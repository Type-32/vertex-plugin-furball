// The kitty on a page, with no Vertex: `bun demo/index.html`.
import sheetUrl from '../public/kitty.png'
import {createStage, type Stage} from '../src/pet/stage'

const sheet = new Image()
sheet.src = sheetUrl
await sheet.decode()
const stage = createStage(document.querySelector('canvas')!, {sheet, scale: 3})
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-do]')) {
    button.onclick = () => stage[button.dataset.do as keyof Pick<Stage, 'cheer' | 'eat' | 'startle' | 'sleep'>]()
}
