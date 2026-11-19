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
- `public/kitty.png`: the art, 32×32 cells in `SHEET`'s layout. The one here is a placeholder made by
  `bun run sheet` from `src/pet/sprites.ts`; a sheet drawn in that layout replaces it.

## Release

Push a tag with `plugin.json`'s version (`git tag v0.1.0 && git push --tags`); the workflow builds the plugin and
makes a release with `plugin.zip`.
