BlockEvents.broken("minecraft:spawner", e => {
    // check dimension if it's in a run
    /** @type {Internal.CompoundTag} */
    let runs = e.server.persistentData["runs"]
    let doesRunIDExist = runs.getAllKeys().toArray().indexOf(e.level.dimension.path)
    let playerRun = getPlayerRun(e.player)
    // Return if spawner or player not in a run
    if (doesRunIDExist == -1 || playerRun == null) return
    // Get the newest rooms bounding box and spawner pos
    let roomBox = playerRun.current_room.bounding_box
    let { x, y, z } = e.block.pos
    // Return if the spawner is not in the newest room box
    if (x < roomBox.bottom.x || x > roomBox.top.x || y < roomBox.bottom.y || y > roomBox.top.y || z < roomBox.bottom.z || z > roomBox.top.z) return

    playerRun.current_room.spawners_mined += 1
    // TODO: add room conquer status
})
