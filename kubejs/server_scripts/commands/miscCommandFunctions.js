/**
 * Kills the nearest entity. amount of entities with first arg, entity type with second arg
 * @param {Internal.CommandContext<Internal.CommandSourceStack>} ctx */
function killNear(ctx, obj) {
	const { server, player, level } = ctx.source
	let amount = obj.amount || 1
	let entity = obj.entity || null
	let returnCode = server.runCommand(`execute as ${player.name.string} run kill @e[type=${entity || "!minecraft:player"},sort=nearest,limit=${amount}]`)

	if (returnCode === 0) { ctx.source.player.tell(`No entity found`) }
	return returnCode
}

/**
 * Renames the players mainhand held item (I just use for differentiating items saved in EMI)
 * @param {Internal.CommandContext<Internal.CommandSourceStack>} ctx */
function renameItem(ctx, Commands, Arguments) {
	const { server, player, level } = ctx.source
	player.mainHandItem.setHoverName(Text.of(Arguments.GREEDY_STRING.getResult(ctx, "newName")))
}
