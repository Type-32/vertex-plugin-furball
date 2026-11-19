/**
 * Draws the kitty from its sheet (`public/kitty.png`): cells of `CELL`×`CELL`, one row per animation, the feet on a
 * cell's bottom row, walking facing right. The layout is `SHEET`; another sheet in that layout is another kitty.
 */
import type {MarkKind, Pet} from './cat'

export const CELL = 32

/** Each animation's row, and how many cells it has, in order. */
export const SHEET = {
    /** Sitting, blinking, eyes left, eyes right; tail up. */
    sit: {row: 0, cells: ['sit', 'tail', 'blink', 'lookLeft', 'lookRight']},
    /** Happy, happy with the tail up, chomping open, shut. */
    happy: {row: 1, cells: ['happy', 'tail', 'chompOpen', 'chompShut']},
    alert: {row: 2, cells: ['alert', 'tail']},
    sleep: {row: 3, cells: ['in', 'out']},
    walk: {row: 4, cells: ['0', '1', '2', '3']},
    /** Held by the scruff, and falling. */
    hang: {row: 5, cells: ['0', '1']},
    /** What flies off it, each in the middle of its cell. */
    marks: {row: 6, cells: ['heart', 'z', 'bang', 'crumb'] satisfies MarkKind[]},
} as const

interface Cell {
    row: number
    col: number
    flip: boolean
}

const cycle = (time: number, fps: number, n: number) => Math.floor(time * fps) % n

/** The cell for what it's doing; `time` is the seconds the stage has run, for what loops whatever the state. */
export function pose(pet: Pet, time: number): Cell {
    const at = (row: number, col: number, flip = false): Cell => ({row, col, flip})
    switch (pet.state) {
        case 'held':
        case 'fall':
            return at(SHEET.hang.row, cycle(time, 4, 2))
        case 'sleep':
            return at(SHEET.sleep.row, cycle(time, 0.8, 2))
        case 'walk':
            return at(SHEET.walk.row, cycle(pet.t, 8, 4), pet.facing < 0)
        case 'happy':
            return at(SHEET.happy.row, cycle(pet.t, 5, 2))
        case 'eat':
            return at(SHEET.happy.row, 2 + cycle(pet.t, 6, 2))
        case 'startle':
            return at(SHEET.alert.row, cycle(pet.t, 6, 2))
        case 'sit':
            if (time % 4.3 < 0.15) return at(SHEET.sit.row, 2)
            if (pet.look) return at(SHEET.sit.row, pet.look < 0 ? 3 : 4)
            return at(SHEET.sit.row, time % 3 < 0.4 ? 1 : 0)
    }
}

/** Draws the kitty and its marks; the context's transform is world pixels, smoothing off. */
export function draw(g: CanvasRenderingContext2D, sheet: CanvasImageSource, pet: Pet, time: number) {
    const {row, col, flip} = pose(pet, time)
    const s = Math.max(-0.35, Math.min(0.35, pet.squash))
    const w = pet.size * (1 - s * 0.6)
    const h = pet.size * (1 + s)
    g.save()
    g.translate(Math.round(pet.x), Math.round(pet.y))
    if (flip) g.scale(-1, 1)
    g.drawImage(sheet, col * CELL, row * CELL, CELL, CELL, -w / 2, -h, w, h)
    g.restore()
    for (const m of pet.marks) {
        g.globalAlpha = Math.min(1, m.life * 2)
        const half = pet.size / 2
        g.drawImage(sheet, SHEET.marks.cells.indexOf(m.kind) * CELL, SHEET.marks.row * CELL, CELL, CELL,
            Math.round(m.x - half), Math.round(m.y - half), pet.size, pet.size)
    }
    g.globalAlpha = 1
}
