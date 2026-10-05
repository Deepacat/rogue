/**
 * @param {Internal.ItemClickedEventJS} event 
 * @param {Internal.ServerPlayer} player 
 */
let runCreationUI = (event, player) => {
    player.openChestGUI(Text.of(Text.red('Run Start Interface')), 3, gui => {
        gui.playerSlots = false

        let runPlayers = getPlayerUUIDsInArea(event.level, event.player.block.pos, 3)
        let removedPlayers = []

        let newUI = (runPlayers, removedPlayers) => {
            gui.slot(4, 2, slot => {
                slot.item = Item.of(heads.checkmark)
                    .withNBT({ display: { Name: `{"text":"§aStart run"}` } })
                slot.leftClicked = (ctx) => {
                    //         while (var5.hasNext()) {
                    // ServerPlayer serverPlayer = (ServerPlayer)var5.next();
                    //             serverPlayer.connection.send((Packet)packetGetter.apply(ComponentUtils.updateForEntity(source, title, serverPlayer, 0)));
                    //         }
                    // player.connection.send()
                    event.server.scheduleInTicks(1, () => {
                        // startRun(event, runPlayers.filter(p => !removedPlayers.includes(p)))
                    })
                }
            })

            for (let i = 0; i < runPlayers.length; i++) {
                /** @type {Internal.Player} */
                let runPlayer = event.server.getPlayer($UUID.fromString(runPlayers[i]))
                let playerRemoved = removedPlayers.includes(runPlayer.uuid.toString())
                let joinOrNotMsg = playerRemoved ? "§cwill not§f" : "§awill§f"

                gui.slot(i, 0, slot => {
                    slot.item = Item.of('minecraft:player_head')
                        .withNBT({ SkullOwner: `${runPlayer.name.string}`, display: { Name: `{"text":"§b${runPlayer.name.string}§f ${joinOrNotMsg} join your run."}` } })
                    slot.leftClicked = (ctx) => {
                        if (removedPlayers.includes(runPlayer.uuid.toString())) {
                            // Add removed player back to run
                            removedPlayers = removedPlayers.filter(p => p != runPlayer.uuid.toString())
                        } else {
                            // Remove player from run
                            if (runPlayer.uuid.toString() == player.uuid.toString()) {
                                player.tell(`§cYou cannot remove yourself from the run.`)
                                return
                            }
                            removedPlayers.push(runPlayer.uuid.toString())
                        }
                        newUI(runPlayers, removedPlayers)
                    }
                })
            }
        }

        newUI(runPlayers, [])

        // gui.slot(1, 2, slot => {
        //     slot.item = 'green_concrete'
        // })
    })
}

ItemEvents.rightClicked(event => {
    if (event.item.id == "minecraft:iron_ingot") { runCreationUI(event, event.player) }
})

ItemEvents.rightClicked(event => {
    if (event.item.id !== 'minecraft:dirt') return
    global.titles.sendTitle(event.player.uuid, {
        title: '§6Hello!',
        subtitle: '§7From a KubeJS script',
        times: { fadeIn: 10, stay: 60, fadeOut: 20 }
    })

    // if (event.level.isClientSide()) return

    // /** @type {Internal.ServerPlayer} */
    // const player = event.player
    // if (!player) return

    // const $ClientboundSetTitleTextPacket = Java.loadClass('net.minecraft.network.protocol.game.ClientboundSetTitleTextPacket')
    // const $ClientboundSetSubtitleTextPacket = Java.loadClass('net.minecraft.network.protocol.game.ClientboundSetSubtitleTextPacket')
    // const $ClientboundSetTitlesAnimationPacket = Java.loadClass('net.minecraft.network.protocol.game.ClientboundSetTitlesAnimationPacket')

    // const title = Component.literal('§6Hello!')
    // const subtitle = Component.literal('§7From a KubeJS script')

    // // fadeIn, stay, fadeOut are in ticks (20 = 1 sec)
    // // Need to 
    // player.connection.send(new $ClientboundSetTitlesAnimationPacket(10, 60, 20))
    // player.connection.send(new $ClientboundSetSubtitleTextPacket(subtitle))
    // player.connection.send(new $ClientboundSetTitleTextPacket(title))
})