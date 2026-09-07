/**
 * Kills the nearest entity. amount of entities with first arg, entity type with second arg
 * @param {Internal.CommandContext<Internal.CommandSourceStack>} ctx */
function killNear(ctx, obj) {
	const { server, player, level } = ctx.source
	let amount = obj.amount || 1
	let entity = obj.entity || null
	let c = server.runCommand(`execute as ${player.name.string} run kill @e[type=${entity || "!minecraft:player"},sort=nearest,limit=${amount}]`)

	if (returnCode === 0) { ctx.source.player.tell(`No entity found`) }
	return c
}

/**
 * Renames the players mainhand held item (I just use for differentiating items saved in EMI)
 * @param {Internal.CommandContext<Internal.CommandSourceStack>} ctx */
function renameItem(ctx, Commands, Arguments) {
	const { server, player, level } = ctx.source
	player.mainHandItem.setHoverName(Text.of(Arguments.GREEDY_STRING.getResult(ctx, "newName")))
}

/**
 * Merges data into the targeted blocks NBT data
 * @param {Internal.CommandContext<Internal.CommandSourceStack>} ctx 
 * @param {Internal.Commands} Commands 
 * @param {Internal.ArgumentTypeWrappers} Arguments 
 */
function editBlockData(ctx, Commands, Arguments, obj) {
	const { server, level, player } = ctx.source
	let block = player.rayTrace().block
	/** @type {Internal.CompoundTag} */
	let nbtCopy = block?.entityData || null
	if (!nbtCopy) {
		player.tell(`No block selected, or block is not an entity.`)
		return 0
	}

	let jsonObj = JSON.parse(obj) || null
	if (!jsonObj) {
		player.tell(`Invalid JSON syntax. Keys must be quoted alongside values. E.g. /dev editBlockData { "key": "value" }`)
		return 0
	}

	nbtCopy.merge({ data: jsonObj })

	let nbtArray = Object.entries(global.nbtToObject(nbtCopy))
	for (let [key, val] of nbtArray) {
		console.log(`${key}: ${val}`)
	}
	block.setEntityData(nbtCopy)
	return 1
}

/**
 * @param {Internal.CommandContext<Internal.CommandSourceStack>} ctx 
 * @param {Internal.Commands} Commands 
 * @param {Internal.ArgumentTypeWrappers} Arguments 
 */
function deleteDimension(ctx, Commands, Arguments) {
	return global.deleteDimension(Arguments.GREEDY_STRING.getResult(ctx, "dimensionID"))
}

ServerEvents.commandRegistry(e => {
	const { commands: Commands, arguments: Arguments } = e
	// e.register(Commands.literal("rogue"))
	e.register(Commands.literal("dev")
		.requires(s => s.hasPermission(2))
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
		.then(Commands.literal("createDim")
			.then(Commands.argument("dimensionCopyID", Arguments.STRING.create(e))
				.then(Commands.argument("newGeneratedDimID", Arguments.STRING.create(e))
					.executes(ctx => {
						let dimID = `rogue:${Arguments.STRING.getResult(ctx, "newGeneratedDimID")}_${$UUID.randomUUID().toString()}`
						console.log(`Creating dimension: ${dimID}`)
						global.createDimension(Arguments.STRING.getResult(ctx, "dimensionCopyID"), dimID)
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
					return global.deleteDimension(dimID)
				})
			)
		)
	)
	e.register(Commands.literal("renameHand")
		.requires(s => s.hasPermission(2))
		.then(Commands.argument("newName", Arguments.GREEDY_STRING.create(e))
			.executes(ctx => {
				return renameItem(ctx, Commands, Arguments)
			})
		)
	)
	e.register(Commands.literal("killNearest")
		.requires(s => s.hasPermission(2))
		.executes(ctx => {
			return killNear(ctx, {})
		})
		.then(Commands.argument("amount", Arguments.INTEGER.create(e))
			.executes(ctx => {
				return killNear(ctx, { amount: Arguments.INTEGER.getResult(ctx, "amount") })
			})
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