/** @param {Internal.SimplePlayerEventJS} e */
function updateRPC(e) {
    e.player.sendData("kubejs:rpc", {
        serverPersistentData: e.server.persistentData,
        playerPersistentData: e.player.persistentData,
        rooms: savedRooms
    })
}

PlayerEvents.loggedIn(e => {
    updateRPC(e)
})

PlayerEvents.tick(e => {
    // Update every 10 seconds
    if (Utils.server.tickCount % (20 * 10) != 0) return
    updateRPC(e)
})