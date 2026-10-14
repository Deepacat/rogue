ServerEvents.commandRegistry(e => {
    const { commands: Commands, arguments: Arguments } = e

    e.register(Commands.literal("dev")
        .requires(s => s.hasPermission(2))
        // Room detector command
        .then(Commands.literal("detectRooms")
            // No argument, auto-detect the room player is currently in the bounding box of
            .executes(ctx => {
                detectRooms(ctx, Commands, Arguments, null)
                return 1
            })
            // Radius argument, scan given chunk radius and add all valid rooms
            .then(Commands.argument("radius", Arguments.INTEGER.create(e))
                .executes(ctx => {
                    let radius = Arguments.INTEGER.getResult(ctx, "radius")
                    detectRooms(ctx, Commands, Arguments, radius)
                    return 1
                })
            )
        )
        // Run management commands
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
        // Edit looked at block nbt data command
        .then(Commands.literal("editBlockData")
            .then(Commands.argument('obj', Arguments.GREEDY_STRING.create(e))
                .suggests((ctx, builder) => {
                    builder.suggest('{"foo": "bar"}')
                    builder.suggest('{"key": "value"}')
                    return builder.buildFuture()
                })
                .executes(ctx => {
                    return editBlockData(ctx, Commands, Arguments, Arguments.GREEDY_STRING.getResult(ctx, 'obj'))
                })
            )
        )
        // Edit looked at room data block command
        .then(Commands.literal("editRoomDataBlock")
            .then(Commands.literal("spawners_required")
                .then(Commands.argument("value", Arguments.FLOAT.create(e))
                    .suggests((ctx, builder) => {
                        builder.suggest("0")
                        builder.suggest("0.5")
                        builder.suggest("1")
                        return builder.buildFuture()
                    })
                    .executes(ctx => {
                        let value = Arguments.FLOAT.getResult(ctx, "value")
                        if (value < 0 || value > 1) {
                            ctx.source.player.tell("Value must be between 0 and 1")
                            return 0
                        }
                        // Round to 3 decimal places
                        let rounded = Number(value).toFixed(3)
                        editBlockData(ctx, Commands, Arguments, `{"spawners_required":${rounded}}`)
                        return 1
                    })
                )
            )
            // Branch for floor_theme
            .then(Commands.literal("floor_theme")
                .then(Commands.argument("value", Arguments.STRING.create(e))
                    .suggests((ctx, builder) => {
                        floorThemes.forEach(theme => builder.suggest(theme))
                        return builder.buildFuture()
                    })
                    .executes(ctx => {
                        let value = Arguments.STRING.getResult(ctx, "value")
                        editBlockData(ctx, Commands, Arguments, `{"floor_theme":"${value}"}`)
                        return 1
                    })
                )
            )
            // Branch for room_type
            .then(Commands.literal("room_type")
                .then(Commands.argument("value", Arguments.STRING.create(e))
                    .suggests((ctx, builder) => {
                        roomTypes.forEach(type => builder.suggest(type))
                        return builder.buildFuture()
                    })
                    .executes(ctx => {
                        let value = Arguments.STRING.getResult(ctx, "value")
                        editBlockData(ctx, Commands, Arguments, `{"room_type":"${value}"}`)
                        return 1
                    })
                )
            )
        )
        // Dimension commands
        .then(Commands.literal("dims")
            .then(Commands.literal("createDim")
                .then(Commands.argument("dimensionCopyID", Arguments.STRING.create(e))
                    .then(Commands.argument("newGeneratedDimID", Arguments.STRING.create(e))
                        .executes(ctx => {
                            let dimID = `rogue:${Arguments.STRING.getResult(ctx, "newGeneratedDimID")}_${$UUID.randomUUID().toString()}`
                            console.log(`Creating dimension: ${dimID}`)
                            global.dims.createDimension(Arguments.STRING.getResult(ctx, "dimensionCopyID"), dimID)
                            console.log(`Created dimension: ${dimID}`)
                            return 1
                        })
                    )
                )
            )
            .then(Commands.literal("deleteDimension")
                .then(Commands.argument("dimensionID", Arguments.GREEDY_STRING.create(e))
                    .suggests((ctx, builder) => {
                        ctx.source.server.levelKeys().stream().forEach(dim => { builder.suggest(`${dim.namespace}:${dim.path}`) })
                        return builder.buildFuture()
                    })
                    .executes(ctx => {
                        let dimID = Arguments.GREEDY_STRING.getResult(ctx, "dimensionID")
                        console.log(`Deleting dimension: ${dimID}`)
                        return global.dims.deleteDimension(dimID)
                    })
                )
            )
        )
    )
})