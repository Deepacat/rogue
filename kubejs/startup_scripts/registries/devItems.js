StartupEvents.registry('item', e => {
    // Attribute debugger stick for dumping attributes to log
    e.create('kubejs:attribute_debugger')
        .tooltip("Hold in offhand and right click to dump attribute stats\nof mainhand item to kubejs server log")
        .texture("minecraft:item/stick")
        .color(0, "#ff0000")
})