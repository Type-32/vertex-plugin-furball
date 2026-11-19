<script setup lang="ts">
/**
 * The kitty and what it holds: a canvas, a sign over its head (the next thing to do, or a text it was asked to hold
 * up) and, after a poke, the bubble with every thing, each ticked off there. The overlay and the desk window both
 * draw this; where the things come from and where a tick goes is theirs.
 */
import {computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch} from 'vue'
import {context} from './context'
import {CELL} from './pet/draw'
import {createStage, type Desk, type Stage} from './pet/stage'
import type {Shout, Thing} from './things'

const props = defineProps<{ scale: number, things: Thing[], shout?: Shout, desk?: Desk }>()
const emit = defineEmits<{ done: [Thing], open: [Thing], bubble: [height: number | undefined], started: [Stage] }>()

const canvas = useTemplateRef('canvas')
const sign = useTemplateRef('sign')
const bubble = useTemplateRef('bubble')
const ctx = context()
const open = ref(false)
const said = ref<string>()
const held = computed(() => said.value ?? props.things[0]?.title)
/** The things by their source's label, in order. */
const groups = computed(() => {
    const by = new Map<string, Thing[]>()
    for (const thing of props.things) by.set(thing.label, [...by.get(thing.label) ?? [], thing])
    return [...by]
})
let stage: Stage | undefined
let frame = 0
let gone = false
let unsay: ReturnType<typeof setTimeout> | undefined

/** Puts `el`'s bottom middle at `(x, y)` in the canvas, inside its width. */
function place(el: HTMLElement | null, x: number, y: number, shown: boolean) {
    if (!el) return
    el.style.visibility = shown ? 'visible' : 'hidden'
    if (!shown) return
    const half = el.offsetWidth / 2
    const left = Math.min(Math.max(x, half + 4), (canvas.value?.clientWidth ?? 0) - half - 4)
    el.style.transform = `translate(${Math.round(left - half)}px, ${Math.round(y - el.offsetHeight)}px)`
}

onMounted(async () => {
    const sheet = new Image()
    sheet.src = ctx.plugin.assetUrl('kitty.png')
    await sheet.decode()
    if (gone || !canvas.value) return
    stage = createStage(canvas.value, {sheet, scale: props.scale, desk: props.desk, onPoke: () => (open.value = !open.value && props.things.length > 0)})
    mood(props.things)
    emit('started', stage)
    const pet = stage.pet
    frame = requestAnimationFrame(function follow() {
        const {x, y} = stage!.local()
        const top = y - pet.size * 0.95
        const awake = pet.state !== 'sleep' && pet.state !== 'held' && pet.state !== 'fall'
        place(sign.value, x, top, !!held.value && !open.value && awake)
        place(bubble.value, x, top, open.value)
        frame = requestAnimationFrame(follow)
    })
})
onBeforeUnmount(() => {
    gone = true
    cancelAnimationFrame(frame)
    clearTimeout(unsay)
    stage?.destroy()
})

watch(() => props.scale, (scale) => {
    if (stage) stage.pet.size = CELL * scale
})
/** Busy with things to do, restless with a late one; with none, no bubble. */
function mood(things: Thing[]) {
    if (stage) {
        stage.pet.busy = things.length > 0
        stage.pet.restless = things.some(t => t.late)
    }
    if (!things.length) open.value = false
}
watch(() => props.things, mood)
// The bubble's height, for the desk window to grow by while it's open.
watch(open, () => {
    emit('bubble', open.value ? bubble.value?.offsetHeight : undefined)
}, {flush: 'post'})
watch(() => props.shout, (shout) => {
    if (!shout || !stage) return
    if (shout.kind === 'cheer') return stage.cheer()
    stage.startle()
    said.value = shout.text
    clearTimeout(unsay)
    unsay = setTimeout(() => (said.value = undefined), 10_000)
})

function tick(thing: Thing) {
    stage?.eat(props.things.length === 1)
    emit('done', thing)
}
</script>

<template>
  <div class="tw:pointer-events-none tw:fixed tw:inset-0 tw:z-40" data-furball-pet>
    <canvas ref="canvas" class="tw:absolute tw:inset-0 tw:size-full"/>
    <div
      ref="sign"
      class="tw:pointer-events-none tw:absolute tw:top-0 tw:left-0 tw:invisible tw:max-w-[calc(100%-8px)] tw:truncate tw:rounded-md tw:bg-default tw:px-2 tw:py-0.5 tw:text-xs tw:font-medium tw:shadow tw:ring tw:ring-default"
      :class="things[0]?.late && !said && 'tw:text-error'"
      data-furball-sign
    >
      {{ held }}
    </div>
    <div
      ref="bubble"
      class="tw:pointer-events-auto tw:absolute tw:top-0 tw:left-0 tw:invisible tw:w-64 tw:max-w-[calc(100%-8px)] tw:rounded-lg tw:bg-default tw:p-2 tw:text-sm tw:shadow-lg tw:ring tw:ring-default"
      data-furball-bubble
    >
      <section v-for="[label, list] in groups" :key="label">
        <p class="tw:px-1 tw:pb-1 tw:text-xs tw:text-muted">{{ label }}</p>
        <div v-for="thing in list" :key="`${thing.source}:${thing.id}`" class="tw:flex tw:items-center tw:gap-2 tw:rounded tw:px-1 tw:py-1 tw:hover:bg-elevated" data-furball-thing>
          <UCheckbox :model-value="false" @update:model-value="tick(thing)"/>
          <button class="tw:min-w-0 tw:flex-1 tw:truncate tw:text-left" :class="thing.late && 'tw:text-error'" @click="emit('open', thing)">{{ thing.title }}</button>
          <span v-if="thing.when" class="tw:shrink-0 tw:text-xs tw:text-muted">{{ thing.when }}</span>
        </div>
      </section>
    </div>
  </div>
</template>
