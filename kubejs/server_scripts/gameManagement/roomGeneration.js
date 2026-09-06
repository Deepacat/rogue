/** @param {Internal.CommandContext<Internal.CommandSourceStack>} ctx */
function genStart(ctx, Commands, Arguments) {
    const { server, player, level } = ctx.source
    let { x, y, z } = player
    let cx = player.chunkPosition().x
    let cz = player.chunkPosition().z

    server.runCommandSilent(`execute in ${level.dimension} run forceload add ` +
        `${cx - 1} ${cz - 1} ${cx + 1} ${cz + 1}`)
    server.runCommandSilent(`execute in ${level.dimension} run place template ` +
        `kubejs:brick_lobby ${cx * 16} ${Math.floor(y) - 5} ${cz * 16}`)
    return 1
}

ServerEvents.commandRegistry(e => {
    const { commands: Commands, arguments: Arguments } = e
    e.register(Commands.literal("dev")
        .requires(s => s.hasPermission(2))
        .then(Commands.literal("startgen")
            .requires(s => s.hasPermission(2))
            .executes(ctx => {
                return genStart(ctx, Commands, Arguments)
            })
        )
    )
})

/**
 * Places a new adjacent room
 * @param {BlockPos} pos - Position of the clicked door block (the old room's door)
 * @param {Internal.Direction} genDirection - Direction to generate the new room
 * @param {Object} runData - Current run data
 * @param {Internal.BlockRightClickedEventJS} e - Event object
 */
function genRoomTest(pos, genDirection, runData, e) {
    const { server, player, level } = e
    /* Main room generation code */

    // debug
    // console.log(`Outward direction (genDirection): ${genDirection}`)

    // Pick a random room from the floor's room list
    // let randomRoom = floorData[runData.theme][Math.floor(Math.random() * floorData[runData.theme].length)]
    let roomList = floorData[runData.theme]["normal"]
    let randomRoom = roomList[Math.floor(Math.random() * roomList.length)]
    let roomObj = savedRooms[randomRoom]

    // Pick a random non-exit door from the new room
    let nonExitDoors = roomObj.doors.filter(door => door.door_type != "exit")
    let randomDoor = nonExitDoors[Math.floor(Math.random() * nonExitDoors.length)]
    // Get the random doors base facing direction
    let originalMarkerFacing = $Direction.valueOf(String(randomDoor.facing).toUpperCase())

    let directions = ['north', 'east', 'south', 'west']
    // Get the delta between the old door's facing and the new door's facing, to determine room rotation
    let origIndex = directions.indexOf(originalMarkerFacing.toString().toLowerCase())
    let targetIndex = directions.indexOf(genDirection.toString().toLowerCase())
    let delta = (targetIndex - origIndex + 4) % 4

    // Get the proper rotation string to use in the place command
    let rotationCommand
    switch (delta) {
        case 0: rotationCommand = "none"; break
        case 1: rotationCommand = "clockwise_90"; break
        case 2: rotationCommand = "180"; break
        case 3: rotationCommand = "counterclockwise_90"; break
        default: rotationCommand = "none"
    }

    // debug
    // console.log(`Selected door: facing=${originalFacing}, pos=(${randomDoor.pos.x},${randomDoor.pos.y},${randomDoor.pos.z})`)
    // console.log(`Target facing: ${genDirection}, delta=${delta}, rotation=${rotationCommand}`)

    // Rotate the doors relative offset (x, z) by (delta * 90deg)
    let doorRelX = randomDoor.pos.x
    let doorRelZ = randomDoor.pos.z
    for (let i = 0; i < delta; i++) {
        let newX = -doorRelZ
        let newZ = doorRelX
        doorRelX = newX
        doorRelZ = newZ
    }

    // Get world position for the new door (adjacent to old door)
    let offsetX = genDirection.x
    let offsetY = genDirection.y
    let offsetZ = genDirection.z
    let doorWorldX = pos.x + offsetX
    let doorWorldY = pos.y + offsetY
    let doorWorldZ = pos.z + offsetZ

    // Get origin pos (NW corner of rotated structure)
    let originX = doorWorldX - doorRelX
    let originY = doorWorldY - randomDoor.pos.y
    let originZ = doorWorldZ - doorRelZ

    // debug
    // console.log(`Door world position: (${doorWorldX}, ${doorWorldY}, ${doorWorldZ})`)
    // console.log(`Rotated door offset: (${doorRelX}, ${randomDoor.pos.y}, ${doorRelZ})`)
    // console.log(`Computed origin: (${originX}, ${originY}, ${originZ})`)

    let roomPlaceCommand = `execute in ${level.dimension} run place template ${randomRoom} ${originX} ${originY} ${originZ} ${rotationCommand}`
    console.log(`Placing room with command: ${roomPlaceCommand}`)
    server.runCommandSilent(roomPlaceCommand)

    /* Doorway removal */
    let perp = genDirection.clockWise
    let perpX = perp.x
    let perpZ = perp.z

    // Positions to clear doorway
    let basePositions = [
        pos,                                                   // old door side
        pos.offset(offsetX, offsetY, offsetZ),                 // new door side
        pos.offset(perpX, 0, perpZ),                           // left of old door
        pos.offset(-perpX, 0, -perpZ),                         // right of old door
        pos.offset(offsetX + perpX, offsetY, offsetZ + perpZ), // left of new door
        pos.offset(offsetX - perpX, offsetY, offsetZ - perpZ)  // right of new door
    ]

    // Calculate bounding box for the fill command
    let minX = basePositions[0].x
    let maxX = basePositions[0].x
    let minZ = basePositions[0].z
    let maxZ = basePositions[0].z
    for (let p of basePositions) {
        if (p.x < minX) minX = p.x
        if (p.x > maxX) maxX = p.x
        if (p.z < minZ) minZ = p.z
        if (p.z > maxZ) maxZ = p.z
    }
    let minY = pos.y - 1
    let maxY = pos.y + 2

    let doorFillCommand = `execute in ${level.dimension} run fill ${minX} ${minY} ${minZ} ${maxX} ${maxY} ${maxZ} minecraft:air`
    server.runCommandSilent(doorFillCommand)
}

BlockEvents.rightClicked("kubejs:door_data", e => {
    let blockState = e.level.getBlockState(e.block.pos)
    let facingProp = blockState.getValues().get(BlockProperties.HORIZONTAL_FACING)
    let outwardDir = $Direction.valueOf(facingProp.toString().toUpperCase()).getOpposite()
    genRoomTest(e.block.pos, outwardDir, currentRun, e)
})