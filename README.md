# Furball

A pixel kitty that lives along the bottom of your [Vertex](https://github.com/CTRL-Neo-Studios/vertex) window.

- **Click** it to boop it; a sleeping kitty wakes with a start.
- **Drag** it to pick it up by the scruff, and let go to throw it: it bounces off the edges and lands on its feet.
- **Move the pointer over it** to stroke it.
- Left alone, it wanders, watches the pointer, and falls asleep.

Everything under it keeps working: only the kitty itself takes clicks.

## Out on the desktop

**Let the kitty out on the desktop** (command palette) and it leaves the window for the bottom edge of your screen,
where it walks, sleeps and can be thrown about like in the window, above your other apps. **Call the kitty back** to
bring it home; it also goes when its workspace window closes. Next time it comes out where it last sat.

## Things to do

With a plugin that gives it things to do (the [Tasks](https://github.com/CTRL-Neo-Studios/vertex-plugin-tasks)
plugin: what's overdue and due today), the kitty holds up the next one and stays awake while there are any. **Click**
it to open the list; tick one there and the kitty eats it (the task is done in its file), and the last one gets a big
cheer. A late one makes it restless; a reminder that's due makes it jump and hold that one up.

## Settings

Settings → Plugins → Furball: **Show the kitty** and its **Size** (small, medium, large), which a workspace can change
for its own windows, and **Keep it above other windows** while it's out on the desktop.

## Develop

```sh
bun install
bun run build       # dist/, the folder Vertex installs, and plugin.zip
bun run typecheck
bun run test
bun run demo        # the kitty on a page in the browser, no Vertex
```

In Vertex: Settings → Plugins → Install… ▾ → **From a folder (development)…**, and pick `dist/`.

- `src/pet/`: the kitty, with no Vertex in it: `cat.ts` (what it does), `draw.ts` (the sheet's layout, `SHEET`),
  `stage.ts` (a canvas and the pointer).
- `public/kitty.png`: the art. The one here is a placeholder made by `bun run sheet` from `src/pet/sprites.ts`; a
  sheet drawn in the layout below replaces it (and then `sprites.ts` and `scripts/sheet.ts` can go).

### The sheet

A PNG with a transparent background, 32×32 pixel cells, 5 cells wide and 7 rows tall (160×224). It's drawn scaled up
by whole numbers with no smoothing. In every cell the kitty's feet are on the bottom row, in the middle; walking
faces right (Vertex mirrors it to walk left). Each row, left to right (`SHEET` in `src/pet/draw.ts`):

| Row | Cells |
| --- | --- |
| 0 sitting | sit, sit with the tail up, blink, eyes left, eyes right |
| 1 happy | happy, happy with the tail up, chomping (mouth open), chomping (mouth shut) |
| 2 alert | alert, alert with the tail up |
| 3 asleep | breathing in, breathing out |
| 4 walking | four steps of a walk |
| 5 held | held by the scruff, two swings (also how it falls) |
| 6 marks | heart, Z, `!`, crumb: small, in the middle of their cells |

A cell that's empty in a row with fewer cells is never drawn.

### For other plugins

Furball provides an API in each workspace window where it's on. Copy `src/api.ts` into your plugin (it only declares
types, and types `ctx.use('furball')`), list `"furball?"` in your `requires`, then:

```ts
ctx.whenPlugin('furball', furball => {
    const remove = furball.source({id: 'my-plugin', label: 'My plugin', items: () => things.value, done: id => finish(id)})
    furball.nudge('Stand up and stretch')
})
```

`items` is read in a Vue `computed`, so a reactive list is followed; `cheer()` makes the kitty hop.

## Release

Push a tag with `plugin.json`'s version (`git tag v0.1.0 && git push --tags`); the workflow builds the plugin and
makes a release with `plugin.zip`.
