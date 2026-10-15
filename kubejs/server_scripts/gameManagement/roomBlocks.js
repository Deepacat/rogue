BlockEvents.rightClicked(e => {
    if (e.block.id == "kubejs:door_data") { doorDataBlockClicked(e); e.cancel() }
    if (e.block.id == "kubejs:room_corner") { roomCornerBlockClicked(e); e.cancel() }
    if (e.block.id == "kubejs:room_data") { roomDataBlockClicked(e); e.cancel()}
})

/** @param {Internal.BlockRightClickedEventJS} e */
function doorDataBlockClicked(e) {
    let { block, player, level, item, hand } = e
    if (hand == "OFF_HAND") return
    player.tell(`§bDoor Type:§r §a${block.entityData?.data?.door_type}`)

    let blockState = level.getBlockState(block.pos)
    let facingProp = blockState.getValues().get(BlockProperties.HORIZONTAL_FACING)
    let outwardDir = $Direction.valueOf(facingProp.toString().toUpperCase()).getOpposite()

    if (!player.persistentData["current_run"]) return

    // Delete the door data block to prevent multi-using it
    e.server.runCommandSilent(`execute in ${level.dimension} run setblock ${block.pos.x} ${block.pos.y} ${block.pos.z} minecraft:bedrock`)

    createRoom(block.pos, outwardDir, getPlayerRun(player), e)
}

/** @param {Internal.BlockRightClickedEventJS} e */
function roomCornerBlockClicked(e) {
    let { block, player, item, hand } = e
    if (hand == "OFF_HAND") return
    if (item.id != "minecraft:structure_block") {
        player.tell(`§bCurrent Room ID§r: §a${block.entityData?.data?.room ? `"${block.entityData.data.room}"` : "None given."}`)
        return
    }
    let structureName = item.nbt.BlockEntityTag["name"] // get the id of the structure in NBT saved structure block

    let nbtCopy = block.getEntityData() // Copy block entities data
    nbtCopy.merge({ data: { room: structureName } }) // merge structure name into the copy
    block.setEntityData(nbtCopy) // overwrite the block data with the modified copied

    player.tell(`§bSaved Room ID§r: §a"${structureName}"§r to corner block.`)
}

/** @param {Internal.BlockRightClickedEventJS} e */
function roomDataBlockClicked(e) {
    let { block, player, item, hand } = e
    if (hand == "OFF_HAND") return
    player.tell(`§bStored Data:`)
    let nbtArray = Object.entries(global.nbt.nbtToJS(block.entityData?.data)) // convert custom data NBT to object then array
    for (let [key, val] of nbtArray) { // loop over array and tell data
        player.tell(`§b${key}§r: §a${val}`)
    }
}
