---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-22
title: "Lobby playlist on the display during SETUP"
status: ready
kind: feature
priority: medium
created: 2026-08-07

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: [WN-20]
blocked_by: []
---

## Goal
Party-arrival music: the display plays through a lobby playlist during the SETUP phase (before the game is locked in), fading out when the game starts — so the room has music while people trickle in and teams get assigned.

## Acceptance Criteria
- [ ] The server enumerates `content/local/audio/lobby/*.mp3` at boot (sorted by filename — deterministic order), serves them via a static route (`/lobby-audio` or fold into the WN-20 mount), and exposes the track list in the display-safe snapshot. Empty/missing directory → empty list, no error.
- [ ] During SETUP, once audio is unlocked (the WN-20 tap-to-enable gate), the display plays the playlist sequentially, advancing on track end and looping back to the first track after the last.
- [ ] Lobby playback stops (with a short fade-out if trivially achievable via volume ramp, hard stop otherwise) when the phase leaves SETUP, and never plays again for the session — the WN-20 anthem cue owns audio from then on. The two must not overlap.
- [ ] With no lobby tracks on disk, SETUP renders and behaves exactly as today.
- [ ] `pnpm typecheck` and `pnpm test` pass, including unit tests for the lobby-track enumeration (populated, empty, missing dir) and the sequential-advance selector.

## Plan
Decisions resolved at planning (grilled 2026-08-07, user present; this slice was added mid-grill by the user):
- **Convention over configuration**: the playlist is "whatever MP3s are in `content/local/audio/lobby/`", sorted by filename — no new content JSON to author or validate. Prefixing filenames (`01-…`, `02-…`) is the ordering mechanism. (self-answered — conservative, matches the local-assets drop-a-file pattern; easily revisited if a manifest is ever wanted)
- **Sequential + loop, not shuffle** — deterministic per the testing rules; the room won't notice order.
- **SETUP only** — INTRO onward belongs to the game's own moments (countdown, anthems). "Before the game is locked in" maps to the SETUP phase.
- This slice shares WN-20's unlock gate and audio element/service — build on that hook, don't add a second `<audio>` lifecycle.

Implementation shape:
1. Server: a small `loadLobbyTracks` next to the content loader (fs.readdir, filter .mp3, sort); expose as a display-safe room-state field (static for the session); static-serve the directory.
2. Client: extend the WN-20 audio service/hook with a "lobby mode" active only in SETUP — track index advances on the audio element's `ended` event; teardown on phase change.
3. Pure selectors for "next track index" tested directly; keep the component thin.

Out of scope: shuffle, host skip/next controls, volume UI, music during EATING/results phases.

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
- [[WN-20]] (unlock gate + static-serving foundation this reuses)
- docs/minigame-authoring-guide.md §5.1–5.2
