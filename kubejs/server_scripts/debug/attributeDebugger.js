ItemEvents.rightClicked(e => {
    if (e.player.offhandItem.id != 'kubejs:attribute_debugger') return
    if(e.hand == 'off_hand') return
    e.player.tell('Dumped attribute data to server.log')

    let player = e.player
    let item = player.mainHandItem

    if (!item || item.isEmpty()) return

    console.log(`Item: ${item.id}`)

    for (let slot of $EquipmentSlot.values()) {
        let modifiers = item.getAttributeModifiers(slot)
        if (modifiers.isEmpty()) continue

        console.log(`- Slot: ${slot.name()}`)

        let entries = modifiers.entries().toArray()

        for (let entry of entries) {
            let attribute = entry.key
            let modList = entry.value

            let list = modList.toArray ? modList.toArray() : [modList]

            for (let mod of list) {
                console.log(`- Attribute: ${attribute.descriptionId}`)
                console.log(`-- UUID: ${mod.id}`)
                console.log(`-- Name: ${mod.name}`)
                console.log(`-- Amount: ${mod.amount}`)
                console.log(`-- Operation: ${mod.operation}`)
            }
        }
    }
})