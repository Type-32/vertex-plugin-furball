import vue from '@vitejs/plugin-vue'
import {vertex} from '@type32/vertex-plugin/vite'
import {defineConfig} from 'vite'

// `vertex()` builds `src/main.ts`, `plugin.json`, `locales/` and `public/` into `dist/`, the folder Vertex installs;
// `pack` also writes `plugin.zip`, the asset a release carries.
export default defineConfig({plugins: [vue(), vertex({pack: true})]})
