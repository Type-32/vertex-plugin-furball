/**
 * Writes the placeholder kitty (`src/pet/sprites.ts`) as the sheet the pet draws from, in `SHEET`'s layout:
 * `bun scripts/sheet.ts [palette]` → `public/kitty.png`. Goes, with `sprites.ts`, once a drawn sheet replaces it.
 */
import {deflateSync} from 'node:zlib'
import {CELL, SHEET} from '../src/pet/draw'
import {type Frame, hang, MARKS, PALETTES, sit, sleep, walk} from '../src/pet/sprites'

const palette = PALETTES[(process.argv[2] ?? 'ginger') as keyof typeof PALETTES]
if (!palette) throw new Error(`no palette "${process.argv[2]}": ${Object.keys(PALETTES).join(', ')}`)

/** A mark in the middle of a cell. */
const centred = (part: readonly string[]): Frame => {
    const top = Math.floor((CELL - part.length) / 2)
    const left = Math.floor((CELL - part[0]!.length) / 2)
    return Array.from({length: CELL}, (_, y) => {
        const row = part[y - top]
        return row ? '.'.repeat(left) + row + '.'.repeat(CELL - left - row.length) : '.'.repeat(CELL)
    })
}

const rows: Record<keyof typeof SHEET, Frame[]> = {
    sit: [sit(), sit('open', 'smile', 1), sit('closed'), sit('open', 'smile', 0, -1), sit('open', 'smile', 0, 1)],
    happy: [sit('happy', 'open'), sit('happy', 'open', 1), sit('open', 'open'), sit('happy', 'smile')],
    alert: [sit('wide', 'flat'), sit('wide', 'flat', 1)],
    sleep: [sleep(0), sleep(1)],
    walk: [walk(0), walk(1), walk(2), walk(3)],
    hang: [hang(0), hang(1)],
    marks: SHEET.marks.cells.map(kind => centred(MARKS[kind])),
}

const width = CELL * Math.max(...Object.values(SHEET).map(r => r.cells.length))
const height = CELL * Object.keys(SHEET).length
const rgba = new Uint8Array(width * height * 4)
const rgb = (hex: string) => [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16))
for (const [name, frames] of Object.entries(rows)) {
    if (frames.length !== SHEET[name as keyof typeof SHEET].cells.length) throw new Error(`${name}: ${frames.length} frames for its row's cells`)
    frames.forEach((frame, col) => frame.forEach((line, y) => [...line].forEach((key, x) => {
        if (key === '.') return
        rgba.set([...rgb(palette[key as keyof typeof palette]), 255], ((SHEET[name as keyof typeof SHEET].row * CELL + y) * width + col * CELL + x) * 4)
    })))
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
await Bun.write('public/kitty.png', Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(lines)), chunk('IEND', new Uint8Array())]))
console.log(`public/kitty.png: ${width}×${height}`)
