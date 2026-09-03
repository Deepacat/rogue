// Create floor data from saved room data for easier room picking
let savedRooms = JsonIO.read('kubejs/script_data/saved_rooms.json')
let floorData = {}
for (let [roomName, roomObj] of Object.entries(savedRooms)) {
    let roomData = roomObj.room_data
    
    floorData[roomData.floor_theme] = floorData[roomData.floor_theme] || []
    floorData[roomData.floor_theme].push(roomName)
}
JsonIO.write('kubejs/script_data/floor_data.json', floorData)