import {definePlugin} from '@type32/vertex-plugin'
import {h} from 'vue'
import Kitty from './Kitty.vue'
import './style.css'

export interface Config {
    /** The kitty in this window. */
    shown: boolean
    /** Screen pixels per sheet pixel. */
    size: '2' | '3' | '4'
}

export default definePlugin<Config>({
    setup(ctx) {
        ctx.views.overlay({
            id: 'furball',
            when: () => ctx.config.value.shown,
            component: async () => ({render: () => h(Kitty, {ctx})}),
        })
    },
})
