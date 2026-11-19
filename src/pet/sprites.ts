/**
 * The kitty, pixel by pixel: 32×32 frames put together from parts (a head, a face, a body, a tail), so every pose
 * wears the same head. A frame is 32 strings of 32 palette keys; `.` is nothing. Its feet are on the frame's last
 * row in every pose that stands on something. Nothing here knows about a canvas or about Vertex.
 */

export const SIZE = 32

export type Frame = readonly string[]
/** A palette: a CSS colour for each key a part uses. */
export type Palette = Readonly<Record<'#' | 'o' | 's' | 'w' | 'p', string>>

/** `#` outline and eyes, `o` fur, `s` stripes, `w` muzzle, chest and paws, `p` nose, ears and tongue. */
export const PALETTES = {
    ginger: {'#': '#3b2a35', o: '#f2a65a', s: '#d07f3c', w: '#fff4e0', p: '#f48aa0'},
    grey: {'#': '#2b2d3a', o: '#9aa0b4', s: '#747a90', w: '#f4f5fa', p: '#f48aa0'},
    black: {'#': '#16141c', o: '#4a4658', s: '#35323f', w: '#e9e6f0', p: '#f48aa0'},
    cream: {'#': '#4a3a34', o: '#f7e3c0', s: '#e3c594', w: '#fffaf0', p: '#f48aa0'},
} satisfies Record<string, Palette>

type Part = readonly string[]

const HEAD: Part = [
    '..#..............#..',
    '.#o#............#o#.',
    '.#oo#..........#oo#.',
    '.#opo##########opo#.',
    '.#opoooooooooooopo#.',
    '#ooooosoossoosooooo#',
    '#oooooooooooooooooo#',
    '#oooooooooooooooooo#',
    '#oooooooooooooooooo#',
    '#ooooooooppoooooooo#',
    '#oooooowwwwwwoooooo#',
    '.#ooooowwwwwwooooo#.',
    '..##oooooooooooo##..',
    '....############....',
]

export type Eyes = 'open' | 'closed' | 'happy' | 'wide'
export type Mouth = 'smile' | 'open' | 'flat'

/** The left eye, at the head's (3, 6), and the right one, at (14, 6): the glint is on the same side of both. */
const EYES: Record<Eyes, readonly [Part, Part]> = {
    open: [['.w#', '.##', '.##'], ['w#.', '##.', '##.']],
    closed: [['...', '...', '###'], ['...', '...', '###']],
    happy: [['...', '.#.', '#.#'], ['...', '.#.', '#.#']],
    wide: [['www', 'w#w', 'www'], ['www', 'w#w', 'www']],
}

/** Drawn at the head's (8, 10). */
const MOUTHS: Record<Mouth, Part> = {
    smile: ['#..#', '.##.'],
    open: ['####', '#pp#'],
    flat: ['....', '.##.'],
}

const BODY_SIT: Part = [
    '...#oooooooo#...',
    '..#oooowwoooo#..',
    '.#oooowwwwoooo#.',
    '.#ooowwwwwwooo#.',
    '#soLowwwwwwoRos#',
    '#oooowwwwwwoooo#',
    '#sooowwwwwwooos#',
    '#ooooowwwwooooo#',
    '#oooo#wwww#oooo#',
    '#ooo#ww##ww#ooo#',
    '.###www##www###.',
    '....###..###....',
].map(row => row.replace(/[LR]/g, 'o'))

const TAILS_SIT: readonly Part[] = [
    ['.###..', '#ooo#.', '#o#so#', '.#.#o#', '...#s#', '..#oo#', '.#oo#.', '#oo#..', '###...'],
    ['..###.', '.#ooo#', '.#o#s#', '..##o#', '...#s#', '..#oo#', '.#oo#.', '#oo#..', '###...'],
]

const LOAF: Part = [
    '......############......',
    '....##oooosoosoooo##....',
    '..##oooooooooooooooo##..',
    '.#oooooooooooooooooooo#.',
    '#oooooooooooooooooooooo#',
    '#oooooooooooooooooooooo#',
    '#oooooooooooooooooooooo#',
    '#oooooooooooooooooooooo#',
    '#ooooooooooooooooooosss#',
    '#oooooooooooooooo######.',
    '.#ooooooooooooooo#ossso#',
    '..################.####.',
]

const BODY_SIDE: Part = [
    '..############..',
    '.#oosoosoosooo#.',
    '#oooooooooooooo#',
    '#oooooooooooooo#',
    '#oooooooooooooo#',
    '#oooooooooooooo#',
    '#ooowwwwwwwwooo#',
    '.#wwwwwwwwwwww#.',
    '..############..',
]

const LEG: Part = ['#o#', '#o#', '#w#', '###']
const LEG_SHORT: Part = ['#o#', '#w#', '###']

const TAILS_SIDE: readonly Part[] = [
    ['.##...', '#oo#..', '#so#..', '.#oo#.', '..#so#', '...#o#'],
    ['##....', '#o#...', '#so#..', '.#oo#.', '..#so#', '...#o#'],
]

const BODY_HANG: Part = [
    '..########..',
    '.#oowwwwoo#.',
    '#o#owwwwo#o#',
    '#o#owwwwo#o#',
    '#w#owwwwo#w#',
    '.##owwwwo##.',
    '..#owwwwo#..',
    '..#owwwwo#..',
    '..#oowwoo#..',
    '..#oo##oo#..',
    '..#o#..#o#..',
    '..#o#..#o#..',
    '..#w#..#w#..',
    '..###..###..',
]

const TAILS_HANG: readonly Part[] = [
    ['##..', '#o#.', '#s#.', '#o#.', '#s#.', '#o#.', '.#..'],
    ['##..', '#o#.', '.#s#', '.#o#', '.#s#', '.#o#', '..#.'],
]

function blank(): string[][] {
    return Array.from({length: SIZE}, () => Array.from({length: SIZE}, () => '.'))
}

/** Draws a part's pixels over the canvas at (x, y); its `.` leaves what's there. */
function put(canvas: string[][], part: Part, x: number, y: number) {
    part.forEach((row, dy) => {
        if (row.length !== part[0]!.length) throw new Error(`a part's row ${dy} is ${row.length} wide, not ${part[0]!.length}`)
        ;[...row].forEach((key, dx) => {
            const line = canvas[y + dy]
            if (key !== '.' && line && x + dx >= 0 && x + dx < SIZE) line[x + dx] = key
        })
    })
}

function head(canvas: string[][], x: number, y: number, eyes: Eyes, mouth: Mouth, look = 0) {
    put(canvas, HEAD, x, y)
    put(canvas, EYES[eyes][0], x + 3 + look, y + 6)
    put(canvas, EYES[eyes][1], x + 14 + look, y + 6)
    put(canvas, MOUTHS[mouth], x + 8, y + 10)
}

/** A frame is built once: the same pose is the same array, which a renderer can key its bitmaps by. */
const built = new Map<string, Frame>()
function frame(key: string, draw: (canvas: string[][]) => void): Frame {
    let made = built.get(key)
    if (!made) {
        const canvas = blank()
        draw(canvas)
        built.set(key, made = canvas.map(row => row.join('')))
    }
    return made
}

/** Sitting, facing us; `look` turns its eyes a pixel left (-1) or right (1). */
export function sit(eyes: Eyes = 'open', mouth: Mouth = 'smile', tail: 0 | 1 = 0, look: -1 | 0 | 1 = 0): Frame {
    return frame(`sit ${eyes} ${mouth} ${tail} ${look}`, (c) => {
        put(c, TAILS_SIT[tail]!, 22, 20)
        put(c, BODY_SIT, 8, 20)
        head(c, 6, 7, eyes, mouth, look)
    })
}

/** Asleep, a loaf with its head down; `breath` lifts its back a pixel. */
export function sleep(breath: 0 | 1 = 0): Frame {
    return frame(`sleep ${breath}`, (c) => {
        put(c, LOAF, 8, 20 - breath)
        if (breath) put(c, LOAF.slice(-2), 8, 30)
        head(c, 2, 18, 'closed', 'flat')
    })
}

/** Walking to the right; `step` is one of the cycle's four. Flip it to walk left. */
export function walk(step: 0 | 1 | 2 | 3): Frame {
    return frame(`walk ${step}`, (c) => {
        const up = step % 2
        put(c, TAILS_SIDE[step < 2 ? 0 : 1]!, 0, 14 - up)
        if (up) {
            // Mid-stride: one leg of each pair is off the ground.
            put(c, LEG_SHORT, step === 1 ? 4 : 7, 28)
            put(c, LEG, step === 1 ? 7 : 4, 28)
            put(c, LEG_SHORT, step === 1 ? 15 : 12, 28)
            put(c, LEG, step === 1 ? 12 : 15, 28)
        } else {
            put(c, LEG, step ? 4 : 3, 28)
            put(c, LEG, step ? 7 : 8, 28)
            put(c, LEG, step ? 12 : 11, 28)
            put(c, LEG, step ? 15 : 16, 28)
        }
        put(c, BODY_SIDE, 3, 20 - up)
        head(c, 12, 10 - up, 'open', 'smile')
    })
}

/** Held up by the scruff, legs dangling; `sway` swings its tail. */
export function hang(sway: 0 | 1 = 0): Frame {
    return frame(`hang ${sway}`, (c) => {
        put(c, TAILS_HANG[sway]!, 19, 19)
        put(c, BODY_HANG, 10, 13)
        head(c, 6, 0, 'wide', 'flat')
    })
}

/** What flies off the kitty: small sprites in the same palette keys. */
export const MARKS = {
    heart: ['.p.p.', 'ppppp', 'ppppp', '.ppp.', '..p..'],
    z: ['####', '..#.', '.#..', '####'],
    bang: ['##', '##', '##', '..', '##'],
    crumb: ['s'],
} satisfies Record<string, Part>

export type Mark = keyof typeof MARKS
