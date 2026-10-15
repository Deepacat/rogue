let enableRPC = true

/** @type {Internal.CompoundTag} */
let rpcData = {
    serverPersistentData: null,
    playerPersistentData: null,
    rooms: null
}

NetworkEvents.dataReceived('kubejs:rpc', event => {
    if (!enableRPC) return
    const data = event.data || {}
    rpcData = data
})

PresenceJSEvents.build(event => {
    if (!enableRPC) return
    const presence = event.getPresence()
    const ctx = event.getContext()
    // Discord app ID
    presence.setClientId('1559843079010263100')

    /// Fallback
    // Upper text
    presence.setDetails('𝓈𝓉𝓇𝒶𝒾𝑔𝒽𝓉 𝓊𝓅 𝒹𝑒𝓋𝓋𝒾𝓃𝑔 𝒾𝓉, 𝒶𝓃 𝒷𝓎 𝒾𝓉 𝓌𝑒𝓁𝓁 𝓁𝑒𝓉𝓈 𝒿𝓊𝓈𝓉𝓇 𝓈𝒶𝓎, 𝓂𝓎 𝓅𝒶𝓀𝒸')
    // Lower text
    presence.setState("meow")
    // Large image on the left (asset ID, message)
    presence.setLargeImage('blob', `theyre eating my flesh`)
    // Smaller image on the bottom right of it (asset ID, message)
    presence.setSmallImage('paws', `paws at u`)
    // Add buttons (left to right, 2 max) (label, url)
    presence.addButton(PresenceJS.button('Github', 'https://github.com/Deepacat/rogue'))
    presence.addButton(PresenceJS.button('x3', 'https://deepa.cat/'))

    // Overrides
    if (rpcData?.serverPersistentData != null && rpcData?.playerPersistentData != null && rpcData?.rooms != null) {
        let playerData = rpcData?.playerPersistentData
        let playerRun = playerData?.current_run

        let serverData = rpcData?.serverPersistentData || null

        let serverRun = null
        if (serverData?.runs) {
            serverRun = serverData.runs[playerRun.uuid] || null
        }

        if (serverRun && serverRun.current_room) {
            let roomObj = rpcData.rooms[serverRun.current_room.room_id]
            let floorText = `F${serverRun.floor_number}`
            let spawnersMined = serverRun.current_room.spawners_mined
            let spawnerTotalReq = Math.floor(roomObj.spawner_count * roomObj.room_data.spawners_required)
            let roomName = String(serverRun.current_room.room_id).split(":")[1]
            presence.setState(
                `${floorText}` +
                ` / in ${roomName}` +
                ` / ⛏ ${spawnersMined}/${spawnerTotalReq} spawners`
            )
        } else {
            presence.setState(`In lobby.`)
        }
    }
})

// When RPC is starting
PresenceJSEvents.ready(event => {
    if (!enableRPC) return
    // gets discord user
    const user = event.getUser()
    // gets discord users name
    const name = user == null ? 'unknown user' : user.getEffectiveName()
    console.info(`[PresenceJS] Connected to Discord as ${name}`)
})

// When RPC is disconnected
PresenceJSEvents.disconnected(event => {
    if (!enableRPC) return
    console.info(`[PresenceJS] Discord disconnected: ${event.getMessage()}`)
})

// PresenceJSEvents.build(event => {
//     const presence = event.getPresence()
//     const context = event.getContext()

//     // Discord app ID
//     presence.setClientId('1559843079010263100')
//     // Upper text
//     presence.setDetails('straight up devving it, it by it well lets justr say, my pakc')
//     // Lower text
//     presence.setState("no i wont finish it")
//     // Large image on the left (asset ID, message)
//     presence.setLargeImage(PresenceJS.image('blob', 'awawa'))
//     // Smaller image on the bottom right of it (asset ID, message)
//     presence.setSmallImage(PresenceJS.image('paws', 'paws at u'))
//     // Add buttons (left to right, 2 max) (label, url)
//     presence.addButton(PresenceJS.button('Github', 'https://github.com/Deepacat/rogue'))
//     presence.addButton(PresenceJS.button('x3', 'https://deepa.cat/'))

// })

// // When RPC is starting
// PresenceJSEvents.ready(event => {
//     // gets discord user
//     const user = event.getUser()
//     // gets discord users name
//     const name = user == null ? 'unknown user' : user.getEffectiveName()
//     console.info(`[PresenceJS] Connected to Discord as ${name}`)
// })

// // When RPC is disconnected
// PresenceJSEvents.disconnected(event => {
//     console.info(`[PresenceJS] Discord disconnected: ${event.getMessage()}`)
// })