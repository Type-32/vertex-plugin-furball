import type {PluginContext} from '@type32/vertex-plugin'

export interface Config {
    /** The kitty in this window. */
    shown: boolean
    /** Screen pixels per sheet pixel. */
    size: '2' | '3' | '4'
    /** Out on the desktop, it stays above other windows. */
    onTop: boolean
}

let current: PluginContext<Config> | undefined

/** Set once by `setup`, in every window the plugin runs in. */
export function setContext(ctx: PluginContext<Config>) {
    current = ctx
}

export function context(): PluginContext<Config> {
    if (!current) throw new Error('Furball: used before setup')
    return current
}
