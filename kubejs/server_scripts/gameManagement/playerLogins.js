PlayerEvents.loggedIn(e => {
    const { player, level, server } = e
    const serverData = server.persistentData
    const playerData = player.persistentData
    const playerJoinedBefore = playerData['first_join'] || false

    // first time player, spawn them to the lobby
    if (playerJoinedBefore == false) {
        playerData['first_join'] = true
        playerData['current_run'] = null
        server.runCommandSilent(`execute in kubejs:lobby run spawnpoint ${player.name.string} 16.0 5 16.0 180`)
        server.runCommandSilent(`execute in kubejs:lobby run tp ${player.name.string} 16.0 6 16.0 180 0`)
    }


    // If player is in a run that ended, remove it from their data and reset them
    /** @type {Internal.ListTag} */
    let endedRunPlayers = server.persistentData["ended_run_players"]
    if (endedRunPlayers.toArray().find(p => p == player.stringUuid)) {
        endedRunPlayers.removeIf(p => p == player.stringUuid)
        server.persistentData["ended_run_players"] = endedRunPlayers // Remove the serverside data that stores players that were offline when a run ended
        player.persistentData["current_run"] = null // Remove current run from player data
        server.runCommandSilent(`execute in kubejs:lobby run spawnpoint ${player.name.string} 16.0 5 16.0 180`)
        server.runCommandSilent(`execute in kubejs:lobby run tp ${player.name.string} 16.0 6 16.0 180 0`)
        console.log(`Player ${player.name.string} has relogged from an ended run and was reset`)
    }
})
