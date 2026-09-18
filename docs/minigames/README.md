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
| SPOTTER | shipped | — | [packages/minigames/spotter/](../../packages/minigames/spotter/) ([spec](spotter-spec.md)) |
| Emoji Charades | spec | ready | [emoji-charades-spec.md](emoji-charades-spec.md) |
| PETMON | spec | ready | [petmon-design.md](../petmon-design.md) (design + mockups; runtime not started) |
| Read the Room | idea | promising | [ideas/read-the-room.md](ideas/read-the-room.md) |
| ANAMORPH | idea | promising | [ideas/anamorph.md](ideas/anamorph.md) |
| CONTRAPTION | idea | promising | [ideas/contraption.md](ideas/contraption.md) |

Target: **at least 8 games**. Current: 5 shipped, 2 spec'd, 3 ideas → 10 concepts, target covered.

ANAMORPH and CONTRAPTION were added to close a specific gap: every other game on this
list is words, recall, or expression, and none of them make the TV do something the room
gasps at. Both are procedural — the server sends a seed and the display renders, so the
graphics cost nothing on the wire and survive reconnect.

SPOTTER closes a different gap: every other game sends information from the tablet outward, and
the person who just ate the wing is the one who knows the answer. SPOTTER reverses the channel — the
TV has the whole picture, the tablet-holder is blind to it, and the room is the input device. It is
the only concept where the spice degrades the *relay* in public rather than the guesser in private.
It is the only game with no content pack: the field is seeded from the rules, so it ships with zero
authoring. Tune the feel numbers in `minigameRules.spotter` from the `/dev/minigame/spotter` sandbox.

## Adding an idea

Drop a file in [`ideas/`](ideas/) using [`ideas/_template.md`](ideas/_template.md). Two lines is fine. Update the table above so the index reflects reality.

## Promoting an idea to a spec

When an idea hits `confidence: ready`:

1. Move `ideas/<slug>.md` → `<slug>-spec.md` and flesh it out — use [drawing-spec.md](drawing-spec.md) as a reference shape.
2. Update the table.
3. Scaffold the package under `packages/minigames/<slug>/` (see [minigame-authoring-guide.md](../minigame-authoring-guide.md)).
