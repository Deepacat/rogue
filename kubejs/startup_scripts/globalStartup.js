// priority: 1000
// All class loads used in startup scripts

const $AttributeModifier = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier')
const $UUID = Java.loadClass('java.util.UUID')
const $EquipmentSlot = Java.loadClass('net.minecraft.world.entity.EquipmentSlot')
const $Random = Java.loadClass("java.util.Random")
const $Set = Java.loadClass("java.util.Set")
const $Registries = Java.loadClass("net.minecraft.core.registries.Registries")
const $ResourceKey = Java.loadClass("net.minecraft.resources.ResourceKey")
const $MinecraftForge = Java.loadClass("net.minecraftforge.common.MinecraftForge")
const $LevelEvent$Load = Java.loadClass("net.minecraftforge.event.level.LevelEvent$Load")
const $MultiworldMod = Java.loadClass("me.isaiah.multiworld.MultiworldMod")
const $InfiniverseAPI = Java.loadClass("commoble.infiniverse.api.InfiniverseAPI")
const $InfiniverseMod = Java.loadClass("commoble.infiniverse.internal.InfiniverseMod")
const $QuietPacketDistributors = Java.loadClass("commoble.infiniverse.internal.QuietPacketDistributors")
const $UpdateDimensionsPacket = Java.loadClass("commoble.infiniverse.internal.UpdateDimensionsPacket")
const $CompoundTag = Java.loadClass("net.minecraft.nbt.CompoundTag")