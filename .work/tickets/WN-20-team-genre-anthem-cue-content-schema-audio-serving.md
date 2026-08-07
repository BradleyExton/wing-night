---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-20
title: "Team genre anthem cue: content schema, audio serving, display playback at MINIGAME_INTRO"
status: needs-planning
kind: feature
priority: medium
created: 2026-08-07

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: []
blocked_by: []
---

## Goal
Each team has a genre identity with anthem MP3s in the content pack; when a team's MINIGAME_INTRO begins, the display (TV) plays their first anthem — flavor plus an audible "your team is up" summon for scattered players.

## Acceptance Criteria
- [ ] `TeamsContentEntry` (packages/shared/src/content/teams/index.ts) gains optional `genre: string` and `anthems: string[]` (MP3 filenames), validated via the shared error-accumulating content-validation pattern (WN-9's validators); `Team` carries them through `buildTeam` (apps/server/src/contentLoader/loadTeams) and they are display-safe in the snapshot.
- [ ] The server mounts its first static asset route: `/team-audio` → `content/local/teams/audio/` (gitignored) in apps/server/src/createApp, following docs/minigame-authoring-guide.md §5.1. Content load logs a warning and drops missing anthem files — never fatal.
- [ ] The admin config wizard's roster editor (WN-19) round-trips the new optional fields when it rewrites teams.json — editing/saving teams never strips `genre`/`anthems` (regression test on the write path).
- [ ] The display shows a "tap to enable audio" unlock overlay (docs/minigame-authoring-guide.md §5.2 / song-guess-spec §8.1 pattern) until tapped once; the unlocked state persists for the session.
- [ ] When the room enters MINIGAME_INTRO for a team with anthems, the display plays `anthems[0]` (via the snapshot-diff one-shot idiom of useGameStartCountdown); playback stops when the phase advances. Audio is best-effort — a locked/blocked AudioContext or missing file never breaks the display (mirror useTimesUpChime's guard).
- [ ] Teams without `anthems` behave exactly as today (no overlay interaction required to advance phases, no errors).
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, and the manifest's `e2e` suite pass — including new unit tests for the teams content parsing (genre/anthems present, absent, and invalid) and the anthem-cue selector, plus e2e coverage that the unlock overlay never obstructs SETUP interactions (extends the display specs from WN-1/WN-2).

## Plan
Decisions resolved at planning (grilled 2026-08-07, user present):
- **Local MP3s over Spotify** — offline-safe at a house party, no OAuth/Premium/SDK, and it reuses the asset pattern the song-guess spec already designed. Spotify is parked indefinitely.
- **Assignment lives in `teams.json`** (content pack, `local/` → `sample/` fallback) — no new setup-phase UI. Since WN-19, teams.json is also editable via the admin config wizard's roster editor; MVP scope here is field *preservation* on that write path, not wizard UI for picking genres (parked).
- **Cue moment is MINIGAME_INTRO** — the "Team X is up" screen is exactly the summon moment; the anthem plays until the host advances into MINIGAME_PLAY.
- **Display is the speaker** (TV/projector = the room's shared audio). No host-side fallback in the MVP; the host's existing times-up chime is untouched.
- **Best-effort audio** — same stance as useTimesUpChime: cue failure must never block the game.

Implementation shape:
1. Shared schema: extend `TeamsContentEntry` + `Team` (optional fields) using the shared error-accumulating validators (WN-9): bad `anthems` entries accumulate warnings and are dropped, not fatal.
2. Server: `buildTeam` copies genre/anthems; validate file existence under `content/local/teams/audio/` at load (warn + drop missing). Mount `express.static` in `createApp` — first static route; add a small createApp test. Audit the wizard's teams write path (WN-10/WN-19 config write/reload) for field round-tripping.
3. Client (DisplayBoard): a `useTeamAnthemCue` hook — previous-phase ref diff (precedent: `useGameStartCountdown`), pure selector `resolveAnthemSrc(team)` tested directly; a single shared `<audio>` element; stop/reset on phase change. Unlock gate as a display overlay (template: GameLockedOverlay) that renders until first tap primes audio (`play().then(pause)` primer per song-guess spec §8.1); overlay must not obstruct SETUP interactions and disappears permanently once tapped.
4. Sample content: add `genre`/`anthems` to `content/sample/teams.json` for two teams (filenames may reference non-existent sample files — the loader's warn-and-drop path covers this and doubles as a live fixture). No MP3s are committed to the repo.

Out of scope (parked): playlist rotation (WN-21), lobby music (WN-22), Spotify, wizard UI for genre/anthem picking, ambient genre beds, host-side audio fallback.

## Progress
<the executing agent appends here — the restart-safe log>
- 2026-08-07T22:12:30.397Z gate1 (product-owner critic, 2026-08-07): needs-changes — recorded at .work/verdicts/WN-20.gate1.json. Summary: every cited premise verifies against the code (TeamsContentEntry + the WN-9 error-accumulating validators, useGameStartCountdown's previous-value-ref diff, useTimesUpChime's try/catch guard, GameLockedOverlay, docs §5.1/§5.2 + song-guess §8.1, and 'teams' already in DISPLAY_SAFE_ROOM_STATE_KEYS so AC1's snapshot half is free) — but two premises are wrong in a way that would land GREEN AND BROKEN. MAJOR 1 (AC2/AC5, audio URL): client and server are always separate origins — there is no vite.config anywhere in the repo (no dev proxy) and createApp mounts only /health, so an <audio src="/team-audio/x.mp3"> resolves against the Vite origin (5173 dev / 5273 e2e) and 404s; it needs an absolute server-origin URL the way createRoomSocket's resolveSocketServerUrl builds one (module-private, not exported). No named check can catch a wrong base URL — no e2e plays audio, no unit test sees an origin — so the ticket must name the URL-resolution decision AND a check that goes red on a wrong URL. MAJOR 2 (AC3, round-trip): the wizard WRITE path the Plan sends the implementer to audit already preserves unknown fields (RosterStep spreads {...team, name}; contentWriter JSON.stringifies edit.value verbatim). The stripping is on the READ path — apps/server/src/readConfigContent/index.ts:52 'teams: teams.map((team) => ({ name: team.name }))', a fresh one-field literal, in a module the ticket never names and which has no test file. Auditing the named path yields a trivially-passing test at the wrong layer while any wizard team rename silently deletes genre/anthems. The players path at :19-29 shows the established re-add pattern to follow. MINORS: AC4's session-from-load overlay contradicts the per-MINIGAME_INTRO scoping of the §8.1 prior art it cites, and AC7's e2e is near-vacuous (the display has no interactive elements; no spec ever clicks it); §5.1's cwd-relative express.static example breaks under the server's cwd=apps/server and the env-overridable WN_CONTENT_ROOT_DIR, and createApp takes no options so a testable mount needs injection; validateTeamsContentFile is SHARED with the config writer, so loosening it for warn-and-drop also loosens the wizard's save gate; and house lint rules make the new overlay a three-file change (entry + copy + styles). Verdict routes ready -> needs-planning; re-plan via plan-work (do not re-prompt the critic). NOTE: the registered product-owner subagent type is not resolvable in this session (.claude/ symlinks skills into claude-dev-system but has no agents symlink), so the critic lens ran via a general-purpose subagent with the gate1 contract supplied explicitly — carried as an info finding on the verdict.

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
- docs/minigames/song-guess-spec.md §5.3–5.4, §8.1 (asset serving + autoplay unlock — the prior art)
- docs/minigame-authoring-guide.md §5.1–5.2 (canonical asset + display-audio patterns)
- apps/client/src/components/DisplayBoard/useGameStartCountdown (snapshot-diff cue idiom)
- apps/client/src/components/HostControlPanel/useTimesUpChime (best-effort audio guard)
- WN-9 (shared content validators, done) · WN-19 (wizard roster editor writes teams.json, done)
- [[WN-21]] (rotation + genre flavor) · [[WN-22]] (lobby playlist) build on this.
