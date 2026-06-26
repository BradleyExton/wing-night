# PETMON — Design Decisions

Pokémon Red/Blue-style gym battle minigame: friend-group pets as the
monsters, friend personas as gym leaders. TV renders a Game Boy battle
screen; the host tablet is the controller. Decisions below were settled
up front (2026-06-12); implementation should not relitigate them without
updating this doc.

## Identity

- MinigameType id `PETMON`, slug `petmon`, package `packages/minigames/petmon`.
- On-screen title "PETMON"; round flavor "Gym Challenge".
- Pokémon-*inspired* throughout: own names, own generated art, no
  Nintendo assets or fonts.

## Battle structure

- One gym battle per active-team turn (standard `turnOrderTeamIds`
  rotation — every team battles once per PETMON round).
- The active team picks **3 pets** from the shared roster at turn start.
- Opponent is the round's **gym leader** (AI) with a **2-pet bench** —
  3v2 tilts toward the players winning.
- One leader per round, fixed content order; every team in a round faces
  the same leader and lineup (fair comparison; badge progression across
  rounds).
- Switching is **faint-only** for MVP: when a pet faints the team picks
  which remaining pet comes out (one host tap). Voluntary switching is a
  possible later "5th move".
- **Turn cap: 12 total turns.** At the cap the battle ends and is scored
  as-is. No clock pressure on screen; `petmonSeconds` is a generous soft
  per-battle timer (~300s) the host can ignore.
- Mirror matches (a team picks a pet that's also on the leader's bench)
  are allowed — it's funny, not a bug.

## Mechanics (MVP scope)

- Stats: **HP and Attack only.** No defense, speed, stat stages, or
  status effects in MVP.
- **Single joke type** per pet and per move, from a ~6-type custom chart
  (e.g. FOOD, ZOOMIES, SLEEPY, CHAOS, CUDDLE, SCREAM — final chart is
  content). Dual-type jokes live in Pokédex flavor text only.
- Type hints are shown, not homework: soft hints on cards plus
  effectiveness flashes after hits ("It's super effective!") so the
  chart is learnable during the night.
- Damage = move power × attacker ATK × type multiplier.
- **Accuracy misses are the only RNG.** No crits, no damage rolls.
  Seeded PRNG stored in battle state so reducers stay deterministic,
  testable, and replayable.
- Leader AI: **biased random** — weighted toward effective/high-damage
  moves but imperfect.

## Difficulty & balance

- All roster pets share an **equal stat/move budget**; they differ by
  typing and move texture. Duplicate picks across teams are harmless and
  allowed.
- Escalation via **per-leader stat multiplier** on the leader's bench
  (e.g. 1.0× / 1.15× / 1.3×) defined in content; AI good-move bias may
  also tick up per leader.

## Scoring (out of pointsMax)

- **Win-weighted composite:** beating both leader pets banks ~60% of
  `pointsMax`; the remainder scales with surviving pets' remaining HP.
- Loss or turn-cap stall scores by damage percentage dealt, capped
  around 50% of `pointsMax`.
- Clamped into `pendingPointsByTeamId` like the other minigames.

## Content

- Roster for night one: **~10 pets, 3 leaders**. Leader benches draw
  from the same roster.
- Sprites are **generator-made images** supplied as assets (no
  processing pipeline): front + back sprite per pet, front sprite per
  leader. Square PNGs rendered with `image-rendering: pixelated`.
- Asset/content locations mirror GEO: committed placeholders in
  `content/sample/minigames/petmon.json` + `apps/client/public/sample-assets/petmon/`;
  real friend content gitignored in `content/local/` +
  `apps/client/public/local-assets/petmon/`.
- Schema sketch:
  - `typeChart`: type ids + effectiveness multipliers (content, not code,
    so the jokes stay editable).
  - `pets[]`: `id, name, type, hp, attack, spriteFrontSrc, spriteBackSrc,
    flavor, moves[4]: { name, type, power, accuracy }`.
  - `leaders[]`: `id, name, spriteSrc, taunt, statMultiplier, petIds[2]`.

## Presentation

- **DMG green 4-shade palette**, letterboxed inside the broadcast bg
  like a giant Game Boy screen. Requires a new scoped surface-language
  section in DESIGN.md (precedent: GEO's gold exception) defining the
  four green tokens.
- `MINIGAME_INTRO` is the leader intro: "GYM LEADER <NAME> wants to
  battle!" with their photo-sprite and a taunt line from content.
- Battle text **auto-advances** (~1.5–2s per line) with typewriter fill,
  blinking ▾, and sequenced HP-bar drain. The host only ever inputs move
  choices and faint replacements.
- Host surface follows the DESIGN.md takeover pattern: four-move pad,
  bench/HP status, faint-replacement picker, and it owns the
  battle-over trigger.

## Rollout

- **Mockups first:** static HTML under `apps/client/public/mockups/`
  (TV battle screen, leader intro, host move pad) to validate the DMG
  look and text rhythm before building the runtime.
- First outing runs PETMON in a **mid-round slot**, not the finale,
  until pacing is proven with humans.
- Standard wiring per docs/minigame-authoring-guide.md: shared
  `MINIGAME_DEFINITIONS` + `petmonSeconds` + `rules.petmon` (+
  validators), server/client registries, content adapter, dev manifest
  fixture, runtime unit tests, sandbox e2e.
