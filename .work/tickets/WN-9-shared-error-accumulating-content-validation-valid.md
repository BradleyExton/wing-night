---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-9
title: "Shared error-accumulating content validation (validateGameConfigFile + file validators)"
status: needs-planning   # idea | needs-research | needs-planning | ready | in-progress | in-review | done | blocked | superseded
kind: feature
priority: medium
created: 2026-08-05

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: []                 # list<id>; DAG edges; must all be `done` before the SELECTOR picks this; default []
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
Add an error-accumulating validation API for the four editable content files in packages/shared, keeping the existing boolean guards as thin delegates (single source of truth, no fork).

## Acceptance Criteria
- [ ] `validateGameConfigFile(value): ValidationIssue[]` exists in `packages/shared/src/content/gameConfig/` where `ValidationIssue = { path: string; message: string }` (e.g. `{ path: "rounds[1].sauce", message: "must be a non-empty string" }`), covering every rule the current guard enforces: name, non-empty contiguous rounds, per-round fields, minigame membership, scoring positives, all required timer keys, outer minigameRules shape, setupPreviewRoundSlots bounds.
- [ ] `isGameConfigFile` is rewritten as `validateGameConfigFile(value).length === 0` — the predicate and the validator can never disagree; no behavior change for existing callers (contentLoader keeps working).
- [ ] Equivalent issue-returning validators exist for `players.json` (`{ players: [{name, avatarSrc?}] }`), `teams.json` (`{ teams: [{name}] }`), and the trivia (`{id,question,answer}`) + drawing (`{id,prompt}`) prompt packs, with their boolean guards (where they exist) delegating the same way.
- [ ] Plugin `isRules` hooks stay boolean in v1: rules validation surfaces as a single generic issue at `minigameRules.<key>` when a plugin rejects (extending the plugin contract is out of scope — noted for later).
- [ ] Colocated unit tests cover: a fully-valid config returns `[]`; each rule violation produces an issue whose `path` points at the offending field; multiple violations accumulate (not first-failure-only); non-contiguous round numbers report the index.
- [ ] `pnpm typecheck` and `pnpm test` pass.

## Plan
Grilled 2026-08-05 (plan-work session; user at the table — decisions user-confirmed unless marked).

- Location: next to the existing guards in `packages/shared/src/content/` — they ARE the schema; the validator becomes the primary implementation and the boolean guard delegates. Never fork the rules.
- Issue shape `{ path, message }` chosen so the wizard (WN-11) can map issues to form fields by path string; no i18n/severity in v1.
- Follow house style: promote `gameConfig.ts`-style modules per code-design rules if a file grows past coherence; colocate tests.
- Out of scope: geo pack validation beyond outer shape (authored by `import:geo`), plugin-owned per-rules schemas.

## Progress
<the executing agent appends here — the restart-safe log>
- 2026-08-07T02:35:09.587Z gate1 (product-owner critic): needs-changes — recorded at .work/verdicts/WN-9.gate1.json. Summary: "Sound, well-formed, worth-doing slice, but two planning gaps must be closed first: packages/shared has no runtime test runner (so the mandated colocated tests would never execute under `pnpm test`), and AC4's plugin-rules issue has no specified seam given shared cannot depend on the minigame plugins." MAJOR 1 (machine-checkable-finish, ok:false): packages/shared/package.json test script is `tsc --noEmit -p tsconfig.test.json` over `src/**/*.test-d.ts` only, and devDeps are {typescript} — so the AC5 colocated unit tests would never execute and `pnpm test` (AC6) would go green having run zero of them. Needs an explicit AC/plan step wiring shared's runtime test script + tsx/@types/node devDeps (precedent: packages/minigames/core `tsx --test src/**/*.test.ts`). MAJOR 2 (hidden-constraints, ok:false): AC4 is not implementable as written — packages/shared has no dependencies and packages/minigames/core depends on @wingnight/shared, so validateGameConfigFile cannot call resolveMinigameRuntimePlugin; the plugin-rules check today lives in apps/server/src/contentLoader/loadGameConfig/index.ts:23-48 and throws. AC4 also collides with AC2 ("no behavior change"): emitting rules issues by default makes the predicate strictly stricter than today. The ticket must name the seam (e.g. an injected validateRules/isRulesByKey option supplied by the server) and say whether loadGameConfig delegates or keeps its own throw. MINOR: AC3 describes trivia/drawing packs by item shape only, but the existing guards also enforce non-empty prompts + unique prompt ids (trivia/index.ts:34-37,52-58; drawing/index.ts:29-32,47-53) — write parity language + a duplicate-id regression test, which nothing in the repo covers today. INFO: re-export the new validators + ValidationIssue from the shared barrel (packages/shared/src/index.ts) for WN-10/WN-11; and the Goal says "four editable content files" while the ACs enumerate five validators — pin the count. Routing per ship-next gate1: explicit rejection ⇒ demote ready → needs-planning and re-plan via plan-work. Pipeline halted before implement; no code was written.

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
Spawned from the 2026-08-05 config-wizard spike + prototype (Variant C picked). Downstream: WN-10 (server uses validator before writes), WN-11 (wizard renders issues inline).
