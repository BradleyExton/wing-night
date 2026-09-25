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

### Announcer voice (pre-rendered)
A game-show announcer on the TV: it explains each minigame, calls the round and its sauce,
introduces the teams, calls the lead after results, and closes the night. The host works the room in
character (Price-is-Right framing, host plus helper), so the app is the ANNOUNCER, never the host.

**Decided with the user (2026-09-16):**
- **Pre-rendered MP3s, not live TTS.** Lines are written, rendered to audio ahead of time, and
  enumerated from `content/local/audio/announcer/` at boot — the lobby-playlist convention, and the
  same local-file pipeline as the anthems. No cloud call and no TTS engine in the party's critical
  path, and every line is auditionable before guests arrive.
- **Cue coverage:** how-to-play per minigame (MINIGAME_INTRO), round + sauce intro (MINIGAME_INTRO),
  team intros and a post-results standings call, and a winner/finale line.

**What pre-rendering can and cannot say.** Rosters and teams are AUTHORED content, known before the
party — so per-team and even per-player lines are perfectly renderable, which is what makes "Scorch
Squad takes the lead" a static file rather than a synthesis problem. Only live numbers are out:
scores, wing counts, "three players ate". Keep numbers on the screen and out of the voice, or the
first score that isn't 2 makes the announcer wrong.

**The blocking design question, and it is not the audio files.** The display owns exactly ONE
`<audio>` element — `data-team-anthem` in `DisplayBoard/index.tsx` — with exactly ONE claimant,
`useMusicPlaybackCue`, which renders the server's `musicPlayback` state and decides nothing itself.
(`useTimesUpChime` is not a claimant: it is WebAudio, on the HOST, so it never touches the TV.) That
single-claimant shape is newer and cleaner than the two phase-disjoint cues it replaced, but it does
NOT answer the announcer, whose line and the team anthem fire at the SAME moment, both at
MINIGAME_INTRO — two things wanting the speaker at once is exactly what one element and one
`musicPlayback` slot cannot express. Settle this before writing a cue table:
- Sequence them (line, then anthem) on the single element — simplest, and it makes the anthem's start
  depend on a line's duration, which the client cannot know until the file loads.
- Two elements with the voice ducking the anthem — the better party moment, and the reason the
  single-element rule needs restating rather than copying: it exists to stop two music cues
  competing for the speaker, not to ban a voice channel over a music channel.
- An audio director owning every cue, with the cues as data. Most work, and the only option where a
  line and an anthem can be concurrent rather than one displacing the other.

**Start from the music model, not from scratch.** `musicPlayback` is already server-authoritative
room state with host-gated `music:*` mutations and a display-reported `music:trackEnded`; whatever
the announcer becomes, it is a second speaker channel alongside that one, not a parallel invention.

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

### Shared photo library (ADR-0004)

Photos are becoming the substance of the game rather than GEO's private asset folder, and the facts
about a photo — where it was taken, who is in it — currently get retyped into each game's prompt
bank. `docs/adr/ADR-0004-shared-photo-library.md` proposes one manifest per pack
(`<pack>/local/photos.json`) plus a served image tree under `assets/photos/`, with game content
referencing a `photoId` and the content loader filling in `imageSrc` and `featuredPlayers` from the
manifest before the roster filter runs.

- **Takeout buys people, not places.** The sidecar carries taken-at and a `people` list from named
  face groups, and the real account already has twenty named clusters and the event albums. But the
  "hot ones" album was walked in the web UI on 2026-09-18: location estimation is on and the photos
  still have no location — four of thirty kept EXIF GPS, the other twenty-six offer "Add a
  location". Coordinates are authored by hand; the export is worth having for the tags.
- **Blocked on that export landing**, not on design. Build the importer against the real unzipped
  Takeout, never against invented fixtures — the last two photo passes both failed on assumptions
  about what Google actually emits.
- **Decide the non-player rule first.** See the ADR's consequences: copying a photo's full `people`
  list into `featuredPlayers` would drop good cards and warn about friends who simply are not
  playing.

---

## Minigames

These are `MinigameRuntimePlugin` packages registered on server and client like
trivia/geo/drawing. Read `docs/minigame-authoring-guide.md` first — adding a `MinigameType` breaks
every `Record<MinigameType, …>` in the repo until fully wired, so there's no throwaway half-state.

### RECREATE ("Forgery Studio") — follow-ups
The game shipped 2026-09-18: a doctored party photo on the TV, the team writes the prompt they
think made it, the server sends that prompt (with the source photo) to the Gemini image API once
per attempt, and the host scores the PROMPT by ticking the target's secret ingredients. Package in
`packages/minigames/recreate`, generation runner in `apps/server/src/minigames/recreateGeneration`,
targets painted ahead of the night by `pnpm import:recreate`. The picture never decides the score,
so a failed or absent generator degrades to judging by ear rather than stalling. Left out on
purpose, in rough priority:

- **A judge that pre-ticks.** A cheap text-only model call that maps the team's prompt onto the
  ingredient list ("sea floor" counts as "underwater") and pre-ticks the host's checklist as a
  suggestion. The host still confirms; with no call the host ticks by hand, exactly as now. The
  reducer already takes `toggleIngredient` per index, so this is a second server side effect in the
  shape of the generation runner, not a rules change.
- **A writing clock.** The game is host-paced (`timerKey: null`) so the tablet can sit with the team
  while they type. A prompt-writing countdown would give the turn pressure; FAPPY's `receivedAtMs`
  pattern (rules-owned limit, no shell timer) is the precedent, and it keeps the shell's timer
  contract untouched.
- **Room-awarded bonus.** One extra point, tapped by the host, for the forgery the room liked best.
  Cheap, and it gives the picture a stake without making it the referee.
- **Video as the reward.** An eight-second clip of the winning forgery over ROUND_RESULTS. Minutes
  and dollars per clip, so pre-rendered from the night's `recreate/attempts/` afterwards, never live.
- **Content-pack targets.** The sample bank ships placeholder SVGs. The night pack needs real
  targets authored from the GEO photos and painted by `pnpm import:recreate`; audition every
  picture against its ingredients before the party.

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

## Team identity (genre theming)

Spec: `docs/team-identity.md`. Teams are told apart by a hashed colour and a name; the genre only
reaches the cast's apparel and the intro eyebrow. The kit turns `genre` into typeface, wordmark,
emblem, ambient texture and entrance beat, resolved once per room state and drawn by four shared
components. Each phase is one session and ends on the full gate plus the Playwright run.

- ~~**Phase 1 — mockup.**~~ Done 2026-09-18; picks recorded in the spec's typography table. `apps/client/public/mockups/team-identity/`: kit board with font candidates
  per genre for the four pack teams, plus a standings footer and intro spotlight from the leading
  picks. Ends on a font decision written into the spec.
- **Phase 2 — foundation.** Bundled woff2 faces + `@font-face` + Tailwind `font-genre-*` tokens;
  `resolveTeamTheme` (absorbs `resolveTeamApparel`, colour precedence authored → genre → hash with
  a collision pass); optional `color` on the teams content entry; `TeamWordmark`, `TeamEmblem`,
  `TeamLineup`, `TeamAmbient`; `teamThemeById` beside `selectHostTeamMaps` and in
  `resolveStageViewModel`.
- **Phase 3 — TV headline moments.** `StandingsSurface`, `MinigameIntroStageBody` (lineup replaces
  the text roster), `TurnResultsStageBody`, `FinalResultsStageBody`.
- **Phase 4 — host surfaces.** `HostMiniRail` pill, `TeamSetupSurface`, `SetupPlayersSurface`
  chips, `TurnOrderSurface`, `ScoreOverrideSurface`: glyph plus colour, no genre face below 20px.
- **Phase 5 — minigames.** `activeTeamTheme` / `teamThemeByTeamId` on the core contract and
  sandbox fixture; marquees in drawing and joust, labels in trivia.
- **Phase 6 — authoring and docs.** Wizard genre field with live preview (genre half of the item
  below), `DESIGN.md` §0.1 exemption and §2.8 pointer, standings/intro sections updated.

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

---

## Code-health cleanup

From a whole-repo audit on 2026-09-21. The mechanical half of that audit has already landed —
`resolveSeededPromptCursor` deduplicated into `packages/minigames/core`, the four PRNG copies
collapsed into `packages/shared/src/seededRandom`, two orphaned `index.css` keyframes deleted, and
the committed PR screenshots untracked. What follows is the half that wants a decision or a
supervised pass, roughly in payoff order.

### Four copies of the same rAF beat loop
`useFappyRunner`, `useFappyMirror`, `useSchlonicRunner` and `useSchlonicMirror` are 1,120 lines that
share one piece of machinery: a `BEAT_DURATION_MS` record, a `stopLoop()`, and a `step(now)` body
that computes `progress = (now - beat.startedAtMs) / BEAT_DURATION_MS[kind]`, calls
`paintBeat(min(1, progress))`, then advances or stops. Only the painting differs.

- Shape: a `createBeatLoop` in `packages/minigames/core` taking the duration map and a `paintBeat`
  callback, returning `{ start, stop }`. The scene refs stay in each hook.
- Do it before a third one-button game lands, not after. The invariants these four share are
  exactly the ones that are easy to get wrong once and then copy: the loop must not be stopped by
  effect cleanup, and a hidden browser pane throttles rAF to ~1fps, so any verification runs under
  Playwright rather than a backgrounded preview pane.
- No behaviour change. Both games have runtime tests plus `/dev/minigame/<slug>` sandboxes.

### The house component rules stop at the minigame packages
`eslint.config.mjs` applies `max-lines`, `no-inline-style-prop`, `no-hardcoded-component-jsx-text`,
`require-styles-import-in-component-entry` and the `styles.ts` colour rules to
`apps/client/src/components/**` and `packages/cast/src/**` only. The 47 components under
`packages/minigames/*/src/client/**` — most of the game UI — are ungoverned, and lint is the only
thing enforcing the house idiom at all.

Measured by temporarily extending the config: **28 violations**, none of them in `styles.ts`
colour rules.

| Rule | Count | Notes |
| --- | --- | --- |
| `require-styles-import-in-component-entry` | 13 | All pure SVG scene primitives (Backdrop, Cactus, Ground, Shooter, ShotGhost, …) |
| `no-hardcoded-component-jsx-text` | 9 | drawing x5, emoji-charades x3, +1 |
| `max-lines` (>260) | 5 | HostFappySurface 334, DrawingCanvas 337, ZoneProps 272, HostSchlonicSurface 290, Perch 264 |
| `no-inline-style-prop` | 1 | `HostDrawingSurface/index.tsx:265` |

The 13 SVG primitives are a real exception — a `<g>` of shapes has no `styles.ts` to import — so
carve them out by path rather than bending the rule. The other 15 are ordinary fixes. Land the
carve-out and the fixes together with the config change, or the gate goes red.

### 118 dead exports
Three recognisable families, all safe to delete:

- **18 `*Props` types** exported and never imported (`PerchProps`, `ShooterProps`,
  `FappySceneProps`, `SchlonicSceneProps`, `ArenaHenProps`, …). The component's own file is the
  only consumer.
- **9 `<game>MinigameId` constants**, one per minigame package, used by nothing
  (`schlonicMinigameId`) or only by their own test. The plugin's `id` field already carries this.
- **Assorted orphans**: `cloneJoustPrompt`, `cloneSongGuessPrompt`, `cloneEmojiCharadesSubject`,
  `cloneEmojiCharadesDeck`, `isEmojiToken`, `isJoustAim`, `createTriviaStateWithPendingPoints`,
  `BARRIE_CENTER`, `BARRIE_ZOOM`, `JOUST_PERCH_MARGIN` (used only inside its own file),
  `useRoomStateEnvelope`, `withHostProviders`, `withDisplayProviders`, `buildGeminiImageUrl`.

A further 104 exports exist only for their colocated test. Most are legitimate
(`testHarness.ts` files, pure resolvers); a handful — `resolveLegHold`, `resolveRunHold`,
`toVolumePercent`/`fromVolumePercent` — are testing internals where a test at the hook boundary
would do.

### `packages/shared/src/index.ts` hand-relists its own sub-barrels
464 lines, roughly 144 of which repeat — symbol by symbol — the export lists already written in
`joust/index.ts`, `fappy/index.ts`, `schlonic/index.ts` and `contraption/index.ts`. Adding a shared
symbol means editing two files and nothing fails if you forget the second. No `export *` appears
anywhere in the package, so decide whether the explicit listing is buying anything (it is not
buying tree-shaking — every consumer is bundled from source) before keeping it.

### `useIsRevealVisible` is still two copies in two packages
The audit found this hook pasted into three surfaces. "Time the reveal on one clock" then merged
DRAWING's two into `drawing/src/client/useIsRevealVisible/` and fixed the clock-skew bug all three
carried — but EMOJI CHARADES kept its own at
`DisplayEmojiCharadesSurface/index.tsx:35`, and the two bodies are now character-for-character
identical apart from the reveal type.

The home has moved with the fix: `resolveRevealDurationMs` already lives in
`packages/minigames/core`, so the hook belongs beside it, generic over a reveal and a
`resolveRevealKey`. Leaving one copy behind in another package is exactly how the first bug got
written twice, and the comment in the DRAWING hook says so.

### Two documented conventions the code no longer follows
Docs-only unless the first one gets acted on.

- `AGENTS.md` §3.1 says the team look lives in `packages/cast`. It does not — `TeamWordmark`,
  `TeamEmblem`, `TeamAmbient`, `TeamLineup` and `resolveTeamTheme` are all in `apps/client`, where
  no minigame package can reach them. Latent rather than broken: no minigame wants one yet. Move
  them when the first one does, and note that `TeamWordmark` is inline by design and dies silently
  without a `block`/`inline-block` in its `sizeClassName`.
- `CLAUDE.md` and `AGENTS.md` §4 say tests are `index.test.ts` beside `index.ts`.
  `apps/server/src/roomState/` instead has seven folder-level specs (`phaseTurnFlow.test.ts`,
  `scoringRecovery.test.ts`, `minigamePlayMutations.test.ts`, …) testing sibling folders. That is
  the right shape for cross-module flow tests; the docs should say so rather than the code
  quietly disagreeing.

### Stale core-flow screenshots
`docs/screenshots/core-flows/` is 2.6 MB across 48 PNGs, and `docs/core-game-flow-ui.md:51` already
labels the set stale — it predates the removal of `ROUND_INTRO`, and two of the pairs are of that
deleted phase. Either recapture the walkthrough or delete the captures and keep the prose. Left
alone in the 2026-09-21 pass because which one it should be is a call about whether that document
is a living guide or a historical record.

### The minigame client trees are outside `react-hooks/exhaustive-deps`
Extending the house rules to `packages/minigames/*/src/client/**` (T1.4) left one block behind.
The browser-globals block in `eslint.config.mjs` also carries `react-hooks/rules-of-hooks` and
`react-hooks/exhaustive-deps`, and turning those on for the minigame trees reports ten findings,
every one of them a hand-narrowed dependency array on a loop or a hold rather than an oversight:

- `fappy/src/client/FappyScene/index.tsx:261` — deps are `[sceneId, waitingBird === null]`, an
  expression the rule cannot follow at all
- `fappy/src/client/HostFappySurface/index.tsx:130`, `useFappyMirror/index.ts:289`,
  `useFappyRunner/index.ts:242`, `useHeldLeg/index.ts:63`
- `schlonic/src/client/SchlonicScene/index.tsx:239`, `useHeldRun/index.ts:79`,
  `useSchlonicMirror/index.ts:257`, `useSchlonicRunner/index.ts:202`

Widening any of them re-runs an effect that starts a `requestAnimationFrame` loop, so the honest
fix is a ref/`useCallback` restructure per site, verified under Playwright because a hidden browser
pane throttles rAF to 1 fps and hides exactly this class of regression. That is a behaviour change
to two shipped minigames, not a lint fix, and it wants its own ticket and its own table time.

### ~~Minigame `styles.ts` files are still on raw hex~~ — done 2026-09-24
The minigame client trees are on the house path list, the colour rule catches `rgb()`/`rgba()`/
`hsl()` as well as hex, and `packages/surface/src/styleTokens/index.ts` is gated too. Chrome is on
tokens (`theme(colors.gold/35%)` inside arbitrary values); licensed scene art sits in `scene*`
exports the rule exempts by name (DESIGN.md §0.1, "Scene art").

### Do the arcade games share a surface language, or have they been copying JOUST?
Surfaced by T3.1. Three `RunningTotals` copies (JOUST, FAPPY, SONG_GUESS) were byte-identical — and
written in `#3a200d` / `#1a0e05` / `#0a0604`, which are JOUST's own arena-frame border and result
plaque from DESIGN.md §2.7. That is not a house card three games agreed on; it is one game's skin that
two games copied. Hoisting it into `packages/surface` forced a value-for-value substitution to
`border-ember/20` / `from-surface to-bg`, because a house-component path may carry no raw hex.

SCHLONIC's variant was the only one of the four already written in house tokens.

The open question, deferred from the T3.1 checkpoint to phase 6: either the arcade games share a
surface language that DESIGN.md should name with real tokens, or the dusk-desert palette belongs to
JOUST's arena alone and the others should stop borrowing it. Until then each migration substitutes
tokens as it goes. **Answered at T6.2**: they were copying JOUST's skin. `DESIGN.md` §2.5 now states the direction — the brown goes and the other seven marquees follow DRAWING onto house tokens. Built 2026-09-24: the brown is gone from every chrome string and lint gates the minigame trees.
