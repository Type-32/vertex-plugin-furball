/**
 * The kitty's behaviour: a plain object `step` moves on, and what can be done to it. No canvas, no DOM, no Vertex.
 * World units are CSS pixels, `(0, 0)` the world's top left; the kitty's `x` is the middle of its feet, `y` the
 * line they stand on, and the floor is the world's bottom. Speeds and gravity scale with its size, so a bigger
 * kitty feels the same.
 */

export type State = 'sit' | 'walk' | 'sleep' | 'happy' | 'eat' | 'startle' | 'held' | 'fall'
export type MarkKind = 'heart' | 'z' | 'bang' | 'crumb'

export interface World {
    width: number
    height: number
    /** Where the pointer is, while it's over the world. */
    pointer?: { x: number, y: number }
}

/** Something flying off the kitty for a moment. */
export interface Mark {
    kind: MarkKind
    x: number
    y: number
    vx: number
    vy: number
    life: number
}

export interface Pet {
    /** Its sprite's side, in world pixels. */
    size: number
    x: number
    y: number
    vx: number
    vy: number
    grounded: boolean
    facing: 1 | -1
    state: State
    /** Seconds in this state, and when it ends (`sit`: when it next decides what to do). */
    t: number
    until: number
    targetX: number
    /** Seconds since anyone did anything with it. */
    idle: number
    /** Squash (below 0) and stretch (above), a spring. */
    squash: number
    squashV: number
    /** Its eyes, toward the pointer. */
    look: -1 | 0 | 1
    stroked: number
    marks: Mark[]
    random: () => number
    /** It has things to do, so it doesn't fall asleep on its own. Its host sets it. */
    busy: boolean
    /** One of them is late: it fidgets, and wakes. Its host sets it. */
    restless: boolean
    /** What it's eating is the last: the cheer after it is the big one. */
    feast: boolean
}

/** Left alone this long, it falls asleep. */
export const SLEEP_AFTER = 45
/** In body sizes per second (squared). */
const GRAVITY = 28
const WALK = 1.1
const HOP = 9
const MAX_THROW = 40
/** What a wall or the ceiling gives back, and what a fast landing does. */
const BOUNCE = 0.5
const FLOOR_BOUNCE = 0.35
const SPRING = 420
const DAMPING = 14
/** Half its width and its height, in sizes: what a wall stops and a pointer hits. */
export const HALF_WIDTH = 0.42
export const HEIGHT = 0.9

/** A small seeded generator, so a test sees the same kitty every time. */
function mulberry(seed: number) {
    return () => {
        seed = (seed + 0x6D2B79F5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

export function createPet(world: World, size: number, seed = Date.now()): Pet {
    const random = mulberry(seed)
    return {
        size, x: world.width / 2, y: world.height, vx: 0, vy: 0, grounded: true, facing: 1,
        state: 'sit', t: 0, until: 2, targetX: world.width / 2, idle: 0,
        squash: 0, squashV: 0, look: 0, stroked: 0, marks: [], random, busy: false, restless: false, feast: false,
    }
}

function to(pet: Pet, state: State, until = 0) {
    pet.state = state
    pet.t = 0
    pet.until = until
}

function mark(pet: Pet, kind: MarkKind, vx = 0, vy = -pet.size * 0.8, life = 1.2) {
    pet.marks.push({kind, x: pet.x + (pet.random() - 0.5) * pet.size * 0.3, y: pet.y - pet.size * HEIGHT, vx, vy, life})
}

function hop(pet: Pet, strength: number) {
    pet.vy = -pet.size * strength
    pet.grounded = false
}

export function step(pet: Pet, dt: number, world: World) {
    dt = Math.min(dt, 0.05)
    pet.t += dt
    pet.idle += dt
    for (const m of pet.marks) {
        m.life -= dt
        m.x += m.vx * dt
        m.y += m.vy * dt
        if (m.kind === 'crumb') m.vy += GRAVITY * pet.size * dt
    }
    pet.marks = pet.marks.filter(m => m.life > 0)

    // In the air it stretches with its speed; landing squashes it (`land`), and the spring brings it back.
    const target = pet.grounded || pet.state === 'held' ? 0 : Math.min(Math.abs(pet.vy) / (pet.size * 60), 0.2)
    pet.squashV += (-(pet.squash - target) * SPRING - pet.squashV * DAMPING) * dt
    pet.squash += pet.squashV * dt

    if (pet.state === 'held') {
        // A held kitty that stops moving is let go of standing still.
        pet.vx *= Math.exp(-dt * 12)
        pet.vy *= Math.exp(-dt * 12)
        return
    }
    move(pet, dt, world)
    behave(pet, dt, world)
}

function move(pet: Pet, dt: number, world: World) {
    const half = pet.size * HALF_WIDTH
    if (pet.grounded) {
        pet.y = world.height
        pet.x = Math.min(Math.max(pet.x, half), Math.max(half, world.width - half))
        return
    }
    pet.vy += GRAVITY * pet.size * dt
    pet.x += pet.vx * dt
    pet.y += pet.vy * dt
    if (pet.x < half) [pet.x, pet.vx] = [half, Math.abs(pet.vx) * BOUNCE]
    if (pet.x > world.width - half) [pet.x, pet.vx] = [world.width - half, -Math.abs(pet.vx) * BOUNCE]
    if (pet.y < pet.size * HEIGHT) [pet.y, pet.vy] = [pet.size * HEIGHT, Math.abs(pet.vy) * BOUNCE]
    if (pet.y >= world.height) land(pet, world)
}

function land(pet: Pet, world: World) {
    pet.y = world.height
    pet.squashV -= pet.vy / pet.size * 0.45
    if (pet.vy > pet.size * 6) {
        pet.vy *= -FLOOR_BOUNCE
        pet.vx *= 0.6
        return
    }
    pet.vx = pet.vy = 0
    pet.grounded = true
    if (pet.state === 'fall') to(pet, 'sit', 1 + pet.random() * 2)
}

function behave(pet: Pet, dt: number, world: World) {
    const half = pet.size * HALF_WIDTH
    switch (pet.state) {
        case 'sit': {
            const dx = world.pointer ? world.pointer.x - pet.x : 0
            pet.look = Math.abs(dx) < pet.size * 0.6 ? 0 : dx < 0 ? -1 : 1
            if (pet.t < pet.until) return
            if (pet.restless && pet.random() < 0.5) return startle(pet)
            if (pet.idle >= SLEEP_AFTER && !pet.busy) return sleep(pet)
            if (pet.random() < 0.5 && world.width > pet.size * 3) {
                pet.targetX = half + pet.random() * (world.width - half * 2)
                if (Math.abs(pet.targetX - pet.x) > pet.size) return to(pet, 'walk')
            }
            pet.until = pet.t + 2 + pet.random() * 4
            return
        }
        case 'walk': {
            const dx = pet.targetX - pet.x
            pet.facing = dx < 0 ? -1 : 1
            const stride = pet.size * WALK * dt
            if (Math.abs(dx) <= stride) {
                pet.x = pet.targetX
                return to(pet, 'sit', 2 + pet.random() * 4)
            }
            pet.x += pet.facing * stride
            return
        }
        case 'sleep':
            if (pet.restless && pet.t > 4) return startle(pet)
            if (pet.t >= pet.until) {
                mark(pet, 'z', pet.size * 0.4, -pet.size * 0.5, 1.6)
                pet.until = pet.t + 2
            }
            return
        case 'eat':
            if (pet.t >= pet.until) return cheer(pet, pet.feast)
            if (Math.floor(pet.t / 0.15) !== Math.floor((pet.t - dt) / 0.15)) {
                mark(pet, 'crumb', (pet.random() - 0.5) * pet.size * 3, -pet.size * 2, 0.6)
            }
            return
        case 'happy':
        case 'startle':
            if (pet.t >= pet.until && pet.grounded) to(pet, 'sit', 1 + pet.random() * 3)
            return
        case 'fall':
        case 'held':
            return
    }
}

// What can be done to it.

/** Picked up by the scruff. */
export function grab(pet: Pet) {
    to(pet, 'held')
    pet.grounded = false
    pet.vx = pet.vy = 0
    pet.idle = 0
}

/** Moved while held: `(x, y)` is the hand, at the scruff; `dt` the seconds since the last move. */
export function hold(pet: Pet, x: number, y: number, dt: number) {
    const feet = y + pet.size * HEIGHT
    if (dt > 0) {
        pet.vx += ((x - pet.x) / dt - pet.vx) * 0.5
        pet.vy += ((feet - pet.y) / dt - pet.vy) * 0.5
    }
    pet.x = x
    pet.y = feet
}

/** Let go of: it flies on with the hand's speed. */
export function drop(pet: Pet) {
    const max = pet.size * MAX_THROW
    pet.vx = Math.max(-max, Math.min(max, pet.vx))
    pet.vy = Math.max(-max, Math.min(max, pet.vy))
    to(pet, 'fall')
}

export function boop(pet: Pet) {
    pet.idle = 0
    if (pet.state === 'sleep') return startle(pet)
    if (pet.state === 'held' || pet.state === 'fall') return
    to(pet, 'happy', 0.8)
    hop(pet, HOP * 0.5)
    mark(pet, 'heart')
}

/** The pointer moved `distance` over it, no button down. */
export function stroke(pet: Pet, distance: number) {
    pet.idle = 0
    pet.stroked += distance
    if (pet.stroked < pet.size * 1.5) return
    pet.stroked = 0
    mark(pet, 'heart')
    if (pet.state === 'sit' || pet.state === 'walk') to(pet, 'happy', 0.6)
}

/** Hops with hearts; `big`, higher and with more (the last thing done). */
export function cheer(pet: Pet, big = false) {
    if (pet.state === 'held') return
    pet.idle = 0
    to(pet, 'happy', big ? 2 : 1.2)
    hop(pet, big ? HOP * 1.4 : HOP)
    const hearts = big ? 7 : 3
    for (let i = 0; i < hearts; i++) mark(pet, 'heart', (i - (hearts - 1) / 2) * pet.size * 0.5, -pet.size * (1 + (i % 3) * 0.2), big ? 1.8 : 1.2)
}

/** Eats something done; `last`, the last thing there was. */
export function eat(pet: Pet, last = false) {
    if (pet.state === 'held') return
    pet.idle = 0
    pet.feast = last
    to(pet, 'eat', 0.9)
}

export function startle(pet: Pet) {
    if (pet.state === 'held') return
    pet.idle = 0
    to(pet, 'startle', 1.2)
    hop(pet, HOP * 0.6)
    mark(pet, 'bang', 0, -pet.size * 0.3, 1)
}

export function sleep(pet: Pet) {
    if (pet.state === 'held') return
    to(pet, 'sleep', 0.5)
}
