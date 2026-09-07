// priority: 999

/* Script for generating/dumping data related to game management systems */

// Create floor data from saved room data for easier room picking
let savedRooms = JsonIO.read('kubejs/script_data/saved_rooms.json')
let floorData = {}
// const floorThemes = ["dungeon"/* , "magic", "lush" */]
let floorThemes = []
// const roomTypes = ["normal" /* , "long", "miniboss", "boss", "shrine" */]
let roomTypes = []

// Get all the floor themes and room types present in saved room data
for (let [roomName, roomObj] of Object.entries(savedRooms)) {
    let roomData = roomObj.room_data

    if (!floorThemes.includes(roomData.floor_theme)) { floorThemes.push(roomData.floor_theme) }
    if (!roomTypes.includes(roomData.room_type)) { roomTypes.push(roomData.room_type) }

    // floorData[roomData.floor_theme] = floorData[roomData.floor_theme] || []
    // floorData[roomData.floor_theme].push(roomName)

    floorData[roomData.floor_theme] = floorData[roomData.floor_theme] || {}
    floorData[roomData.floor_theme][roomData.room_type] = floorData[roomData.floor_theme][roomData.room_type] || []
    floorData[roomData.floor_theme][roomData.room_type].push(roomName)
}

JsonIO.write('kubejs/script_data/debug/floor_data_dump.json', floorData)
JsonIO.write('kubejs/script_data/debug/floor_themes_dump.json', { themes: floorThemes })
JsonIO.write('kubejs/script_data/debug/room_types_dump.json', { types: roomTypes })

ServerEvents.loaded(e => {
    // Create persistent data variables if they don't exist
    if (e.server.persistentData["ended_run_players"] == undefined) { e.server.persistentData["ended_run_players"] = [] }
    if (e.server.persistentData["runs"] == undefined) { e.server.persistentData["runs"] = {} }
    // Write server data to file for reading to debug
    let serverDataObj = global.nbtToObject(e.server.persistentData)
    JsonIO.write('kubejs/script_data/debug/persistent_data_dump.json', serverDataObj)
})

// Rerun every minute to update dumped data
ServerEvents.tick(e => {
    if (e.server.tickCount % (20) != 0) return
    let serverDataObj = global.nbtToObject(e.server.persistentData)
    JsonIO.write('kubejs/script_data/debug/persistent_data_dump.json', serverDataObj)
})