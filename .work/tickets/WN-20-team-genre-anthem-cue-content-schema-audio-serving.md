---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-20
title: "Team genre anthem cue: content schema, audio serving, display playback at MINIGAME_INTRO"
status: ready
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
- [ ] `pnpm typecheck` and `pnpm test` pass, including new unit tests for the teams content parsing (genre/anthems present, absent, and invalid) and the anthem-cue selector.

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

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
- docs/minigames/song-guess-spec.md §5.3–5.4, §8.1 (asset serving + autoplay unlock — the prior art)
- docs/minigame-authoring-guide.md §5.1–5.2 (canonical asset + display-audio patterns)
- apps/client/src/components/DisplayBoard/useGameStartCountdown (snapshot-diff cue idiom)
- apps/client/src/components/HostControlPanel/useTimesUpChime (best-effort audio guard)
- WN-9 (shared content validators, done) · WN-19 (wizard roster editor writes teams.json, done)
- [[WN-21]] (rotation + genre flavor) · [[WN-22]] (lobby playlist) build on this.
