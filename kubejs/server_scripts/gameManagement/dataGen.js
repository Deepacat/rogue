// priority: 999


/* Script for generating data related to game management system, like room lists */


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

JsonIO.write('kubejs/script_data/floor_data_dump.json', floorData)
JsonIO.write('kubejs/script_data/floor_themes_dump.json', { themes: floorThemes })
JsonIO.write('kubejs/script_data/room_types_dump.json', { types: roomTypes })

// Init runs data
ServerEvents.loaded(e => {
    if (e.server.persistentData["runs"] == undefined) { e.server.persistentData["runs"] = {} }
})
