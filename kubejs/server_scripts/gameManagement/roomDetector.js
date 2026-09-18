/**
 * Detects dev marker blocks in the world and saves the data
 * Used for the room detector command to cache rooms for later generation
 * @param {Internal.CommandContext<Internal.CommandSourceStack>} ctx 
 * @param {Internal.Commands} Commands 
 * @param {Internal.ArgumentTypeWrappers} Arguments 
 * @param {number|null} radiusOverride - If null, uses default radius and filters to room containing player
 */
function detectRooms(ctx, Commands, Arguments, radiusOverride) {
	let { server, level, player } = ctx.source
	let pos = player.block.pos

	// If no radius provided, use a default radius (4 chunks around player)
	let radius = radiusOverride !== null ? radiusOverride : 4
	let radiusOf = n => Array.from(Array(2 * n + 1).keys()).map(i => i - n)
	let map = radiusOf(radius)

	let foundRooms = {} // Object to store room data (keyed by room_id)
	let foundBlocks = [] // Array to add nearby found blocks to
	// Blocks that should be searched for within detection range to save data for 
	let matchBlocks = ["kubejs:room_corner", "kubejs:door_data", "kubejs:room_data", "minecraft:structure_block", "minecraft:spawner"]

	// Loops over every chunk position in range
	for (let dx of map) {
		for (let dz of map) {
			let chunk = level.getChunkAt(pos.offset(dx * 16, 0, dz * 16))
			chunk["findBlocks(java.util.function.BiPredicate,java.util.function.BiConsumer)"](
				(blockState, blockPos) => {
					let matched = false
					for (let checkBlock of matchBlocks) {
						if (blockState.block.id.toString() == checkBlock) { matched = true; break }
					}
					return matched
				},
				(blockPos, blockState) => {
					const { x, y, z } = blockPos
					const block = level.getBlock(blockPos)
					const blockID = block.id.toString()
					switch (blockID) {
						case "kubejs:room_corner": {
							let roomID = block.entityData?.data?.room
							if (!roomID) return
							// console.log(`Adding block: ${JSON.stringify({ type: blockID, data: { room_id: roomID }, pos: [x, y, z] })}`)
							foundBlocks.push({ type: blockID, data: { room_id: roomID }, pos: [x, y, z] })
							break
						}
						case "kubejs:door_data": {
							let facing = blockState.getValues().get(BlockProperties.HORIZONTAL_FACING).toString()
							let doorType = block.entityData?.data?.door_type
							// console.log(`Adding block: ${JSON.stringify({ type: blockID, data: { facing: facing }, pos: [x, y, z] })}`)
							foundBlocks.push({ type: blockID, data: { facing: facing, door_type: doorType }, pos: [x, y, z] })
							break
						}
						case "kubejs:room_data": {
							let roomData = global.nbtToObject(block.entityData?.data)
							// console.log(`Adding block: ${JSON.stringify({ type: blockID, data: roomData, pos: [x, y, z] })}`)
							foundBlocks.push({ type: blockID, data: roomData, pos: [x, y, z] })
							break
						}
						case "minecraft:structure_block": {
							let structureName = block.entityData.name != "" ? block.entityData.name : undefined
							if (!structureName) return
							// console.log(`Adding block: ${JSON.stringify({ type: blockID, data: { structure_name: structureName }, pos: [x, y, z] })}`)
							foundBlocks.push({ type: blockID, data: { structure_name: structureName }, pos: [x, y, z] })
							break
						}
						case "minecraft:spawner": {
							foundBlocks.push({ type: blockID, pos: [x, y, z] })
							break
						}
						default:
							break
					}
				}
			)
		}
	}

	// Group corner markers by room ID
	let cornerGroups = {}
	for (let block of foundBlocks) {
		if (block.type === "kubejs:room_corner") {
			let roomId = block.data.room_id
			if (!cornerGroups[roomId]) cornerGroups[roomId] = []
			cornerGroups[roomId].push(block.pos)
		}
	}

	// Temporary storage for min coordinates (needed for filtering if radius was null)
	let roomMinCoords = {}
	// Track which room_data blocks are used inside a room
	let usedRoomDataIndices = new Set()

	// For each room ID, validate corner count and build room
	for (let [roomId, corners] of Object.entries(cornerGroups)) {
		if (corners.length < 2) {
			let warnMsg = `Room "${roomId}" has ${corners.length} corner markers (expected at least 2). Skipping.`
			console.warn(warnMsg)
			player.tell(`§e${warnMsg}`)
			continue
		}

		let selectedCorners
		if (corners.length === 2) {
			selectedCorners = corners
		} else {
			// More than 2 corners: pick the two closest to the player
			let playerX = pos.x, playerY = pos.y, playerZ = pos.z
			let sorted = corners.slice().sort((a, b) => {
				let distA = (a[0] - playerX) ** 2 + (a[1] - playerY) ** 2 + (a[2] - playerZ) ** 2
				let distB = (b[0] - playerX) ** 2 + (b[1] - playerY) ** 2 + (b[2] - playerZ) ** 2
				return distA - distB
			})
			selectedCorners = [sorted[0], sorted[1]]
			let warnMsg = `Room "${roomId}" has ${corners.length} corner markers (expected 2). Using the two closest to player: [${sorted[0]}] and [${sorted[1]}].`
			console.warn(warnMsg)
			player.tell(`§e${warnMsg}`)
		}

		let [p1, p2] = selectedCorners
		let minX = Math.min(p1[0], p2[0])
		let maxX = Math.max(p1[0], p2[0])
		let minY = Math.min(p1[1], p2[1])
		let maxY = Math.max(p1[1], p2[1])
		let minZ = Math.min(p1[2], p2[2])
		let maxZ = Math.max(p1[2], p2[2])

		// Store min coordinates for later filtering if needed
		roomMinCoords[roomId] = { minX: minX, minY: minY, minZ: minZ }

		let spawners = foundBlocks
			.filter(block => {
				if (block.type !== "minecraft:spawner") return false
				let [x, y, z] = block.pos
				return x >= minX && x <= maxX && y >= minY && y <= maxY && z >= minZ && z <= maxZ
			})
			.map(block => ({
				pos: { x: block.pos[0] - minX, y: block.pos[1] - minY, z: block.pos[2] - minZ }
			}))
		console.log(`Found ${spawners.length} spawners in room ${roomId}`)

		// Find door markers inside this bounding box
		let doors = foundBlocks
			.filter(block => {
				if (block.type !== "kubejs:door_data") return false
				let [x, y, z] = block.pos
				return x >= minX && x <= maxX && y >= minY && y <= maxY && z >= minZ && z <= maxZ
			})
			.map(block => ({
				facing: block.data.facing,
				door_type: block.data.door_type,
				pos: {
					x: block.pos[0] - minX,
					y: block.pos[1] - minY,
					z: block.pos[2] - minZ
				}
			}))
		console.log(`Found ${doors.length} door markers in room ${roomId}`)

		// Find room_data blocks inside this bounding box and track indices
		let roomDataIndices = []
		for (let block of foundBlocks) {
			if (block.type === "kubejs:room_data") {
				let [x, y, z] = block.pos
				if (x >= minX && x <= maxX && y >= minY && y <= maxY && z >= minZ && z <= maxZ) {
					roomDataIndices.push(foundBlocks.indexOf(block))
				}
			}
		}

		if (roomDataIndices.length === 0) {
			let warnMsg = `Room "${roomId}" has no Room Data Storage Block inside its bounds.`
			console.warn(warnMsg)
			player.tell(`§e${warnMsg}`)
		} else if (roomDataIndices.length > 1) {
			let warnMsg = `Room "${roomId}" has ${roomDataIndices.length} Room Data Storage Blocks inside (expected exactly 1). Using the first one found.`
			console.warn(warnMsg)
			player.tell(`§e${warnMsg}`)
		}

		// Mark all room_data indices inside this room as used
		for (let idx of roomDataIndices) {
			usedRoomDataIndices.add(idx)
		}

		// Use the first one's data if any
		let roomData = roomDataIndices.length > 0 ? foundBlocks[roomDataIndices[0]].data : undefined

		// Require at least 2 doors inside room bounding box
		if (doors.length < 2) {
			let warnMsg = `Room "${roomId}" has only ${doors.length} door markers inside (needs at least 2). Skipping.`
			console.warn(warnMsg)
			player.tell(`§e${warnMsg}`)
			continue
		}

		// Build room object
		let boundingBox = {
			x: maxX - minX + 1,
			y: maxY - minY + 1,
			z: maxZ - minZ + 1
		}

		foundRooms[roomId] = {
			room_id: roomId,
			bounding_box: boundingBox,
			room_data: roomData,
			doors: doors
		}
	}

	// If no radius override was provided, filter to only the room containing the player
	if (radiusOverride === null) {
		let playerX = pos.x, playerY = pos.y, playerZ = pos.z
		let filteredRooms = {}
		for (let [roomId, room] of Object.entries(foundRooms)) {
			let { minX, minY, minZ } = roomMinCoords[roomId] || { minX: 0, minY: 0, minZ: 0 }
			let size = room.bounding_box
			if (playerX >= minX && playerX < minX + size.x &&
				playerY >= minY && playerY < minY + size.y &&
				playerZ >= minZ && playerZ < minZ + size.z) {
				filteredRooms[roomId] = room
			}
		}
		foundRooms = filteredRooms
		if (Object.keys(foundRooms).length === 0) {
			player.tell(`§eNo room found containing your position.`)
		}
	}

	player.tell(`Finished searching nearby rooms, added §a${Object.keys(foundRooms).map(roomId => foundRooms[roomId].room_id).join(", ")}§r (§b${Object.keys(foundRooms).length}§r total)`)
	player.tell(`check §bminecraft/logs/kubejs/server.log§r for details`)

	let existingRooms = JsonIO.read('kubejs/script_data/saved_rooms.json') || {}
	Object.assign(existingRooms, foundRooms)
	JsonIO.write('kubejs/script_data/saved_rooms.json', existingRooms)
}