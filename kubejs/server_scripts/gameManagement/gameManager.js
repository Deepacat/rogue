// TODO: Remove this placeholder and get the current run data when generating
let currentRun = {
    "floor_number": 1,
    // "players": [],
    // "alive_players": [],
    "current_theme": "dungeon",
    // "exhausted_rooms": [],
    "room_count": 0
}

/**
 * @param {Internal.CommandSourceStack} event 
 * @param {Internal.Vec3d} startPos 
 * @returns {number} */
function startRun(event, startPos) {
    const { server, level } = event
    const startingPlayer = event.player

    // Run can only be started from the lobby dimension (shouldn't happy outside of it realistically)
    if (level.dimension != "kubejs:lobby") { console.log("Run failed to start, player not in lobby dimension."); return 0 }

    // Generate a run uuid for tracking and dimension
    let runUUID = $UUID.randomUUID().toString()
    let runDimID = `rogue:${runUUID}`

    // Get a box around player for detecting other players to add to run
    let tpBox = AABB.ofBlock(new BlockPos(startPos.x, startPos.y, startPos.z)).inflate(3)

    // Get players within the bounding box
    let playersInRunArray = level.getEntitiesOfClass($Player, tpBox).map(p => p.stringUuid)

    // Template run object for tracking data related to the run
    let runObjTemplate = {
        "dimension": runDimID, // The dimension for the run (`rogue:${runUUID}`)
        "current_theme": "dungeon", // TODO: pick a random theme (when theres more easy ones)
        "room_count": 0, // Counter of how many rooms have generated per floor (0 lobby), resets on new floor
        "floor_number": 1, // The floor number

        // TODO: implement these 2 when making better room gen
        "generated_boxes": [], // List of all room bounding boxes that are currently generated (To prevent overlaps) (Rooms maybe cleared to free up space)
        "exhausted_rooms": [], // List of rooms that have already been generated for the floor (To later prevent duplicate rooms)

        "starting_players": playersInRunArray, // List of players present when run began
        "alive_players": playersInRunArray, // List of currently alive players in the run (Including logged out players)
        "dead_players": [], // Players that have fully died and are spectating

        // TODO: Make conquer status system, room data should be the rooms data obj which included the spawner % req and total spawners
        "current_room": { // The current newest generated room, tracks spawners for room conquer status
            "room_data": {},
            "spawners_mined": 0,
        }
    }

    // Add the initial run data obj to server data
    server.persistentData["runs"][runUUID] = runObjTemplate
    let runObj = server.persistentData["runs"][runUUID]

    // Add the run uuid to every player in the run
    event.player.tell(`§bStarting run§r: ${runUUID}`)

    event.player.tell(`Creating dimension "§b${runDimID}§r" for run with theme "§b${runObj.current_theme}§r"`)
    global.createDimension(`kubejs:${runObj.current_theme}`, runDimID)
    server.runCommandSilent(`execute in ${runDimID} run forceload add -1 -1 1 1`)
    server.runCommandSilent(`execute in ${runDimID} run place template kubejs:lobby_dungeon 0 256 0`)

    event.player.tell(`§bPlayers in run§r: §a[§r${playersInRunArray.join(", ")}§a]§r`)
    playersInRunArray.forEach(uuid => {
        let curPlayer = server.getPlayer($UUID.fromString(uuid))
        curPlayer.persistentData["current_run"] = runUUID
        server.runCommandSilent(`execute in ${runDimID} run tp ${curPlayer.name.string} 14.0 270 14.0 180 0`)
    })
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
        // TODO: Make this somehow effect offline players (if null, add to a list to clear on login?)
        let player = server.getPlayer($UUID.fromString(uuidString)) || null
        if (!player) {
            server.persistentData["ended_run_players"].push(uuidString)
            return
        } else {
            player.tell(`Run "§b${runUUID}§r" has ended.`)
            player.persistentData["current_run"] = null
        }
    })
    let runDimID = `rogue:${runUUID}`
    return global.deleteDimension(runDimID)
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
