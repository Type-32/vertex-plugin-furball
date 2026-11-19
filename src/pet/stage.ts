/**
 * The kitty on a canvas: the frame loop and the pointer. The canvas is the world (it's sized by its host, CSS);
 * it takes no pointer events itself, so whatever is under it keeps them, except where the kitty is: a press there
 * is the kitty's. A click boops it, a drag holds it by the scruff and throws it, a pointer moving over it strokes it.
 */
import {boop, cheer, createPet, drop, eat, grab, HALF_WIDTH, HEIGHT, hold, sleep, startle, step, stroke, type World} from './cat'
import {CELL, draw} from './draw'

export interface StageOptions {
    /** The sheet, loaded. */
    sheet: CanvasImageSource
    /** Screen pixels per sheet pixel. */
    scale: number
}

/** A press that moves this far is a drag. */
const DRAG = 4

export function createStage(canvas: HTMLCanvasElement, {sheet, scale}: StageOptions) {
    const g = canvas.getContext('2d')!
    const world: World = {width: 0, height: 0}
    let rect = canvas.getBoundingClientRect()
    const resize = () => {
        rect = canvas.getBoundingClientRect()
        world.width = rect.width
        world.height = rect.height
        canvas.width = Math.round(rect.width * devicePixelRatio)
        canvas.height = Math.round(rect.height * devicePixelRatio)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    canvas.style.pointerEvents = 'none'
    const pet = createPet(world, CELL * scale)

    let time = 0
    let last = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
        const dt = (now - last) / 1000
        last = now
        time += dt
        step(pet, dt, world)
        g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
        g.clearRect(0, 0, world.width, world.height)
        g.imageSmoothingEnabled = false
        draw(g, sheet, pet, time)
        frame = requestAnimationFrame(tick)
    })

    const at = (e: PointerEvent) => ({x: e.clientX - rect.left, y: e.clientY - rect.top})
    const hits = ({x, y}: { x: number, y: number }) => Math.abs(x - pet.x) < pet.size * HALF_WIDTH && y < pet.y && y > pet.y - pet.size * HEIGHT
    let press: { x: number, y: number, at: number, dragging: boolean } | undefined
    const cursor = (value: string) => {
        if (document.documentElement.style.cursor !== value) document.documentElement.style.cursor = value
    }
    const take = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
    }

    function down(e: PointerEvent) {
        const p = at(e)
        if (e.button !== 0 || !hits(p)) return
        take(e)
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
    // Capturing, so a press on the kitty never reaches what's under it; the click that follows a press is its too.
    const click = (e: MouseEvent) => hits({x: e.clientX - rect.left, y: e.clientY - rect.top}) && take(e)
    window.addEventListener('pointerdown', down, true)
    window.addEventListener('pointermove', move, true)
    window.addEventListener('pointerup', up, true)
    window.addEventListener('click', click, true)
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
            window.removeEventListener('click', click, true)
            document.documentElement.removeEventListener('pointerleave', leave)
            cursor('')
        },
    }
}

export type Stage = ReturnType<typeof createStage>
