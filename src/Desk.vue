<script setup lang="ts">
/**
 * The kitty out on the desktop (`ownWindows` `desk`, bare): a window twice its size that follows it around the
 * screen's usable part, on whose bottom edge it walks. It tells the session window where it settles.
 */
import type {WindowProps} from '@type32/vertex-plugin'
import {onBeforeUnmount, onMounted, useTemplateRef, watch} from 'vue'
import {context} from './context'
import {CELL} from './pet/draw'
import {createStage, type Stage} from './pet/stage'

const props = defineProps<WindowProps>()
const canvas = useTemplateRef('canvas')
const ctx = context()
let stage: Stage | undefined
let gone = false
let told: number | undefined
let timer: ReturnType<typeof setInterval> | undefined

watch(() => ctx.config.value.onTop, on => void props.window.setAlwaysOnTop(on), {immediate: true})

onMounted(async () => {
    const scale = Number(props.params.scale) || 3
    await props.window.setSize(CELL * scale * 2, CELL * scale * 2)
    const area = await props.window.workArea()
    const sheet = new Image()
    sheet.src = ctx.plugin.assetUrl('kitty.png')
    await sheet.decode()
    if (gone || !canvas.value) return
    stage = createStage(canvas.value, {sheet, scale, desk: {area, move: props.window.setPosition}})
    const share = typeof props.params.x === 'number' ? props.params.x : 0.5
    stage.pet.x = share * area.width
    // Where it settles, now and then: not every step of a walk.
    timer = setInterval(() => {
        const pet = stage!.pet
        const x = Math.round(pet.x)
        if (!pet.grounded || pet.state === 'walk' || x === told) return
        told = x
        void props.channel.post({x: x / area.width}).catch(() => {})
    }, 2000)
})
onBeforeUnmount(() => {
    gone = true
    clearInterval(timer)
    stage?.destroy()
})
</script>

<template>
  <canvas ref="canvas" class="tw:fixed tw:inset-0 tw:size-full" data-furball-desk/>
</template>
