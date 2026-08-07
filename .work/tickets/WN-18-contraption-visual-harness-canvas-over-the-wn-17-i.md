---
id: WN-18
title: "CONTRAPTION visual harness: canvas over the WN-17 integrator for the readability/piece-set/length questions"
status: ready
kind: spike
priority: medium
created: 2026-08-07
deps: [WN-17]
blocked_by: []
---

## Goal
The **visual** half of the CONTRAPTION prototype: a throwaway canvas harness over WN-17's integrator,
so WN-15's remaining questions can be answered by driving it. This ticket builds the harness; the
judgements stay human.

## Acceptance Criteria
- [ ] A dev-only route renders the harness. It **cannot** reuse `/dev/minigame/<slug>`: `App.tsx:38`
      gates `DEV_MINIGAME` on `devMinigameType !== null` and `MinigameDevSandbox/index.tsx:14`
      imports `../../minigames/registry`, so that route requires a registered `MinigameType`, which
      the guardrail below forbids. Add a sibling dev route (e.g. `/dev/lab/<name>`) to
      `resolveClientRoute` alongside `resolveDevMinigameSlug`, **with the colocated test case its
      precedent already has** (`utils/resolveClientRoute/index.test.ts`). If WN-16 has already added
      that route, reuse it rather than adding a second.
- [ ] The harness drives WN-17's module — it does **not** reimplement or fork the integrator. Import
      it from `packages/shared`.
- [ ] WN-15's questions are answerable by driving it: failure **readability** (can the room see *why*
      a run failed), **piece set and count** (smallest set still allowing a clever solution), **one
      shot vs best-of-N**, and **sim length** against the ~4s watchable target. WN-15 calls this the
      *logic* branch but explicitly not a TUI — "do failures read as understandable" is visual.
- [ ] **Lint is pre-authorized to be handled, not discovered.** The harness lands under
      `apps/client/src/components/**`, where `eslint.config.mjs:113-146` enables the wingnight
      component rules (`no-hardcoded-component-jsx-text`, `no-inline-style-prop`,
      `require-styles-import-in-component-entry`, `component-entry-file-name`, `max-lines` 260/140).
      A live-control harness violates these by construction — `ConfigSetupPrototype` scored 8 such
      errors. **Decision made here so the implementer does not halt at the fork the way WN-3's agent
      did:** add a mirrored `ignores` entry for this harness's folder in `eslint.config.mjs`, with an
      inline comment naming **WN-15** as the ticket that deletes both the harness and the entry. This
      is a scope carve-out for throwaway code, not a rule disable — no rule definition changes and no
      `eslint-disable` comment anywhere.
- [ ] **No bare `window` / `import.meta.env` at module or render scope**, and prove it with a
      colocated unit test that **imports the harness module**. Do not rely on `pnpm test` passing as
      the proof: nothing in `apps/client/src` imports `App` (`App.tsx:46` already reads bare
      `window.location.pathname` at render scope), so an unimported module's bare `window` sails
      through green — gate1 correctly called that guard "false comfort".
- [ ] Scope guardrail: no package under `packages/minigames/`, no `MINIGAME_DEFINITIONS` entry, no
      registry changes.
- [ ] **`pnpm lint`, `pnpm typecheck` and `pnpm test` all pass** — all three manifest verify keys.

## Plan
Split out of WN-17 at gate1's direction: the module + byte measurement are headless and autonomous,
this half is the disposable visual layer serving human judgement. Deps on WN-17 so the integrator
exists to drive.

The lint carve-out above is the deliberate answer to the fork WN-3's agent halted at. It is decided
here at planning time rather than left for the implementer to discover mid-run.

Pre-verified 2026-08-07: `App.tsx:38-39` dispatch; `MinigameDevSandbox/index.tsx:14` registry import;
`eslint.config.mjs:113-146` component rule scope and `:14-16` the ConfigSetupPrototype ignore
precedent; `App.tsx:46` bare `window.location.pathname`.

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
- Headless half: WN-17 (dep). Consumer: WN-15.
- Route-surface sibling: WN-16 (same dev-lab route; whichever lands first adds it).
- Prior combined rejection: `.work/verdicts/WN-17.gate1.json` major 3 (scope split).
