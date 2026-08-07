---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-10
title: "Server config write + reload path (content/local writes, callable reload, config:* socket events)"
status: needs-planning   # idea | needs-research | needs-planning | ready | in-progress | in-review | done | blocked | superseded
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
- 2026-08-07T05:18:42.559Z gate1 (product-owner critic): needs-changes — recorded at .work/verdicts/WN-10.gate1.json. Summary: "Well-formed, correctly scoped, machine-checkable slice, but three ACs collide with landed code in ways that would land silently: the apply broadcast is a no-op through the existing pipeline, gameConfig saves skip the plugin rules seam, and config:* handlers can throw a socket.io listener exception that kills the process." MAJOR 1 (AC4 broadcast is a silent no-op): the broadcast pipeline gates on `didMutate`, a module-scoped flag raised ONLY by defineRoomMutation (roomState/mutationResult/index.ts:11-27; socketServer/index.ts:76-84). The four re-seed setters AC2 names (setRoomStatePlayers/Teams/GameConfig/MinigameContent, baseMutations/index.ts:134-184) are plain functions that never call reportRoomStateMutation(), so applyRoomStateMutation returns didMutate:false and broadcastAfter returns early — host + display would NOT see the new config without a refresh, which is exactly what AC4 promises. The obvious fix is also trapped: defineRoomMutation early-returns when isRoomInFatalState (defineRoomMutation/index.ts:30-40), i.e. it refuses to run in the broken-content state the wizard exists to repair. AC4 must name how apply reports its mutation, and AC5 must add a case asserting a snapshot is actually broadcast after a successful apply. MAJOR 2 (AC1 validation gate has a hole for gameConfig): WN-9 landed validateGameConfigFile with the per-plugin rules check as an INJECTED seam — called bare, minigameRules are not validated at all (validateGameConfigFile/index.ts:55-60 "Omitted => no rules issues"). The loader supplies it via isRulesValidForKey, which is PRIVATE to loadGameConfig (loadGameConfig/index.ts:44-69). So a gameConfig.json with plugin-rejected rules passes the writer, lands in content/local/, and fatals the very next load — and because the file persists, EVERY subsequent boot fatals, with the wizard read path unusable to undo it. AC1 must require the writer to validate gameConfig through the same plugin-backed rules seam (extract isRulesValidForKey so there is one implementation), and AC5 must add a bad-minigameRules case. MAJOR 3 (no AC covers throwing loaders inside socket.io listeners): loadContent and every loader under it throw (loadContentFileWithFallback/index.ts:27-29; contentLoaderUtils/index.ts:14-20) — which is why boot wraps them in try/catch (index.ts:22-41). socket.io v4 dispatches listeners inside process.nextTick with no surrounding catch, and there is no process.on("uncaughtException") anywhere in apps/server, so a throw out of config:read/save/apply takes the server DOWN. The acute case is the one the feature exists for: with a broken content/local file the server boots into fatalError (alive, by design), then the wizard config:read re-reads that same broken file and kills the process. Needs an AC that config:read/save/apply never throw out of the handler — a load/parse failure returns a typed error payload distinct from CONFIG_LOCKED — plus a matching AC5 case. MINOR (AC3 pattern cannot express these events): defineAuthorizedEvent requires runMutation to return RoomState and the dispatch discards the result (registerRoomStateHandlers/index.ts:80-117), no ack/callback arity exists anywhere in the contract, and the only per-socket server->client precedent is the payload-less host:secretInvalid — so new SERVER_TO_CLIENT_EVENTS + a non-mutating registration path must be minted. Graded minor (it fails typecheck rather than landing silently) but the response event names/shapes are the contract WN-11 is written against, so the ticket should name them. MINOR (injectable content root): every loader takes options.contentRootDir and the contentLoader testHarness writes into mkdtempSync(os.tmpdir()); if contentWriter/reloadContentIntoRoomState hard-code the default root, AC5 tests write into the repo real content/local/ — gitignored, so it survives unnoticed and shadows content/sample for the dev server. AC1/AC2 should state both new modules accept the contentRootDir override. MINOR (AC2 fatalError path is destructive): setRoomStateFatalError first does overwriteRoomState(createInitialRoomState()) (baseMutations/index.ts:112-132), so a failed apply-time reload WIPES players/teams entered live in SETUP. Bounded (apply is SETUP-only, writes pre-validated, setup baseline survives), but the ticket should say the wipe is intended or scope apply-time failure to a non-destructive error return. Checks: well-formed ok, machine-checkable-finish ok, scoped ok, blast-radius ok, hidden-constraints FAILED, worth-doing ok. Confidence high. Routing per ship-next gate1: explicit rejection => demote ready -> needs-planning and re-plan via plan-work. Pipeline halted before implement; no code was written.

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
Deps: WN-9 (validators). Downstream: WN-11 (wizard consumes config:* events). Related: geo import CLI writes content/local/minigames/geo.json (tools/import-geo-photos).
