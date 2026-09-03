// Registry: each entry has a condition test and a handler function
global.attributeHandlerRegistry = []

/**
 * Convert a condition (string or object) into a predicate function.
 * @param {string|object} condition 
 * @returns {function(Internal.ItemStack, Internal.EquipmentSlot):boolean}
 */
function buildConditionTest(condition) {
    // String condition: item id or #tag (backward compatible)
    if (typeof condition === 'string') {
        if (condition.startsWith('#')) {
            let tagKey = condition.substring(1)
            return (itemStack, slotType) => itemStack.hasTag(tagKey)
        } else {
            let itemId = condition
            return (itemStack, slotType) => itemStack.id === itemId
        }
    }

    // Object condition
    if (typeof condition === 'object' && condition !== null) {
        let itemFilter = condition.item
        let tagFilter = condition.tag
        let slotFilter = condition.slot

        // Normalize slotFilter to array
        if (slotFilter !== undefined) {
            if (!Array.isArray(slotFilter)) slotFilter = [slotFilter]
            // Convert string slot names to lowercase for case-insensitive compare
            slotFilter = slotFilter.map(s => s.toLowerCase())
        }

        // Return a predicate that checks all defined filters
        return (itemStack, slotType) => {
            // Item ID check
            if (itemFilter !== undefined && itemStack.id !== itemFilter) return false

            // Tag check
            if (tagFilter !== undefined && !itemStack.hasTag(tagFilter)) return false

            // Slot check
            if (slotFilter !== undefined) {
                // Get slot name from the enum (e.g., "mainhand", "head")
                let currentSlot = slotType.name().toLowerCase()
                if (!slotFilter.includes(currentSlot)) return false
            }
            return true
        }
    }
    throw new Error('Condition must be a string (item ID or #tag) or an object with keys: item, tag, slot')
}

/**
 * Register a handler for ItemAttributeModifierEvent.
 * @param {string|object} condition - Either:
 *   - string: item ID (e.g. 'minecraft:bow') or tag (e.g. '#forge:tools')
 *   - object: { item?: string, tag?: string, slot?: string|string[] }
 *        Example: { item: 'minecraft:diamond_sword', slot: 'mainhand' }
 *        Example: { tag: 'forge:tools', slot: ['head', 'chest'] }
 * @param {function(Internal.ItemAttributeModifierEvent):void} handler 
 */
global.onItemAttributeModifier = (condition, handler) => {
    let testFunction = buildConditionTest(condition)

    global.attributeHandlerRegistry.push({
        test: (itemStack, slotType) => testFunction(itemStack, slotType),
        handler: handler
    })
}

// Main event handler
ForgeEvents.onEvent('net.minecraftforge.event.ItemAttributeModifierEvent', e => {
    let itemStack = e.itemStack
    let slotType = e.slotType
    for (let entry of global.attributeHandlerRegistry) {
        if (entry.test(itemStack, slotType)) {
            entry.handler(e)
        }
    }
})

/*** @param {string|object} condition @param {function(Internal.ItemAttributeModifierEvent):void} handler */
let attrMod = (condition, handler) => global.onItemAttributeModifier(condition, handler)

// attrMod({ item: 'minecraft:bow' }, (e) => {
//     // e.removeModifier('projectile_damage:generic',
//     //     new $AttributeModifier(UUID.fromString('e5d0a858-012b-11ed-b939-0242ac120002'),
//     //         'Bow Remove Proj', 6, 'addition'))
// })

// attrMod({ item: 'minecraft:bow', slot: 'mainhand' }, (e) => {
//     e.addModifier('puffish_attributes:ranged_damage',
//         new $AttributeModifier('01e79da4-0b12-4857-8cc4-785165a78795', 'Bow r', 4, 'addition'))
//     // e.addModifier('alembic:arcane_damage',
//     //     new $AttributeModifier('c1e79da4-0b12-4857-8cc4-785165a78795', 'Bow Arcane', 4, 'addition'))
//     // e.addModifier('alembic:alchemical_damage',
//     //     new $AttributeModifier('970e4318-fe38-482a-993b-3eb26a9a4687', 'Bow Alchemical', 1, 'addition'))
// })

// attrMod({ item: 'minecraft:diamond_sword', slot: 'mainhand' }, (e) => {
//     e.addModifier('alembic:arcane_damage',
//         new $AttributeModifier('02d98fd9-9650-49c8-9909-1bb5d3276152', 'modifier name', 4, 'addition'))
//     e.addModifier('forge:entity_reach',
//         new $AttributeModifier('03d98ce9-9650-49c8-9909-1bb5d3276152', 'modifier name', 20, 'addition'))
// })

// attrMod({ item: 'irons_spellbooks:decrepit_scythe', slot: 'mainhand' }, (e) => {
//     e.addModifier('generic.attack_speed',
//         new $AttributeModifier('04d98fd9-9650-49c8-9909-1bb5d9156152', 'modifier name', -0.8, 'multiply_base'))
//     e.addModifier('forge:entity_reach',
//         new $AttributeModifier('05d98ce9-9650-49c8-9909-1bb5d3190153', 'modifier name', 7, 'addition'))
//     e.addModifier('alembic:arcane_damage',
//         new $AttributeModifier('06d98ce9-9650-49c8-9909-1bb5d3190153', 'modifier name', 40, 'addition'))
// })

// StartupEvents.registry('item', e => {
//     let sword = e.create("cool_sword", "sword")
//     sword.modifyAttribute("forge:entity_reach", "my_reach_addition", 2.5, "addition")
// })