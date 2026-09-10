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

ServerEvents.loaded(e => {
    const { server } = e
    const serverData = server.persistentData

    // Run tickfix on server load
    fixScheduledTicks(server)
})

// Run tickfix on server load/reload (Probably won't work on first serverload but works on reloads, so it's in event and outside)
fixScheduledTicks(Utils.server)

/**
 * Runs a scheduled tick in every dimension. This should hopefully fix an issue with KubeJS
 * where the first time an event runs in a dimension, each scheduled tick ran by it will happen instantly (0 ticks)
 * rather than the intended amount of tick delay
 * @param {Internal.MinecraftServer} server 
 */
function fixScheduledTicks(server) {
    let levels = []
    server.allLevels.forEach(level => {
        level.server.scheduleInTicks(1, () => { levels.push(`${level.dimension.namespace}:${level.dimension.path}`) })
    })
    console.log(`Scheduledtick fix ran in dimensions: ${levels.join(", ")}`)
}