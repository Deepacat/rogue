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

	let nbtArray = Object.entries(global.nbt.nbtToJS(nbtCopy))
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
	return global.dims.deleteDimension(Arguments.GREEDY_STRING.getResult(ctx, "dimensionID"))
}