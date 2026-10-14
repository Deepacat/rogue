// Other helper commands unrelated to modpack specific or debugging (Or just want to type quickly)

ServerEvents.commandRegistry(e => {
	const { commands: Commands, arguments: Arguments } = e

	// quick kjs reloads
	e.register(Commands.literal("qrl")
		.requires(s => s.hasPermission(2))
		.executes(ctx => {
			/** @type {Internal.Player} */
			let player = ctx.source.player
			if (!player) return 0
			player.runCommand("kubejs reload startup_scripts")
			player.runCommand("kubejs reload server_scripts")
			player.runCommand("kubejs reload client_scripts")
			return 1
		})
	)
	// quick renames held item
	e.register(Commands.literal("renameHand")
		.requires(s => s.hasPermission(2))
		.then(Commands.argument("newName", Arguments.GREEDY_STRING.create(e))
			.executes(ctx => {
				return renameItem(ctx, Commands, Arguments)
			})
		)
	)
	// quick kill nearby mobs
	e.register(Commands.literal("killNearest")
		.requires(s => s.hasPermission(2))
		// no args = kill 1 nearest mob
		.executes(ctx => {
			return killNear(ctx, {})
		})
		// amount
		.then(Commands.argument("amount", Arguments.INTEGER.create(e))
			.executes(ctx => {
				return killNear(ctx, { amount: Arguments.INTEGER.getResult(ctx, "amount") })
			})
			// specify entity type ID
			// TODO: add suggestions
			.then(Commands.argument("entityID", Arguments.GREEDY_STRING.create(e))
				.executes(ctx => {
					return killNear(ctx, {
						amount: Arguments.INTEGER.getResult(ctx, "amount"),
						entity: Arguments.GREEDY_STRING.getResult(ctx, "entityID")
					})
				})
			)
		)
	)
})