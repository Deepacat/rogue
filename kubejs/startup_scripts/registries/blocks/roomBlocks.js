StartupEvents.registry('block', e => {
    e.create('kubejs:door_data', 'cardinal')
        .rotateState(ctx => ctx.set(BlockProperties.HORIZONTAL_FACING, ctx.rotate(ctx.get(BlockProperties.HORIZONTAL_FACING))))
        .mirrorState(ctx => ctx.set(BlockProperties.HORIZONTAL_FACING, ctx.mirror(ctx.get(BlockProperties.HORIZONTAL_FACING))))
        .displayName("Door Data Marker Block")
        .textureAll("kubejs:block/door_data_side")
        .textureSide("south", "kubejs:block/door_data_front")
        .unbreakable()
        .blockEntity(blockInfo => {
            blockInfo.initialData({
                door_type: "any" // can be "any", "entrance", or "exit" to mark how the door connects rooms
            })
        })
        .item(i => {
            i.modelJson = { "parent": "minecraft:item/generated", "textures": { "layer0": "kubejs:block/door_data_front" } }
            i.tooltip(Text.of(["§7Place within room bounds to mark doorways. Direction Matters!\n", "§7Can right-click to test room detection."]))
        })

    e.create('kubejs:room_corner')
        .displayName("Room Corner Marker Block")
        .textureAll("kubejs:block/room_corner")
        .unbreakable()
        .blockEntity(blockInfo => { // block entity so it can store data
            blockInfo.initialData({
                room: undefined // initial empty room data, if this doesn't exist it won't be saved to the world
            })
        })
        .item(i => {
            i.modelJson = { "parent": "minecraft:item/generated", "textures": { "layer0": "kubejs:block/room_corner" } }
            i.texture("kubejs:block/room_corner")
            i.tooltip(Text.of([
                "§7Should be placed at either corner of the room:\n", " §8[§r↓§8] §bBottom NW§r §8(Above structure block)§r\n",
                " §8[§r↑§8] §cTop    SE§r\n", "§7Right click with NBT-saved structure block to save room ID to corner block."
            ]))
        })

    e.create('kubejs:room_data')
        .displayName("Room Data Storage Block")
        .textureAll("kubejs:block/room_data")
        .unbreakable()
        .blockEntity(blockInfo => {
            blockInfo.initialData({
                spawners_required: 0.90,    // spawners required percentage to conquer room
                room_type: "normal",        // room type (normal, long, boss, shrine, etc)
                floor_theme: "dungeon"      // the floor theme of the room so that it only generates on that floor theme
            })
        })
        .item(i => {
            i.modelJson = { "parent": "minecraft:item/generated", "textures": { "layer0": "kubejs:block/room_data" } }
            i.texture("kubejs:block/room_data")
            i.tooltip(Text.of(["§7Stores room data for generation.\n", `Run "/dev dataBlock help" for more info.`]))
        })
})