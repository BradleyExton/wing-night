# Wing Night Minigames Roadmap

Index of every minigame — shipped, building, spec'd, or still just a sketch.

Last updated: 2026-09-16

## Stages

- **idea** — name + a sentence or two. Lives in [`ideas/<slug>.md`](ideas/). Confidence: `sketch` / `promising` / `ready`.
- **spec** — a draft `<slug>-spec.md` here at the root of `docs/minigames/`. Ready (or nearly ready) to build.
- **building** — real implementation in progress under `packages/minigames/<slug>/`.
- **shipped** — playable, tested, in the round rotation.

## Roadmap

| Game | Stage | Confidence | Doc |
|---|---|---|---|
| Trivia | shipped | — | [packages/minigames/trivia/](../../packages/minigames/trivia/) |
| Geo | shipped | — | [packages/minigames/geo/](../../packages/minigames/geo/) ([spec](geo-spec.md)) |
| Drawing | shipped | — | [packages/minigames/drawing/](../../packages/minigames/drawing/) ([spec](drawing-spec.md)) |
| Who's That Song | shipped | — | [packages/minigames/song-guess/](../../packages/minigames/song-guess/) ([spec](song-guess-spec.md)) |
| Slingshlong (JOUST) | shipped | — | [packages/minigames/joust/](../../packages/minigames/joust/) ([spec](joust-spec.md)) |
| Emoji Charades | shipped | — | [packages/minigames/emoji-charades/](../../packages/minigames/emoji-charades/) ([spec](emoji-charades-spec.md)) — built and tested; not in the sample lineup yet |
| PETMON | spec | ready | [petmon-design.md](../petmon-design.md) (design + mockups; runtime not started) |
| Read the Room | idea | promising | [ideas/read-the-room.md](ideas/read-the-room.md) |
| ANAMORPH | idea | promising | [ideas/anamorph.md](ideas/anamorph.md) |
| CONTRAPTION | idea | promising | [ideas/contraption.md](ideas/contraption.md) |
| SEAR | spec | ready | [sear-spec.md](sear-spec.md) (build plan in §0; runtime not started) |

Target: **at least 8 games**. Current: 6 shipped, 2 spec'd, 3 ideas → 11 concepts, target covered.

ANAMORPH and CONTRAPTION were added to close a specific gap: every other game on this
list is words, recall, or expression, and none of them make the TV do something the room
gasps at. Both are procedural — the server sends a seed and the display renders, so the
graphics cost nothing on the wire and survive reconnect.

SEAR was added to close a different gap: every game above is think-then-commit and runs three
to five minutes a turn, so the night has no short, high-energy beat and no palate cleanser between
the heavy rounds. It is a blind-clock precision game rather than a reaction-speed game on purpose —
the spec explains why raw reaction time is mostly a sobriety test.

## Adding an idea

Drop a file in [`ideas/`](ideas/) using [`ideas/_template.md`](ideas/_template.md). Two lines is fine. Update the table above so the index reflects reality.

## Promoting an idea to a spec

When an idea hits `confidence: ready`:

1. Move `ideas/<slug>.md` → `<slug>-spec.md` and flesh it out — use [drawing-spec.md](drawing-spec.md) as a reference shape.
2. Update the table.
3. Scaffold the package under `packages/minigames/<slug>/` (see [minigame-authoring-guide.md](../minigame-authoring-guide.md)).
