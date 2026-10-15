// priority: 100

const roomTypes = {
    trinket_reward: {
        roomType: "normal",     // Type of room, defines which rooms can be generated
        roomPool: "generic",    // Where/when the room can generate, "generic" is any new opened non guaranteed room
        weight: 100             // weight of the room in the room pool
    },
    gear_reward: {
        roomType: "normal",
        roomPool: "generic",
        weight: 100
    },
    shrine: {   // Shrine type is rarer, can still generate anywhere using generic pool (normally opened new rooms)
        roomType: "shrine",
        roomPool: "generic",
        weight: 25
    },
        boss: {
        roomType: "boss",   // Boss room type can only generate at end of the floor
        roomPool: "boss"    // Can use any room in the boss pool (If multiple in the same theme exist)
    },
    lobby: {
        roomType: "lobby",  // Lobby room type can only generate on new floor/start of run
        roomPool: "lobby"   // Can use any room in the lobby pool (If multiple in the same theme exist)
    }
}

/**
 * Main function to create a new room in the run
 * @param {BlockPos} pos - Position of the clicked door block (the old room's door)
 * @param {Internal.Direction} genDirection - Direction to generate the new room
 * @param {Object} runData - Current run data
 * @param {Internal.BlockRightClickedEventJS} e - Event object
 */
function createRoom(pos, genDirection, runData, e) {
    const { server, player, level } = e
    let dirs = ['north', 'east', 'south', 'west']
    let yawMap = { south: 0, west: 90, north: 180, east: 270 }

    console.log(`Outward direction (genDirection): ${genDirection}`) // debug

    // Get the obj of a random room from the floors current theme to generate of "normal" room type
    let pick = pickRoom(runData.current_theme, "normal")
    let randomRoom = pick.randomRoom
    let roomObj = pick.roomObj

    // Get a random non-exit door to set as the new rooms entrance when generating
    let nonExitDoors = roomObj.doors.filter(door => door.door_type != "exit")
    let randomDoor = nonExitDoors[Math.floor(Math.random() * nonExitDoors.length)]
    let originalMarkerFacing = $Direction.valueOf(String(randomDoor.facing).toUpperCase())

    // Get rotation for room placement (since the randomly picked entrance door maybe rotated)
    let rot = computeRotation(originalMarkerFacing, genDirection)
    let delta = rot.delta
    let rotationCommand = rot.rotationCommand

    console.log(`Selected door: facing=${originalMarkerFacing}, pos=(${randomDoor.pos.x},${randomDoor.pos.y},${randomDoor.pos.z})`) // debug
    console.log(`Target facing: ${genDirection}, delta=${delta}, rotation=${rotationCommand}`) // debug

    let doorRel = rotateOffset(randomDoor.pos.x, randomDoor.pos.z, delta)

    let offsetX = genDirection.x * 3
    let offsetY = 0
    let offsetZ = genDirection.z * 3
    let doorWorldX = pos.x + offsetX
    let doorWorldY = pos.y + offsetY
    let doorWorldZ = pos.z + offsetZ
    let originX = doorWorldX - doorRel.x
    let originY = doorWorldY - randomDoor.pos.y
    let originZ = doorWorldZ - doorRel.z

    console.log(`Door world position: (${doorWorldX}, ${doorWorldY}, ${doorWorldZ})`) // debug
    console.log(`Rotated door offset: (${doorRel.x}, ${randomDoor.pos.y}, ${doorRel.z})`) // debug
    console.log(`Computed origin: (${originX}, ${originY}, ${originZ})`) // debug

    // Placing the room
    let roomPlaceCommand = `execute in ${level.dimension} run place template ${randomRoom} ${originX} ${originY} ${originZ} ${rotationCommand}`
    console.log(`Placing room with command: ${roomPlaceCommand}`) // debug
    let roomPlaceReturn = server.runCommandSilent(roomPlaceCommand)
    console.log(roomPlaceReturn) // debug

    // Clearing the doorway into the new room (filled with air)
    fillDoorwayArea(server, level, pos, genDirection, offsetX, offsetY, offsetZ)

    // Save bounding box, used for spawner mined detection and saving position of previous rooms
    let boundingBoxWithDoor = computeRoomBounds(roomObj, originX, originY, originZ, delta, genDirection)

    let runObj = getPlayerRun(player)
    runObj.room_count += 1
    runObj["current_room"].room_id = roomObj.room_id
    runObj["current_room"].spawners_mined = 0
    runObj["current_room"].bounding_box = boundingBoxWithDoor

    // Get suitable exit doors in the new room to pick possible new doors
    let exitDoors = selectExitDoors(roomObj, randomDoor)

    // Spawn text displays and armor stands used for display and opening new rooms
    spawnDoorEntities(level, exitDoors, originX, originY, originZ, delta, dirs, yawMap)

    return 1
}

/**
 * Computes the min/max bounds across a list of points.
 * Points may have only x/z, or x/y/z.
 * @param {Array<{x:number, y?:number, z:number}>} points
 * @returns {{minX:number, maxX:number, minY:number, maxY:number, minZ:number, maxZ:number}}
 */
function getBounds(points) {
    let hasY = points[0].y !== undefined
    let minX = points[0].x, maxX = points[0].x
    let minZ = points[0].z, maxZ = points[0].z
    let minY = hasY ? points[0].y : 0
    let maxY = hasY ? points[0].y : 0
    for (let p of points) {
        if (p.x < minX) minX = p.x
        if (p.x > maxX) maxX = p.x
        if (p.z < minZ) minZ = p.z
        if (p.z > maxZ) maxZ = p.z
        if (hasY) {
            if (p.y < minY) minY = p.y
            if (p.y > maxY) maxY = p.y
        }
    }
    return { minX: minX, maxX: maxX, minY: minY, maxY: maxY, minZ: minZ, maxZ: maxZ }
}

/**
 * Picks a random room of a given type from a theme's room list
 * @param {string} theme
 * @param {string} roomType
 * @returns {{randomRoom: string, roomObj: Object}}
 */
function pickRoom(theme, roomType) {
    let roomList = floorData[theme][roomType]
    let randomRoom = roomList[Math.floor(Math.random() * roomList.length)]
    return { randomRoom: randomRoom, roomObj: savedRooms[randomRoom] }
}

/**
 * Computes the clockwise rotation delta and place-template rotation command
 * needed to align a door's facing to a target direction
 * @param {Internal.Direction} originalFacing
 * @param {Internal.Direction} targetFacing
 * @returns {{delta: number, rotationCommand: string}}
 */
function computeRotation(originalFacing, targetFacing) {
    let dirs = ['north', 'east', 'south', 'west']
    let origIndex = dirs.indexOf(originalFacing.toString().toLowerCase())
    let targetIndex = dirs.indexOf(targetFacing.toString().toLowerCase())
    let delta = (targetIndex - origIndex + 4) % 4

    let rotationCommand
    switch (delta) {
        case 0: rotationCommand = "none"; break
        case 1: rotationCommand = "clockwise_90"; break
        case 2: rotationCommand = "180"; break
        case 3: rotationCommand = "counterclockwise_90"; break
        default: rotationCommand = "none"
    }
    return { delta: delta, rotationCommand: rotationCommand }
}

/**
 * Rotates an x/z offset clockwise by delta * 90 degrees
 * @param {number} x
 * @param {number} z
 * @param {number} delta
 * @returns {{x: number, z: number}}
 */
function rotateOffset(x, z, delta) {
    for (let i = 0; i < delta; i++) {
        let newX = -z
        let newZ = x
        x = newX
        z = newZ
    }
    return { x: x, z: z }
}

/**
 * Fills a 3 wide, 4 tall, 4 deep doorway of air between the old door and the new room
 * after a short delay to ensure the room has been placed
 * @param {Internal.MinecraftServer} server
 * @param {Internal.Level} level
 * @param {BlockPos} pos
 * @param {Internal.Direction} genDirection
 * @param {number} offsetX
 * @param {number} offsetY
 * @param {number} offsetZ
 */
function fillDoorwayArea(server, level, pos, genDirection, offsetX, offsetY, offsetZ) {
    let perp = genDirection.clockWise
    let perpX = perp.x
    let perpZ = perp.z

    let basePositions = [
        pos,
        pos.offset(offsetX, offsetY, offsetZ),
        pos.offset(perpX, 0, perpZ),
        pos.offset(-perpX, 0, -perpZ),
        pos.offset(offsetX + perpX, offsetY, offsetZ + perpZ),
        pos.offset(offsetX - perpX, offsetY, offsetZ - perpZ)
    ]

    let bounds = getBounds(basePositions)
    let minX = bounds.minX
    let maxX = bounds.maxX
    let minZ = bounds.minZ
    let maxZ = bounds.maxZ
    let minY = pos.y - 1
    let maxY = pos.y + 2

    server.scheduleInTicks(1, () => {
        let doorFillCommand = `execute in ${level.dimension} run fill ${minX} ${minY} ${minZ} ${maxX} ${maxY} ${maxZ} minecraft:air`
        console.log(`Filling doorway with command: ${doorFillCommand}`) // debug
        let doorFillReturn = server.runCommandSilent(doorFillCommand)
        console.log(doorFillReturn) // debug
    })
}

/**
 * Computes the world-space bounding box of the generated room, extended 2 blocks
 * toward the previous room to include the bedrock gap the doorway sits in
 * @param {Object} roomObj
 * @param {number} originX
 * @param {number} originY
 * @param {number} originZ
 * @param {number} delta
 * @param {Internal.Direction} genDirection
 * @returns {{bottom: {x:number,y:number,z:number}, top: {x:number,y:number,z:number}}}
 */
function computeRoomBounds(roomObj, originX, originY, originZ, delta, genDirection) {
    let bbSize = roomObj.bounding_box
    let localCorners = [
        { x: 0, z: 0 },
        { x: bbSize.x - 1, z: 0 },
        { x: 0, z: bbSize.z - 1 },
        { x: bbSize.x - 1, z: bbSize.z - 1 }
    ]

    let worldCorners = []
    for (let c of localCorners) {
        let r = rotateOffset(c.x, c.z, delta)
        worldCorners.push({ x: originX + r.x, z: originZ + r.z })
    }

    let bounds = getBounds(worldCorners)
    let roomMinX = bounds.minX
    let roomMaxX = bounds.maxX
    let roomMinZ = bounds.minZ
    let roomMaxZ = bounds.maxZ

    let roomMinY = originY
    let roomMaxY = originY + bbSize.y - 1

    if (genDirection.x > 0) roomMinX -= 2
    else if (genDirection.x < 0) roomMaxX += 2
    if (genDirection.z > 0) roomMinZ -= 2
    else if (genDirection.z < 0) roomMaxZ += 2

    return {
        bottom: { x: roomMinX, y: roomMinY, z: roomMinZ },
        top: { x: roomMaxX, y: roomMaxY, z: roomMaxZ }
    }
}

/**
 * Selects 2-4 random non-entrance doors from a room, excluding the door that
 * was used to connect the room to the previous one
 * @param {Object} roomObj
 * @param {Object} connectingDoor
 * @returns {Internal.ArrayList}
 */
function selectExitDoors(roomObj, connectingDoor) {
    /** @type {Internal.ArrayList} */
    let possibleExitDoors = new $ArrayList(roomObj.doors)
        .filter(d => d.door_type != "entrance")
        .filter(d => !(d.pos.x == connectingDoor.pos.x && d.pos.y == connectingDoor.pos.y && d.pos.z == connectingDoor.pos.z))

    $Collections.shuffle(possibleExitDoors)

    let doorAmt = Math.min(Math.floor(Math.random() * 3) + 2, possibleExitDoors.size())
    let exitDoors = new $ArrayList(possibleExitDoors.subList(0, doorAmt))
    console.log(`Selected ${exitDoors.size()} exit doors: ${exitDoors.toArray().join(", ")}`) // Debug
    return exitDoors
}

/**
 * Spawns an armor stand and a floating text label at each exit door, facing
 * the door's direction and positioned one block in front of the door marker
 * @param {Internal.Level} level
 * @param {Internal.ArrayList} exitDoors
 * @param {number} originX
 * @param {number} originY
 * @param {number} originZ
 * @param {number} delta
 * @param {Array<string>} dirs
 * @param {Object} yawMap
 */
function spawnDoorEntities(level, exitDoors, originX, originY, originZ, delta, dirs, yawMap) {
    for (let door of exitDoors) {
        let rel = rotateOffset(door.pos.x, door.pos.z, delta)
        let doorWorldX = originX + rel.x
        let doorWorldY = originY + door.pos.y
        let doorWorldZ = originZ + rel.z

        let facingIdx = dirs.indexOf(String(door.facing).toLowerCase())
        let rotatedFacing = dirs[(facingIdx + delta) % 4]
        let facingDir = $Direction.valueOf(rotatedFacing.toUpperCase())
        let yaw = yawMap[rotatedFacing]

        // block centered
        let cx = doorWorldX + 0.5
        let cy = doorWorldY + 0.5
        let cz = doorWorldZ + 0.5

        /// Armor stand entities
        let standX = cx + facingDir.x
        let standY = cy - 0.5
        let standZ = cz + facingDir.z

        // Armor stand that is not a marker, is entirely invisible but is rescaled as a interactable trigger
        /** @type {Internal.Entity} */
        let clickableStand = level.createEntity("minecraft:armor_stand")
        clickableStand.setPosition(standX, standY, standZ)
        clickableStand.mergeNbt({
            Invisible: 1, Invulnerable: 1, PersistenceRequired: 1, NoBasePlate: 1, NoGravity: 1, Small: 1, DisabledSlots: 16191,
            "pehkui:scale_data_types": { "pehkui:width": { "scale": 4 } }, // see pehkui data types with /scale
            "ForgeData": { door_data: door, "aaaaaaaaa": "bbbbbbbbbbbb" }
        })
        clickableStand.spawn()
        clickableStand.setRotation(yaw, 0)

        // Armor stand with helmet as a marker (Invisible, cannot be hit, purely for head display)
        /** @type {Internal.Entity} */
        let displayStand = level.createEntity("minecraft:armor_stand")
        displayStand.setPosition(standX, standY - 1.25, standZ)
        displayStand.mergeNbt({
            Invisible: 1, PersistenceRequired: 1, NoBasePlate: 1, NoGravity: 1, Marker: 1, DisabledSlots: 16191,
        })
        displayStand.setItemSlot("head", Item.of("minecraft:skeleton_skull"))
        displayStand.spawn()
        displayStand.setRotation(yaw, 0)

        /// Text display entity
        let faceOffset = 0.6
        let textX = cx + facingDir.x * faceOffset
        let textY = standY + 1.5
        let textZ = cz + facingDir.z * faceOffset

        /** @type {Internal.Entity} */
        let textDisplay = level.createEntity("minecraft:text_display")
        textDisplay.setPosition(textX, textY, textZ)
        textDisplay.mergeNbt({
            shadow: 1, Glowing: 1, shadow_radius: 1, billboard: "fixed",
            text: `{"text":"Room type: meowmeow","color":"aqua"}`
        })
        textDisplay.spawn()
        textDisplay.setRotation(yaw, 0)
    }
}