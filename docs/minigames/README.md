# Wing Night Minigames Roadmap

Index of every minigame — shipped, building, spec'd, or still just a sketch.

Last updated: 2026-09-16

## Stages

- **idea** — name + a sentence or two. Lives in [`ideas/<slug>.md`](ideas/). Confidence: `sketch` / `promising` / `ready`.
- **spec** — a draft `<slug>-spec.md` here at the root of `docs/minigames/`. Ready (or nearly ready) to build.
- **building** — real implementation in progress under `packages/minigames/<slug>/`.
- **shipped** — playable, tested, in the round rotation.
- **killed** — investigated and ruled out. The doc records why, so nobody re-investigates.

## Roadmap

| Game | Stage | Confidence | Doc |
|---|---|---|---|
| Trivia | shipped | — | [packages/minigames/trivia/](../../packages/minigames/trivia/) |
| Geo | shipped | — | [packages/minigames/geo/](../../packages/minigames/geo/) ([spec](geo-spec.md)) |
| Drawing | shipped | — | [packages/minigames/drawing/](../../packages/minigames/drawing/) ([spec](drawing-spec.md)) |
| Who's That Song | shipped | — | [packages/minigames/song-guess/](../../packages/minigames/song-guess/) ([spec](song-guess-spec.md)) |
| Emoji Charades | spec | ready | [emoji-charades-spec.md](emoji-charades-spec.md) |
| PETMON | spec | ready | [petmon-design.md](../petmon-design.md) (design + mockups; runtime not started) |
| Read the Room | idea | promising | [ideas/read-the-room.md](ideas/read-the-room.md) |
| ANAMORPH | idea | promising | [ideas/anamorph.md](ideas/anamorph.md) |
| CONTRAPTION | idea | promising | [ideas/contraption.md](ideas/contraption.md) |
| STUNT | idea | promising | [ideas/stunt.md](ideas/stunt.md) |
| Tilt / balance / shake (tablet sensors) | killed | — | [ideas/stunt.md §0](ideas/stunt.md) — motion APIs are secure-context only; plain-HTTP LAN origins get nothing on iPad or Android |

Target: **at least 8 games**. Current: 4 shipped, 2 spec'd, 4 ideas → 10 concepts, target covered. One type (tablet sensors) investigated and killed.

ANAMORPH and CONTRAPTION were added to close a specific gap: every other game on this
list is words, recall, or expression, and none of them make the TV do something the room
gasps at. Both are procedural — the server sends a seed and the display renders, so the
graphics cost nothing on the wire and survive reconnect.

STUNT closes the other gap: nothing on the list touched the body. A tablet-as-sensor type
(tilt/balance) was the first candidate and is dead on arrival — the host tablet is served over
plain HTTP on the LAN, and every engine gates motion sensors on a secure context. The evidence
lives in the STUNT doc's §0; STUNT is the host-judged physical challenge that came out of it.

## Adding an idea

Drop a file in [`ideas/`](ideas/) using [`ideas/_template.md`](ideas/_template.md). Two lines is fine. Update the table above so the index reflects reality.

## Promoting an idea to a spec

When an idea hits `confidence: ready`:

1. Move `ideas/<slug>.md` → `<slug>-spec.md` and flesh it out — use [drawing-spec.md](drawing-spec.md) as a reference shape.
2. Update the table.
3. Scaffold the package under `packages/minigames/<slug>/` (see [minigame-authoring-guide.md](../minigame-authoring-guide.md)).
