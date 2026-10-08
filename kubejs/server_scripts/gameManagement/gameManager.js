/** 
 * @param {Internal.Level} level
 * @param {Internal.BlockPos} blockPos 
 * @param {number} radius
 */
function getPlayerUUIDsInArea(level, blockPos, radius) {
    // Get a box around player for detecting other players to add to run
    let boundingBox = AABB.ofBlock(blockPos).inflate(radius)
    // Get players within the bounding box
    let playersInRunArray = level.getEntitiesOfClass($Player, boundingBox).map(p => p.stringUuid)
    return playersInRunArray
}

/**
 * @param {Internal.CommandSourceStack} event 
 * @param {Internal.Vec3d} startPos 
 * @returns {number} */
function startRun(event, startingPlayerUUIDArray) {
    const { server, player, level } = event

    // Generate a run uuid for tracking and dimension
    let runUUID = $UUID.randomUUID().toString()
    let runDimID = `rogue:${runUUID}`
    let playersInRunArray = startingPlayerUUIDArray

    // Template run object for tracking data related to the run
    let runObjTemplate = {
        "dimension": runDimID,      // The dimension for the run (`rogue:${runUUID}`)
        "current_theme": "dungeon", // TODO: pick a random theme (when theres more easy ones)
        "room_count": 0,            // Counter of how many rooms have generated per floor (0 lobby), resets on new floor
        "floor_number": 1,          // The floor number

        // TODO: implement these 2 when making better room gen
        "generated_boxes": [],  // List of all room bounding boxes that are currently generated (To prevent overlaps) (Rooms maybe cleared to free up space)
        "exhausted_rooms": [],  // List of rooms that have already been generated for the floor (To later prevent duplicate rooms)

        "starting_players": playersInRunArray,  // List of players present when run began
        "alive_players": playersInRunArray,     // List of currently alive players in the run (Including logged out players)
        "dead_players": [],                     // Players that have fully died and are spectating

        "current_room": {           // The current newest generated room, tracks spawners for room conquer status
            "room_id": undefined,   // Room ID string
            "spawners_mined": 0,    // Counter of how many spawners have been mined in the room so far
            "bounding_box": {}      // top and bottom corner X, Y, Z for the rooms bounding box (used to check spawners mined)
        }
    }

    // Add the initial run data obj to server data
    server.persistentData["runs"][runUUID] = runObjTemplate
    let runObj = server.persistentData["runs"][runUUID]

    console.log(`Starting run with UUID "${runUUID}" and players [${Array(playersInRunArray).join(", ")}]`)
    console.log(`Creating dimension "${runDimID}" with theme "${runObj.current_theme}"`)

    global.dims.createDimension(`kubejs:${runObj.current_theme}`, runDimID)
    server.runCommandSilent(`execute in ${runDimID} run forceload add -1 -1 1 1`)
    server.runCommandSilent(`execute in ${runDimID} run place template kubejs:lobby_dungeon 0 256 0`)

    // Add the run uuid to every player in the run
    playersInRunArray.forEach(uuid => {
        let runPlayer = server.getPlayer($UUID.fromString(uuid))
        runPlayer.persistentData["current_run"] = { "uuid": runUUID, "floor": 1 }
        server.runCommandSilent(`execute in ${runDimID} run tp ${runPlayer.name.string} 14.0 270 14.0 180 0`)
        global.titles.sendTitle(runPlayer, { clear: true, reset: true })
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

    if (!runObj) { console.log(`§bRun with UUID: §a"§f${runUUID}§a"§b not found.§r`); return 0 }
    delete server.persistentData["runs"][runUUID]

    /** @type {Internal.ListTag} */
    let alive_players = runObj.alive_players

    alive_players.forEach(uuid => {
        let uuidString = uuid.getAsString()
        let player = server.getPlayer($UUID.fromString(uuidString)) || null
        if (!player) {
            server.persistentData["ended_run_players"].push(uuidString)
            return
        } else {
            player.persistentData["current_run"] = null
        }
    })
    let runDimID = `rogue:${runUUID}`
    return global.dims.deleteDimension(runDimID)
}

// Run debug commands
ServerEvents.commandRegistry(e => {
    const { commands: Commands, arguments: Arguments } = e
    e.register(Commands.literal("dev")
        .requires(s => s.hasPermission(2))
        .then(Commands.literal("runs")
            .then(Commands.literal("startRun")
                .executes(ctx => {
                    let player = ctx.source.getPlayer()
                    if (!player) { return 0 }
                    let runPlayers = getPlayerUUIDsInArea(player.level, player.block.pos, 3)
                    return startRun(ctx.source, runPlayers)
                })
            )
            .then(Commands.literal("getOngoingRuns")
                .executes(ctx => {
                    const { server, player, level } = ctx.source
                    player.tell(`§bOngoing runs: §a[§f${Object.keys(server.persistentData["runs"]).join(", ") || "None"}§a]§r`)
                    player.tell(`§bOutputting runs data to console.§r`)
                    console.log(`"Ongoing runs":`, server.persistentData["runs"])
                    return 1
                })
            )
            .then(Commands.literal("getCurrentRun")
                .executes(ctx => {
                    const { server, player, level } = ctx.source
                    let runUUID = player.persistentData["current_run"]
                    player.tell(`§bOutput run data to console for run UUID: §a"§f${player.persistentData["current_run"]}§a"§r`)
                    console.log(`"Run data for UUID": ${runUUID}`, server.persistentData["runs"][runUUID])
                    return 1
                })
            )
            .then(Commands.literal("endRun")
                .executes(ctx => {
                    const { server, player, level } = ctx.source
                    let runUUID = player.persistentData["current_run"]
                    player.tell(`§bEnding run§r: §a"§f${runUUID}§a"§r`)
                    return endRun(ctx.source, runUUID)
                })
            )
            .then(Commands.literal("endAllRuns")
                .executes(ctx => {
                    const { server, player, level } = ctx.source
                    player.tell(`§bEnding all runs and clearing run data.§r`)
                    for (let runUUID of Object.keys(server.persistentData["runs"])) {
                        player.tell(`§bEnding run§r: §a"§f${runUUID}§a"§r`)
                        endRun(ctx.source, runUUID)
                    }
                    return 1
                })
            )
        )
    )
})
