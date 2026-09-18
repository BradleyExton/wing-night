# Spotter Minigame Spec

Status: **Shipped** — `packages/minigames/spotter/`

Last updated: 2026-09-16

> **Read §0 first.** The body below is the 2026-09-16 research pass that
> argued the design, kept for its reasoning. §0 records what the build settled
> and where it departed from the pass.

## 0) As built

- **The recommended lab was folded into the package.** The pass wanted a
  throwaway `/dev/lab/spotter` before any package work, on the grounds that the
  feel numbers would be expensive to change once pinned. They are not: grid
  size, targets per turn and the score bands are `minigameRules.spotter`, the
  fire hold is one constant (`FIRE_HOLD_MS` in the host surface), and the
  `/dev/minigame/spotter` sandbox plays the real reducer on both surfaces. Tune
  there, in config, with a room of people; there is nothing to throw away.
- **Rules:** `targetsPerTurn` (5), `gridCols` (13, 5–25), `gridRows` (7, 3–15),
  `scoreBandsCells` (`[{ maxCells: 0, points: 3 }, { maxCells: 1, points: 1 }]`,
  Chebyshev distance, first match wins) and an optional integer `seed`. The
  sample config carries the defaults and `spotterSeconds: 60`. A missing seed
  rolls a fresh one per turn so a team scheduled twice sees two fields; the dev
  manifest pins `20260916` so the sandbox and the e2e suite see the same one.
- **No content file.** `content` is undefined on the plugin; the loader skips
  it. First roster entry with nothing under `content/`.
- **Actions:** `nudge { direction: "U" | "D" | "L" | "R" }` and `fire {}`. A
  nudge into a wall is a no-op (no phantom trail step); the trail is capped at
  40; every action is ignored once the last target is resolved.
- **The inverse answer-safety test exists** (`runtime/index.test.ts`, "display
  view exposes the field while the host view stays field-free"): the host view
  carries `status`, `targetsPerTurn`, `targetIndex`, `nudgesThisTarget`,
  `lastShot` and per-shot `{ band, points }` — never cursor, targets, seed,
  path or grid size. The display view carries all of it, including where each
  shot landed, so the TV can splat it.
- **Fire is a 400 ms hold** on the centre zone (pointer events), with Enter or
  Space firing immediately for keyboard users. Nudges are single taps in the
  four edge zones; the gaps between zones are dead bands. The tablet ticks on a
  registered nudge and thunks on fire via WebAudio, best-effort, created lazily
  on the first tap (no unlock overlay needed on the host).
- **The display** is one SVG in a fixed cell space scaled to fit, so 720p and
  4K read identically: faint grid, numbered rings for upcoming targets, the
  current target pulsing in `heat`, the crosshair and trail in `primary`, and
  colour-coded splats with the band and points at every resolved shot.
  DESIGN.md §2.6 records the surface language.
- **Not scheduled in the sample config**, matching Song Guess: the default demo
  night is unchanged. Schedule it by adding a round with `"minigame": "SPOTTER"`
  in `content/local/gameConfig.json`.
- **Unchanged from the pass:** staging A (holder faces the room, back to the
  TV) with input that also works eyes-free; no hazards; ordered targets; the
  timer is the shell's, not the reducer's; the shell's one-tap Next CTA is still
  a cross-title hazard for a sauce-covered holder (BACKLOG "Cross-title game
  shell contract").

---

## Research pass (2026-09-16)


### Pitch

Every game in the roster points the same way: the tablet knows something, the room finds out.
SPOTTER reverses the channel. The **TV has the whole picture** — a field of numbered targets and
a fat crosshair — and the one person holding the controls is the one person who can't see it.
Their team becomes the artillery spotter: *"up, up, left — no, YOUR left — one more — FIRE."*
The crosshair on the TV is a live readout of how well that sentence survived the trip from the
room to a person who just ate a ghost-pepper wing.

Why it earns a slot:

- **It fills the one gap nothing else fills.** Trivia, Geo, Song Guess and Read the Room are
  tablet → room. Drawing and Emoji Charades are tablet → TV → room. ANAMORPH and CONTRAPTION
  put the picture on the TV but the *sighted* team drives. SPOTTER is the only concept where the
  room is the input device and the holder is a lossy relay. That is a different social shape, and
  it is the one the party format is built for: everyone at the table is already shouting.
- **Spice degrades exactly the right person, in public.** The holder's watering eyes don't matter
  (they aren't looking at anything). What matters is that they must count "three ups" while
  hiccuping, and every miscount lands on the TV as a wrong move for the whole room to scream at.
  See §7.
- **It is the cheapest game on the roster to build.** No content pack, no assets, no audio, no
  physics, no server tick. State is a seed, a cursor and a short list of ints. Two actions.
- **The external precedent is strong and consistent.** The guide-the-blind-partner loop is a
  proven genre — Minefield the team-building exercise, Taskmaster's blindfold maze, the Roblox
  "Tell Me" obby, Keep Talking and Nobody Explodes — and every one of them reports the same thing:
  the difficulty of describing space to someone who can't see it is *sufficient*; you don't need
  to add any other obstacle. We have a free obstacle called capsaicin.

Renamed from the working slug `blind-pilot`: "pilot" implies steering, and steering is the
candidate this pass rejects (§1). A spotter is the person who calls corrections to a gunner who
cannot see the target — that is the room's job here, and the name tells them so.

### Rough rules

- One active team per turn, one tablet, the standard handoff: the host gives the tablet to the
  team's chosen holder. The holder sits in the "hot seat" **facing the room, back to the TV**.
  The intro screen on the TV says so; enforcement is social, same as Read the Room's hidden band.
- The TV shows a coarse grid (leaning 13 × 7 cells, tunable — see Open questions) with
  `targetsPerTurn` numbered targets scattered by a seed, and a crosshair that starts dead centre.
  Target 1 pulses. The tablet shows **no field, no cursor, no targets** — only the controls, the
  timer, the shot tally and non-leaking feedback (§3).
- The holder nudges the crosshair one cell at a time with taps in four big edge zones
  (top = up, bottom = down, left = left, right = right) and fires with the centre zone. Every
  nudge is one server action; the TV moves on the snapshot, so the room sees every tap land.
- FIRE always resolves the current target (it does not "miss and wait" — see §6 for why). Points
  by distance band: on the cell = 3, one cell off = 1, else 0. The TV splats the shot, then target
  N+1 pulses and the trail resets.
- Turn ends when every target is resolved or the phase timer runs out (`spotterSeconds`, leaning
  60). Points pend and apply at the phase boundary like every other minigame.
- Host escape hatches are the existing ones: skip the turn boundary, undo the last scoring
  mutation, manual score override — all via the override dock once the host takes the tablet back.

#### 1. The task — candidates considered

| Candidate | Input | Why not / why |
|---|---|---|
| **Trace a path** (TV shows a shape or maze; holder draws it blind) | continuous drag | Drawing works because the drawer can see. Blind, a dragged finger has no anchor after the first lift, grease drops pointer events mid-stroke, and there is no honest automatic score — shape-matching a blind squiggle is either a host verdict (fine for Drawing, where the *guessers* are the game) or a fairness argument. The failure state is mush, not a moment. The back-to-back drawing exercise exists precisely because verbal description of a picture is slow and fails predictably. Rejected. |
| **Assemble in order** (TV shows a sequence; tablet is a grid of pads; room reads out "second row, third from left") | discrete taps | Robust, greasy-thumb-proof, and Keep Talking proves the loop. But the "picture" on the TV is a lookup table, the guidance is coordinate reading rather than spatial correction, and there is no continuous readout for the room to scream at — a wrong pad is a binary buzz. Solid as a *second mode* later; not the first cut. |
| **Steer** (holder holds a direction; a blob moves while held; TV shows a course) | hold-and-release | The most "pilot" feel and the wrong architecture: time-continuous motion needs a server tick or client-side extrapolation, and the runtime today is purely action-driven (`reduceAction` runs only on dispatch; no plugin sees a clock). It also puts LAN latency *and* shouting latency inside the control loop, so every overshoot is ambiguous — was that lag, or Mike? Rejected on both counts. |
| **Aim and fire** (TV shows targets + crosshair; holder nudges the crosshair a cell per tap and fires) | discrete taps + a deliberate fire | Discrete steps make the shouting countable ("three ups") and make latency irrelevant to correctness (§4). Every target is reachable, so the only stuck state is social. FIRE is a commit point the whole room feels. Scores by distance, which we already ship (Geo). **Chosen.** |
| *Find it in a photo* (aim-and-fire over a photo: "put the crosshair on Jordan's face") | as above | Same mechanic plus content. Reuses the Geo photo import and `featuredPlayers`, but needs hand-annotated target boxes per photo. Deferred to v2 (Open questions). |

#### 2. Input for someone who can't see the screen, on a greasy tablet

Two stagings are possible and the input must work for the harder one:

- **A — back to the TV** (recommended for MVP): the holder can see the tablet, just not the field.
  Visible zones are enough.
- **B — Heads Up! style**: the tablet is held facing the room; the holder sees nothing. Input must
  be fully eyes-free. Heads Up! solved this with *tilt* (down = correct, up = pass) because a
  phone on a forehead can't be looked at. Tilt on our tablet needs `DeviceOrientation` permission
  prompts on iPadOS and gives four directions plus fire no clean mapping. Not worth it for MVP.

So: **bezel-anchored edge zones, tapped.** Four bands along the physical edges of the tablet plus
a centre zone, with dead bands between them; a tap in a dead band is ignored, never guessed. A
finger can find an edge by feel in staging B and by sight in staging A. Compared:

- *Continuous drag* — no reference frame once the finger lifts, grease cancels pointers
  mid-gesture, and the TV would mirror a smear rather than a decision. No.
- *Hold-and-release* — needs a clock in the reducer (there isn't one) and puts latency in the loop.
  No.
- *Swipes* — direction is clear but grease turns a swipe into a tap, and a stray tap in the
  middle is a FIRE. No.
- *Discrete taps* — one tap, one cell, one snapshot. Idempotent enough that a double-tap is just
  two nudges the room can see and correct. **Yes.**
- *FIRE = hold the centre ~400 ms*, not a tap. A deliberate gesture that works by feel, is
  grease-proof, and gives the room one beat to yell "NO WAIT". Every other stray tap is
  recoverable; a stray FIRE resolves a target, so it earns the extra friction.

One shell-level hazard worth naming: during `MINIGAME_PLAY` the host shell keeps a one-tap **Next**
CTA pinned at the bottom and the **Overrides** trigger bottom-right
(`HostControlPanel/index.tsx`), and the SPEC's press-and-hold host unlock is not implemented (no
`PASS_AND_PLAY` anywhere in the code). The package can only keep its DOWN zone inside the takeover
canvas with a dead band above the bar. A hold-to-confirm on the CTA is a cross-title shell item
(BACKLOG "Cross-title game shell contract"), not something this game should solve alone — but it
is the tap most likely to end a turn by accident with sauce on the screen.

#### 3. What the tablet shows

Not blank. A blank tablet gives no confirmation a tap registered, so the holder double-taps and
the room watches the crosshair jump two. Show:

- The five zones, labelled, with a flash on the tapped zone and a tablet-side **audio tick** per
  nudge and a **thunk** on fire. iPad Safari has no vibration API, but the host tablet's first
  button press is the user gesture that unlocks audio, so this needs none of the display's
  unlock overlay (authoring guide §5.3 says as much). Eyes-free confirmation for staging B.
- Timer, targets resolved / remaining, points pending, and after each shot a plain result
  ("HIT · 3", "CLOSE · 1", "MISS") — the room sees the same thing on the TV, so it leaks nothing.

Deliberately **not** shown, because each one reconstructs the picture:

- Cursor coordinates or a mini-field — the entire point is that only the room has these.
- Proximity or warmer/colder — this turns the game into hot-and-cold and makes the room optional.
  The room *is* the proximity sensor.
- A nudge count for the current target is borderline: it tells the holder nothing about *where*
  they are, only how many times they've moved. Harmless; keep it as a small "shots / nudges" line.

**Contract check.** The host view is `MinigameHostViewBase & { … }` and the shell only requires
the two base fields: `activeTurnTeamId` (the server copies it to `RoomState.activeTurnTeamId`,
and `canDispatchMinigameAction` is false without it) and `pendingPointsByTeamId` (the server
copies it into `pendingMinigamePointsByTeamId` from the **host** view). Beyond those, no shell code,
no server projection test and no registry test assumes a host view carries a prompt, a cursor or
anything else — the per-game tests are the only place view contents are asserted, and
`MinigameSurface` only insists the view be non-null during play. A starved host view therefore
violates nothing. What is missing is the *inverse* guardrail: AGENTS.md §3.2 and every existing
projection test are one-directional (display must be answer-free). SPOTTER's runtime test must
add the mirror image of drawing's "host view exposes the prompt while the display view stays
answer-safe" — *display view exposes the field while the host view stays field-free* — asserting
`"cursor" in hostView === false`, no `targets`, no `seed`, no `path`.

One honest caveat on the trust model: the host socket receives the full `RoomState`, including
`minigameDisplayView` (only the display snapshot is role-stripped). The starvation is at the
projection layer for the host view and at the render layer for the display view. This is the same
trust model as every game where the host has the answers, and the person least able to open
devtools mid-turn is the one who just ate the wing.

#### 4. Live mirroring and the LAN loop

Yes, the TV mirrors every nudge live — the crosshair on the TV *is* the feedback loop; without it
the room can't guide. Cost is one tiny action per tap through the existing
`minigame:action → mutation → snapshot broadcast` path, which Drawing already pushes at ~15
sends/sec (`drawing-spec.md` §8.1). A human can't tap much above 3–4/sec, so this is a fraction
of a load we've proven.

Is the round trip tight enough? Gergle, Kraut & Fussell measured exactly this — pairs doing a
guided puzzle with a shared view delayed by a controlled amount — and found **no measurable
effect on performance for delays between 60 ms and ~940 ms**; only past ~940 ms did each extra
100 ms cost seconds. Socket.IO on a home LAN is tens of milliseconds tap-to-TV, an order of
magnitude inside the safe band. The latency that matters is human (shout → hear → count → tap),
and discrete steps make it *irrelevant to correctness*: a late "stop" can't overshoot a cell that
only moves when tapped. That is the strongest single argument for taps over hold-to-move.

Reconnect: the display view carries the cursor, targets, current index, trail and results, so a
mid-turn refresh rehydrates the identical frame with no client derivation.

#### 5. Frustration budget

Time cap, not attempt cap, plus partial credit — and the structural insurance that **nothing can
get stuck.** Every target is reachable in at most (cols + rows) / 2 nudges from anywhere; there is
no "I can't do this" state as there is in Drawing. The only failure is social (the room disagrees
with itself), and that resolves in seconds, not the whole turn, *provided sequences stay short* —
which is why the grid is coarse and there are only a handful of targets.

What keeps it funny rather than infuriating, per the precedents:

- **Don't add a second obstacle.** Keep Talking's designers tried misleading manual text and
  pulled it: "the difficulty in communicating these visual concepts to people who can't see what
  you see is enough of a barrier." Taskmaster's version adds a no-repeated-words rule because its
  contestants are sober. Ours have eaten. No scrambled controls, no inverted axes.
- **Misses cost a target, not the turn.** Partial credit by band means a fumbled shot still puts
  a number on the board and the next target lights up immediately.
- **Short beats.** Five targets in sixty seconds is roughly ten seconds per target; a lost ten
  seconds is a laugh, a lost sixty is a sulk.
- **The timer is the only pressure**, as in Emoji Charades ("the clock is the disincentive").
  Note that no reducer in the repo sees the phase timer — "hard cutoff at zero" is a shell
  convention (the host advances at "Time's Up"), not an enforced one. Same for SPOTTER; late taps
  are socially policed like everywhere else.

#### 6. Scoring shape

**Count-per-target with a narrow distance band**, capped at `pointsMax`: on the cell = 3, one
cell off (Chebyshev distance 1) = 1, else 0; five targets → 15 = `defaultMax`, the same
arithmetic Geo uses (5 × 3). `finalRoundMax` 20 is reachable by scheduling `targetsPerTurn: 7`
in that round's rules and letting the cap trim it, exactly as Geo's 15-max already behaves.

Why not the alternatives:

- *Wide proximity bands (Geo's six tiers)* — on a discrete grid "close" is just a miscount, and
  generous bands make "fire when roughly there" the dominant strategy, which deletes the FIRE
  beat. One consolation point for the adjacent ring keeps the greasy thumb from being brutal
  without making precision optional.
- *Binary per target* — too swingy for a 60-second turn; one bad sequence is a zero and the
  room stops shouting.
- *Pure count with unlimited attempts (miss-and-retry)* — the tempting design, but it combines
  badly with partial credit: firing repeatedly around a target would farm the 1-point ring. Hence
  FIRE always resolves the target; a stray shot is expensive, which is why FIRE is a hold.

#### 7. How a very hot wing degrades it

It should, and it does, along the axis that shows on the TV:

- **Counting under distress.** "Up three, left two" is trivial sober. Hiccuping, mouth breathing,
  eyes streaming, one hand on a glass of milk — the holder taps four, or taps the wrong edge, and
  the crosshair on the TV moves the wrong way in front of everyone. The cursor becomes a public
  readout of how wrecked the person is. No other candidate makes the impairment this legible.
- **The back-channel dies.** A holder with a scorched mouth can't say "wait, which left?" The
  loop degrades toward one-way shouting, which is exactly the variant the Minefield exercise uses
  to make things harder.
- **Streaming eyes don't matter**, because the holder isn't looking at the picture. That is a
  feature: a sighted version of this game would degrade into "I can't see the screen", which the
  room can't watch. Blind, the only failure mode is the funny one.
- The shouters ate too (the active team eats, then plays — SPEC §5), so the guidance is also
  compromised. That's fine; the point is that only the holder's failures are on the TV.

If the holder were sober and sighted this would be a mild coordination game. It belongs in a
mid-to-high-heat slot, holder chosen by the team *before* they know the sauce.

#### 8. The room is the channel and the mob

Position: **the noise is the point, and it needs one structural mitigation, not a rule.**

Spaceteam's designer notes the shouting was never a feature — it emerged because "it's the only
way to get someone to hear your instruction." The multi-voice variant of Minefield, where every
team shouts at once and navigators must pick out their own guide, is used *because* the
confusion is the lesson. Keep Talking's early sessions are chaos by design and the stress "kept
people laughing and eager to replay." Other teams heckling with wrong directions is the same
category of fun as other teams shouting wrong answers in Drawing: a social contract, not a
fairness problem the engine should solve.

The mitigation is the one already in the rules: **short sequences.** A coarse grid and few
targets mean a burst of contradictory shouting costs a couple of nudges the room can see and
undo. Hosts who want a "one designated caller" rule can impose it; the game shouldn't. The one
thing the display *must* do is make the active team unmissable (marquee, team colour) so the
holder knows whose voice to listen for — the Minefield variant's whole difficulty is that they
can't.

#### State shape

Tiny, fully `SerializableValue`, no clock, no derivation on the display:

```
{
  activeTurnTeamId, pendingPointsByTeamId,
  seed,                       // for tests and a fair redo; targets are stored, not re-derived
  gridCols, gridRows,
  targets: [{ col, row }],    // targetsPerTurn entries, seeded, none at centre, ≥2 cells apart
  targetIndex,
  cursor: { col, row },
  path: ("U"|"D"|"L"|"R")[],  // nudges since the last shot, capped (~40) → the TV trail
  results: [{ col, row, points }]
}
```

Actions: `nudge { direction }` (clamped at the edges, appends to `path`), `fire {}` (scores the
band, appends to `results`, advances `targetIndex`, clears `path`). Both no-ops when every target
is resolved. Targets come from a six-line seeded PRNG (mulberry32) in the runtime; the display
never runs it — the server projects the target list, so cross-side determinism is not a concern
at all (a simpler position than ANAMORPH's).

Host view: base fields + `targetsPerTurn`, `targetIndex`, `nudgesThisTarget`, `lastShot`
(`{ points, band } | null`), `results` as points only. **No cursor, targets, seed or path.**
Display view: everything above. `rulesKey: "spotter"` with `targetsPerTurn`, `gridCols`,
`gridRows`, `scoreBands`; `timerKey: "spotterSeconds"`; **no content file** (`content: undefined`
on the plugin), which makes it the first roster entry with nothing under `content/`.

Display surface language: Spicy Broadcast, two accents — `primary` for the crosshair and trail,
`heat` for the pulsing current target — with sauce-splat hits. Check
`apps/client/public/mockups/` first per house rules; there is no SPOTTER mockup yet, and the
closest shape is `trivia-display` (single stage, big numerals) rather than the easels.

### Open questions

- **Grid size and targets per turn are the whole feel**, and they trade against each other:
  13 × 7 with five targets is a guess (centre-to-corner is nine nudges; five targets ≈ thirty taps
  in sixty seconds with shouting in between). Bigger grid = longer sequences = more mistakes =
  funnier and slower. This cannot be reasoned to on paper — it is a **lab** question (below).
- **FIRE as a hold vs a tap, and how long.** 400 ms is a guess. Too short and grease fires it;
  too long and the "NO WAIT" beat becomes a wait. If the hold is worth showing on the TV as a
  charging ring, that needs `armFire` / `cancelFire` actions and a tiny bit more state — a
  nice-to-have, not MVP.
- **Does the trail help or clutter?** CONTRAPTION's labs settled that failure needs a "trail"
  aid to read from across the room. Here the trail makes a wrong sequence legible ("you went
  DOWN three times") but at 4K it may read as noise. Lab.
- **Hazards.** Minefield is literally about avoiding things. Cells that reset the cursor to
  centre when crossed would add "NOT THAT WAY" to the shouting without breaking SPEC §6's
  no-negative-scoring rule. Leaning **no hazards in MVP** — the spice is the hazard — and revisit
  once the base loop is measured.
- **Staging A vs B.** Recommending back-to-the-TV for MVP; the edge-zone input is designed so
  tablet-facing-out works without change if a playtest prefers it.
- **Photo mode (v2).** "Put the crosshair on Jordan's face" over a `local-assets` photo reuses
  the Geo import and `featuredPlayers` and is the obvious content-pack win, but needs an
  annotated target box per photo and a different hit test (pixel distance, not cells). Keep the
  MVP procedural so the game ships with zero authoring.
- **Ordered targets vs any order.** Ordered is simpler for the room ("get to 2") and gives the
  TV one thing to pulse. Leaning ordered.
- **Final-round cap.** 3 × 5 = 15 can't reach `finalRoundMax` 20; either a 7-target final rule
  (leaning) or accept it as Geo does.

#### Lab recommendation

The feel questions above are a **`/dev/lab/spotter`** job, in the throwaway shape of
`AnamorphLab` (route under `resolveDevLabName`, an `eslint.config.mjs` ignore, deleted when the
package ships, and never touching `packages/minigames/`, `MINIGAME_DEFINITIONS` or either
registry). The one twist: this loop is two people and a room, which a single window can't
exercise. Recommend the lab take `?role=field` and `?role=pad` and sync the two windows over
`BroadcastChannel` — no server, same origin — so the actual party rig (laptop on HDMI as the
field, laptop screen turned away as the pad) runs it, with knobs for grid size, targets, fire
hold time and trail on/off. LAN latency does not need a lab; Drawing already proved the path.

Do not build the package before the lab: the grid/target numbers are the difference between the
best shouting game at the table and a slow, annoyed one, and they are cheap to find and expensive
to change once the sample config and tests pin them.

### References / inspiration

- Heads Up! — the mass-market reverse-flow game: the holder can't see their screen, the room
  supplies the information, and input is *tilt* because a screen on a forehead can't be looked
  at; timed 60–120 s rounds scored by count. [MakeUseOf on the play loop](https://www.makeuseof.com/tag/heads-charades-mobile-game-hold-forehead/),
  [Google Play listing](https://play.google.com/store/apps/details?id=com.wb.headsup&hl=en_US)
- Keep Talking and Nobody Explodes — Ben Kane on why asymmetric information is enough on its own
  and why the misleading-manual tricks were cut; "if either side goes silent, something's gone
  wrong." [Voices of VR #98](https://voicesofvr.com/98-ben-kane-on-designing-keep-talking-and-nobody-explodes/),
  [GDC: Designing Asymmetric Gameplay for KTANE](https://gdcvault.com/play/1023471/Designing-Asymmetric-Gameplay-For-Keep)
- Spaceteam — Henry Smith: shouting was emergent, not designed; one instruction at a time.
  [Road to the IGF](https://www.gamedeveloper.com/design/road-to-the-igf-henry-smith-s-i-spaceteam-i-)
- Gergle, Kraut & Fussell, *The Impact of Delayed Visual Feedback on Collaborative Performance*
  (CHI 2006) — shared-view delay under ~940 ms had no measurable effect; beyond it each 100 ms
  cost ~2.3 s. The number that settles §4. [PDF](https://sfussell.hci.cornell.edu/pubs/Manuscripts/Gergle_CHI2006.pdf),
  [ACM DL](https://dl.acm.org/doi/10.1145/1124772.1124968)
- Taskmaster NZ, "Direct your team-mate through the maze" — blindfolded navigator, guides may
  not repeat a word; the extra constraint is there because the contestants are sober.
  [taskmaster.info](https://taskmaster.info/task.php?id=2683), [Taskmaster wiki](https://taskmaster.fandom.com/wiki/Control_a_blindfolded_teammate_through_the_maze_without_touching_the_rope_(Taskmaster_NZ))
- Minefield (team-building) — the multi-voice variant where every guide shouts at once and the
  navigator must pick out their own team's voice. [Building Your Team](https://www.buildingyourteam.com/minefield-team-building-game-the-ultimate-team-communication-challenge/),
  [Oak Innovation](https://www.oakinnovation.com/blog/free-activities/minefield-game-activities-for-team-workshops)
- "Tell Me!" 2-Player Obby (Roblox) — the current mass-audience blind-plus-guide game; its
  folk advice (consistent directional language, countdowns, describe ahead) is the room's
  strategy here. [Roblox](https://www.roblox.com/games/14747881398/Tell-Me),
  [Playgama summary](https://playgama.com/blog/game-faqs/what-roblox-obby-has-one-player-blind/)
- Back-to-back / blind drawing exercises — why "describe the picture, draw it blind" is slow and
  fails predictably; the argument against the trace-a-path candidate.
  [SessionLab](https://www.sessionlab.com/methods/blind-drawing), [Teampedia](https://www.teampedia.net/wiki/Back-2-Back_Drawing)
- Split-information voice co-op — *We Were Here* (walkie-talkie symbol description),
  *Tick Tock: A Tale for Two*, *Blindside*: the same "neither side has the full picture" loop on
  two screens. [We Were Here review](https://roomescapeartist.com/2021/02/02/we-were-here-review/),
  [Tick Tock](https://www.othertalesinteractive.com/press-ticktock), [Blindside](https://waffleworks.itch.io/blindside)
- Blind Drive — a game built entirely on eyes-free feedback; the precedent for the tablet's
  audio tick/thunk. [Game Developer](https://www.gamedeveloper.com/audio/creating-i-blind-drive-i-an-audio-sensory-driving-game-experienced-through-sound)
- What I could **not** find: a mainstream console party title (Jackbox, Mario Party, Wii Party)
  with this exact inversion — TV visible to all, controller-holder blind. The genre lives in
  phone-on-forehead apps, Roblox and team-building exercises. Treat that as mild evidence the
  slot is open rather than evidence it doesn't work.
- In-repo: proximity scoring and `promptsPerTurn` rules ([geo-spec.md](geo-spec.md)); live
  tablet → TV action streaming at ~15/s and the answer-safety test to mirror
  ([drawing-spec.md](drawing-spec.md), `packages/minigames/drawing/src/runtime/index.test.ts`);
  TV-renders / tablet-is-the-controller split ([petmon-design.md](../petmon-design.md));
  the throwaway-lab convention ([BACKLOG.md](../../BACKLOG.md) "Prerequisite lab work",
  `apps/client/src/components/AnamorphLab`).
