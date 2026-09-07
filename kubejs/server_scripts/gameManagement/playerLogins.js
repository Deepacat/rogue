PlayerEvents.loggedIn(e => {
    const { player, level, server } = e
    const serverData = server.persistentData
    const playerData = player.persistentData

    let spawnGenerated = serverData['spawn_generated'] || false
    let playerJoinedBefore = playerData['first_join'] || false

    // first time player, spawn them to the lobby
    if (playerJoinedBefore == false) {
        playerData['first_join'] = true
        playerData['current_run'] = null
        server.runCommandSilent(`execute in kubejs:lobby run spawnpoint ${player.name.string} 8 5 8 180`)
        server.runCommandSilent(`execute in kubejs:lobby run tp ${player.name.string} 16.0 6 16.0 180 0`)
    }

    // first spawn, generate the spawn area
    if (spawnGenerated == false) {
        serverData['spawn_generated'] = true
        server.runCommandSilent(`execute in kubejs:lobby run forceload add -16 -16 16 16`)
        server.runCommandSilent(`execute in kubejs:lobby run place template kubejs:main_lobby 0 0 0`)
    }

    // if (server.persistentData["ended_run_players"])
})