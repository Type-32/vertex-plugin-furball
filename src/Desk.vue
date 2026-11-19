<script setup lang="ts">
/**
 * The kitty out on the desktop (`ownWindows` `desk`, bare): a window twice its size that follows it around the
 * screen's usable part, on whose bottom edge it walks; taller and wider while its bubble is open. The session window
 * sends it the things to do and what it's asked (`{things}`, `{shout}`), and hears its ticks (`{done}`, `{open}`) and
 * where it settles (`{x}`, a share of the screen's width).
 */
import type {WindowMessage, WindowProps} from '@type32/vertex-plugin'
import {onBeforeUnmount, onMounted, shallowRef, watch} from 'vue'
import {context} from './context'
import {CELL} from './pet/draw'
import type {Desk} from './pet/stage'
import PetView from './PetView.vue'
import type {Shout, Thing} from './things'

const props = defineProps<WindowProps>()
const ctx = context()
const scale = Number(props.params.scale) || 3
const size = CELL * scale
const desk = shallowRef<Desk>()
const things = shallowRef<Thing[]>([])
const shout = shallowRef<Shout>()
let told: number | undefined
let timer: ReturnType<typeof setInterval> | undefined

watch(() => ctx.config.value.onTop, on => void props.window.setAlwaysOnTop(on), {immediate: true})

const stop = props.channel.on((message) => {
    if (!message || typeof message !== 'object' || Array.isArray(message)) return
    if (Array.isArray(message.things)) things.value = message.things as unknown as Thing[]
    if (message.shout && typeof message.shout === 'object') shout.value = message.shout as unknown as Shout
})
const post = (message: WindowMessage) => void props.channel.post(message).catch(() => {})

onMounted(async () => {
    await props.window.setSize(size * 2, size * 2)
    desk.value = {area: await props.window.workArea(), move: props.window.setPosition}
    post({ready: true})
})
onBeforeUnmount(() => {
    stop()
    clearInterval(timer)
})

/** Once the kitty is drawn: put it where it last sat, and tell where it settles, now and then. */
function started(stage: { pet: { x: number, grounded: boolean, state: string } }) {
    const area = desk.value!.area
    stage.pet.x = (typeof props.params.x === 'number' ? props.params.x : 0.5) * area.width
    timer = setInterval(() => {
        const x = Math.round(stage.pet.x)
        if (!stage.pet.grounded || stage.pet.state === 'walk' || x === told) return
        told = x
        post({x: x / area.width})
    }, 2000)
}

const thingKey = (thing: Thing) => ({source: thing.source, id: thing.id})
function bubble(height: number | undefined) {
    void props.window.setSize(height ? Math.max(size * 2, 272) : size * 2, size * 2 + (height ?? 0))
}
</script>

<template>
  <PetView
    v-if="desk"
    :scale="scale"
    :things="things"
    :shout="shout"
    :desk="desk"
    @started="started"
    @done="thing => post({done: thingKey(thing)})"
    @open="thing => post({open: thingKey(thing)})"
    @bubble="bubble"
  />
</template>
