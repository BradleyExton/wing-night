# Wing Night — Backlog

Open work, distilled from the `.work/` ticket log before that system was removed (2026-09-14).
Ordering within each section is rough priority. `SPEC.md` is scope, `DESIGN.md` is the visual
system, `AGENTS.md` is the engineering standards — this file is only "what's left to build".

Verification for anything here: `pnpm lint` → `pnpm typecheck` → `pnpm test`. Playwright is
**excluded** from `pnpm test`; run it explicitly for any change under `apps/client/src/**`,
`packages/minigames/**/*.tsx`, or `tests/e2e/**`:

```bash
CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e
```

`CI=1` and the pinned ports matter: 3000/5173 are routinely held on this machine, and reusing a
foreign dev server verifies someone else's code and reports it green.

---

## Audio / music

### Anthem playlist rotation per round
Teams with multi-song playlists hear a different anthem each round; the MINIGAME_INTRO screen shows
the team's genre identity alongside the team spotlight.

- Pure selector `resolveAnthemForRound` picking `anthems[(round - 1) % anthems.length]` —
  deterministic rotation, not random. The display-safe field is `currentRound`
  (`packages/shared/src/roomState/index.ts`), and today's pick is a hard-coded `anthems?.[0]` at
  `apps/client/src/components/.../useTeamAnthemCue/index.ts`.
- Genre label renders in `DisplayBoard/StageSurface/MinigameIntroStageBody`, identical to today when
  absent. Check `apps/client/public/mockups/minigame-intro/` (01-team-spotlight) before styling.
- **Known gap that sank this once:** `content/sample/teams.json` ships exactly one anthem per team
  and there's no `content/sample/teams/audio` dir — so rotation is unobservable end to end. Either
  extend the sample pack to 2–4 songs per team, or put sample content explicitly out of scope.
- Decided at planning: small playlist per genre (2–4 songs); rotation keyed off round number so a
  display refresh picks the same track. Out of scope: per-phase ambient beds, genre on
  standings/results, host controls.

### Lobby playlist during SETUP
Music while people trickle in, fading out when the game starts.

- Server enumerates `content/local/audio/lobby/*.mp3` at boot, sorted by filename, serves them
  statically and exposes the list in the display-safe snapshot. Empty/missing dir → empty list, no
  error.
- Convention over configuration: the playlist is whatever MP3s are in the directory; `01-`, `02-`
  filename prefixes are the ordering mechanism. No new content JSON to author or validate.
- Sequential + loop, not shuffle (determinism). SETUP only — INTRO onward belongs to the game's own
  moments.
- Reuses the existing tap-to-enable unlock gate and audio element. Do not add a second `<audio>`
  lifecycle; lobby playback must never overlap the anthem cue.
- Out of scope: shuffle, host skip/next, volume UI, music during EATING/results.

---

## Minigames

Both of these are `MinigameRuntimePlugin` packages registered on server and client like
trivia/geo/drawing. Read `docs/minigame-authoring-guide.md` first — adding a `MinigameType` breaks
every `Record<MinigameType, …>` in the repo until fully wired, so there's no throwaway half-state.

### ANAMORPH — rotate a 3D point cloud until it snaps into a silhouette
TV renders a seeded point cloud that resolves into a recognizable shape from exactly one viewing
angle; the active team hunts that angle with two dials on the tablet.

- Runtime state stays tiny and seed-derived (`{ promptId, seed, currentYaw, currentPitch,
  lockedAngle }`) — no geometry crosses the wire, so a mid-turn display refresh rehydrates the
  identical frame.
- The hidden true angle must not appear in `minigameDisplayView` **or** `minigameHostView` before
  lock-in. Stricter than drawing's answer-safety, because here the active team holds the tablet.
- Proximity scoring by angular error in configurable bands, mirroring geo's `scoreBandsKm` shape.
- Content via the standard local-overrides-sample pipeline; sample ships inline SVG path strings,
  no binary assets.
- `prefers-reduced-motion` disables the idle tumble; dial-driven rotation stays (user-initiated).
- **Still unanswered** (this is what `AnamorphLab` at `/dev/lab/anamorph` exists to settle): the
  ray-jitter magnitude and the shape of the legibility curve as angular error → 0 (linear ramp vs
  late hard snap); whether the antipodal mirror image is an acceptable second solution; two dials vs
  drag-to-orbit on a sauce-covered tablet; whether the tablet needs its own preview of the cloud.

### CONTRAPTION — build a physics contraption on the tablet, watch the run on the TV
Active team lays out physics pieces on a coarse grid, commits, and the TV replays a
server-simulated run of a wing falling through what they built.

- **Architecture settled:** the server simulates in the reducer and emits a keyframe track; the
  display replays it and never predicts (mirrors drawing's stroke replay). Track weight was measured
  and is a non-issue — 8,610 B @30fps / 5,770 B @20fps for a whole ~4s run, ~1,600 B at real piece
  counts. The both-sides-simulate alternative is struck; it would have bound us to the transcendental
  ban forever.
- Integrator is hand-rolled, deterministic, dependency-free; no `Math.sin`/`cos`/`pow` in the hot
  path. Determinism proven by test — a fixed layout produces a byte-identical run — not asserted.
- Every sample level ships a known-good solution in the content file, with a test asserting the sim
  still solves it. An unsolvable level is a genuinely bad party moment.
- Scoring: bucket landing plus en-route pickups, capped at `pointsMax`, applied at the phase
  boundary. Host escape hatches: re-run the replay, skip a stuck turn.
- **Settled from the labs:** failure readability needs the `Trail` aid level — trail kinks imply the
  contacts and the arc over the bucket reads plainly; bare fails (after settle it's just a wing on
  the floor and half the room is eating).
- **Still unanswered:** piece set and count; one shot vs best-of-N (leaning two attempts, best score
  counts); sim length (~4s target watchable window). These couldn't be driven before because the
  integrator couldn't slide — that's since fixed, but the lab's presets still need re-finding against
  the fixed physics (below).
- Open scope questions: whether the room sees the plan before GO (invites backseat engineering from
  other teams — probably the best part, but it's a fairness call), and authored levels vs seeded
  procedural generation (leaning authored — tunable and solvable by construction).

#### Prerequisite lab work

**Re-cut the picked Sidestage variant** (`ContraptionUiLab`, `/dev/lab/contraption-ui?variant=sidestage`).
The picked direction is A · Sidestage, but with a structural revision the lab doesn't render: the
thrower **sits at a table** eating wings, **well above** the contraption field, facing **away**, and
throws the wing **backward over their shoulder** — so the contraption sits behind and below them.

- Reuse `scene/flightPath/` with new waypoints; do not fork the flight model. Tune waypoints if
  `apexLift` reads wrong for a throw starting high.
- Add a table and a seated back-turned thrower as primitives in `scene/`, used **only** by variant A.
  Don't add a `seated` flag to the shared `Thrower` and thread it everywhere.
- Variants B · Arena and C · Character-first stay byte-identical.
- Projectile is the **drumette** — settled by the pick, no angular velocity, no changes under
  `packages/shared/src/contraption/`. The flat wing bone stays in the toggle as the rejected option.
- Variant A's three axis strings in `variants/index.ts` describe the old geometry and are asserted in
  four places in `ContraptionUiLab/index.test.tsx`. Rewrite strings and assertions **in the same
  change** — assert on axis values, not labels (`/Throw/` is a substring of `Thrower` and pins
  nothing). Keep the two invariants the suite pins: all three variants distinct on all three axes,
  and exactly one `targetTreatment` starting with `"Foregrounded"`.
- The five beats must still play end to end, including the miss beat completing (bone on floor,
  cleaner walks on, picks it up, carries it off, floor empty). `scene/cleanerWalk/` is parameterised
  by `sceneWidth`/`restX` — re-aim it, don't reimplement.

**Re-find the piece-set presets** (`ContraptionLab/pieceSets/index.ts`) against the fixed physics and
the re-cut geometry.

- A set is kept only if the wing lands **and physically contacts every piece it was given**, checked
  at every one of the 240 integration steps, not at the 30 Hz display sampling. An uncontacted piece
  is scenery, and a set full of scenery makes the piece-count question unanswerable.
- **The sets must stop nesting.** They currently nest (`four = two + 2`, `six = four + 2`), which is
  why 2 and 4 pieces produced a byte-identical track and an identical settle — the added ramps were
  near-bucket deflectors. Re-find each set independently so piece count is a real variable. The
  nesting test is deliberately re-specified to the non-nesting contract, not deleted.
- At least one set must exploit **sliding** — only solvable because a body now travels along a ramp
  instead of deflecting off it. Without that, nothing demonstrates the friction fix changed anything
  a player would notice.
- The contact-guard assertion must still fail loudly when a ramp is shifted out of the flight path
  (a mutation probe moved min contact distance from ~2.60 to 15.97 and it went red). Do not relax it
  to fit new geometry.
- Rewrite the per-set `hint` copy to ask the re-framed question honestly.

Both labs and their `eslint.config.mjs` `ignores` entries are throwaway — delete them when the real
minigame packages ship. Neither lab may create a package under `packages/minigames/`, add a
`MINIGAME_DEFINITIONS` entry, or touch either registry.

---

## Platform / architecture

Kept deliberately unscoped — direction-setting work that wants a supervised session, not a
pick-it-up-and-go ticket.

> **A v2 platform grill exists and supersedes much of this.** It's a local, uncommitted note at
> `docs/grills/wing-night-v2-platform.md` (2026-09-07, paused mid-session) working out what a hosted,
> paid, multi-title Wing Night would take — including which parts of today's code survive the move
> (server-authoritative room state, the plugin contract, engine/content separation) and which don't
> (the closed `MINIGAME_DEFINITIONS` registry, plugins knowing Wing Night's scoring, two roles,
> `hostSecret`, in-memory-only state). The two items below are the narrower in-repo versions of that
> same question, so settle the platform direction before spending effort on either.

### Cross-title game shell contract (ADR)
Define the boundary between reusable party-game orchestration and Wing Night-specific gameplay.
Today the reusable engine still lives inside the app: contracts in `packages/minigames/core`,
registration via `MINIGAME_DEFINITIONS`, orchestration in `apps/server/src/minigames/runtime` +
`apps/server/src/roomState`.

Real cross-title consumers already exist as unmerged branches — the book-club game variants built
for the July 2026 book-club night. Ground the ADR in what actually varies across those rather than
in hypotheticals. Questions to answer: what varies per title (phases? scoring? copy/theming?
minigame roster?); package targets and dependency direction (does the phase machine move to
`packages/`, or do titles fork the app shell and share only `packages/minigames/*`?); compat and
versioning between shell and plugins (`minigameApiVersion` — is it enforced anywhere today?);
migration sequence and explicit non-goals.

### Extract the reusable orchestrator package
Execute whatever the ADR decides. Candidates to move: `apps/server/src/minigames/runtime` and the
generic parts of `apps/server/src/roomState` (phase machine, timer lifecycle, turn cursor). Stays
in-app: wing scoring, sauce/round config semantics, host/display copy. Largely re-homes
orchestration, not contracts. No behavior change — socket contract and room-state invariants
unchanged.

---

## Smaller / housekeeping

### Passcode admin auth for the config wizard
Gate `/admin` behind a server-side passcode: `ADMIN_PASSCODE` exchanged for an `adminSecret`,
replacing the wizard's current host-secret ride-along. Low priority until the app is ever hosted
publicly.

- `adminAuth` mirrors the `hostAuth` issue/validate pattern but keeps admin and host secrets in
  separate slots, so claiming one never invalidates the other. `ADMIN_PASSCODE` is read server-side
  only — never a `VITE_` var, or it ships in the client bundle.
- With `ADMIN_PASSCODE` unset the wizard stays open (LAN default, mirroring `HOST_CONTROL_TOKEN`).
- **This rewires the one surface with a dedicated Playwright spec.** `tests/e2e/admin-config-wizard.spec.ts`
  is built on exactly the host-secret ride-along this removes: `openWizard` waits on `config:read`,
  which only replies after the host claim issues a secret, and the spec sequences `/host` then
  `/admin` because the server keeps one host secret, last claim wins. Both premises die here — run
  the e2e suite or the regression lands silently green.
- Retire `copy/admin.ts`'s `hostAuthCoexistenceWarning`, which was scoped to live only until this
  lands.
- Decide in-ticket: add an ADMIN `SocketClientRole` (and update the type-level tripwire at
  `packages/shared/src/socketClientRole/index.test-d.ts`) or keep HOST-role sockets with
  admin-gated events and document why. Either is acceptable.
- Parked alongside: everything hosting-related (Dockerfile, static serving, socket-URL fallback,
  volume). A database remains a no-go.

### Reconnect/recovery snapshot contract
The role-scoped snapshot contract is shipped (`toRoleScopedSnapshotEnvelope` +
`toDisplayRoomStateSnapshot` in `packages/shared/src/roomState/index.ts`; per-role emission in
`apps/server/src/socketServer`). What's missing is the explicit decision for
`socket.recovered === false`: there is no reference to `recovered` anywhere, and
`connectionStateRecovery` is not enabled, so every reconnect is a fresh connection and
`registerRoomStateHandlers` emits unconditionally. The spec'd behavior holds **by construction** but
is undocumented and unpinned.

Likely shape: don't enable `connectionStateRecovery`; document "full role-scoped snapshot on every
(re)connection" as the contract (`AGENTS.md` already states it) and add a server test asserting a
fresh connection receives a role-scoped snapshot without a `REQUEST_STATE` round-trip.

### Docs alignment
Docs-only, no code.

- `README.md` has zero mentions of the authoring guide, plugins, or the registry, yet the plugin
  architecture is fully shipped with three real implementations (TRIVIA, GEO, DRAWING). Describe the
  registry/runtime in the architecture section and link `docs/minigame-authoring-guide.md` and
  `docs/minigames/README.md`.
- `AGENTS.md` carries the snapshot-privacy guardrails but not the generic minigame **action
  envelope** (`minigameId`/`actionType`/`actionPayload` validation) or the **full-screen takeover
  shell** rules (shell-level override overlay, PASS_AND_PLAY lock preservation). Both are shipped
  and ungoverned.
