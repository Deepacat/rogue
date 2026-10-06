// Events on server loading for first time
ServerEvents.loaded(e => {
    const { server } = e
    const serverData = server.persistentData
    const serverFirstLoad = !serverData['server_first_load'] || true

    if (serverFirstLoad == false) { return }
    serverData['server_first_load'] = false

    server.runCommandSilent(`execute in kubejs:lobby run forceload add -16 -16 16 16`)
    server.runCommandSilent(`execute in kubejs:lobby run place template kubejs:main_lobby 0 0 0`)
})

/**
 * Runs a scheduled tick on level load, This should hopefully fix an issue with KubeJS
 * where the first time an event runs in a dimension, each scheduled tick ran by it will happen instantly (0 ticks)
 * rather than the intended amount of tick delay
 * 
 * This event also runs twice for some reason
 */
LevelEvents.loaded(e => {
    // Run tickfix on level load
    e.level.server.scheduleInTicks(1, () => { console.log(`Scheduled tick fix running in dimension: ${e.level.dimension}`) })
})