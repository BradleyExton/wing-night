# Wing Night Minigames Roadmap

Index of every minigame — shipped, building, spec'd, or still just a sketch.

A shipped game has one name: the `displayName` on its entry in `MINIGAME_DEFINITIONS`,
which is what the **Game** column reads. **Id** is the enum key the code, the config and the
package folder use; it is an identifier, never a title, and no game carries a third name.

Last updated: 2026-10-02

## Stages

- **idea** — name + a sentence or two. Lives in [`ideas/<slug>.md`](ideas/). Confidence: `sketch` / `promising` / `ready`.
- **spec** — a draft `<slug>-spec.md` here at the root of `docs/minigames/`. Ready (or nearly ready) to build.
- **building** — real implementation in progress under `packages/minigames/<slug>/`.
- **shipped** — playable, tested, in the round rotation.

## Roadmap

| Game | Id | Stage | Confidence | Doc |
|---|---|---|---|---|
| Trivia | `TRIVIA` | shipped | — | [packages/minigames/trivia/](../../packages/minigames/trivia/) — no spec. Information asymmetry: the host holds the answer (`TriviaMinigameHostView.currentPrompt`), the question is on the TV for everyone, and it collapses when the host marks Correct or Incorrect. The flattest game we ship on this axis ([principles §12](../minigame-design-principles.md#12-where-the-shipped-game-falls-short-today)). |
| Geo | `GEO` | shipped | — | [packages/minigames/geo/](../../packages/minigames/geo/) ([spec](geo-spec.md)) |
| Drawing | `DRAWING` | shipped | — | [packages/minigames/drawing/](../../packages/minigames/drawing/) ([spec](drawing-spec.md)) |
| Name That Cheese | `SONG_GUESS` | shipped | — | [packages/minigames/song-guess/](../../packages/minigames/song-guess/) ([spec](song-guess-spec.md)) |
| Slingshlong | `JOUST` | shipped | — | [packages/minigames/joust/](../../packages/minigames/joust/) ([spec](joust-spec.md)) |
| Fappy Bird | `FAPPY` | shipped | — | [packages/minigames/fappy/](../../packages/minigames/fappy/) ([spec](fappy-spec.md)) — a timed relay of the cast; built and tested; not in the sample lineup yet |
| Emoji Charades | `EMOJI_CHARADES` | shipped | — | [packages/minigames/emoji-charades/](../../packages/minigames/emoji-charades/) ([spec](emoji-charades-spec.md)) — built and tested; not in the sample lineup yet |
| Forgery Studio | `RECREATE` | shipped | — | [packages/minigames/recreate/](../../packages/minigames/recreate/) — no spec; design in memory and `RecreateMinigameDisplayView` (`packages/shared/src/roomState`). Information asymmetry: the room and the team share the target photo; the ingredients are host-only while the team writes (in pass-and-play the tablet is in the team's hands and the ingredients are the answer) and the authored prompt is held back until the score is locked. It collapses in two beats: ingredients at submit, the authored prompt at scoring. |
| Schlonic | `SCHLONIC` | shipped | — | [packages/minigames/schlonic/](../../packages/minigames/schlonic/) — no spec; `SchlonicMinigameDisplayView` (`packages/shared/src/roomState`). Information asymmetry: spectator-only lead over a nobody-knows outcome. The zone is a rule every team runs and host and display carry the same fields, but the TV's camera fills the wall and shows the street further ahead of the hen than the tablet's box does (`SchlonicScene/camera`), so the couch sees the next hazard before the holder and is the runner's lookout; the round's best run so far replays beside every later runner as a ghost, so the room reads ahead-or-behind off the wall rather than off a sum; the open question is how far the run gets, and it collapses run by run as the TV re-plays the input log, and hard at the post or the crash. |
| Streets of Barrie | `BRAWL` | shipped | — | [packages/minigames/brawl/](../../packages/minigames/brawl/) ([spec](brawl-spec.md)) — a side-scrolling beat 'em up relay of the cast down Dunlop Street to the Spirit Catcher, a block each; built and tested on both surfaces; not in the sample lineup. Information asymmetry: spectator-only, by camera. The course is a published seed every team fights and host and display carry the same fields, but the TV's camera is wider than the tablet's on both sides (the extra split either side, `BrawlScene/camera`) and goons are born past the tablet's edges, so the wall sees a goon walk in and honk before the holder does, from the left as much as the right, and is the hen's lookout ("BEHIND YOU"); the open question is how many goons she puts down before the hearts go, and it collapses goon by goon as each enters the tablet's frame, and hard at the bay or the bell. |
| PETMON | — | spec | ready | [petmon-design.md](../petmon-design.md) (design + mockups; runtime not started) |
| Read the Room | — | idea | promising | [ideas/read-the-room.md](ideas/read-the-room.md) |
| ANAMORPH | — | idea | promising | [ideas/anamorph.md](ideas/anamorph.md) |
| CONTRAPTION | — | idea | promising | [ideas/contraption.md](ideas/contraption.md) |
| Photo Codenames | — | idea | promising | [ideas/photo-codenames.md](ideas/photo-codenames.md) — blocked on the photo library, [ADR-0004](../adr/ADR-0004-shared-photo-library.md) |
| SEAR | — | spec | ready | [sear-spec.md](sear-spec.md) (build plan in §0; runtime not started) |
| Wing Roulette | — | idea | promising | [ideas/wing-roulette.md](ideas/wing-roulette.md) — push-your-luck peck at a wing rack; the roster's first chance game; cheapest build on the list |
| Kempenfelt Curling | — | idea | promising | [ideas/kempenfelt-curling.md](ideas/kempenfelt-curling.md) — drag-release throw plus a teammate sweep after the commit; every team's stones stay in the house |
| Scream Run | — | idea | promising | [ideas/scream-run.md](ideas/scream-run.md) — the tablet mic is the controller; blocked on HTTPS or a Chrome flag on the tablet |
| Mount Your Hens | `MOUNT` | spec | ready | [mount-your-hens-spec.md](mount-your-hens-spec.md) (build plan in §0; runtime not started). Mount Your Friends with the cast: one climb per player onto a pile of everyone before them, kept as round memory; the cast's ragdoll mode is the first step |

Target: **at least 8 games**. Current: 10 shipped, 3 spec'd, 7 ideas → 20 concepts, target covered.

The four ideas added 2026-10-02 come from [docs/research/cast-minigame-candidates.md](../research/cast-minigame-candidates.md),
a survey of known games worth giving the cast treatment; its scorecard says why the rest of
that list stayed on the bench.

ANAMORPH and CONTRAPTION were added to close a specific gap: every other game on this
list is words, recall, or expression, and none of them make the TV do something the room
gasps at. Both are procedural — the server sends a seed and the display renders, so the
graphics cost nothing on the wire and survive reconnect.

SEAR was added to close a different gap: every game above is think-then-commit and runs three
to five minutes a turn, so the night has no short, high-energy beat and no palate cleanser between
the heavy rounds. It is a blind-clock precision game rather than a reaction-speed game on purpose —
the spec explains why raw reaction time is mostly a sobriety test.

## Adding an idea

Drop a file in [`ideas/`](ideas/) using [`ideas/_template.md`](ideas/_template.md). Two lines is fine, plus the template's Principles check — the starred items of [minigame-design-principles.md](../minigame-design-principles.md) §11. Update the table above so the index reflects reality.

## Promoting an idea to a spec

When an idea hits `confidence: ready`:

1. Move `ideas/<slug>.md` → `<slug>-spec.md` and flesh it out — use [drawing-spec.md](drawing-spec.md) as a reference shape, and answer the full [design principles checklist](../minigame-design-principles.md#11-the-review-checklist); where the answer is no, the spec says why the game is worth it anyway.
2. Update the table.
3. Scaffold the package under `packages/minigames/<slug>/` (see [minigame-authoring-guide.md](../minigame-authoring-guide.md)).
