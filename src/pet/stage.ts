/**
 * The kitty on a canvas: the frame loop and the pointer. A click boops it, a drag holds it by the scruff and throws
 * it, a pointer moving over it strokes it.
 *
 * In a page, the canvas is the world (it's sized by its host, CSS): it takes no pointer events itself, so whatever is
 * under it keeps them, except where the kitty is. On the desktop (`desk`), the world is the screen and the canvas is a
 * small window that follows the kitty around it.
 */
import {boop, cheer, createPet, drop, eat, grab, HALF_WIDTH, HEIGHT, hold, sleep, startle, step, stroke, type World} from './cat'
import {CELL, draw} from './draw'

/** The screen's part the kitty lives in on the desktop, and the window it's drawn in, both in screen pixels. */
export interface Desk {
    area: { x: number, y: number, width: number, height: number }
    /** Puts the window's top left corner here. */
    move(x: number, y: number): Promise<void>
}

export interface StageOptions {
    /** The sheet, loaded. */
    sheet: CanvasImageSource
    /** Screen pixels per sheet pixel. */
    scale: number
    desk?: Desk
}

/** A press that moves this far is a drag. */
const DRAG = 4

export function createStage(canvas: HTMLCanvasElement, {sheet, scale, desk}: StageOptions) {
    const g = canvas.getContext('2d')!
    const world: World = {width: desk?.area.width ?? 0, height: desk?.area.height ?? 0}
    let rect = canvas.getBoundingClientRect()
    const resize = () => {
        rect = canvas.getBoundingClientRect()
        if (!desk) {
            world.width = rect.width
            world.height = rect.height
        }
        canvas.width = Math.round(rect.width * devicePixelRatio)
        canvas.height = Math.round(rect.height * devicePixelRatio)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    canvas.style.pointerEvents = 'none'
    const pet = createPet(world, CELL * scale)

    // On the desktop: the world's point at the canvas's top left (the window's place, once it's been moved there), and
    // the place last asked for. One move at a time: they're calls to the app, and a frame doesn't wait for one.
    let view = {x: 0, y: 0}
    let asked: typeof view | undefined
    let moving = false
    function follow(desk: Desk) {
        const next = {x: Math.round(pet.x - rect.width / 2), y: Math.round(pet.y - rect.height)}
        if (moving || (asked && asked.x === next.x && asked.y === next.y)) return
        asked = next
        moving = true
        desk.move(desk.area.x + next.x, desk.area.y + next.y)
            .then(() => (view = next), () => (asked = undefined))
            .finally(() => (moving = false))
    }

    let time = 0
    let last = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
        const dt = (now - last) / 1000
        last = now
        time += dt
        step(pet, dt, world)
        if (desk) follow(desk)
        g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, -view.x * devicePixelRatio, -view.y * devicePixelRatio)
        g.clearRect(view.x, view.y, rect.width, rect.height)
        g.imageSmoothingEnabled = false
        draw(g, sheet, pet, time)
        frame = requestAnimationFrame(tick)
    })

    // Where the pointer is in the world: on the desktop, from the screen, as the window moves under it.
    const at = (e: MouseEvent) => desk
        ? {x: e.screenX - desk.area.x, y: e.screenY - desk.area.y}
        : {x: e.clientX - rect.left, y: e.clientY - rect.top}
    const hits = ({x, y}: { x: number, y: number }) => Math.abs(x - pet.x) < pet.size * HALF_WIDTH && y < pet.y && y > pet.y - pet.size * HEIGHT
    let press: { x: number, y: number, at: number, dragging: boolean } | undefined
    /** The last press was on the kitty: the mouse events that follow it are its. */
    let ours = false
    const cursor = (value: string) => {
        if (document.documentElement.style.cursor !== value) document.documentElement.style.cursor = value
    }
    const take = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
    }

    function down(e: PointerEvent) {
        const p = at(e)
        ours = hits(p)
        if (!ours) return
        take(e)
        if (e.button !== 0) return
        press = {...p, at: e.timeStamp, dragging: false}
    }
    function move(e: PointerEvent) {
        const p = at(e)
        world.pointer = p
        if (press) {
            take(e)
            if (!press.dragging && Math.hypot(p.x - press.x, p.y - press.y) > DRAG) {
                press.dragging = true
                grab(pet)
            }
            if (press.dragging) hold(pet, p.x, p.y, (e.timeStamp - press.at) / 1000)
            press.at = e.timeStamp
            cursor(press.dragging ? 'grabbing' : 'grab')
            return
        }
        const over = hits(p)
        cursor(over ? 'grab' : '')
        if (over) stroke(pet, Math.abs(e.movementX) + Math.abs(e.movementY))
    }
    function up(e: PointerEvent) {
        if (!press) return
        take(e)
        if (press.dragging) drop(pet)
        else boop(pet)
        press = undefined
        cursor(hits(at(e)) ? 'grab' : '')
    }
    const leave = () => (world.pointer = undefined)
    // Capturing, so a press on the kitty never reaches what's under it, nor do the mouse events that come of it
    // (an editor listens to `mousedown`, not `pointerdown`). The next press decides again.
    const MOUSE = ['mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu'] as const
    const mouse = (e: MouseEvent) => (ours || hits(at(e))) && take(e)
    window.addEventListener('pointerdown', down, true)
    window.addEventListener('pointermove', move, true)
    window.addEventListener('pointerup', up, true)
    for (const type of MOUSE) window.addEventListener(type, mouse, true)
    document.documentElement.addEventListener('pointerleave', leave)

    return {
        pet,
        cheer: () => cheer(pet),
        eat: () => eat(pet),
        startle: () => startle(pet),
        sleep: () => sleep(pet),
        destroy() {
            cancelAnimationFrame(frame)
            observer.disconnect()
            window.removeEventListener('pointerdown', down, true)
            window.removeEventListener('pointermove', move, true)
            window.removeEventListener('pointerup', up, true)
            for (const type of MOUSE) window.removeEventListener(type, mouse, true)
            document.documentElement.removeEventListener('pointerleave', leave)
            cursor('')
        },
    }
}

export type Stage = ReturnType<typeof createStage>
