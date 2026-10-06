/**
 * @param {Internal.ItemClickedEventJS} event 
 * @param {Internal.ServerPlayer} player 
 */
function runCreationUI(event, player) {
    player.openChestGUI(Text.of(Text.red('Run Start Interface')), 3, gui => {
        gui.playerSlots = false
        // TODO: Make this sort by like distance and take a max player param
        let runPlayerUUIDs = getPlayerUUIDsInArea(event.level, event.player.block.pos, 3)
        let removedPlayerUUIDs = [] // temp var for removed player list

        function newUI(runPlayerUUIDs, removedPlayerUUIDs) {
            // Run start checkbox button
            gui.slot(4, 2, slot => {
                slot.item = Item.of(heads.checkmark)
                    .withNBT({
                        display: {
                            Name: `{"text":"§aStart run"}`,
                            Lore: [
                                `{"text":"§7Click to start the run with ${runPlayerUUIDs.length - removedPlayerUUIDs.length} players:"}`,
                                `{"text":"§7${runPlayerUUIDs.filter(p => !removedPlayerUUIDs.includes(p)).map(p => `§b${event.server.getPlayer($UUID.fromString(p)).name.string}§f`).join(', ')}"}`
                            ]
                        }
                    })
                slot.leftClicked = (ctx) => {
                    let finalRunPlayerUUIDs = runPlayerUUIDs.filter(p => !removedPlayerUUIDs.includes(p))
                    event.player.closeMenu()
                    global.titles.sendTitle(finalRunPlayerUUIDs, {
                        title: '§fStarting run',
                        subtitle: '§bPlease wait a moment...',
                        times: { fadeIn: 5, stay: 100, fadeOut: 10 }
                    })
                    event.server.scheduleInTicks(1, () => {
                        startRun(event, finalRunPlayerUUIDs)
                    })
                }
            })

            // Loop over players and add a slot with their head for removals
            /** @type {Array<string>} */
            let playersExceptSelf = runPlayerUUIDs.filter(p => p != player.uuid)

            console.log(`Slots (${playersExceptSelf.length} players):`)

            for (let playerUUID of playersExceptSelf) {
                /** @type {Internal.Player} */
                let runPlayer = event.server.getPlayer($UUID.fromString(playerUUID))

                let isPlayerRemoved = removedPlayerUUIDs.includes(runPlayer.uuid.toString())
                let joinOrNotMsg = isPlayerRemoved ? "§cwill not§f" : "§awill§f"

                let coll = (playersExceptSelf.indexOf(playerUUID)) % 9
                let row = Math.floor(playersExceptSelf.indexOf(playerUUID) / 9)
                gui.slot(coll, row, slot => {
                    slot.item = Item.of('minecraft:player_head') // Players head
                        .withNBT({
                            SkullOwner: `${runPlayer.name.string}`,
                            display: {
                                Name: `{"text":"§b${runPlayer.name.string}§f ${joinOrNotMsg} join your run."}`,
                                Lore: [`{"text":"§7Click to ${isPlayerRemoved ? '§lAdd§r§7' : '§lRemove§r§7'} player"}`]
                            }
                        })
                    slot.leftClicked = (ctx) => {
                        if (removedPlayerUUIDs.includes(runPlayer.uuid.toString())) {
                            // Add removed player back to run
                            removedPlayerUUIDs = removedPlayerUUIDs.filter(p => p != runPlayer.uuid.toString())
                        } else {
                            // Remove player from run
                            removedPlayerUUIDs.push(runPlayer.uuid.toString())
                        }
                        // Reopen UI with updated player list
                        newUI(runPlayerUUIDs, removedPlayerUUIDs)
                    }
                })
            }
        }

        // Open UI first time
        newUI(runPlayerUUIDs, [])
    })
}

ItemEvents.rightClicked(event => {
    if (event.item.id == "minecraft:iron_ingot") { runCreationUI(event, event.player) }
})