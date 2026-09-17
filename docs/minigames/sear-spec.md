# SEAR Minigame Spec (MVP)

Status: **Planned** — nothing under `packages/minigames/sear/` yet

Last updated: 2026-09-16

> **§0 is the build plan; the Research section after it is the reasoning it rests on.**
> Read §0, then `docs/minigame-authoring-guide.md`, then build in the order given. Every
> decision the research left open is closed in §0.3 — if you find yourself re-deciding one,
> stop and re-read it. Adding a `MinigameType` breaks every `Record<MinigameType, …>` in the
> repo until fully wired (guide §1), so there is no useful half-state: land the whole
> checklist in one change.

## 0) Build plan

### 0.1 What ships

One `MinigameRuntimePlugin` package, `@wingnight/minigames-sear`, registered on server and
client exactly like song-guess. A blind-clock precision relay: the active team passes the
tablet, each shot is START → three visible seconds → hidden count → STOP, scored by absolute
error in bands. No content file. Server authoritative for shot state, band, points and
plausibility; the tablet only reports a measured `elapsedMs`.

### 0.2 Order of work (each step ends with the gate green)

Gate for every step: `pnpm lint && pnpm typecheck && pnpm test`. Steps 5–7 also need
`CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e` (CLAUDE.md). A fresh
worktree needs `pnpm install` under fnm Node 25 first.

1. **Engine plumbing — `receivedAtMs` on the action envelope.**
   `packages/minigames/core`: add optional `receivedAtMs?: number` to
   `MinigameRuntimeActionEnvelope`. `apps/server/src/roomState/scoringMutations`
   `dispatchMinigameAction`: stamp `receivedAtMs: Date.now()` into the envelope it passes to
   `dispatchActiveMinigameRuntimeAction`. Test that the stamp reaches the plugin by
   monkeypatching `Date.now` the way `phaseTurnFlow.test.ts` does. Existing plugins ignore
   the field; do not touch Drawing's in-reducer `Date.now()`. Land this first so the reducer
   in step 3 is pure from its first commit.
2. **Shared contracts.** `packages/shared/src/content/gameConfig/minigameDefinitions`: add
   `SEAR` (`slug: "sear"`, `timerKey: "searSeconds"`, `rulesKey: "sear"`,
   `capabilityFlags: ["startShot","stopShot","redoShot","skipShot","overrideShotBand"]`).
   `packages/shared/src/roomState`: add `SearMinigameHostView` / `SearMinigameDisplayView`
   to the unions (§0.4 shapes; one outer member each, internal `status` discriminant per
   guide §3). No `packages/shared/src/content/sear` module — there is no content file.
   Typecheck now fails at every `Record<MinigameType, …>`; the remaining steps are the walk.
3. **Runtime package.** Scaffold `packages/minigames/sear/` from `packages/minigames/song-guess`
   (closest sibling: rules-backed; omit the `content` adapter — `loadMinigameContent` already
   skips plugins without one). `src/runtime/{types,guards,rules,scoring,views}/index.ts` +
   `index.ts` + `index.test.ts`. `isRules` validates `minigameRules.sear` (§0.5); the server
   calls it at config load. Reducer per §0.6. Every test timestamp is a literal.
4. **Registries + config.** `apps/server/src/minigames/registry`, `apps/client/src/minigames/registry`,
   `apps/client/src/copy/minigameBriefings` (needs a `sear-illustration.svg` under
   `apps/client/public/display/` beside the others), workspace deps in both `package.json`s,
   `content/sample/gameConfig.json`: add `timers.searSeconds: 75` and `minigameRules.sear`
   with the §0.5 defaults. **Do not schedule SEAR in a sample round** (song-guess precedent:
   the demo night stays unchanged and the e2e content root is shared across the run).
5. **Mockup, then surfaces.** No `apps/client/public/mockups/` prototype exists for SEAR —
   add `sear-display/` and `sear-host/` first (this repo styles from prototypes, never the
   other way round), using the EATING timer as the typographic reference (`DESIGN.md` §4,
   §5). Then `src/client/HostSearSurface/` and `src/client/DisplaySearSurface/` per §0.7,
   and add a `DESIGN.md` §2.6 "SEAR surface language" paragraph in the same change so the
   surfaces are part of the visual system. `src/dev/index.ts` = `createDevManifest({ rules,
   content: null })`.
6. **E2E.** `tests/e2e/sear-sandbox.spec.ts` against `/dev/minigame/sear` under
   `page.clock.install()` (§0.8). Mirror `song-guess-sandbox.spec.ts`'s black-box shape.
7. **Docs.** Flip this file's status to Shipped with an "as built" list of every divergence
   from §0 (the song-guess §0 convention), update `docs/minigames/README.md` (row → shipped,
   counts), delete the SEAR section from `BACKLOG.md`.

### 0.3 Locked decisions (closed here; argued in the Research section)

- **Verb:** blind clock, stop-at-target. Not quick-draw, not a visible needle, not rhythm.
- **Relay:** `shotsPerTurn` shots per team, same count for every team regardless of size.
  Runtime tracks a shot index, never a player id.
- **Targets:** `targetsSeconds` from rules, cycled by shot index, same sequence for every
  team. Not seeded, not randomised.
- **Measurement:** tablet measures START→STOP with `performance.now()`; server referees with
  `receivedAtMs` and a slack; out-of-slack shots score on the server's number and are
  flagged `disputed`, never zeroed.
- **Display sweep** animates from local snapshot arrival, not from server wall-clock. No
  clock-sync protocol.
- **Points cap by construction:** defaults give `4 × 3 = 12 < defaultMax 15`; the reducer
  additionally clamps at `pointsMax` like every other game. `isRules` cannot see
  `minigameScoring` (its signature is `(rulesKey, rules)`), so there is no cross-field
  guard — a known gap, noted in Research §6, not to be solved in this change.
- **Override = re-band, not re-time.** `overrideShotBand { shotIndex, band }` re-derives
  points through the band table. The shell's integer delta and pending-points hatches are
  untouched.
- **No audio, no content file, no `/dev/lab/`.** The sandbox is the lab.
- **Shot pacing is player-paced; phase advance is host-paced.** `searSeconds` is a budget
  the host reads, not a trigger. Nothing fires at `endsAt` — there is no server tick.

### 0.4 View shapes

```ts
type SearBand = "PERFECT" | "CLOSE" | "NEAR" | "BURNT";

type SearShotResult = {
  shotIndex: number;
  targetMs: number;
  elapsedMs: number;        // what the tablet measured (0 when skipped)
  skipped: boolean;
  band: SearBand;           // effective band (overriddenBand ?? measuredBand)
  points: number;
};

type SearMinigameDisplayView = {
  minigame: "SEAR";
  activeTurnTeamId: string | null;
  shotsPerTurn: number;
  shotIndex: number;
  visibleMs: number;
  results: SearShotResult[];
  pendingPointsByTeamId: Record<string, number>;
} & (
  | { status: "waiting"; targetMs: number }
  | { status: "running"; targetMs: number }
  | { status: "revealed"; targetMs: number; lastResult: SearShotResult }
  | { status: "done" }
);

// Host view = display view plus what the override chip needs.
type SearMinigameHostView = SearMinigameDisplayView & {
  hostResults: Array<SearShotResult & {
    serverElapsedMs: number;
    disputed: boolean;
    measuredBand: SearBand;
    overriddenBand: SearBand | null;
  }>;
};
```

There is no privileged field: the running clock is hidden from *both* surfaces. The
answer-safety test still exists (guide §6) and asserts the display view carries no
`serverElapsedMs` / `disputed` / `overriddenBand` — not because they are secrets, but so the
display contract cannot drift into carrying host-only bookkeeping.

### 0.5 Rules (`minigameRules.sear`), validated by `isRules`

```json
{
  "shotsPerTurn": 4,
  "targetsSeconds": [5, 7, 4, 8],
  "visibleSeconds": 3,
  "scoreBandsMs": [
    { "maxMs": 80,  "band": "PERFECT", "points": 3 },
    { "maxMs": 200, "band": "CLOSE",   "points": 2 },
    { "maxMs": 450, "band": "NEAR",    "points": 1 }
  ],
  "latencySlackMs": 400
}
```

Guards: `shotsPerTurn` positive integer; `targetsSeconds` non-empty, every value
≥ `visibleSeconds + 1`; `visibleSeconds` ≥ 0; `scoreBandsMs` non-empty, `maxMs` strictly
ascending, `points` non-negative integers, bands distinct and never `BURNT`; `latencySlackMs`
> 0. Missing `minigameRules.sear` ⇒ these defaults (GEO's `normalize…` pattern). Anything
beyond the last band is `BURNT` at 0.

### 0.6 Runtime state and reducer

```ts
type SearRuntimeState = {
  activeTurnTeamId: string | null;
  shotIndex: number;                       // next shot to take, 0-based
  currentShot: null | { targetMs: number; startedAtServerMs: number };
  results: SearHostResult[];               // completed shots, in order
  pendingPointsByTeamId: Record<string, number>;
};
```

Actions (bare names; all `didMutate: false` outside their status, on a malformed payload, or
when `envelope.receivedAtMs` is missing or non-finite for the two that need it):

- `startShot` — refused if a shot is running or `shotIndex ≥ shotsPerTurn`. Sets
  `currentShot = { targetMs: targets[shotIndex % targets.length] * 1000, startedAtServerMs: receivedAtMs }`.
- `stopShot { elapsedMs }` — refused if no shot is running or `elapsedMs` is not a finite
  number ≥ 0. `serverElapsedMs = receivedAtMs − startedAtServerMs`;
  `disputed = |elapsedMs − serverElapsedMs| > latencySlackMs`;
  `scoredMs = disputed ? serverElapsedMs : elapsedMs`; band from `|scoredMs − targetMs|`
  (inclusive at each `maxMs`); points from band; `pendingPoints[team] = min(pointsMax,
  previous + points)`. Pushes the result, clears `currentShot`, increments `shotIndex`.
- `redoShot` — if a shot is running: cancel it (no result). Else if `results` is non-empty:
  pop the last result, subtract its points from pending (floor 0), decrement `shotIndex`.
  Else refused. This is also what the host surface dispatches on mounting into a `running`
  shot it has no local stopwatch for (reload / reconnect).
- `skipShot` — refused if a shot is running or the turn is done. Records a result with
  `elapsedMs: 0`, `serverElapsedMs: 0`, `skipped: true`, `band: "BURNT"`, `points: 0`;
  increments `shotIndex`. The slot is consumed so shot counts stay equal across teams.
- `overrideShotBand { shotIndex, band }` — refused unless `results[shotIndex]` exists and
  `band` is a known band. Sets `overriddenBand`, recomputes that result's points and the
  team's pending total from all results (still clamped at `pointsMax`). Idempotent when the
  band is unchanged.

`initialize` reads `activeRoundTeamId`, rules and `pendingPointsByTeamId`; `syncPendingPoints`
mirrors the shell's pending map like the other games. `status` is derived in the view
selectors (`running` if `currentShot`, `done` if `shotIndex === shotsPerTurn`, `revealed` if
`results.length > 0` and the last result's `shotIndex === shotIndex − 1`, else `waiting`),
never stored.

Test list (colocated, `tsx --test`, no clock anywhere): each refusal above; PERFECT at 4 ms
error; band boundaries inclusive at `maxMs`; BURNT beyond the last band; disputed path scores
the server number; a gap exactly at the slack is *not* disputed; cap at `pointsMax`; redo of a
running shot vs a completed shot; skip consumes a slot; override recomputes totals and is a
no-op when unchanged; targets cycle past the array length; display view carries no host-only
fields; `isRules` rejects each guard violation and accepts the defaults.

### 0.7 Surfaces

**Host (`HostSearSurface`).** Takeover per `DESIGN.md` §2.0A. Three states, one big control
each: START (waiting), STOP (running — the button is effectively the whole canvas; no running
number anywhere on the tablet), and the reveal card with no NEXT button (the next player just
taps START). Shot tally chips along the top; a completed chip is tappable and opens the band
picker (the override), showing the measured time struck through once a band has been ruled.
`Skip shot` and `Redo` live in the chip strip, not in the main control. The stopwatch is
`createShotStopwatch(now)` in its own folder with `performance.now` bound at the call site;
on mount into `status: "running"` with no local start, dispatch `redoShot` once.

**Display (`DisplaySearSurface`).** `resolveSweepFrame(elapsedSinceArrivalMs, visibleMs)`
is pure and drives a `requestAnimationFrame` loop that starts when a `running` snapshot
arrives. Waiting: target at hero scale, tally strip. Running-visible: count-up in `primary`,
timer typography. Running-hidden: `?` in place of the number, target stays, slow `heat` pulse
behind the grill (off under `prefers-reduced-motion`). Revealed: actual time, signed error,
band label — `gold` for PERFECT only, `heat` for BURNT. Done: strip + turn total. No audio.
Fluid `clamp()` sizing, no scroll, `100dvh` (`DESIGN.md` §2.2).

Copy in `copy.ts` per folder (`AGENTS.md` §15). Styles in `styles.ts`, theme tokens only.

### 0.8 E2E (`tests/e2e/sear-sandbox.spec.ts`)

`page.clock.install()` before `page.goto("/dev/minigame/sear")`. The default target
sequence starts at 5 s. First shot: tap START, `runFor(5_000)`, tap STOP, assert the reveal
shows `5.00`, PERFECT, pending score 3. Second shot (target 7 s): `runFor(7_600)` → assert
BURNT (error 600 > 450). Then reload mid-shot and assert the slot
reopened. The sandbox's reducer runs in the real server process on real time, so assert on
**band**, never on the server's elapsed number — the plausibility gap there is the wall time
between two Playwright actions, well inside the 400 ms slack. If it ever flakes, the fix is a
wider `latencySlackMs` in the dev manifest, not a sleep.

### 0.9 Acceptance

- `pnpm typecheck` green proves every `Record<MinigameType, …>` registration exists.
- Server accepts SEAR actions only in `MINIGAME_PLAY` for the active team (the shell already
  enforces this; the reducer refuses out-of-status actions on top).
- A team of 3 and a team of 6 each get exactly `shotsPerTurn` shots at the same targets.
- No surface ever renders a running number after `visibleSeconds`.
- A network-delayed `stopShot` scores the server's observation and lights "Needs Review";
  the host can re-band it from the chip.
- Reload mid-shot reopens the slot; reload between shots rehydrates results and cursor.
- `content/sample/gameConfig.json` boots with `searSeconds` present and SEAR unscheduled.
- Both gates green; the e2e run used the pinned 3100/5273 ports.

---

## Research

Everything below is the 2026-09-16 research pass this plan came out of, kept intact. Section
numbers §1–§9 are the nine questions that pass was asked to resolve.

## Pitch

The TV says **STOP AT 7.00**. A player slaps START on the tablet. A huge clock runs on the TV — 0.5, 1.0, 1.5 — and at 3.0 the grill lid slams down and the number is gone. Silence. Then not silence, because four teammates and twelve spectators are all counting out loud at different speeds, several of them on purpose. The player taps STOP. The lid lifts: **7.31 — OVER by 0.31 — CLOSE**. Next teammate.

This is the "stop the clock at exactly ten seconds" game — a Mario Party 7 minigame (*Clock Watchers*), a Wii Party minigame (*Stop Watchers*), a wall-mounted arcade unit for events, and a TikTok challenge with tens of millions of views. It works in a group because the audience knows the truth before the player does: they can see the count, the player can't, and the gap between those two is where the noise comes from.

Why it earns a slot, and why it is *this* twitch verb and not a faster one:

- **It is the pacing tool the night is missing.** Every current concept is think-then-commit and runs three to five minutes a turn. A SEAR turn is four shots at under a minute, with a hard beat every ten seconds. WarioWare built a franchise on the observation that a four-second challenge followed by a three-second buffer feels like "breakneck speed" ([Microgame, Super Mario Wiki](https://www.mariowiki.com/Microgame)). This is that, at party tempo.
- **It is precision, not reaction speed, on purpose.** A quick-draw tap measures simple reaction time, and simple reaction time is mostly a sobriety test (numbers in §5 below). Counting seven seconds in your head is a skill a 55-year-old on their second beer has as much of as a 24-year-old on water. The winner is whoever keeps their nerve while the room screams a wrong count at them.
- **It is the only twitch verb where latency doesn't matter.** The measured interval is START-tap to STOP-tap *on the same device*. No network hop, no TV refresh, no HDMI processing delay sits inside the measurement. Every other candidate (stop the moving needle, tap on the flash, tap to the beat) puts a screen or a speaker inside the timing loop and immediately inherits a calibration problem this repo has no machinery for.
- **Nothing is secret.** The clock is hidden from *everyone* — the host tablet shows no running number either. There is no answer field to keep out of the display view, which makes the answer-safety guardrail (`AGENTS.md` §3.1) trivially satisfied.
- **Spice makes it funnier, not unfair.** Adrenaline and capsaicin push everyone's internal clock the same direction (fast), so a scorched team still competes on equal terms with itself. See §8.

## Rough rules

- Tablet is the stopwatch, TV is the scoreboard. The active team passes the tablet between shots; the runtime never learns *who* is holding it. Drawing and Emoji Charades already run holder-agnostic (they just don't rotate inside a turn), so this is the same runtime contract with a handoff added on top.
- **Relay.** Every team takes the same fixed number of shots per turn — `shotsPerTurn`, default 4 — and the same target sequence, so teams of 3 and teams of 6 score on identical terms. Who takes each shot is the team's business (a 3-player team sends someone twice; a 6-player team rests two). See §2 for why relay beats nominating one player.
- Per shot:
  1. TV and tablet show **STOP AT 7.00**. Player taps **START** on the tablet.
  2. The clock runs visibly on both surfaces for `visibleSeconds` (default 3, the *Clock Watchers* number). Then the lid closes: the TV shows the target and a darkened grill; the tablet shows only a giant **STOP** button.
  3. Player taps STOP. Tablet reports the elapsed time it measured. Server scores it and the TV reveals: actual time, signed error, band label.
  4. Next player taps START when ready — no host action between shots. Host-driven never-auto-advance (`SPEC.md` §1) governs *phases*; shots inside a turn are player-paced.
- **Scoring** by absolute error in bands, mirroring GEO's `scoreBandsKm` shape as `scoreBandsMs`. Proposed defaults: ≤ 80 ms → 3 (**PERFECT**), ≤ 200 ms → 2 (**CLOSE**), ≤ 450 ms → 1 (**NEAR**), else 0 (**BURNT**). Four shots cap a turn at 12, under `defaultMax` 15 by construction. Pending points applied at the phase boundary like every other minigame.
- Targets come from rules (`targetsSeconds`, default `[5, 7, 4, 8]`), cycled by shot index. Every team sees the same sequence in the same order — fairness over novelty. The host varies it per night in `gameConfig.json`.
- After the last shot the runtime is `done`; the host ends the turn with the normal CTA. The phase-wide `searSeconds` timer (default 75) is a budget, not a trigger — if it runs out the host advances as they would for any other game.

### 1. The twitch verb — four candidates, one pick

| Verb | Precedent | What it measures | Where the timing loop runs | Verdict |
|---|---|---|---|---|
| Tap on cue (quick-draw) | Human Benchmark, Western duel games, *Shy Guy Says* fake-outs | Simple reaction time | Cue on a screen → eye → thumb → tablet. The TV's own frame lag sits inside it. | Fails §5 (sobriety test) and §3 (which screen showed the cue, and when?). Fake-outs are the fun part and they don't survive that. |
| Stop a moving needle | Mario Golf power meter, every QTE | Coincidence-anticipation timing (predicting when a moving thing crosses a line) | Needle animation → eye → thumb. Fine if the needle is *on the tablet*; broken if the player looks at the TV, which lags the tablet by an unknown 50–150 ms. | Better than quick-draw on fairness, still latency-bound. The natural fallback if SEAR tests flat (see open questions). |
| Hold-and-release (charge meter) | Mario Golf, fishing minigames | Same as the needle with a held thumb | Same as the needle, plus a thumb held on a saucy screen | Strictly worse than the needle here. |
| Rhythm sequence (tap the beat) | *Rhythm Heaven*, *Simon* | Audio-motor sync | Speaker → ear → thumb. The TV is the speaker (settled by Song Guess) and HDMI audio is typically 50–100 ms behind the tablet with no way to know by how much. | Rhythm games need a calibration screen and still struggle ([Rhythm Quest devlog 10](https://rhythmquestgame.com/devlog/10.html)). Kill. |
| Whack-a-mole (tap targets) | Mario Party generally | Throughput | Target appears on tablet → thumb. Latency-tolerant because targets linger. | Latency-fine but the TV has nothing to show except a mirror of taps; low spectator value, and throughput is the raw-speed stat we're trying to avoid. |
| **Blind clock (stop at N)** | *Clock Watchers* (MP7), *Stop Watchers* (Wii Party), TikTok #stopthetimer, arcade "10 Second Challenge" | Interval timing under social pressure | START-tap → STOP-tap, both on the tablet. **Nothing else is inside the interval.** | **Pick.** The only verb that is simultaneously fair across age and drink, latency-immune by construction, and better to watch than to play. |

### 2. Nominated player or relay — relay

Relay, hard-capped at `shotsPerTurn`, same count for every team.

- **Nominating one player recreates the fairness problem at team level.** The team sends its steadiest counter every time, and the game becomes "which team has the best metronome." Four shots from four people averages that out.
- **Relay is what the format already is.** *Clock Watchers* is one-at-a-time with the rest watching; Mario Party made it a group minigame *because* the audience half is the good half.
- **The cost is small.** Per shot: ~1 s to tap START, ≤ 8 s of count, ~2 s reveal, ~3 s handoff — call it 12–14 s. Four shots is 50–60 s. That is still comfortably the shortest turn of the night, and it is a full minute in which something happens every ten seconds.
- **Same shot count, not "everyone goes once."** Teams are 3–6 players (`SPEC.md` §2); per-player shots would give the biggest team the most points. Fixed count per team is the fairness invariant; the runtime tracks a shot index, never a player.

### 3. Server authority vs a tap only the client can time

**The fact that makes this tractable:** the score is a function of one number, `elapsedMs`, and both endpoints of that interval are taps on the same tablet. The tablet measures it with `performance.now()` — monotonic, sub-millisecond, unaffected by NTP adjustments. The tablet's own touch-to-JS input latency is inside the interval twice, once at each tap, so it cancels. No network round-trip is in the measurement at all.

So the split is:

- **Client measures, server rules.** The tablet reports `stopShot { elapsedMs }`. The server owns whether a shot is running, which target it is, what band the error falls in, what points that earns, and whether the report is plausible. The client never computes a band and never touches points — same shape as `AGENTS.md` §6 ("no recalculating scores client-side"), and the same trust posture as Drawing, whose stroke points already carry client-measured `t` offsets that the server stores as data.
- **The server referees with its own clock, but it is not the stopwatch.** On `startShot` the server records `startedAtServerMs`; on `stopShot` it computes `serverElapsedMs = receivedAtMs − startedAtServerMs`. The claim is accepted if `|elapsedMs − serverElapsedMs| ≤ latencySlackMs` (default 400 — home Wi-Fi jitter is usually under 30 ms with occasional spikes well beyond it, so the slack is generous by an order of magnitude). Outside the slack the shot is still recorded, scored on `serverElapsedMs`, and flagged `disputed`; the host's override trigger lights up "Needs Review" (the copy key already exists) and the host can re-band it (§9). A shot never scores zero because of a network hiccup — it scores the server's observation and asks a human.
- **What `endsAt` already gives us, and what has to be new.** The existing pattern is `createRunningTimer(phase, seconds)` in `apps/server/src/roomState/selectors`, set on phase entry by `setTimerForPhase` in `apps/server/src/roomState/phaseState`, stored as `RoomTimerState { startedAt, endsAt, durationMs, isPaused, remainingMs }`, and rendered client-side by `resolveRemainingTimerSeconds` against the client's `Date.now()` on a 250 ms interval. There is no server-side tick — nothing fires at `endsAt`; the host advances. That pattern covers the **phase budget** (`searSeconds`) unchanged. It does not cover per-shot timing, and one thing is missing for that:
  - `MinigameRuntimeReductionInput` carries `{ state, envelope, pointsMax, rules, content }` and **no clock**. Drawing's reducer calls `Date.now()` directly for its reveal expiry, and its test only asserts the *difference* between two stamps to dodge the wall clock. SEAR should not repeat that. **New:** an optional `receivedAtMs` on `MinigameRuntimeActionEnvelope`, stamped by `dispatchMinigameAction` in `apps/server/src/roomState/scoringMutations` from an injectable `now` seam. One additive field; existing plugins ignore it; SEAR's reducer stays pure and every timestamp in its tests is a literal.
  - The display does **not** sync clocks to render the visible sweep. It starts its local animation from the moment the snapshot with `status: "running"` arrives (one-way latency, tens of ms) rather than from `startedAtServerMs` compared to its own `Date.now()` (unknown cross-machine offset, potentially seconds). The visible three seconds are orientation for the room; the reveal carries the truth. This sidesteps needing an NTP-style offset protocol ([timesync](https://www.npmjs.com/package/timesync) is what that would look like) that nothing else in the repo wants.
- **How cheat-resistant does it need to be.** The only input device is the host's own tablet, held by a guest, with the host standing beside them. The adversary who forges `elapsedMs` has to open devtools on the host's tablet mid-wing in front of the room. The plausibility check exists to catch *bugs and hiccups* — a stalled socket delivering `stopShot` three seconds late — not that person. Anything beyond "flag it, score the server's number, let the host rule" is engineering against nobody. Kahoot, which scores millions of speed-based answers, doesn't compensate latency either; it offers an Accuracy mode instead ([How points work](https://support.kahoot.com/hc/en-us/articles/115002303908-How-points-work)). Same conclusion: change what you measure, don't fight the clock.
- **Reconnect mid-shot.** The tablet's local stopwatch is gone after a reload. The host surface, on mounting into a `running` shot it has no local start for, dispatches `redoShot` — the slot reopens, nobody loses a shot to a Wi-Fi blip. Snapshot rehydration otherwise restores results, cursor and target for free.

### 4. Testability, designed first

`AGENTS.md` §9 says avoid flaky timing tests and mock timers where possible. The mechanic was chosen so that "where possible" is "everywhere":

- **Reducer: pure over literal timestamps.** `startShot` at `receivedAtMs: 1_000`; `stopShot { elapsedMs: 7_004 }` at `receivedAtMs: 8_010` → error 4 ms → PERFECT → 3 points. Same stop at `receivedAtMs: 9_500` → server sees 8_500, gap 1_496 > slack → `disputed`, scored on 8_500 → NEAR → 1 point. Bands, targets cycling, cap at `pointsMax`, redo/skip/override, refusal of `stopShot` with no running shot, refusal of a non-finite or negative `elapsedMs` — all `didMutate: false` or exact-state assertions with no clock anywhere. Colocated `src/runtime/index.test.ts`, `tsx --test`, deterministic.
- **Client stopwatch: one tiny unit with an injected clock.** `createShotStopwatch(now: () => number)` exposing `start()` / `stop(): number`. Tested with a fake `now` that returns scripted values. The `performance.now` binding is the one line not under test, which is the right line to leave.
- **Display sweep: a pure frame function.** `resolveSweepFrame(elapsedMs, rules) → { visibleTime | null, lidClosed }` tested with numbers; the `requestAnimationFrame` loop that feeds it is thin and not asserted.
- **E2E: the dev sandbox under Playwright's fake clock.** `/dev/minigame/sear` boots the real reducer with the dev manifest, as every game's sandbox does. Playwright 1.58 (already pinned) ships `page.clock`, which overrides `Date`, timers, `requestAnimationFrame` and `performance` ([Playwright clock docs](https://playwright.dev/docs/clock)): `install()`, tap START, `runFor(7_000)`, tap STOP, assert the reveal reads 7.00 and PERFECT. The sandbox's server-side reducer sees the real `Date.now()`, so the plausibility gap in that test is real wall time between two Playwright actions — a few ms, well inside the slack — and the assertion is on the *band*, not the exact server number. Follows the Song Guess convention: sandbox spec, no round scheduling change.
- **The rule that shaped the mechanic:** if scoring had depended on *when the cue was shown* (needle, quick-draw, rhythm), the test would have had to fake a cue time on two devices and a network in between. It depends on one integer the reducer receives. That's why.

### 5. Fairness — precision, not speed, and the numbers

Take the position: **this game must not reward reaction speed.**

- **Age matters less than folk wisdom says.** Woods et al. 2015 measured simple reaction time in 1,469 adults: mean ~231 ms, rising ~0.5 ms per year of age, with the increase almost entirely slowed motor output rather than perception ([Factors influencing the latency of simple reaction time](https://pmc.ncbi.nlm.nih.gov/articles/PMC4374455/)). A 30-year age gap is ~15 ms. Real, but small.
- **Alcohol is the real variable, and this is a wing-and-beer party.** Reaction time slows ~15–25 % at 0.05 % BAC and by ~120 ms at 0.08 % ([Michigan Medicine](https://www.michiganmedicine.org/health-lab/how-alcohol-impairs-your-ability-drive)); a lab study found reflex response times of 156 ms sober vs 180 ms after drinking, significant from 0.035 % BAC ([PMC2955582](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2955582/)). Against a ~270 ms median ([Human Benchmark statistics](https://humanbenchmark.com/tests/reactiontime/statistics)), a 120 ms penalty is not a handicap, it's a different sport. "The youngest sober person wins" is really "the soberest person wins," and by round three that's nobody the game should be crowning.
- **Interval timing degrades gently, and in the same direction for everyone.** Ogden et al. 2011 found a high alcohol dose speeds the internal clock, producing *over*-estimation of elapsed time on prospective timing tasks ([PubMed 21802649](https://pubmed.ncbi.nlm.nih.gov/21802649/)); a 2021 systematic review found the literature split three studies to three on the direction of the effect ([Time perception and alcohol use](https://www.sciencedirect.com/science/article/abs/pii/S0149763421001901)). Two things follow. First, the effect is a bias of a few percent, not a 40 % slowdown. Second, over a 4–8 s count almost everyone falls back on *counting*, which is a strategy, not a reflex — and strategies survive beer better than reflexes do. A drunk counter stops early. A drunk counter who knows they stop early adds a beat. That's a game.
- **Band widths are the fairness dial.** 80 ms for PERFECT is deliberately tighter than anyone hits reliably (the viral pizza challenge required 10.00 exactly and almost nobody did), so PERFECT is a moment, not a strategy. CLOSE at 200 ms is what a calm counter gets; NEAR at 450 ms is what a heckled one gets. These are rules config, tuned at a table, not in code.

### 6. Pacing and budget

- **Turn duration target: 60 s** for `shotsPerTurn: 4`; `searSeconds: 75` as the phase budget with slack for handoffs. Compare: Trivia 30 s, Geo 45 s, Drawing 60 s on the clock, and the sketched games at three to five minutes.
- **Scheduling.** `gameConfig.json` rounds carry exactly one `minigame` each, and every round has an EATING phase, so a SEAR round is a real round with a sauce — the "palate cleanser" is the round *between* two heavy ones, not an interlude without wings. Suggested placement in a five-round night: round 3, after Drawing or Contraption and before the finale. `timers.searSeconds` and `minigameRules.sear` are the only config surface, derived from the definition's `timerKey` / `rulesKey` as the authoring guide describes. Sample config should **not** schedule it by default, per the Song Guess precedent — the demo night stays as it is.
- **Points must not match a five-minute game, and today the engine can't say so for us.** `resolveMinigamePointsMax` in `apps/server/src/roomState/selectors` knows only round position (`defaultMax` 15, `finalRoundMax` 20) — there is no per-minigame cap. Two ways to normalize:
  1. **By construction (recommended for MVP):** `shotsPerTurn × top band = 12`, so the cap is never reached and a realistic team scores 5–8 — about half a good Geo or Contraption turn, for a fifth of the time. The rules guard should reject a `scoreBandsMs` / `shotsPerTurn` pair whose ceiling exceeds `defaultMax`, so a host can't accidentally configure a 60-second game worth 20.
  2. **A per-round `pointsMax` override in `GameConfigRound`** — general, but a config-contract change that touches every round's validation, and nothing else needs it yet. Note it, don't build it for this.
- **Eating points dwarf both anyway.** `pointsPerPlayer` 2–4 across a 4-player team is 8–16 per round, so a 5-point minigame haul is a nudge, not a swing. That's the correct weight for a palate cleanser.

### 7. What the TV shows

The TV's job is to make the room complicit. Spectators can see what the player can't, and the design leans on that the whole way through.

- **Waiting:** target in huge tabular numerals — **STOP AT 7.00** — with the shot tally strip beneath it (four slots, filled as they go: `PERFECT · 7.31 CLOSE · — · —`). Active team name per `DESIGN.md` §2.3.
- **Running, visible (0–3 s):** the clock counts up in `primary` orange at timer scale (`text-7xl`+, tabular numerals, the EATING timer's typography). The grill lid on screen is open. The room's eyes lock on.
- **Running, hidden (3 s → stop):** the lid drops. The number is replaced by a static `?` mark; the target stays up; a slow `heat` pulse breathes behind the grill. This is the beat the crowd fills with noise. No number leaks anywhere — including the host tablet.
- **Reveal:** smash cut. Actual time at hero scale, signed error under it (**OVER +0.31**), band label. PERFECT is the one case allowed `gold` — it's a celebration moment by any reading of `DESIGN.md` §0.1. BURNT gets `heat`. The tally strip slot fills. Hold ~2 s, then back to Waiting for the next shot.
- **Done:** the four-slot strip and the turn total, held until the host advances.
- Motion budget: the count-up and the reveal are user-initiated discrete events, allowed under `DESIGN.md` §8. The hidden-phase pulse is ambient, so it disables under `prefers-reduced-motion`, same as the Anamorph idle tumble.
- No audio. Silence during the hidden phase is the point; the room provides the soundtrack. (A single lid-clunk at 3 s is tempting and is the first thing a feel pass would try — it would also opt the display into the audio-unlock overlay, so it isn't free.)

### 8. What spice does to it

- **Concentration, not motor control.** The button is the whole tablet. Shaking hands and sauce-slick fingers change nothing; what degrades is the ability to hold a steady count while your mouth is on fire. That's a comedic degradation and it hits the whole team the same way in the same round — it doesn't create a between-player skill gap the way flinching would for a quick-draw tap.
- **Same-direction bias.** Adrenaline runs the internal clock fast, as does alcohol (§5). A scorched, tipsy counter stops *early*. Everyone in the room can see it, and the correction ("add a Mississippi, you're rushing") becomes part of the between-shot coaching. It's a bias the team can learn inside one turn.
- **Watering eyes** can't read the target — which is why the target is on the TV at hero size and the host reads it out. A player who can't see the tablet can still find a button that is the whole screen.
- **Worst case:** a player who can't count at all because they're in genuine distress. That's what `skipShot` is for, and it costs the team one slot rather than the turn.

### 9. Escape hatches, and what "override a reaction time" means

- **Skip.** Two grains. The shell's existing skip-turn override ends the whole turn. The runtime's `skipShot` voids the current slot (scores 0, advances the cursor) for a player who can't take it — the slot is consumed so shot counts stay equal across teams.
- **Redo.** `redoShot` voids the most recent *completed* shot's result and points and reopens that slot. Used for a mis-tap, a phone ringing, a disputed flag the host wants re-run, and automatically by the host surface after a mid-shot reconnect. Refused when no shot has completed.
- **Manual score override — the host rules on the outcome, not the evidence.** The host is never asked to type milliseconds; the measured number is a fact the room saw. Instead the runtime exposes `overrideShotBand { shotIndex, band }`: the host taps a completed shot's chip and picks PERFECT / CLOSE / NEAR / BURNT. Points are re-derived through the same band table, so the turn total is always consistent with rules, and the chip shows the original measurement struck through beside the ruled band. This is the intended resolution for a `disputed` shot. For anything the band table can't express — a ruling that the whole turn is void, a make-good for a broken tablet — the shell's existing integer score delta in the Overrides dock (`adjustTeamScore`) and `setPendingMinigamePoints` are untouched and still apply. Never remove escape hatches (`AGENTS.md` §11); this adds one and changes none.

### State shape

Small and fully `SerializableValue`:

```
{
  activeTurnTeamId,
  shotIndex,
  currentShot: null | { targetMs, startedAtServerMs },
  results: [{ targetMs, elapsedMs, serverElapsedMs, disputed, band, points, overriddenBand: null | band }],
  pendingPointsByTeamId
}
```

Host and display views are the same data minus nothing — there is no privileged field. The display view omits `serverElapsedMs` and `disputed` only because the room doesn't need them; the host view carries them so the override chip can explain itself.

Actions: `startShot`, `stopShot { elapsedMs }`, `redoShot`, `skipShot`, `overrideShotBand { shotIndex, band }`. All bare names, all refused with `didMutate: false` outside their status.

Rules (`minigameRules.sear`, validated by `isRules` at config load): `shotsPerTurn`, `targetsSeconds[]`, `visibleSeconds`, `scoreBandsMs[]`, `latencySlackMs`. Guards: every target ≥ `visibleSeconds + 1`; band ceiling × `shotsPerTurn` ≤ `defaultMax`.

No content file. This is the first game in the roster with nothing to author, which is part of why it's cheap.

## Open questions

> Closed by §0.3 at planning time; kept for the reasoning behind each call.

- **Is a blind count "high-energy" enough, or does the room want the needle?** The energy is supposed to come from the crowd counting over the player. If a quiet group just watches politely, the game is 60 seconds of nothing. The fallback is the visible-needle variant from the §1 table, rendered on the tablet only (never the TV) so its latency story holds. Cheapest way to find out: play four shots at a kitchen table with the dev sandbox. Not a lab question — the sandbox boots the real reducer and the numbers are rules config.
- **Band widths and target lengths.** 80 / 200 / 450 ms and targets in the 4–8 s range are educated guesses. Longer targets are harder and funnier; shorter ones make PERFECT reachable. Rules config, tune at the table.
- **Visible seconds: 3, 2, or 0?** *Clock Watchers* shows 3 s as a tempo reference. A fully blind count (0 s) from a self-started tap is the TikTok version. Both are one rules value. Leaning 3 — the visible sweep is the TV's best moment.
- **Same targets for every team, or seeded per team?** Same sequence is fairer and testable with literals; it also means team four has watched twelve shots at those exact targets. Leaning same — watching doesn't help you count, and the crowd-coaching it enables is the point.
- **Should `receivedAtMs` on the envelope be SEAR's, or the engine's?** It's a one-line additive change to `packages/minigames/core` that every future timing-aware game would want, and it retires Drawing's in-reducer `Date.now()` if anyone cares to. Recommend landing it as engine plumbing in the same change, with a test that existing plugins receive and ignore it.
- **A lid-clunk sound at 3 s.** Would land, but opts the display into `requiresDisplayAudio` and the unlock overlay. Defer until the silent version has been played.

**No `/dev/lab/` recommended.** The open questions are rules numbers and a kitchen-table feel check, and `/dev/minigame/sear` — the standard sandbox — already boots the real reducer against them. A lab is warranted when the question is about something a spec can't pin (Anamorph's jitter constant, Contraption's readability); here the spec can pin all of it and the only thing left is to play it.

## References / inspiration

- *Clock Watchers* (Mario Party 7): the exact format — target time, 3 s visible then hidden, 20 s hard stop, one player at a time with the rest watching. [Super Mario Wiki](https://www.mariowiki.com/Clock_Watchers)
- *Stop Watchers* (Wii Party): the simultaneous variant. [Wii Sports Wiki](https://wiisports.fandom.com/wiki/Stop_Watchers)
- The stop-the-timer challenge as spectator content — online versions and the arcade cabinet built for event queues: [stopthetimer.com](https://stopthetimer.com/), [Stopwatch Challenge](https://play.gameonfamily.com/timer-game/), [10 Second Challenge (arcade unit)](https://madeforarcade.com/product/time-challenge-10-second-timing-game-customized-to-specs/)
- Why a four-second challenge feels fast in sequence: [Microgame — Super Mario Wiki](https://www.mariowiki.com/Microgame)
- Fake-outs as the watchable part of a reaction game (and why they don't survive a laggy cue): [*Shy Guy Says*](https://www.mariowiki.com/Shy_Guy_Says)
- Simple reaction time by age, ~0.5 ms/year, motor-output driven: Woods, Wyma, Yund, Herron & Reed 2015, [Frontiers in Human Neuroscience / PMC4374455](https://pmc.ncbi.nlm.nih.gov/articles/PMC4374455/)
- Population reaction-time distribution (median ~273 ms, right-skewed by device lag): [Human Benchmark statistics](https://humanbenchmark.com/tests/reactiontime/statistics)
- Alcohol and reaction time: [Michigan Medicine](https://www.michiganmedicine.org/health-lab/how-alcohol-impairs-your-ability-drive); [Even low alcohol concentrations affect obstacle avoidance reactions (PMC2955582)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2955582/)
- Alcohol and interval timing: Ogden, Wearden, Gallagher & Montgomery 2011, *Acta Psychologica* — [PubMed 21802649](https://pubmed.ncbi.nlm.nih.gov/21802649/); [Time perception and alcohol use: a systematic review (2021)](https://www.sciencedirect.com/science/article/abs/pii/S0149763421001901)
- The 100 ms plausibility floor for a human reaction, and the research suggesting 80–85 ms: [World Athletics sprint start research](https://worldathletics.org/news/news/iaaf-sprint-start-research-project-is-the-100). Not used for scoring here — cited as the reference point for what "implausibly fast" means if a quick-draw variant is ever tried.
- Why audio/visual cue timing needs calibration and still fails: [Rhythm Quest devlog 10 — Latency Calibration](https://rhythmquestgame.com/devlog/10.html)
- Speed-scored answers without latency compensation, and an accuracy mode as the fix: [Kahoot — How points work](https://support.kahoot.com/hc/en-us/articles/115002303908-How-points-work)
- Clock-offset sync over a socket, the approach this design avoids needing: [timesync](https://www.npmjs.com/package/timesync)
- Fake clocks for the e2e layer: [Playwright — Clock](https://playwright.dev/docs/clock)
- In-repo precedents: phase-wide `endsAt` timers (`apps/server/src/roomState/selectors`, `phaseState`, `apps/client/src/utils/resolveRemainingTimerSeconds`); client-timed data accepted as data ([drawing-spec.md](../drawing-spec.md), stroke `t` offsets); proximity bands ([geo-spec.md](../geo-spec.md), `scoreBandsKm`); sandbox-only e2e and unscheduled sample config ([song-guess-spec.md](../song-guess-spec.md) §0); holder-agnostic runtimes ([emoji-charades-spec.md](../emoji-charades-spec.md) — one picker per turn, identity untracked).
