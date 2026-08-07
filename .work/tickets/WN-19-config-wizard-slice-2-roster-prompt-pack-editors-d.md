---
id: WN-19
title: "Config wizard slice 2: Roster + prompt-pack editors, delete the lab and its eslint carve-out"
status: ready
kind: feature
priority: medium
created: 2026-08-07
deps: [WN-11]
blocked_by: []
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

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
- Spine: WN-11 (dep). Auth hardening: WN-12. Onboarding gap for the catalog outputs: WN-13.
- Split rationale: `.work/verdicts/WN-11.gate1.json` major 3.
