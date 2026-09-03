/**
 * Converts java compoungTag into a JS Object for use getting data from persistentData
 * ai generated deepa is liable kill me
 * @param {Internal.CompoundTag} tag 
 * @returns 
 */
function nbtToObject(tag) {
    if (tag === null || tag === undefined) return null

    const id = tag.getId()  // numeric NBT type ID

    // CompoundTag (id 10)
    if (id === 10) {
        const obj = {}
        for (let key of tag.getAllKeys()) {
            obj[key] = nbtToObject(tag.get(key))
        }
        return obj
    }

    // ListTag (id 9)
    if (id === 9) {
        const arr = []
        for (let i = 0; i < tag.size(); i++) {
            arr.push(nbtToObject(tag.get(i)))
        }
        return arr
    }

    // Numeric tags (1=Byte,2=Short,3=Int,4=Long,5=Float,6=Double)
    if ([1, 2, 3, 4, 5, 6].includes(id)) {
        return tag.getAsNumber()
    }

    // String (id 8)
    if (id === 8) return tag.getAsString()

    // ByteArray (id 7), IntArray (11), LongArray (12)
    if (id === 7) return tag.getAsByteArray()
    if (id === 11) return tag.getAsIntArray()
    if (id === 12) return tag.getAsLongArray()

    return tag.toString()
}

global.nbtToObject = nbtToObject