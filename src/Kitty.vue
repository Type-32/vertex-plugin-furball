<script setup lang="ts">
/**
 * The overlay: a canvas over the whole window with the kitty on the window's bottom edge. The canvas takes no
 * pointer events; the stage takes a press on the kitty and leaves the rest to the window.
 */
import type {PluginContext} from '@type32/vertex-plugin'
import {onBeforeUnmount, onMounted, useTemplateRef, watch} from 'vue'
import type {Config} from './main'
import {CELL} from './pet/draw'
import {createStage, type Stage} from './pet/stage'

const props = defineProps<{ ctx: PluginContext<Config> }>()
const canvas = useTemplateRef('canvas')
const scale = () => Number(props.ctx.config.value.size)
let stage: Stage | undefined
let gone = false

onMounted(async () => {
    const sheet = new Image()
    sheet.src = props.ctx.plugin.assetUrl('kitty.png')
    await sheet.decode()
    if (gone || !canvas.value) return
    stage = createStage(canvas.value, {sheet, scale: scale()})
})
watch(scale, (next) => {
    if (stage) stage.pet.size = CELL * next
})
onBeforeUnmount(() => {
    gone = true
    stage?.destroy()
})
</script>

<template>
  <canvas ref="canvas" class="tw:fixed tw:inset-0 tw:size-full tw:z-40" data-furball/>
</template>
