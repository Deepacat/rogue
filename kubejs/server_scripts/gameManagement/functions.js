/** 
 * Gets the player's current run from reference
 * @param {Internal.Player} player
 */
function getPlayerRun(player) {
    let currentRun = player.server.persistentData["runs"][player.persistentData["current_run"].uuid] || null
    return currentRun
}