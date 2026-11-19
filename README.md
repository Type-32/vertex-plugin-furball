# Furball

A pixel kitty that lives along the bottom of your [Vertex](https://github.com/CTRL-Neo-Studios/vertex) window.

- **Click** it to boop it; a sleeping kitty wakes with a start.
- **Drag** it to pick it up by the scruff, and let go to throw it: it bounces off the edges and lands on its feet.
- **Move the pointer over it** to stroke it.
- Left alone, it wanders, watches the pointer, and falls asleep.

Everything under it keeps working: only the kitty itself takes clicks.

## Settings

Settings → Plugins → Furball: **Show the kitty** and its **Size** (small, medium, large). A workspace can change both
for its own windows.

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
