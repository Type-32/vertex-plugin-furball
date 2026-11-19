import {computed, shallowReactive, shallowRef} from 'vue'
import type {FurballApi, FurballSource, FurballThing} from './api'

/** A thing to do with the source it's from: plain JSON, so the desk window can be sent it. */
export interface Thing extends FurballThing {
    source: string
    label: string
}

/** What the kitty is asked to do from outside: cheer, or hold up a text. `at` tells one ask from the next. */
export type Shout = { kind: 'cheer', at: number } | { kind: 'say', text: string, at: number }

// This session window's sources (other plugins' lists), and what the kitty is asked, wherever it is.
const sources = shallowReactive(new Map<string, FurballSource>())
export const shout = shallowRef<Shout>()

/** Every source's things, late ones first, each source's order kept. */
export const things = computed<Thing[]>(() => {
    const all = [...sources.values()].flatMap(s => s.items().map(item => ({...item, source: s.id, label: s.label})))
    return [...all.filter(t => t.late), ...all.filter(t => !t.late)]
})

/** A thing ticked or opened in the bubble, given to its source. */
export function doThing(thing: Pick<Thing, 'source' | 'id'>, what: 'done' | 'open') {
    const source = sources.get(thing.source)
    void Promise.resolve(what === 'done' ? source?.done(thing.id) : source?.open?.(thing.id))
        .catch((error: unknown) => console.error(`[furball] ${thing.source} ${what}:`, error))
}

/** What Furball provides other plugins in this window. */
export const api: FurballApi = {
    source(source) {
        sources.set(source.id, source)
        return () => void (sources.get(source.id) === source && sources.delete(source.id))
    },
    cheer: () => void (shout.value = {kind: 'cheer', at: Date.now()}),
    nudge: text => void (shout.value = {kind: 'say', text, at: Date.now()}),
}
