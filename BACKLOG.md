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

### Now-playing UI and host music controls
A music player on the TV showing what is playing, and host control over it from the tablet.
Reverses this file's earlier "out of scope: host skip/next, volume UI" — decided with the user
2026-09-16, after the lobby playlist and anthem rotation shipped and the music became real.

**The crux, and it is not the UI.** Playback today is entirely CLIENT-LOCAL: the display derives
what plays from `phase` and `currentRound` (`useLobbyPlaylistCue`, `useTeamAnthemCue`), and the
server has no idea a track is playing. Host control inverts that — "pause" and "skip" are mutations,
so which track is playing and whether it is playing become server-authoritative room state, exactly
like `timer`. Settle this before any component gets drawn:
- New display-safe room-state fields (roughly `musicPlayback: { trackIndex, isPlaying, source }`),
  host-secret-gated `music:*` client→server events, and mutations in the usual
  `defineRoomMutation` shape. The display stops deciding and starts obeying.
- The cues become projections of that state rather than owners of it. `resolveAnthemForRound` stays
  pure and keeps its determinism test; the LOBBY cursor stops being display-local.
- **What a display refresh mid-track does.** Today it is deterministic by construction — same phase
  and round, same track, from the top. Once the host can skip, position is real state. Either the
  server tracks elapsed position the way `RoomTimerState` does (accurate resume, more machinery), or
  a refresh restarts the current track (cheap, and a refresh mid-party is rare). Decide in-ticket;
  do not leave it to fall out of the implementation.

**Track titles are a content question, not a label.** `01-hot-in-herre.mp3` is not display copy. The
lobby directory's whole point is convention over configuration, so deriving the title from the
filename (strip the `NN-` prefix, hyphens to spaces, title case) keeps that promise and ships no new
JSON. A sidecar metadata file would read better ("Hot in Herre — Nelly") at the cost of the thing
that made the directory nice. Pick one before building the strip, because the UI is shaped by it.

**Open scope questions:**
- Which controls: play/pause and next are the obvious pair. Previous, scrub, pick-a-track and
  volume each need a reason — and volume in particular competes with the TV's own remote, which is
  what people actually reach for.
- Whether host control covers the ANTHEM too, or only the lobby playlist. Pausing a team's entrance
  music mid-spotlight is a different product decision from pausing background music.
- Where it lives on the host tablet. The tablet is sauce-covered and thumb-driven (DESIGN.md), so
  this is a big-target surface, not a media-player chrome strip.

**Prerequisites and constraints:**
- No mockup exists for a now-playing strip. `apps/client/public/mockups/setup/` has the SETUP
  surface it would sit on; design it there first, per the repo's own convention.
- The display's one `<audio>` element now has two cue claimants that coexist only because their
  phases are disjoint. A host "play music during EATING" control breaks that, and lands on the same
  audio-director decision the announcer item is already blocked on — read that item first.
- Host-only information must stay out of the display snapshot as always; a track title is not
  privileged, so this is a straightforward display-safe addition.

### Announcer voice (pre-rendered)
A game-show announcer on the TV: it explains each minigame, calls the round and its sauce,
introduces the teams, calls the lead after results, and closes the night. The host works the room in
character (Price-is-Right framing, host plus helper), so the app is the ANNOUNCER, never the host.

**Decided with the user (2026-09-16):**
- **Pre-rendered MP3s, not live TTS.** Lines are written, rendered to audio ahead of time, and
  enumerated from `content/local/audio/announcer/` at boot — the lobby-playlist convention, and the
  same local-file pipeline as the anthems. No cloud call and no TTS engine in the party's critical
  path, and every line is auditionable before guests arrive.
- **Cue coverage:** how-to-play per minigame (MINIGAME_INTRO), round + sauce intro (ROUND_INTRO),
  team intros and a post-results standings call, and a winner/finale line.

**What pre-rendering can and cannot say.** Rosters and teams are AUTHORED content, known before the
party — so per-team and even per-player lines are perfectly renderable, which is what makes "Scorch
Squad takes the lead" a static file rather than a synthesis problem. Only live numbers are out:
scores, wing counts, "three players ate". Keep numbers on the screen and out of the voice, or the
first score that isn't 2 makes the announcer wrong.

**The blocking design question, and it is not the audio files.** The display owns exactly ONE
`<audio>` element — `data-team-anthem` in `DisplayBoard/index.tsx`, now driven by TWO cues:
`useTeamAnthemCue` (MINIGAME_INTRO) and `useLobbyPlaylistCue` (SETUP). (`useTimesUpChime` is not a
claimant: it is WebAudio, on the HOST, so it never touches the TV.) Those two coexist only because
their phases are disjoint and each stops only audio it started — a rule that does NOT extend to the
announcer, whose line and the team anthem fire at the SAME moment, both at MINIGAME_INTRO. Settle
this before writing a cue table:
- Sequence them (line, then anthem) on the single element — simplest, and it makes the anthem's start
  depend on a line's duration, which the client cannot know until the file loads.
- Two elements with the voice ducking the anthem — the better party moment, and the reason the
  single-element rule needs restating rather than copying: it exists to stop two music cues
  competing for the speaker, not to ban a voice channel over a music channel.
- An audio director owning every cue, with the cues as data. Most work, and the only option that
  stays sane now that the element already has two claimants.

**Non-negotiables:**
- A cue with no file is SILENT, never fatal and never a blocked phase transition. A party must not
  stall because one MP3 is missing, so this is a `playQuietly` best-effort path like every existing
  media call — not a content validator that fatals the boot.
- Cue → filename resolution is pure and deterministic, tested directly. No randomness anywhere: a
  display refresh mid-phase must replay the same line, not a different one.
- The announcer never speaks host-only information, same snapshot-privacy rule as everything else on
  the display.

The `playQuietly`/`stopQuietly` pair the two existing cues share lives in
`DisplayBoard/displayMediaPlayback/`; a third claimant belongs there too rather than re-deriving
best-effort playback.

**Author-time tooling:** a `tools/` script rendering a lines file to MP3s, in the shape of
`tools/import-geo-photos`. macOS `say -o` is offline and free and good enough to develop against; a
better voice later replaces the files without touching a line of app code, which is the point of
pre-rendering.

**Suggested first slice:** the three how-to-play cues only. One phase, three files, no dynamic
content — and it still forces the single-speaker decision above, which is the part that will be
expensive to change later.

**Out of scope:** live TTS, any spoken number, announcer volume UI, and a host "replay that line"
control until someone actually wants one.

---

## Team-targeted prompts

`featuredPlayers` tags already exist on every prompt bank, and `loadContent` filters packs down to
prompts featuring someone on tonight's roster (see `docs/minigame-authoring-guide.md` 5.2). The
deferred half is *targeting*: serving each team the prompts featuring **their own** members, so a
photo of Jordan comes up on Jordan's team's turn.

- Needs player data threaded into the runtimes. `createInitialState` currently takes `teamIds` and
  nothing else about who those teams contain, and `Team.playerIds` is empty until team setup runs —
  so this is runtime state, not something the content loader can pre-compute.
- Collides with the seeded prompt cursor. Geo spaces teams out with
  `resolveSeededPromptCursor(...) % prompts.length`; per-team pools mean that wrapping cursor has to
  become a per-team selection instead, and the "same pack, different offsets" invariant goes away.
- Decide the fallback before building: what a team with no photos of its members sees. Falling back
  to the roster-filtered pack is probably right, but it means targeting is best-effort and the rule
  needs stating in the host UI, not just the code.

---

## Minigames

Both of these are `MinigameRuntimePlugin` packages registered on server and client like
trivia/geo/drawing. Read `docs/minigame-authoring-guide.md` first — adding a `MinigameType` breaks
every `Record<MinigameType, …>` in the repo until fully wired, so there's no throwaway half-state.

### SEAR — stop the hidden clock at the target time
Blind-clock precision relay: START on the tablet, three visible seconds on the TV, then the lid
drops and the player taps STOP at the target from memory. Scored by absolute error in bands.

- **Fully planned.** `docs/minigames/sear-spec.md` §0 is the ordered build plan with every open
  question closed; the Research section is the reasoning. Build from §0, in order, one change.
- One engine change rides along: an optional `receivedAtMs` stamped onto the minigame action
  envelope by `dispatchMinigameAction`, so a timing-aware reducer stays pure and testable with
  literal timestamps. Additive; existing plugins ignore it.
- No content file, no audio, no `/dev/lab/` — the standard `/dev/minigame/sear` sandbox is the
  feel lab. Band widths and target lengths are rules config to tune at a table.
- Not scheduled in the sample config (song-guess precedent); `timers.searSeconds` is still added.

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

### Reset Game drops preset seating
`players.json` can now seat players on teams at boot, but `Reset Game` still returns to empty
rosters: `normalizeBaselineTeams` (`apps/server/src/roomState/baseMutations/index.ts`) clears
`playerIds` on the way into the setup baseline, so a reset restores the players and teams but not
who was on which team — the host re-taps Auto-assign.

- Defensible as-is (rosters were always "formed live"), and deliberately left alone when preset
  seating landed: changing it rewrites what `Reset Game` means and re-specifies the existing
  baseline tests, which is a product call rather than a loose end.
- The narrow version: have the CONTENT path (`setRoomStateTeams`) carry its seating into the
  baseline while live setup mutations keep clearing it. Note the interaction that makes this only
  half a fix — `createTeam`/`addPlayer` call `syncSetupBaselineTeamsFromState`, which re-normalizes
  every team, so adding one team at the party would wipe the preset seating out of the baseline
  again.
- Decide what a reset means before coding either: back to the authored pack, or back to empty.

### Team genre and anthems are unreachable from the wizard
`TeamsContentEntry` has `genre` and `anthems`, and the anthem cue reads them, but the `/admin`
Roster step's `TEAM_FIELDS` is name-only — so a team created in the wizard gets no genre and no
anthem, and the only way to give it one is editing `teams.json` by hand.

- Existing teams keep both fields through a wizard save (the field specs spread the whole entry, and
  `toTeamsContentEntries` re-adds them), so this is a gap in authoring, not a data-loss bug.
- `anthems` is a string array, which no `EntryFieldSpec` shape covers today — the interesting part
  is what a list-of-strings field looks like in `EntryListEditor` without turning it into a form
  builder. One filename per line in a textarea is the cheap answer.
- Round-keyed anthem rotation has shipped, so multi-anthem teams are now the normal case and the
  wizard is the only thing that cannot author one.

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
