---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-10
title: "Server config write + reload path (content/local writes, callable reload, config:* socket events)"
status: ready   # idea | needs-research | needs-planning | ready | in-progress | in-review | done | blocked | superseded
kind: feature
priority: medium
created: 2026-08-05

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: [WN-9]                 # list<id>; DAG edges; must all be `done` before the SELECTOR picks this; default []
blocked_by: []           # list<string>; external/manual waits (free text); non-empty => selector skips; default []
# model: sonnet          # opus | sonnet | haiku; unset => global default-by-kind policy (SCHEMA §5)
# thinking: medium       # low | medium | high; unset => policy
# trust: checkpointed    # checkpointed | heads-down; default checkpointed
# needs_prototype: false # true => prototype must complete before in-progress; default false
# landing: preview-pr    # preview-pr | direct-main | feature-flag; unset => manifest default (SCHEMA §7)
# worktree:              # set by work-on on claim (collision guard); default null
# parallel_safe:         # RESERVED for F-8 (post-MVP) — do not set
---

## Goal
Give the server a config write + reload path: atomic writes of edited content files into content/local/, loadContent extracted into a callable reload-and-re-seed operation, and authorized config:* socket events (read / save / apply) with an explicit SETUP-only apply lock.

## Acceptance Criteria
- [ ] A server `contentWriter` module writes a content file to `content/local/` (creating dirs as needed) atomically — write temp file, rename — refusing any payload whose shared validator (WN-9) returns issues: invalid content never lands on disk.
- [ ] The one-shot boot logic in `apps/server/src/index.ts` is extracted into a callable `reloadContentIntoRoomState()` operation (loadContent → setRoomStatePlayers/Teams/GameConfig/MinigameContent) used by both boot and apply; a reload failure surfaces through the existing fatalError path rather than crashing.
- [ ] New authorized socket events following the existing defineAuthorizedEvent + HostSecretPayload pattern: `config:read` returns the current merged content (gameConfig, players, teams, trivia + drawing packs, geo count) as loaded from disk; `config:save` validates + writes files (allowed in any phase); `config:apply` saves then reloads-and-re-seeds, hard-rejecting with a typed `CONFIG_LOCKED` error payload when `phase !== SETUP` (user-confirmed: save-while-locked allowed, apply rejected; Reset Game is the escape hatch).
- [ ] `config:apply` success broadcasts the refreshed role-scoped snapshots through the existing broadcast pipeline (host + display see the new config without refresh); a validation-rejected save/apply returns the ValidationIssue[] to the requesting socket.
- [ ] Server unit tests (contentLoader testHarness pattern) cover: atomic write + local-overrides-sample readback; apply rejected when locked; apply re-seeds room state (totalRounds recomputed); invalid payload rejected with issues and no file written.
- [ ] `pnpm typecheck` and `pnpm test` pass.

## Plan
Grilled 2026-08-05 (plan-work session; user at the table).

- Transport DECIDED: socket events, not HTTP — reuses HostSecretPayload + defineAuthorizedEvent + broadcast; no express.json/HTTP-auth surface. v1 rides the existing hostSecret (WN-12 later swaps the gate to adminSecret).
- Apply semantics DECIDED: hard reject `CONFIG_LOCKED` when past SETUP; file saves permitted while locked (prep next week's config mid-night). Documented rule: Apply re-seeds room state and overwrites live setup:* edits (players/teams) — pre-flight wins pre-night, deck wins in-room after.
- `config:read` must read the merged current files (content/local/ wins), NOT just echo room state — `import:geo` may have written local files the room never saw; prompt packs aren't in room state at all.
- Watch the host-secret invalidation edge: reload does not touch hostAuth; the /admin socket and /host socket both claim HOST (last-claim-wins) — same-device usage is fine, but note the claim-war behavior in Progress if it bites during testing.
- Roster DECIDED in scope: wizard writes players.json/teams.json via the same save path.

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
Deps: WN-9 (validators). Downstream: WN-11 (wizard consumes config:* events). Related: geo import CLI writes content/local/minigames/geo.json (tools/import-geo-photos).
