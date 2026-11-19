/**
 * Furball's API, for other plugins: copy this file into yours, then `ctx.whenPlugin('furball', furball => …)` (or
 * `ctx.use('furball')`) is typed. Furball provides it in each session window where it's on. It only types; it imports
 * nothing of Furball's.
 */

/** One thing to do, as the kitty holds it up and lists it. */
export interface FurballThing {
    id: string
    title: string
    /** When it's for, already in the reader's words (`14:00`, `Tomorrow`); shown beside the title. */
    when?: string
    /** Past its time: the kitty is restless while any thing is. */
    late?: boolean
}

/** A plugin's list of things to do. Furball reads `items` in a Vue `computed`, so a reactive list is followed. */
export interface FurballSource {
    /** One per plugin: a second `source` with the same id replaces the first. */
    id: string
    /** Over its things in the kitty's bubble; already translated. */
    label: string
    items(): readonly FurballThing[]
    /** Ticked in the bubble. The kitty eats it. */
    done(id: string): unknown
    /** Its title clicked in the bubble. */
    open?(id: string): unknown
}

export interface FurballApi {
    /** Adds a list of things to do; returns what removes it. */
    source(source: FurballSource): () => void
    /** The kitty hops with hearts. */
    cheer(): void
    /** The kitty startles and holds up `text` for a while (a reminder that's due). */
    nudge(text: string): void
}

declare module '@type32/vertex-plugin' {
    interface PluginApis {
        furball: FurballApi
    }
}
