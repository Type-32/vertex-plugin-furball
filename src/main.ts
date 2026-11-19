import {definePlugin} from '@type32/vertex-plugin'
import {h} from 'vue'
import View from './View.vue'
import './style.css'

export default definePlugin({
    setup(ctx) {
        ctx.views.panel({
            id: 'my-plugin',
            // An i18n key: this plugin's strings are `plugins.my-plugin.…`, from `locales/`.
            label: 'plugins.my-plugin.view',
            icon: 'i-lucide-puzzle',
            defaultArea: 'right',
            component: async () => ({render: () => h(View, {ctx})}),
        })
    },
})
