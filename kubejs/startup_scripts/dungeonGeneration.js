// priority: 100

/**
 * @param {string} dimensionCopyID The ID of the dimension to copy the world generation of for the new dimension
 * @param {string} newGeneratedDimID The ID of the newly generated dimension
 * @returns {Internal.ServerLevel}
 */
function createDimension(dimensionCopyID, newGeneratedDimID) {
    let copiedDim = Utils.server.getLevel(dimensionCopyID)
    // Generate a copy of the dimension using multiworld mod
    let newDim = $MultiworldMod.create_world(
        newGeneratedDimID,                          // The dimension ID that the new dimension will have
        Utils.server.registryAccess()               // Java resource key of the copied dim
            .registryOrThrow($Registries.DIMENSION_TYPE)
            .getKey(copiedDim.dimensionType()),
        copiedDim.chunkSource.generator,            // Chunk generator of the copied dim
        copiedDim.difficulty,                       // Difficulty of the copied dim
        new $Random().nextLong()                    // Random Java long to use as a seed for new dim
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

function deleteDimension(dimensionID) {
    Utils.server.runCommandSilent(`execute in ${dimensionID} run forceload remove all`)
    $InfiniverseAPI.get().markDimensionForUnregistration(Utils.server, $ResourceKey.create($Registries.DIMENSION, dimensionID))
    return 1
}

// Global functions (the base functions aren't global for type annotation sake)
global.createDimension = createDimension
global.deleteDimension = deleteDimension
