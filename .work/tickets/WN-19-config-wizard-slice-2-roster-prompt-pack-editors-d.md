---
id: WN-19
title: "Config wizard slice 2: Roster + prompt-pack editors, delete the lab and its eslint carve-out"
status: done
kind: feature
priority: medium
created: 2026-08-07
deps: [WN-11]
blocked_by: []
worktree: "/Users/bradleyexton/Projects/wing-night-WN-19"
landed_range: cb6a599ef9e283a01384ce1dc8916a445a73901f..7bcdc844d59917ec08a18552ba43b3d75f8130ba
review: pending
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
- 2026-08-07T17:57:13.675Z Anti-blind-spot sweep (work grep --since e86cb78): 170 touched symbols, 30 flagged names. Every flagged name is either a generic local (apply, baseline, snapshot, draft, prompt, player, suffix, url, timeoutId...) or a style token I re-exported without changing. The three that could actually have broken a caller, opened and checked by hand: (1) roundCard/roundHead — renamed in fieldTokens to entryCard/entryHead; the ONLY consumer is LineupStep, whose styles.ts now aliases them back, so LineupStep/index.tsx:41-42 resolves unchanged. (2) The deleted lab's runtime surface — grep for 'variant=' across apps/packages/tools/tests/README returns ZERO hits, so nothing reaches /host?variant=A|B|C any more. (3) AdminConfigWizard's only consumer is App.tsx:48 and its prop (socket) is unchanged. Also opened HostControlPanel/index.tsx post-deletion: imports, the WN-3 typeof-window guard and the dispatch are all gone and the component is back to a plain render. One gap the sweep surfaced and I closed rather than noted: the gameConfig prefix/strip round trip (previously toFileScopedIssues, now selectDraftIssues) had no direct assertion, so a regression would have shown as issues silently not landing on IdentityStep's bare 'name' path. Added contentDraft test 'prefixes a game config issue with its own key so the step's bare path still resolves'.
- 2026-08-07T18:05:49.052Z browser-verify: RAN and passed, though the O-6 predicate said skip. The ticket's frontmatter is kind: feature, so readBrowserOutcome returns skip and no browser phase was required. I ran one anyway and recorded a pass verdict (.work/verdicts/WN-19.browser.json, sha 8958be1) because WN-11 — the spine this sits on — took the skip and named the residual gap out loud: 'nobody has LOOKED at the wizard, so a layout or contrast defect that does not break a role-based locator would survive both the spec and this skip.' This slice adds two more visible steps to that same unlooked-at surface, so the gap was compounding. Booted the e2e stack (seeded content root, server 3100, vite 5273) and drove a real Chromium over all six steps. Findings: every step renders correctly against the house idiom; the roster shows 16 player cards (name + optional avatar) and 4 team cards with the AC-1 overwrite hint; prompt packs shows trivia and drawing with the read-only id column present; geo renders as '8 photo prompts' + the pnpm import:geo pointer with no editor; Review carries the new prompt-packs row and the overwrite warning, and its roster row no longer claims 'edited on /host, not here'. Emptying a team name paints the danger border and renders 'must be a non-empty string' under the field, and Review then reads 'Fix the highlighted fields first' disabled — proving the gate reads the whole draft, not just the edited step. Zero pageerror and zero console.error across the whole pass. Screenshots at .work/verdicts/WN-19-browser/ (gitignored, per-run, beside the verdict). NO design comparison was possible and none is claimed — apps/client/public/mockups/ has no /admin entry, because the wizard's design lived in the ConfigSetupPrototype lab this ticket deletes; graded against the house idiom instead. Three INFO findings carried, none blocking and none in scope here: the drawing editor renders all 62 prompts as full cards (~10,600px tall), a read-only prompt id looks identical to an editable input, and single-field entries leave the two-column grid half empty. Recorded BEFORE the handoff so the attested tree and the landed tree are the same one.
- 2026-08-07T18:08:04.791Z handed off → in-review (verify green); awaiting land
- 2026-08-07T18:09:32.947Z auto-landed on green verdicts + attestation (in-review → done); review: pending

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

<!-- captured-evidence:start -->
**Verify gate:** ✓ PASS (3 step(s))

```
✓ lint: pnpm lint
✓ typecheck: pnpm typecheck
✓ test: pnpm test
```

**Anti-blind-spot grep:** 31 symbol(s) with external call-sites reviewed (5 low-signal name(s) skipped: context, files, next, parsed, path):

- `Prompt` → apps/client/src/components/MinigameDevSandbox/index.test.tsx:36, packages/minigames/drawing/src/client/HostDrawingSurface/copy.ts:9
- `apply` → apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.ts:12, apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.ts:107, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.test.ts:43, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.test.ts:44, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.test.ts:54, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.test.ts:67, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.test.ts:100, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.ts:20, … 22 more (run `work grep`)
- `applyButton` → apps/client/src/components/AdminConfigWizard/ReviewStep/styles.ts:1
- `baseline` → apps/client/src/components/DisplayBoard/StageSurface/FinalResultsStageBody/styles.ts:40, apps/client/src/components/HostControlPanel/styleTokens/index.ts:102, apps/client/src/components/RootRouteLanding/styles.ts:48, apps/server/src/reloadContentIntoRoomState/index.ts:45, apps/server/src/roomState/baseMutations/index.ts:62, packages/minigames/geo/src/client/DisplayGeoSurface/styles.ts:9, packages/minigames/geo/src/client/HostGeoSurface/styles.ts:6
- `buildSnapshot` → apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:21, apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:48, apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:62, apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:76, apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:86, apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:96, apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:110, apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:125, … 69 more (run `work grep`)
- `cycle` → packages/shared/src/content/gameConfig/index.ts:3
- `draft` → apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.test.ts:109, apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.test.ts:137, apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.ts:11, apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.ts:13, apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.ts:106
- `edits` → apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.test.ts:50, apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.test.ts:54, apps/client/src/components/AdminConfigWizard/selectIssueMessages/index.ts:7, apps/server/src/contentWriter/index.ts:97, apps/server/src/contentWriter/index.ts:100, apps/server/src/contentWriter/index.ts:115, apps/server/src/readConfigContent/index.ts:20, apps/server/src/reloadContentIntoRoomState/index.test.ts:70
- `fieldPath` → packages/shared/src/content/gameConfig/validateGameConfigFile/index.ts:111, packages/shared/src/content/gameConfig/validateGameConfigFile/index.ts:115, packages/shared/src/content/gameConfig/validateGameConfigFile/index.ts:120, packages/shared/src/content/gameConfig/validateGameConfigFile/index.ts:126, packages/shared/src/content/gameConfig/validateGameConfigFile/index.ts:130, packages/shared/src/content/gameConfig/validateGameConfigFile/index.ts:135, packages/shared/src/content/gameConfig/validateGameConfigFile/index.ts:142
- `handleKeyDown` → apps/client/src/components/HostControlPanel/OverrideDock/index.tsx:46, apps/client/src/components/HostControlPanel/OverrideDock/index.tsx:55, apps/client/src/components/HostControlPanel/OverrideDock/index.tsx:58
- `hostPage` → tests/e2e/host-display-sync.spec.ts:16, tests/e2e/host-display-sync.spec.ts:19, tests/e2e/host-display-sync.spec.ts:22, tests/e2e/host-display-sync.spec.ts:23, tests/e2e/host-display-sync.spec.ts:27, tests/e2e/host-display-sync.spec.ts:37, tests/e2e/host-display-sync.spec.ts:43, tests/e2e/host-display-sync.spec.ts:49, … 72 more (run `work grep`)
- `isLocked` → apps/client/src/components/AdminConfigWizard/ClocksScoringStep/index.tsx:12, apps/client/src/components/AdminConfigWizard/ClocksScoringStep/index.tsx:27, apps/client/src/components/AdminConfigWizard/ClocksScoringStep/index.tsx:56, apps/client/src/components/AdminConfigWizard/ClocksScoringStep/index.tsx:89, apps/client/src/components/AdminConfigWizard/IdentityStep/index.tsx:11, apps/client/src/components/AdminConfigWizard/IdentityStep/index.tsx:20, apps/client/src/components/AdminConfigWizard/IdentityStep/index.tsx:35, apps/client/src/components/AdminConfigWizard/LineupStep/index.tsx:17, … 23 more (run `work grep`)
- `issueMessagesByPath` → apps/client/src/components/AdminConfigWizard/ClocksScoringStep/index.tsx:11, apps/client/src/components/AdminConfigWizard/ClocksScoringStep/index.tsx:26, apps/client/src/components/AdminConfigWizard/ClocksScoringStep/index.tsx:32, apps/client/src/components/AdminConfigWizard/ClocksScoringStep/index.tsx:68, apps/client/src/components/AdminConfigWizard/ClocksScoringStep/index.tsx:100, apps/client/src/components/AdminConfigWizard/IdentityStep/index.tsx:10, apps/client/src/components/AdminConfigWizard/IdentityStep/index.tsx:19, apps/client/src/components/AdminConfigWizard/IdentityStep/index.tsx:32, … 8 more (run `work grep`)
- `lockBanner` → apps/client/src/components/AdminConfigWizard/styles.ts:34
- `normalized` → packages/minigames/drawing/src/client/strokeRendering/index.ts:5, packages/minigames/drawing/src/client/strokeRendering/index.ts:10, packages/minigames/drawing/src/runtime/guards/index.ts:205, packages/minigames/geo/src/runtime/index.test.ts:173, packages/shared/src/roomState/index.ts:117
- `numberInput` → apps/client/src/components/AdminConfigWizard/ClocksScoringStep/index.tsx:51, apps/client/src/components/AdminConfigWizard/ClocksScoringStep/index.tsx:84, apps/client/src/components/AdminConfigWizard/ClocksScoringStep/styles.ts:1, apps/client/src/components/AdminConfigWizard/LineupStep/index.tsx:139
- `pack` → apps/client/src/components/AdminConfigWizard/IdentityStep/index.tsx:26, apps/client/src/components/AdminConfigWizard/IdentityStep/index.tsx:30, apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.test.ts:50, apps/server/src/contentWriter/index.test.ts:170, packages/shared/src/content/drawing/index.test.ts:21, packages/shared/src/content/drawing/index.test.ts:49, packages/shared/src/content/promptPack/index.ts:24, packages/shared/src/content/promptPack/index.ts:41, … 2 more (run `work grep`)
- `player` → apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:28, apps/client/src/components/DisplayBoard/StageSurface/resolveStageViewModel/index.ts:108, apps/client/src/components/DisplayBoard/StandingsSurface/index.test.tsx:12, apps/client/src/components/DisplayBoard/StandingsSurface/index.test.tsx:18, apps/client/src/components/DisplayBoard/StandingsSurface/index.test.tsx:24, apps/client/src/components/DisplayBoard/StandingsSurface/index.test.tsx:25, apps/client/src/components/DisplayBoard/StandingsSurface/index.test.tsx:26, apps/client/src/components/DisplayBoard/StandingsSurface/index.test.tsx:27, … 240 more (run `work grep`)
- `previousRound` → apps/server/src/roomState/phaseMutations/index.ts:43, apps/server/src/roomState/phaseMutations/index.ts:76
- `prompt` → apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:142, apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:156, apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:186, apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:217, apps/client/src/components/HostControlPanel/HostMiniRail/index.test.tsx:107, apps/client/src/components/HostControlPanel/HostPhaseBody/index.test.tsx:87, apps/client/src/components/HostControlPanel/MinigameSurface/index.test.tsx:17, apps/client/src/components/HostControlPanel/MinigameSurface/index.test.tsx:81, … 184 more (run `work grep`)
- `raw` → packages/minigames/geo/src/client/leafletConstants/index.ts:1, tools/eslint-plugin-wingnight/rules/no-nonsemantic-color-tokens-in-styles.mjs:28
- `removeButton` → apps/client/src/components/AdminConfigWizard/LineupStep/index.tsx:46
- `roomState` → apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:39, apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:43, apps/client/src/components/DisplayBoard/StageSurface/index.tsx:158, apps/client/src/components/DisplayBoard/StageSurface/index.tsx:159, apps/client/src/components/DisplayBoard/StageSurface/index.tsx:164, apps/client/src/components/DisplayBoard/StageSurface/resolveStageViewModel/index.ts:80, apps/client/src/components/DisplayBoard/StageSurface/resolveStageViewModel/index.ts:82, apps/client/src/components/DisplayBoard/StageSurface/resolveStageViewModel/index.ts:84, … 355 more (run `work grep`)
- `roundCard` → apps/client/src/components/AdminConfigWizard/LineupStep/index.tsx:41
- `roundHead` → apps/client/src/components/AdminConfigWizard/LineupStep/index.tsx:42
- `snapshot` → apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.test.ts:31, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.test.ts:99, apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:248, apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:273, apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:297, apps/client/src/components/DisplayBoard/index.test.tsx:35, apps/client/src/components/DisplayBoard/index.test.tsx:51, apps/client/src/components/HostControlPanel/CompactSummarySurface/index.test.tsx:30, … 307 more (run `work grep`)
- `suffix` → tools/eslint-plugin-wingnight/index.mjs:2, tools/eslint-plugin-wingnight/index.mjs:14, tools/eslint-plugin-wingnight/rules/no-class-name-suffix-in-styles-exports.mjs:67, tools/eslint-plugin-wingnight/tests/index.test.mjs:6, tools/eslint-plugin-wingnight/tests/index.test.mjs:207, tools/eslint-plugin-wingnight/tests/index.test.mjs:209
- `targetIndex` → apps/client/src/components/HostControlPanel/TurnOrderSurface/index.tsx:15, apps/client/src/components/HostControlPanel/TurnOrderSurface/index.tsx:24
- `timeoutId` → apps/client/src/components/DisplayBoard/useGameStartCountdown/index.ts:58, apps/client/src/components/DisplayBoard/useGameStartCountdown/index.ts:69
- `update` → apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:130, apps/client/src/copy/display.ts:8, apps/client/src/copy/host.ts:99, tests/e2e/minigame-sandbox.spec.ts:73
- `url` → apps/client/src/components/DisplayBoard/StageSurface/SetupStageBody/HeroFlame/index.tsx:83, apps/client/src/components/DisplayBoard/StageSurface/SetupStageBody/HeroFlame/index.tsx:88, apps/client/src/components/DisplayBoard/StageSurface/SetupStageBody/HeroFlame/index.tsx:93, apps/client/src/components/DisplayBoard/StageSurface/SetupStageBody/HeroFlame/index.tsx:98, apps/server/src/contentLoader/contentLoaderUtils/index.test.ts:13, apps/server/src/contentLoader/contentLoaderUtils/index.ts:2, apps/server/src/contentLoader/contentLoaderUtils/index.ts:5, apps/server/src/contentLoader/contentLoaderUtils/index.ts:13, … 10 more (run `work grep`)

_Captured 2026-08-07T18:08:04.791Z._
<!-- captured-evidence:end -->

**Two corrections to the captured block above — read these, not it, on those two lines.**

1. **"Anti-blind-spot grep: no touched symbols in the diff" is a FALSE EMPTY, not a clean sweep.**
   `work evidence` runs the grep with no `--since`, so it diffed a committed, clean worktree and
   found nothing to survey. The real sweep was `work grep --since e86cb78`: **170 touched symbols
   across 30 flagged names**, run against the committed diff (untracked files are invisible to
   git-grep, so an unstaged sweep would have produced exactly this same confident false clean). Its
   findings and the three call-sites opened by hand are in `## Progress`.

2. **The verify gate ran FOUR steps, not the three shown.** The captured block reflects the default
   gate; the ticket's last AC also requires the full `e2e` key, and it was run —
   `work verify --steps lint,typecheck,test,e2e` → all four green (`✓ lint ✓ typecheck ✓ test
   ✓ e2e`), plus a standalone full-suite run of `CI=1 WN_E2E_SERVER_PORT=3100
   WN_E2E_CLIENT_PORT=5273 pnpm test:e2e` → **14 passed (31.3s)**. The full key matters more than
   `test_one` here for the same reason it did on WN-11: `admin-config-wizard.spec.ts` sorts first
   under `workers: 1` / `fullyParallel: false`, so this spec's applied edits are visible to every
   spec after it. They are, and the suite stays green — the rename was chosen over an add precisely
   so `overrides.spec.ts` keeps "Scorch Squad" and the roster keeps its 16/4 shape.

**Unit tests:** 677 assertions, `fail 0`, exit 0 across all 7 workspace projects.

**port-variant outputs 2 and 3: SKIPPED-AND-SAID, pending WN-13 (per the Plan).** Output 1 —
folding the picked direction into prod as a proper rewrite — is the substance of this ticket and
was done. Outputs 2 (register the shipped component in `/design-system`) and 3 (publish the pick to
`/designs/<id>`) are **not skipped because they do not apply**, but because **wing-night has not
been given those routes yet**: `resolveClientRoute` defines `ROOT | HOST | ADMIN | DISPLAY |
DEV_MINIGAME | DEV_LAB | NOT_FOUND` and nothing else, and `design/` in this repo is documentation,
not a catalog app. That is the onboarding gap **WN-13** exists to close; it can backfill the
catalog entries for `AdminConfigWizard`, `EntryListEditor`, `RosterStep` and `PromptPacksStep`
afterwards. Same disposition WN-11 recorded, for the same reason — recorded here rather than
inherited silently.

**Browser-verify ran despite the predicate saying skip.** `kind: feature` routes this to skip, but
WN-11 shipped the wizard with the gap named out loud ("nobody has LOOKED at the wizard"), and this
slice adds two more steps to that surface. A real Chromium pass over all six steps is recorded at
`.work/verdicts/WN-19.browser.json` (pass, sha 8958be1) with the screenshots above. **No
screenshot-vs-design comparison was possible and none is claimed** — `apps/client/public/mockups/`
has no `/admin` entry, because the wizard's design lived in the `ConfigSetupPrototype` lab this
ticket deletes. Three INFO findings carried for post-merge review, none blocking and none in scope:
the drawing editor renders all 62 prompts as full cards (~10,600px tall), a read-only prompt id is
visually indistinguishable from an editable input, and single-field entries leave the two-column
grid half empty.

## Links
- Spine: WN-11 (dep). Auth hardening: WN-12. Onboarding gap for the catalog outputs: WN-13.
- Split rationale: `.work/verdicts/WN-11.gate1.json` major 3.
