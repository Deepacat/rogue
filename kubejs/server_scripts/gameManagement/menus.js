/**
 * @param {Internal.ItemClickedEventJS} event 
 * @param {Internal.ServerPlayer} player 
 */
let runCreationUI = (event, player) => {
    player.openChestGUI(Text.of(Text.red('Run Start Interface')), 3, gui => {
        gui.playerSlots = false

        gui.slot(4, 2, slot => {
            slot.item = heads.checkmark
        })

        let runPlayers = getPlayersForRun(player)

        for (let i = 0; i < runPlayers.length; i++) {
            /** @type {Internal.ServerPlayer} */
            let runPlayer = event.server.getPlayer($UUID.fromString(runPlayers[i]))
            gui.slot(i, 0, slot => {
                slot.item = Item.of('minecraft:player_head',)
                    .withNBT({ SkullOwner: `${runPlayer.name.string}`, display: { Name: `{"text":"§b${runPlayer.name.string}§f will join your run."}` } })
                slot.leftClicked = (ctx) => {
                    runPlayer.addMotion(0, 0.5, 0)
                }
            })
        }

        // gui.slot(1, 2, slot => {
        //     slot.item = 'green_concrete'
        // })
    })
}

ItemEvents.rightClicked(event => {
    if (event.item.id == "minecraft:iron_ingot") { runCreationUI(event, event.player) }
})