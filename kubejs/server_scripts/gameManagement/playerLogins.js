PlayerEvents.loggedIn(e => {
    const { player, level, server } = e
    const serverData = server.persistentData
    const playerData = player.persistentData

    let spawnGenerated = serverData.getBoolean('spawn_generated')
    let playerFirstJoin = playerData.getBoolean('first_join')

    // first time player, spawn them to the lobby
    if (playerFirstJoin == false) {
        playerData.putBoolean('first_join', true)
        playerData.putString('current_run', null)
        server.runCommandSilent(`execute in kubejs:lobby run spawnpoint ${player.name.string} 8 5 8 180`)
        server.runCommandSilent(`execute in kubejs:lobby run tp ${player.name.string} 8 5 8 180 0`)
    }

    // first spawn, generate the spawn area
    if (spawnGenerated == false) {
        serverData.putBoolean('spawn_generated', true)
        server.runCommandSilent(`execute in kubejs:lobby run forceload add -16 -16 16 16`)
        server.runCommandSilent(`execute in kubejs:lobby run place template kubejs:brick_lobby 0 0 0`)
    }
})