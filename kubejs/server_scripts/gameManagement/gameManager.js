let currentRun = {
    "floor_number": 1,
    // "players": [],
    // "alive_players": [],
    "theme": "dungeon",
    // "exhausted_rooms": [],
    "room_count": 0
}

/**
 * @param {Internal.CommandSourceStack} event 
 * @param {Internal.Vec3d} startPos 
 * @returns {number} */
function startRun(event, startPos) {
    const { server, level } = event
    // Run can only be started from the lobby dimension (shouldn't happy outside of it realistically)
    if (level.dimension != "kubejs:lobby") { console.log("Run failed to start, player not in lobby dimension."); return 0 }
    // Generate a run uuid for tracking and dimension
    let runUUID = $UUID.randomUUID().toString()
    let runDim = `rogue:${runUUID}`
    // Get position and make a bounding box for entity detection
    let tpBox = AABB.ofBlock(new BlockPos(startPos.x, startPos.y, startPos.z)).inflate(3)
    // Get players within the bounding box
    let playersInRunArray = level.getEntitiesOfClass($Player, tpBox).map(p => p.stringUuid)
    // Template run object for tracking data related to the run
    let runObj = {
        uuid: runUUID,
        dimension: runDim,
        theme: "dungeon",
        room_count: 0,
        floor_number: 1,
        players: playersInRunArray,
        alive_players: playersInRunArray,
        exhausted_rooms: []
    }
    // Add the initial run data obj to server data
    server.persistentData["runs"][runUUID] = runObj
    // Add the run uuid to every player in the run
    event.player.tell(`§bStarting run§r: ${runUUID}`)
    event.player.tell(`§bPlayers in run§r: §a[§r${playersInRunArray.join(", ")}§a]§r`)
    playersInRunArray.forEach(uuid => {
        let curPlayer = server.getPlayer($UUID.fromString(uuid))
        curPlayer.persistentData["current_run"] = runUUID
    })

    // Generate dimension \`rogue:${uuid}\`


    // Teleport players into starting room center
    return 1
}

/**
 * @param {Internal.CommandSourceStack} event
 */
function endRun(event, runUUID) {
    let { server, level } = event
    /** @type {Internal.OrderedCompoundTag} */
    let runObj = server.persistentData["runs"][runUUID]

    if (!runObj) { console.log(`Run with UUID ${runUUID} not found.`); return 0 }
    delete server.persistentData["runs"][runUUID]

    /** @type {Internal.ListTag} */
    let alive_players = runObj.alive_players

    alive_players.forEach(uuid => {
        let uuidString = uuid.getAsString()
        let player = server.getPlayer($UUID.fromString(uuidString))

        player.tell(`Run "§b${runUUID}§r" has ended.`)
        player.persistentData["current_run"] = null
    })




    return 1
}

// Run debug commands
ServerEvents.commandRegistry(e => {
    const { commands: Commands, arguments: Arguments } = e
    e.register(Commands.literal("dev")
        .requires(s => s.hasPermission(2))
        .then(Commands.literal("runs")
            .then(Commands.literal("startRun")
                .executes(ctx => {
                    return startRun(ctx.source, new BlockPos(ctx.source.player.x, ctx.source.player.y, ctx.source.player.z))
                })
            )
            .then(Commands.literal("getOngoingRuns")
                .executes(ctx => {
                    const { server, player, level } = ctx.source
                    player.tell(`"Ongoing runs": [${Object.keys(server.persistentData["runs"]).join(", ") || "None"}]`)
                    player.tell(`Outputting runs data to console.`)
                    console.log(`"Ongoing runs":`, server.persistentData["runs"])
                    return 1
                })
            )
            .then(Commands.literal("getCurrentRun")
                .executes(ctx => {
                    const { server, player, level } = ctx.source
                    let runUUID = player.persistentData["current_run"]
                    player.tell(`§bOutput run data to console for run UUID§r: "${player.persistentData["current_run"]}"`)
                    console.log(`"Run data for UUID": ${runUUID}`, server.persistentData["runs"][runUUID])
                    return 1
                })
            )
            .then(Commands.literal("endRun")
                .executes(ctx => {
                    const { server, player, level } = ctx.source
                    let runUUID = player.persistentData["current_run"]
                    player.tell(`§bEnding run§r: ${runUUID}`)
                    return endRun(ctx.source, runUUID)
                })
            )
            .then(Commands.literal("endAllRuns")
                .executes(ctx => {
                    const { server, player, level } = ctx.source
                    player.tell(`Ending all runs and clearing run data.`)
                    for (let runUUID of Object.keys(server.persistentData["runs"])) {
                        endRun(ctx.source, runUUID)
                    }
                    return 1
                })
            )
        )
    )
})