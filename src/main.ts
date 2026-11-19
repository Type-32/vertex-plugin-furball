import {definePlugin, type PluginContext, type PluginWindowHandle, type WindowMessage} from '@type32/vertex-plugin'
import {effectScope, h, shallowRef, watch} from 'vue'
import {type Config, setContext} from './context'
import Kitty from './Kitty.vue'
import {api, doThing, shout, things} from './things'
import './style.css'

/** This window's kitty out on the desktop, while it is. */
const out = shallowRef<PluginWindowHandle>()

/**
 * Lets the kitty out: its own window (`desk`), on the screen's floor where it last sat. This window sends it the
 * things to do (when it's ready, and as they change) and what it's asked, and does what it's told: a tick or an open
 * goes to the thing's source, and where it settles (`{x}`, a share of the screen's width) is kept for next time.
 */
async function letOut(ctx: PluginContext<Config>) {
    const place = (await ctx.data.global.get()) as { x?: number } | undefined
    const handle = await ctx.windows.open('desk', {params: {scale: Number(ctx.config.value.size), x: place?.x ?? 0.5}})
    out.value = handle
    const send = (message: WindowMessage) => void handle.post(message).catch(() => {})
    const sendThings = () => send({things: things.value as unknown as WindowMessage})
    const scope = effectScope(true)
    scope.run(() => {
        watch(things, sendThings)
        watch(shout, value => value && send({shout: value}))
    })
    const stop = handle.on((message) => {
        if (!message || typeof message !== 'object' || Array.isArray(message)) return
        if (message.ready) sendThings()
        if (typeof message.x === 'number') void ctx.data.global.set({x: message.x})
        for (const what of ['done', 'open'] as const) {
            const thing = message[what]
            if (thing && typeof thing === 'object' && !Array.isArray(thing) && typeof thing.source === 'string' && typeof thing.id === 'string') {
                doThing({source: thing.source, id: thing.id}, what)
            }
        }
    })
    void handle.closed.then(() => {
        scope.stop()
        stop()
        out.value = undefined
    })
}

export default definePlugin<Config>({
    setup(ctx) {
        setContext(ctx)
        ctx.windows.define({id: 'desk', component: () => import('./Desk.vue')})
        if (ctx.window.kind === 'plugin') return
        // Other plugins' things to do, cheers and reminders (`api.ts`).
        ctx.provide(api)

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
