# Wing Night Minigames Roadmap

Index of every minigame — shipped, building, spec'd, or still just a sketch.

Last updated: 2026-05-01

## Stages

- **idea** — name + a sentence or two. Lives in [`ideas/<slug>.md`](ideas/). Confidence: `sketch` / `promising` / `ready`.
- **spec** — a draft `<slug>-spec.md` here at the root of `docs/minigames/`. Ready (or nearly ready) to build.
- **building** — real implementation in progress under `packages/minigames/<slug>/`.
- **shipped** — playable, tested, in the round rotation.

## Roadmap

| Game | Stage | Confidence | Doc |
|---|---|---|---|
| Trivia | shipped | — | [packages/minigames/trivia/](../../packages/minigames/trivia/) |
| Drawing | spec | ready | [drawing-spec.md](drawing-spec.md) |
| Geo | spec | ready | [geo-spec.md](geo-spec.md) |
| Who's That Song | spec | ready | [song-guess-spec.md](song-guess-spec.md) |
| Emoji Charades | spec | ready | [emoji-charades-spec.md](emoji-charades-spec.md) |

Target: **at least 8 games**. Current: 1 shipped, 4 spec'd → need ~3 more concepts.

## Adding an idea

Drop a file in [`ideas/`](ideas/) using [`ideas/_template.md`](ideas/_template.md). Two lines is fine. Update the table above so the index reflects reality.

## Promoting an idea to a spec

When an idea hits `confidence: ready`:

1. Move `ideas/<slug>.md` → `<slug>-spec.md` and flesh it out — use [drawing-spec.md](drawing-spec.md) as a reference shape.
2. Update the table.
3. Scaffold the package under `packages/minigames/<slug>/` (see [minigame-authoring-guide.md](../minigame-authoring-guide.md)).
