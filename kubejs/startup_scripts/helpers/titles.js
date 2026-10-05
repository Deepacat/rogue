// Helper for sending player "titles" like /title, doing it the Java packet way
// rather than running a command from server scripts

global.titles = {}

function _toComponent(v) {
    if (v === null || v === undefined) return Component.empty()
    if (typeof v === 'string')         return Component.literal(v)
    return v // already a Component
}

function _resolvePlayers(targets) {
    let arr  = Array.isArray(targets) ? targets : [targets]
    let out  = []
    let list = Utils.server.getPlayerList()

    for (let t of arr) {
        if (t === null || t === undefined) continue

        // Already a ServerPlayer
        if (typeof t === 'object' && typeof t.getConnection === 'function') {
            out.push(t)
            continue
        }

        // JS string: try UUID, then name
        if (typeof t === 'string') {
            let p = null
            try { p = list.getPlayer($UUID.fromString(t)) } catch (e) { /* not a UUID */ }
            if (!p) p = list.getPlayerByName(t)
            if (p) out.push(p)
            continue
        }

        // java.util.UUID object
        if (typeof t === 'object' && typeof t.toString === 'function') {
            let p = null
            try { p = list.getPlayer(t) } catch (e) { /* fall through */ }
            if (!p) {
                try { p = list.getPlayer($UUID.fromString(String(t))) } catch (e) { /* nope */ }
            }
            if (p) out.push(p)
        }
    }
    return out
}

/**
 * @param {Internal.ServerPlayer | string | Internal.UUID | (Internal.ServerPlayer|string|Internal.UUID)[]} targets
 * @param {Object} options
 * {
 *   title?:     string | Component,
 *   subtitle?:  string | Component,
 *   actionbar?: string | Component,
 *   times?:     { fadeIn?: number, stay?: number, fadeOut?: number },  // ticks
 *   clear?:     boolean,
 *   reset?:     boolean
 * }
 */
function sendTitle(targets, options) {
    let players = _resolvePlayers(targets)
    if (!players.length) return

    let opts = options || {}

    if (opts.clear) {
        let pkt = new $ClientboundClearTitlesPacket(opts.reset === true)
        for (let p of players) p.connection.send(pkt)
        return
    }

    if (opts.times) {
        let pkt = new $ClientboundSetTitlesAnimationPacket(
            opts.times.fadeIn  ?? 10,
            opts.times.stay    ?? 70,
            opts.times.fadeOut ?? 20
        )
        for (let p of players) p.connection.send(pkt)
    }

    if (opts.subtitle !== undefined) {
        let pkt = new $ClientboundSetSubtitleTextPacket(_toComponent(opts.subtitle))
        for (let p of players) p.connection.send(pkt)
    }

    if (opts.title !== undefined) {
        let pkt = new $ClientboundSetTitleTextPacket(_toComponent(opts.title))
        for (let p of players) p.connection.send(pkt)
    }

    if (opts.actionbar !== undefined) {
        let pkt = new $ClientboundSetActionBarTextPacket(_toComponent(opts.actionbar))
        for (let p of players) p.connection.send(pkt)
    }
}

global.titles.sendTitle = sendTitle

// /* Examples

// ItemEvents.rightClicked('minecraft:dirt', event => {
//     sendTitle(event.player, {
//         title:    '§6Hello!',
//         subtitle: '§7From a KubeJS script',
//         times:    { fadeIn: 10, stay: 60, fadeOut: 20 }
//     })
// })

// // Broadcast to everyone by name
// sendTitle(['Steve', 'Alex'], { title: '§cServer restart in 5 min' })

// // Actionbar only
// sendTitle(event.player, { actionbar: '§a+50 XP' })

// // Clear current title
// sendTitle(event.player, { clear: true })

// // Clear and reset timings back to vanilla defaults
// sendTitle(event.player, { clear: true, reset: true })
// */