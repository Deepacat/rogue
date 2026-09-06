// /** @type {Internal.CustomBuilderObject} */
// let passthroughBlock

// StartupEvents.registry('block', e => {
//     /** @type {Internal.BlockBehaviour$Properties} */
//     let passthroughBlockProps = new $BlockProperties.of()

//     passthroughBlock = e.createCustom('kubejs:passthrough_block_breakable_redstone', () => {
//         new $PoweredBlock(passthroughBlockProps
//             .requiresCorrectToolForDrops()
//             .strength(5.0, 6.0)
//             .sound(SoundType.METAL)
//             .isRedstoneConductor(() => false)
//         )
//     })
// })

// StartupEvents.registry('item', e => {
//     e.createCustom('kubejs:passthrough_block_breakable_redstone', () => {
//         new $BlockItem(passthroughBlock.get(), new $ItemProperties())
//     })
// })