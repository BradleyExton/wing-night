---
id: WN-19
title: "Config wizard slice 2: Roster + prompt-pack editors, delete the lab and its eslint carve-out"
status: in-progress
kind: feature
priority: medium
created: 2026-08-07
deps: [WN-11]
blocked_by: []
worktree: "/Users/bradleyexton/Projects/wing-night-WN-19"
---

## Goal
Finish the pre-flight config wizard: add the Roster and prompt-pack steps on top of WN-11's spine,
then delete the throwaway `ConfigSetupPrototype` lab and every prop holding it up.

## Acceptance Criteria
- [ ] **Roster step** edits `players.json` / `teams.json` through the same `config:save` path. The
      documented rule (user-confirmed at planning) is that Apply **overwrites live setup edits** —
      pre-flight wins pre-night, the SETUP deck wins in-room after. Surface that in the Review copy.
- [ ] **Prompt packs:** trivia and drawing editable; geo is a read-only count with a
      `pnpm import:geo` pointer. Note the lab never designed the drawing editor —
      `ConfigSetupPrototype/sampleDraft.ts:8-15` models drawing as a read-only **count**, so this
      step has no prototype to port from and is a fresh design against the house idiom.
- [ ] Pin the read/write shape asymmetry before building: `ConfigContentSnapshot` hands back
      `players[]` / `teams[]`, while `ConfigFileEdit.value` must be the **whole file object**. Also
      settle whether the wizard ever emits `config:save` independently of `config:apply` — WN-11's
      Review makes apply the single action, so a bare save may have no caller.
- [ ] **Delete the lab and everything propping it up, in one diff:**
      - `git rm -r apps/client/src/components/HostControlPanel/ConfigSetupPrototype/` (committed at
        9001a1f) and its dispatch at `HostControlPanel/index.tsx:87-89` plus the imports at 6-8.
      - **WN-3's `typeof window` guard** at `HostControlPanel/index.tsx:31-36` — it exists only to
        stop the lab crashing `tsx --test`; left behind it is dead code referencing a deleted module
        and will not compile.
      - The `ConfigSetupPrototype/**` entry in `eslint.config.mjs` `ignores` (line 16). Leave the
        `.claude/**` entry (line 13) — unrelated worktree litter.
- [ ] The e2e spec uses the **content-root env override WN-11 adds** so applying config never writes
      the repo's real `content/local/` — same reasoning as WN-11 (local wins over sample and the
      write persists across runs, reddening `host-display-sync.spec.ts`). Run via the manifest
      `test_one` pinned form; restore SETUP phase before finishing.
- [ ] **`pnpm lint`, `pnpm typecheck` and `pnpm test` all pass**, plus the full `e2e` key. Lint
      matters twice here: it is the only check enforcing the house component idiom, and this ticket
      edits `eslint.config.mjs` itself.

## Plan
Split from WN-11 at gate1's direction (`.work/verdicts/WN-11.gate1.json` major 3): eight deliverables
over a 459-line prototype decomposing into ~15-25 files was one pass too many. WN-11 is the spine
(route + seeding + apply for gameConfig); this is the content breadth plus the cleanup.

The lab deletion rides this slice deliberately — it must not happen until the wizard actually
replaces everything the lab demonstrated, or the reference disappears mid-build.

**port-variant outputs 2-3 stay skipped-and-said pending WN-13** (the vendored `/design-system` and
`/designs` routes are an onboarding gap, not absent by design — see WN-11's Plan and WN-13). Record
the skip and the reason in `## Evidence`.

Pre-verified 2026-08-07: `sampleDraft.ts:8-15` (drawing modelled as a count),
`HostControlPanel/index.tsx:6-8,31-36,87-89`, `eslint.config.mjs:13,16`, lab committed at 9001a1f.

## Progress
<the executing agent appends here — the restart-safe log>
- 2026-08-07T17:37:04.447Z gate1: PASS (product-owner, confidence high) — well-formed, machine-checkable finish (lint+typecheck+test+e2e), premises verified against the landed WN-11 code. Four minors carried to the implementer: (1) the biggest unnamed piece of work is generalizing useConfigWizard from single-file to a multi-file draft — GAME_CONFIG_KEY at useConfigWizard/index.ts:23, draft state, toFileScopedIssues, isDirty and the apply files[] are all scoped to one key today; (2) AC-3's open question resolves to 'no bare config:save caller' — the wizard emits only CONFIG_APPLY (useConfigWizard/index.ts:169-179); (3) AC-5's content-root override already exists suite-wide (playwright.config.ts:32,46) and admin-config-wizard.spec.ts:12-13,125 already pins/restores SETUP — do not re-plumb it; (4) the Plan's line anchors drifted: the typeof-window guard is HostControlPanel/index.tsx:34-37, the lab dispatch :88-90, the import opens at :5 — sampleDraft.ts:8-15 and eslint.config.mjs:13,16 are exact as claimed. Watch the 260-line cap on components/**/index.tsx (wizard entry is at 185) and wingnight/no-hardcoded-component-jsx-text (new step copy goes in copy/admin.ts).
- 2026-08-07T17:37:07.716Z prototype: skipped (not in plan) — needs_prototype is false; `work ship-plan WN-19 --json` emits select→gate1→implement→test→qa→browser→gate2→land with no prototype phase.
- 2026-08-07T17:37:34.904Z claimed → in-progress @ /Users/bradleyexton/Projects/wing-night-WN-19
- 2026-08-07T17:42:14.313Z AC-3 settled before building (both halves).
(a) READ/WRITE SHAPE ASYMMETRY — the draft holds the WRITE shapes, not the read ones. ConfigContentSnapshot hands back flat arrays (players[], teams[], triviaPrompts[], drawingPrompts[]) while ConfigFileEdit.value must be the whole file object ({players:[]}, {teams:[]}, {prompts:[]} x2). Resolution: wrap ONCE at seed time (toConfigDraft) so the draft is always exactly what goes on the wire — same discipline gameConfig already has, where the draft IS a GameConfigFile. The alternative (keep flat arrays, wrap at apply) puts the adapter on the hot path and lets a draft exist that is not a valid file.
(b) BARE config:save — the wizard does NOT emit it. WN-11's Review makes apply the single action and nothing else calls save, so a bare save would have no caller. The server-side save path stays as-is: it is part of the wire contract, is covered by configEvents.test.ts:120,138, and removing it is not in scope.
(c) Consequence decided here: apply emits only the files whose draft differs from the seeded baseline. Writing every file would promote untouched content/sample files into content/local/ (local wins over sample on every later read), silently converting a fallback into an override the host never asked for.
- 2026-08-07T17:52:13.140Z Build complete, pre-e2e. Shape of the diff: (1) useConfigWizard generalized single-file -> multi-file — draft/baseline are now a ConfigDraft over all five writable keys, issues are exposed per file (issueMessagesByFile) because a step now edits two files at once and 'players.name' vs 'gameConfig.name' would collide on the bare field path, and editFile(key, transform) replaces editGameConfig. (2) New pure modules with colocated tests: contentDraft/ (toConfigDraft, selectDirtyEdits, selectDraftIssues, blank/next entry templates, setPlayerAvatarSrc) and entryListDraft/ (setEntry/addEntry/removeEntry, generic over any {listKey: Entry[]} file — the roster and both packs are four instances of one shape). (3) New surfaces: EntryListEditor/ (field-spec-driven list rows, shared by all four lists), RosterStep/, PromptPacksStep/; ReviewStep gains a prompt-packs row and the AC-1 overwrite warning, and its roster row lost the now-false 'edited on /host, not here'. (4) Lab deleted: git rm ConfigSetupPrototype/, the imports at index.tsx:5-8, the WN-3 typeof-window guard, the dispatch, and the eslint.config.mjs ignores entry. Grep confirms zero remaining references outside ticket prose. Gate so far: pnpm lint clean (exit 0), pnpm typecheck clean, pnpm test exit 0 — 677 assertions, fail 0.

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
- Spine: WN-11 (dep). Auth hardening: WN-12. Onboarding gap for the catalog outputs: WN-13.
- Split rationale: `.work/verdicts/WN-11.gate1.json` major 3.
