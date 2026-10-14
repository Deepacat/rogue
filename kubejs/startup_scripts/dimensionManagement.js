// priority: 100

global.dims = {}

// World generation code mostly taken from Gcats Gambleth modpack

/**
 * @param {string} dimensionCopyID The ID of the dimension to copy the world generation of for the new dimension
 * @param {string} newGeneratedDimID The ID of the newly generated dimension
 * @returns {Internal.ServerLevel}
 */
function createDimension(dimensionCopyID, newGeneratedDimID) {
    let copiedDim = Utils.server.getLevel(dimensionCopyID)
    let dimGenerator = copiedDim.chunkSource.generator

    console.log(dimGenerator.biomeSource)

    // Create a new dimension copy using multiworld mod
    let newDim = $MultiworldMod.create_world(
        newGeneratedDimID,            // The dimension ID that the new dimension will have
        Utils.server.registryAccess() // Java resource key of the copied dim
            .registryOrThrow($Registries.DIMENSION_TYPE)
            .getKey(copiedDim.dimensionType()),
        dimGenerator,                 // Chunk generator of the copied dim
        copiedDim.difficulty,         // Difficulty of the copied dim
        new $Random().nextLong()      // Random Java long to use as a seed for new dim
    )

    // have no clue what the code below does, this will be commented as i figure it out
    Utils.server.markWorldsDirty()
    $MinecraftForge.EVENT_BUS.post(new $LevelEvent$Load(newDim))
    $QuietPacketDistributors.sendToAll(
        $InfiniverseMod.CHANNEL,
        new $UpdateDimensionsPacket($Set.of($ResourceKey.create($Registries.DIMENSION, newGeneratedDimID)), true)
    )

    return newDim
}
global.dims.createDimension = createDimension

function deleteDimension(dimensionID) {
    console.log(`Attempting to delete dimension: ${dimensionID}`)
    Utils.server.runCommandSilent(`execute in ${dimensionID} run forceload remove all`)
    Utils.server.scheduleInTicks(1, () => {
        console.log(`Deleting dimension: ${dimensionID}`)
        $InfiniverseAPI.get().markDimensionForUnregistration(Utils.server, $ResourceKey.create($Registries.DIMENSION, dimensionID))
        if (Utils.server.getLevel(dimensionID) != null) {
            console.log(`Failed to delete dimension: ${dimensionID}`)
        }
    })
    return 1
}
global.dims.deleteDimension = deleteDimension
