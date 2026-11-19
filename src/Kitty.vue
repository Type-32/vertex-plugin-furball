<script setup lang="ts">
/** The overlay: the kitty along the window's bottom edge, with this window's things to do. */
import type {PluginContext} from '@type32/vertex-plugin'
import type {Config} from './context'
import PetView from './PetView.vue'
import {doThing, shout, things} from './things'

defineProps<{ ctx: PluginContext<Config> }>()
</script>

<template>
  <PetView
    :scale="Number(ctx.config.value.size)"
    :things="things"
    :shout="shout"
    @done="thing => doThing(thing, 'done')"
    @open="thing => doThing(thing, 'open')"
  />
</template>
