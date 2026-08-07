---
id: WN-16
title: "ANAMORPH prototype lab: answer the jitter/curve/dial questions in a throwaway dev-route lab"
status: ready
kind: spike
priority: medium
created: 2026-08-07
deps: []
blocked_by: []
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
- [ ] **No bare `window` or `import.meta.env` at module or render scope.** WN-3 had to add a
      `typeof window` guard because `ConfigSetupPrototype` crashed all 16 `HostControlPanel` tests
      under `tsx --test` (no DOM, no Vite) — and that guard reddened the gate for every ticket until
      it was fixed. Do not repeat it: gate on a prop or a route-level check that is inert under the
      test runner, and confirm by running `pnpm test` with the lab present.
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
- [ ] `pnpm typecheck` and `pnpm test` pass, **with the lab present** (that is the WN-3 regression
      guard, not a formality).

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

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
- Answers feed WN-14 (blocked on the human pick, then re-planned via plan-work Mode B).
- Question source: WN-14's `**Why needs_prototype: true**` section. Idea doc:
  `docs/minigames/ideas/anamorph.md`.
- Crash precedent to avoid: WN-3 (`typeof window` guard, `HostControlPanel/index.tsx`).
