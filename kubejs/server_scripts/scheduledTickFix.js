// Runs a scheduled tick in every dimension
// this should hopefully fix an issue with KubeJS where the first time an event runs
// each scheduled tick ran by it will happen instantly (0 tick delay)

ServerEvents.loaded(e => {
    e.server.allLevels.forEach(level => {
        level.server.scheduleInTicks(1, () => {
            console.log(`Scheduled tick fix for level ${level.name.string}`)
        })
    })
})