---
id: WN-16
title: "ANAMORPH prototype lab: answer the jitter/curve/dial questions in a throwaway dev-route lab"
status: in-progress
kind: spike
priority: medium
created: 2026-08-07
deps: []
blocked_by: []
worktree: "/Users/bradleyexton/Projects/wing-night-WN-16"
---

## Goal
Build the throwaway lab that answers WN-14's four feel questions. **This ticket builds the lab; it
does not pick the answers** — the pick is a human judgement made by driving it. Splitting the build
off means the lab can be produced autonomously and the pick becomes a five-minute review afterwards,
instead of stalling WN-14 mid-pipeline waiting for a person.

## Acceptance Criteria
- [ ] A dev-only route renders the lab. It **cannot** reuse `/dev/minigame/<slug>`: `App.tsx:38`
      gates `DEV_MINIGAME` on `devMinigameType !== null` and `MinigameDevSandbox/index.tsx:14`
      imports `../../minigames/registry`, so that route requires a registered `MinigameType` —
      which the guardrail below forbids. Add a sibling dev route (e.g. `/dev/lab/<name>`) to
      `resolveClientRoute` alongside `resolveDevMinigameSlug`, following the same shape.
- [ ] **Scope guardrail (from WN-14, restated because it is the whole risk):** the lab must NOT
      create a package under `packages/minigames/`, add a `MINIGAME_DEFINITIONS` entry, or touch
      either registry. Adding a `MinigameType` is a type-level fan-out — every
      `Record<MinigameType, …>` in the repo stops compiling until fully wired, so there is no
      throwaway half-state. The lab is a canvas, a point array and controls: no server, no teams,
      no scoring, no phases, no content pipeline.
- [ ] **No bare `window` or `import.meta.env` at module or render scope**, proven by a **colocated
      unit test that imports the lab module**. WN-3 had to add a `typeof window` guard because
      `ConfigSetupPrototype` crashed all 16 `HostControlPanel` tests under `tsx --test` (no DOM, no
      Vite), reddening the gate for every ticket until fixed. But do **not** treat a green `pnpm test`
      as the proof: nothing in `apps/client/src` imports `App` (`App.tsx:46` already reads bare
      `window.location.pathname` at render scope), so an unimported lab module's bare `window` passes
      green and the guard never fires — gate1 correctly called that "false comfort". The importing
      test is the actual check.
- [ ] **Lint is pre-authorized to be handled, not discovered.** The lab lands under
      `apps/client/src/components/**`, where `eslint.config.mjs:113-155` enables the wingnight
      component rules (`component-entry-file-name`, `no-hardcoded-component-jsx-text`,
      `no-inline-style-prop`, `require-styles-import-in-component-entry`, `max-lines` 260). A
      four-knob control lab is hardcoded labels and runtime style values by construction —
      `ConfigSetupPrototype` scored 8 such errors. **Decision made here so the implementer does not
      halt at the fork WN-3's agent halted at:** add a mirrored `ignores` entry for this lab's folder
      in `eslint.config.mjs`, with an inline comment naming **WN-14** as the ticket that deletes both
      the lab and the entry. A scope carve-out for throwaway code — not a rule disable, no rule
      definition changes, no `eslint-disable` anywhere.
- [ ] The new `resolveClientRoute` branch gets **the colocated test case its precedent already has**
      (`utils/resolveClientRoute/index.test.ts`).
- [ ] The lab makes all four of WN-14's questions **answerable by driving it**, each as a live
      control — not a code edit:
      1. **Jitter magnitude** — a slider across the plausible band.
      2. **Legibility curve shape** — a toggle between linear ramp and late hard snap, since WN-14
         records these as having different game feel (hill-climb vs drama).
      3. **Antipodal mirror** — a toggle for whether the mirrored angle also resolves, so the
         "score against whichever is nearer" fix can be judged rather than assumed.
      4. **Control idiom** — two dials vs drag-to-orbit, switchable, plus a toggle for the tablet's
         own small preview of the cloud (TV-only vs preview).
- [ ] Seeded and deterministic: the same seed produces the same cloud across reloads, so two people
      comparing settings are looking at the same object.
- [ ] The lab writes nothing into prod paths and is deleted by WN-14 when it ports the answers —
      note the delete target in this ticket's Evidence so WN-14 can find it.
- [ ] **`pnpm lint`, `pnpm typecheck` and `pnpm test` all pass** — all three manifest verify keys,
      with the lab present. `lint` has been in the default gate since WN-3 landed; naming only
      typecheck+test is the exact defect that got this ticket rejected on 2026-08-07.

## Plan
The output that survives this ticket is **numbers and a decision, not code** (WN-14 says so
explicitly). So the deliverable is the lab plus a findings note; the implementer records what the
controls do and what ranges are available, and leaves the judgement to the human review.

The `?variant=` + floating-switcher idiom from the `prototype` skill does not fit cleanly here —
there is no existing real page to overlay, and the four questions are orthogonal knobs rather than
N whole-page directions. Live controls on one lab page is the honest shape; say so rather than
forcing the variant idiom.

Pre-verified 2026-08-07 against landed code: `resolveClientRoute` defines
`ROOT | HOST | DISPLAY | DEV_MINIGAME | NOT_FOUND` with `resolveDevMinigameSlug` as the prefix-match
precedent to copy; `App.tsx:38-39` is the dispatch; `MinigameDevSandbox/index.tsx:14` is the
registry import that rules that route out.

## Progress
<the executing agent appends here — the restart-safe log>
- 2026-08-07T11:00:03.502Z gate1 REJECTED (product-owner, needs-changes, confidence high) — demoted ready→needs-planning, routing to plan-work. Verdict: .work/verdicts/WN-16.gate1.json. Bottom line: every pre-verified code claim in the Plan checks out and the scope/blast-radius is sound, but the ticket ignores the OTHER half of the WN-3 precedent it cites. MAJOR: the declared finish line (`pnpm typecheck` + `pnpm test`) is narrower than the gate that will actually run — the manifest's verify has three keys and `lint: pnpm lint` has been in the default gate since WN-3. The lab lands under apps/client/src/components/**, where eslint.config.mjs:120-155 enables the wingnight custom rules (component-entry-file-name, no-hardcoded-component-jsx-text, no-inline-style-prop, require-styles-import-in-component-entry, max-lines 260). A four-knob lab is hardcoded control labels + runtime style values by construction. Not speculative: the previous throwaway lab (ConfigSetupPrototype) scored 8 such errors and the resolution shipped as a permanent ignore entry at eslint.config.mjs:14-16 — and WN-3's Progress records the agent HALTING at exactly that fork rather than deciding it. Planning fix: add `pnpm lint` to the final AC and pre-authorize the mirrored ignore entry naming WN-14 as the deleter. MINOR 1: AC#3's proof method is false comfort — nothing in apps/client/src imports App (App.tsx:46 already reads bare window.location.pathname at render scope), so a bare `window` at the lab's module scope would pass `pnpm test` green and the AC's own guard would never fire; require one colocated unit test importing the lab module, or drop the claim. MINOR 2: AC#1 mandates a new resolveClientRoute branch but never asks for the colocated test case its precedent already has (utils/resolveClientRoute/index.test.ts). INFO: route-surface overlap with WN-13 (vendored /designs + /design-system dev-gating) — a Links line, not a dep edge.
- 2026-08-07T14:34:19.543Z gate1 RE-JUDGED after re-plan (product-owner, pass, confidence high) — advancing to implement. Verdict: .work/verdicts/WN-16.gate1.json (attempt 2, supersedes the 2026-08-07 needs-changes above). All three prior findings confirmed closed against landed code: the MAJOR (lint absent from the finish line) is closed by the final AC naming all three manifest verify keys plus AC#4 pre-authorizing the mirrored eslint ignores entry — the exact fork WN-3's agent halted at, now decided in the ticket; MINOR 1 (false-comfort window proof) is closed by AC#3 requiring a colocated test that IMPORTS the lab module and explicitly disclaiming a green pnpm test as proof; MINOR 2 is closed by AC#5. Critic re-verified every file:line claim verbatim (App.tsx:38, App.tsx:46, MinigameDevSandbox/index.tsx:10-14, eslint.config.mjs:14-16, utils/resolveClientRoute/index.test.ts) and re-ran pnpm lint on HEAD: clean, exit 0, so the lint baseline is green and any error the gate reports will be the lab's own. Three INFO findings carried for the implementer: (a) AC#9 'writes nothing into prod paths' is about the lab's OUTPUT (no packages/minigames/ package, no MINIGAME_DEFINITIONS entry, no registry edits) and does NOT forbid the resolveClientRoute branch, App.tsx dispatch arm, and eslint ignores entry that AC#1/AC#4 mandate; (b) two dev-gating precedents exist — /dev/minigame is ungated-but-undiscoverable, ConfigSetupPrototype uses import.meta.env.DEV behind a caller-side typeof window guard; AC#3's word 'bare' permits either, but a guarded read needs the guard right; (c) route-surface overlap with WN-13 stays a Links line, not a dep edge.
- 2026-08-07T14:34:19.662Z prototype: skipped (not in plan) — work ship-plan WN-16 emits no prototype phase (needsPrototype: false); routing straight to implement.
- 2026-08-07T14:35:13.746Z claimed → in-progress @ /Users/bradleyexton/Projects/wing-night-WN-16
- 2026-08-07T14:43:26.309Z Route + pure core landed. resolveClientRoute gains DEV_LAB + resolveDevLabName on a /dev/lab/ prefix, mirroring resolveDevMinigameSlug; extracted the shared resolvePrefixedSegment helper so the two resolvers are one implementation (existing DEV_MINIGAME tests guard the refactor). AC#5's colocated cases added: 8/8 green in utils/resolveClientRoute/index.test.ts, covering the positive, the bare-prefix negative, the deeper-path negative, and cross-prefix non-matching. shouldCreateRoomSocket is an allowlist (HOST||DISPLAY) so DEV_LAB opens no socket for free. Pure anamorph core in components/AnamorphLab/anamorphCloud/ with 16/16 green: exact resolve at the true angle for both projection models, soup 60deg off, seed determinism (identical points + hidden angle), hidden angle stable across point-count changes, jitter monotonicity, and both curve properties (snap ~2x more scrambled than linear at 8deg inside the 25deg window, byte-identical to linear at 45deg outside it). Two modelling findings the first test run forced, both real: (1) a zero-jitter cloud is a flat plate, so off-angle it shows a FORESHORTENED silhouette, not the identical one — the test now proves it is a pure affine squash (residual <1e-9) via a fitted 2x2 map, which is the honest statement of 'too little jitter is trivial'; (2) the naive error metric conflated that foreshortening with ray-jitter scramble, so jitter ratios read ~1.9x instead of ~6x — replaced with scrambleError, which differences against the same cloud at jitter 0 and isolates the jitter term. Design note for WN-14: the antipodal question resolved to a property of the projection model, not a tunable — parallel jitter drops depth so the antipode resolves mirrored (proven exact, <1e-9); eye-ray jitter fans out from behind and does not (>0.1). The lab's mirror toggle therefore switches the model rather than fudging a score.

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
- Answers feed WN-14 (blocked on the human pick, then re-planned via plan-work Mode B).
- Question source: WN-14's `**Why needs_prototype: true**` section. Idea doc:
  `docs/minigames/ideas/anamorph.md`.
- Crash precedent to avoid: WN-3 (`typeof window` guard, `HostControlPanel/index.tsx`).
