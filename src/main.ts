import {definePlugin, type PluginContext, type PluginWindowHandle} from '@type32/vertex-plugin'
import {h, shallowRef} from 'vue'
import {type Config, setContext} from './context'
import Kitty from './Kitty.vue'
import './style.css'

/** This window's kitty out on the desktop, while it is. */
const out = shallowRef<PluginWindowHandle>()

/**
 * Lets the kitty out: its own window (`desk`), on the screen's floor where it last sat. That window tells this one
 * where it settles (`{x}`, a share of the screen's width), which is remembered for the next time.
 */
async function letOut(ctx: PluginContext<Config>) {
    const place = (await ctx.data.global.get()) as { x?: number } | undefined
    const handle = await ctx.windows.open('desk', {params: {scale: Number(ctx.config.value.size), x: place?.x ?? 0.5}})
    out.value = handle
    const stop = handle.on((message) => {
        if (message && typeof message === 'object' && !Array.isArray(message) && typeof message.x === 'number') void ctx.data.global.set({x: message.x})
    })
    void handle.closed.then(() => {
        stop()
        out.value = undefined
    })
}

export default definePlugin<Config>({
    setup(ctx) {
        setContext(ctx)
        ctx.windows.define({id: 'desk', component: () => import('./Desk.vue')})
        if (ctx.window.kind === 'plugin') return

        // In the window while it isn't out on the desktop.
        ctx.views.overlay({
            id: 'furball',
            when: () => ctx.config.value.shown && !out.value,
            component: async () => ({render: () => h(Kitty, {ctx})}),
        })
        ctx.commands.register({
            id: 'let-out',
            label: 'plugins.furball.commands.letOut',
            icon: 'i-lucide-cat',
            palette: true,
            enabled: () => !out.value,
            run: () => letOut(ctx).catch(error => console.error('[furball] let out:', error)),
        })
        ctx.commands.register({
            id: 'call-back',
            label: 'plugins.furball.commands.callBack',
            icon: 'i-lucide-cat',
            palette: true,
            enabled: () => !!out.value,
            run: () => void out.value?.close(),
        })
    },
})
