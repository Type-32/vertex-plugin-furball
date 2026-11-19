/**
 * Draws every frame to `sheet.png`, on a light and a dark ground: `bun scripts/sheet.ts [palette] [out]`. The way to
 * look at the pixels while changing them (`src/pet/sprites.ts`), and the picture in the README.
 */
import {deflateSync} from 'node:zlib'
import {hang, PALETTES, sit, SIZE, sleep, walk} from '../src/pet/sprites'

const FRAMES = {
    sit: sit(), sitTail: sit('open', 'smile', 1), lookLeft: sit('open', 'smile', 0, -1), lookRight: sit('open', 'smile', 0, 1),
    blink: sit('closed'), happy: sit('happy', 'open'), alert: sit('wide', 'flat'), chomp: sit('open', 'open'),
    sleep0: sleep(0), sleep1: sleep(1), walk0: walk(0), walk1: walk(1), walk2: walk(2), walk3: walk(3),
    hang0: hang(0), hang1: hang(1),
}

const palette = PALETTES[(process.argv[2] ?? 'ginger') as keyof typeof PALETTES]
if (!palette) throw new Error(`no palette "${process.argv[2]}": ${Object.keys(PALETTES).join(', ')}`)
const SCALE = 5
const PAD = 4
const COLUMNS = 6
const names = Object.keys(FRAMES) as (keyof typeof FRAMES)[]
const cell = (SIZE + PAD * 2) * SCALE
const rows = Math.ceil(names.length / COLUMNS)
const width = cell * COLUMNS
const height = cell * rows * 2
const rgba = new Uint8Array(width * height * 4)
const rgb = (hex: string) => [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16))

for (let y = 0; y < height; y++) {
    const ground = y < height / 2 ? [244, 244, 240] : [30, 31, 38]
    for (let x = 0; x < width; x++) rgba.set([...ground, 255], (y * width + x) * 4)
}
for (const [half, offset] of [[0, 0], [1, height / 2]] as const) {
    void half
    names.forEach((name, i) => {
        const left = (i % COLUMNS) * cell + PAD * SCALE
        const top = offset + Math.floor(i / COLUMNS) * cell + PAD * SCALE
        FRAMES[name].forEach((row, py) => [...row].forEach((key, px) => {
            if (key === '.') return
            const colour = rgb(palette[key as keyof typeof palette])
            for (let sy = 0; sy < SCALE; sy++) {
                for (let sx = 0; sx < SCALE; sx++) rgba.set([...colour, 255], ((top + py * SCALE + sy) * width + left + px * SCALE + sx) * 4)
            }
        }))
    })
}

function chunk(type: string, data: Uint8Array): Buffer {
    const body = Buffer.concat([Buffer.from(type), data])
    const out = Buffer.alloc(body.length + 8)
    out.writeUInt32BE(data.length, 0)
    body.copy(out, 4)
    out.writeUInt32BE(Bun.hash.crc32(body), body.length + 4)
    return out
}
const header = Buffer.alloc(13)
header.writeUInt32BE(width, 0)
header.writeUInt32BE(height, 4)
header.set([8, 6, 0, 0, 0], 8)
const lines = Buffer.alloc((width * 4 + 1) * height)
for (let y = 0; y < height; y++) lines.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1)
const out = process.argv[3] ?? 'sheet.png'
await Bun.write(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(lines)), chunk('IEND', new Uint8Array())]))
console.log(`${out}: ${names.length} frames, ${width}×${height}`)
