import {expect, it} from 'bun:test'
import {boop, createPet, drop, grab, HALF_WIDTH, hold, type Pet, SLEEP_AFTER, step, type World} from './cat'

const world: World = {width: 800, height: 400}
const run = (pet: Pet, seconds: number, until?: (pet: Pet) => boolean) => {
    for (let t = 0; t < seconds; t += 1 / 60) {
        step(pet, 1 / 60, world)
        if (until?.(pet)) return true
    }
    return false
}

it('thrown hard at a wall, comes to rest sitting on the floor inside the world', () => {
    const pet = createPet(world, 96, 1)
    grab(pet)
    hold(pet, 400, 100, 1 / 60)
    hold(pet, 460, 60, 1 / 60)
    drop(pet)
    expect(pet.vx).toBeGreaterThan(0)
    expect(run(pet, 10, p => p.grounded)).toBe(true)
    expect(pet.state).toBe('sit')
    expect(pet.y).toBe(world.height)
    expect(pet.x).toBeGreaterThanOrEqual(96 * HALF_WIDTH)
    expect(pet.x).toBeLessThanOrEqual(world.width - 96 * HALF_WIDTH)
})

it('left alone it falls asleep, and a boop wakes it', () => {
    const pet = createPet(world, 96, 2)
    expect(run(pet, SLEEP_AFTER - 1, p => p.state === 'sleep')).toBe(false)
    expect(run(pet, 20, p => p.state === 'sleep')).toBe(true)
    boop(pet)
    expect(pet.state).toBe('startle')
    expect(run(pet, 3, p => p.state === 'sit')).toBe(true)
})

it('with things to do it stays awake; with a late one it fidgets, and wakes from sleep', () => {
    const pet = createPet(world, 96, 3)
    pet.busy = true
    expect(run(pet, SLEEP_AFTER + 30, p => p.state === 'sleep')).toBe(false)
    pet.busy = false
    expect(run(pet, 30, p => p.state === 'sleep')).toBe(true)
    pet.restless = true
    expect(run(pet, 6, p => p.state === 'startle')).toBe(true)
})
