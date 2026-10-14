/** @param {Internal.SimplePlayerEventJS} e */
function updateRPC(e) {
    let rooms = savedRooms || {}
    let serverData = e.server.persistentData || {}
    let playerData = e.player.persistentData || {}

    e.player.sendData("kubejs:rpc", {
        serverPersistentData: serverData,
        playerPersistentData: playerData,
        rooms: rooms
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