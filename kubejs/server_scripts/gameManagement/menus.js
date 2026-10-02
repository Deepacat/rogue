/**
 * @param {Internal.ItemClickedEventJS} event 
 * @param {Internal.ServerPlayer} player 
 */
let runCreationUI = (event, player) => {
    player.openChestGUI(Text.of(Text.red('Run Start Interface')), 3, gui => {
        gui.playerSlots = false

        // TODO: Allow removing players from the run by clicking them

        gui.slot(4, 2, slot => {
            slot.item = Item.of(heads.checkmark)
                .withNBT({ display: { Name: `{"text":"§aStart run"}` } })
            slot.leftClicked = (ctx) => {
                event.server.scheduleInTicks(1, () => {
                    // TODO: Make startRun take a player list rather than a blockPos for finding players
                    startRun(event, new BlockPos(event.player.x, event.player.y, event.player.z))
                })
            }
        })

        let runPlayers = getPlayerUUIDsInArea(player, 3)

        for (let i = 0; i < runPlayers.length; i++) {
            /** @type {Internal.Player} */
            let runPlayer = event.server.getPlayer($UUID.fromString(runPlayers[i]))
            gui.slot(i, 0, slot => {
                slot.item = Item.of('minecraft:player_head')
                    .withNBT({ SkullOwner: `${runPlayer.name.string}`, display: { Name: `{"text":"§b${runPlayer.name.string}§f will join your run."}` } })
                slot.leftClicked = (ctx) => {

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