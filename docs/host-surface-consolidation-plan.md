# Host & Display Surface Consolidation — Orchestration Plan

Written 2026-09-21 from a measured audit of all nine minigame host surfaces at the real tablet
size. This file is self-contained: an orchestrator picking it up cold should not need to re-run
the audit. Everything below is evidence, not impression.

---

## 0) The goal prompt

Paste this into a fresh chat to start the work.

> You are the orchestrator for the Wing Night host/display surface consolidation.
>
> Read `docs/host-surface-consolidation-plan.md` in full before doing anything else. It holds the
> diagnosis, the task list, the per-task subagent briefs, the guardrails and the progress log.
>
> Then run this loop until every task is checked off or a human checkpoint blocks you:
>
> 1. Re-read the Progress log section from disk. Never trust your memory of it — you may have been
>    compacted since the last iteration.
> 2. Pick the next task whose dependencies are all complete.
> 3. Dispatch exactly ONE fresh subagent for that task, with the model and reasoning effort the
>    task row specifies. Give it only that task's brief plus the Guardrails section. Do not give it
>    the whole plan; do not let it pick up adjacent work.
> 4. When it returns, VERIFY THE WORK YOURSELF by running the task's verify command and reading its
>    exit code and output. Never route on the subagent's prose. A subagent saying "tests pass" is a
>    claim; a green run you executed is proof.
> 5. On green: commit with a message in this repo's voice (see Guardrails), append a one-line entry
>    to the Progress log with the task id, the SHA and what actually changed, and continue.
> 6. On red: dispatch one repair subagent with the failing output. If it fails twice, stop and
>    report to the human with the output.
> 7. At a task marked HUMAN CHECKPOINT, stop and ask. Do not proceed past it on your own judgement.
>
> Work on the branch you are on; commit per green task. Do not open a pull request — this repo
> ships to main. Do not run tasks in parallel unless the task table marks them parallel-safe, and
> never let two subagents touch the same package at once.
>
> Start by reading the plan.

---

## 1) Diagnosis

The host shell already has a working design system: `apps/client/src/components/HostControlPanel/
styleTokens/index.ts`, 190 lines, named roles, composed by five host stages, the mini-rail, the CTA
bar and the whole AdminConfigWizard, whose step files are mostly re-exports of it.

It stops exactly at the takeover boundary. `DESIGN.md` §2.0A says of `MINIGAME_PLAY`: *"the deck
collapses and the minigame package owns the full canvas. The shell steps out of the way."* Nine
minigame packages then invented their own anatomy — §2.4 through §2.11, one "surface language"
apiece.

They could not have done otherwise. **`AGENTS.md:62` forbids minigame packages from importing
`apps/client`, while `AGENTS.md:259` tells host surfaces to prefer the Host language utilities from
`HostControlPanel/styleTokens`.** Both are house law. A minigame surface cannot obey both. Three
independent mechanisms enforce the ban: `apps/client/package.json` has no `main`/`types`/`exports`,
`tsconfig.base.json` declares no `paths`, and no minigame package declares the dependency.

`packages/cast` is the precedent. Its own entry file says why it exists: *"It is a package rather
than a client component so a minigame package can draw a player's bird too — the minigame packages
cannot import from apps/client, and a second copy of the bird would drift from the first."*

### Measured evidence

Canvas share at 1280x800 (1,024,000 px), measured live through `/dev/minigame/<slug>`:

| Game | The part you touch or watch | Share |
|---|---|---|
| GEO | map 1227x747, chrome floats over it | **90%** |
| SONG_GUESS | console column 887x717 | 62% |
| JOUST | arena 887x689 | 60% |
| SCHLONIC | stage 887x685 | 59% |
| FAPPY | corridor 887x685 | 59% |
| EMOJI_CHARADES | picker 893x668 | 58% |
| DRAWING | board 938x586, letterboxed in a 1163x604 slot | 54% |
| TRIVIA | question card + two buttons, 355px of dead air | 36% |
| RECREATE | target + prompt, 268px empty at the bottom | 33% |

GEO proves the shell permits 90%. Nothing structural stops the others.

### Duplication

- `resolveActiveTeamName` is copy-pasted **verbatim into all nine** host `index.tsx` files.
- The rail skeleton `flex flex-wrap items-center gap-x-4 gap-y-1 px-1 pr-[clamp(9rem,15vw,12rem)]
  text-xs font-extrabold uppercase tracking-[0.22em] text-muted` is byte-identical in JOUST, FAPPY,
  SCHLONIC and SONG_GUESS, all four under the identical comment *"Mini-rail strip, echoing the host
  shell anatomy (DESIGN.md §2.0A)."*
- `deck = "flex w-[clamp(230px,28vw,330px)] flex-col gap-3"` byte-identical in those same four;
  EMOJI_CHARADES uses a fifth width, `clamp(240px,25vw,330px)`.
- The team-colour dot has **four spellings across six files** and is `bg-primary` in every one, so
  it is never the team's colour — while `teamThemeByTeamId` exists in the client and simply is not
  on the renderer props.
- Eight of nine say `"No team assigned"`; TRIVIA says `"No assigned team"`.
- Five spellings of "quiet secondary deck button", four of "waiting note", and the gold status card
  exists in two irreconcilable colour systems (`from-[#3a1d09] to-[#1a0c04]` vs
  `from-surfaceAlt to-surface`).
- `RunningTotals` is a near-clone component in four packages: same props shape, same
  `Object.keys(view.pendingPointsByTeamId)` loop, same active-row conditional.
- On the TV: `marqueeTeamName` and `marqueeTitle` are byte-identical across six display surfaces,
  and three of the six are silently missing the bulbs the other three have. There are **two
  independently authored timer chips** — `TakeoverTimerChip` and `DisplayBoard/StageSurface/
  MinigameStageBody` — different clamps, different keyframes, same concept.

### Inconsistent role placement

Where a control lands matters more than how it is styled. A host moving between games relearns the
tablet each time.

- **Turn counter** appears in four places: top-left pill, floating chip, right-deck card, header
  top-right.
- **Points** in five: rail top-right (x3), floating bottom-right, deck card, mid-canvas seal, absent.
- **Primary advance**: bottom-left (GEO), deck-mid (SONG_GUESS, JOUST), deck-top (EMOJI),
  full-width canvas-bottom (RECREATE), absent in four, and RECREATE has three of them.
- **Verdicts**: bottom-centre full width (TRIVIA), bottom-right (DRAWING, with "Nope" left of
  "Correct"), right rail (SONG_GUESS, EMOJI), centre panel (RECREATE).
- **Hint text**: top of canvas (TRIVIA, EMOJI), under the board (JOUST, FAPPY, SCHLONIC), floating
  bottom-left (GEO), absent (SONG_GUESS, DRAWING).

### Two live bugs, not preferences

1. **TRIVIA's `INCORRECT` button sits under the corner dock.** `actions` (`styles.ts:63`) has no
   right gutter and `playArea` is `w-full flex-1`, so the right-hand grid cell at the foot of the
   canvas lands beneath the dock's 48px circle.
2. **RECREATE's `Next target` button, same.** `nextTargetButton` is `min-h-14 w-full`, last child of
   a container whose only padding is `p-5`. RECREATE guards its top-right and not its bottom-right.

### The gutter is wrong in both directions

`DESIGN.md:92` states the ~4.5rem bottom-right reserve in prose. In code it is nine hand-typed
paddings in three idioms. Only GEO, DRAWING and EMOJI_CHARADES have a play-phase clock
(`minigameDefinitions` sets `timerKey: null` for the rest, and `TakeoverTimerChip` returns null).
So **JOUST, SCHLONIC, SONG_GUESS, FAPPY and RECREATE reserve ~12rem of top-right for a chip that
never renders, while DRAWING and EMOJI_CHARADES, which do have clocks, reserve nothing.**

---

## 2) Decisions already made

These were settled by the repo owner on 2026-09-21. Do not relitigate them.

1. **The shell owns the chrome.** `MinigamePlayTakeover` will render the real `HostMiniRail`, the
   timer chip and the dock as structural layout. Minigames render a body only and stop drawing
   rails. The data already exists: `HostMiniRail/selectHeaderContext` computes round, sauce,
   minigame and active team, including a `MINIGAME_PLAY` branch, and the takeover currently throws
   it away on the one phase where nine packages re-derive a worse version.
2. **JOUST, FAPPY and SCHLONIC go full-bleed**, GEO's floating-chrome model. The 330px deck goes.
3. **Lint extends to `packages/minigames/**` now**, not later, with its 28 pre-existing violations
   fixed in the same phase.
4. **Host and display are both in scope.** Phase 5 is the cut line if the project has to be
   shortened; phases 1-4 stand alone.

### Two explicit layouts, never one configurable component

`docs/adr/0002` forbids behaviour-switch props and multi-flag configuration objects;
`docs/adr/0003` says "favor explicit, small helpers over configurable abstractions". So the package
exports two named layouts, not one with a `fullBleed` flag:

- **`<TakeoverStage>`** — rail row, body, optional deck column. For panel-shaped games.
- **`<TakeoverCanvas>`** — full-bleed body with chrome floating over it, and corner slots that
  already know where the timer chip and the dock live. GEO's model, generalised.

Everything else ships as **tokens, not components**, except four things with real structure that
clear ADR-0002's three-call-site bar comfortably: the rail, the deck column, the standings panel
and the arena frame.

---

## 3) Task table

Model and effort are per-task. `opus` for anything that makes a judgement call or writes prose that
will live in the repo; `sonnet` for mechanical work with an unambiguous spec; `haiku` for trivial
single-file edits. Effort is the reasoning budget the orchestrator should set on the subagent.

Verify commands: `GATE` means `pnpm lint && pnpm typecheck && pnpm test`. `E2E` means
`CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e`. Any task touching
`apps/client/src/**`, `packages/minigames/**/*.tsx` or `tests/e2e/**` needs both.

### Phase 1 — Make the system reachable, and govern it

| id | Task | Model / effort | Depends | Verify |
|---|---|---|---|---|
| T1.1 | Create `packages/surface` (`@wingnight/surface`) with `packages/cast`'s exact manifest shape | sonnet / medium | — | GATE |
| T1.2 | Move `HostControlPanel/styleTokens` into the package; update every importer | sonnet / medium | T1.1 | GATE + E2E |
| T1.3 | Resolve the keyframe coupling (see Unknowns) | opus / high | T1.1 | GATE + E2E |
| T1.4 | Extend eslint: new package into the four globs, plus `packages/minigames/*/src/client/**`, plus the SVG-primitive path carve-out | opus / high | T1.1 | `pnpm lint` |
| T1.5 | Fix 9 hardcoded JSX strings into `copy.ts` + 1 inline style prop (`HostDrawingSurface/index.tsx:265`) | sonnet / medium | T1.4 | GATE |
| T1.6 | Extract the 5 over-cap files (see below) | opus / high | T1.4 | GATE + E2E |
| T1.7 | Sandbox renders `TakeoverTimerChip` in the host preview | sonnet / low | — | GATE + E2E |
| T1.8 | Quick wins: RECREATE bottom-right gutter; `"No assigned team"` → `"No team assigned"` | haiku / low | — | GATE |

**T1.6 is the seam-finding exercise, not busywork.** The five files over the 260-line cap are
`HostFappySurface` (334), `DrawingCanvas` (337), `ZoneProps` (272), `HostSchlonicSurface` (290),
`Perch` (264). For the host surfaces, the things to extract — `RunningTotals`, `ShotHistory`,
`LegHistory`, `RunHistory` — are exactly the near-clone components that become shared primitives in
phase 3. Extract along those lines and the shared component boundaries fall out of the work rather
than being guessed at. `ZoneProps` and `Perch` are SVG scene internals and should be split on their
own terms.

T1.7 and T1.8 are parallel-safe with everything else in phase 1.

### Phase 2 — The takeover layout

| id | Task | Model / effort | Depends | Verify |
|---|---|---|---|---|
| T2.1 | Write the layout API spec: slots, corner budget, z-index scale, what the shell owns vs the game — prose first, no code | opus / max | T1.2 | human read |
| T2.2 | Implement `<TakeoverStage>` and `<TakeoverCanvas>` in the package, with colocated tests | opus / high | T2.1 | GATE |
| T2.3 | Shell: `MinigamePlayTakeover` draws rail + chip + dock structurally; update the `MinigameSurface` seam | opus / high | T2.2 | GATE + E2E |
| T2.4 | Migrate TRIVIA; fix its dock collision; delete its `resolveActiveTeamName` | opus / high | T2.3 | GATE + E2E |
| T2.5 | Measure TRIVIA at 1280x800, screenshot, record the new canvas share in the Progress log | sonnet / low | T2.4 | — |
| — | **HUMAN CHECKPOINT** — does the new anatomy feel right on the actual tablet before eight more games adopt it | — | T2.5 | — |

The z-index scale in T2.1 matters more than it looks. Today it is undeclared and discoverable only
from comments: the dock is `z-[1100]` because Leaflet reaches z-1000, the timer chip is `z-10`, and
GEO's floating chrome also picks `z-[1100]` and is only kept off the dock by an `isolate` on its
container. A minigame that forgets `isolate` and picks 1100 paints over the only two controls the
host has. The spec must make this a declared budget.

### Phase 3 — The arcade three go full-bleed

| id | Task | Model / effort | Depends | Verify |
|---|---|---|---|---|
| T3.1 | JOUST → full-bleed. Also defines the shared standings and history primitives | opus / high | T2.4 + checkpoint | GATE + E2E |
| — | **HUMAN CHECKPOINT** — is full-bleed right, before three more games follow | — | T3.1 | — |
| T3.2 | FAPPY → full-bleed | opus / high | T3.1 | GATE + E2E |
| T3.3 | SCHLONIC → full-bleed | opus / high | T3.1 | GATE + E2E |
| T3.4 | SONG_GUESS → shared primitives (it is a console, not an arena; judge whether full-bleed suits it) | opus / high | T3.1 | GATE + E2E |

T3.2, T3.3 and T3.4 are parallel-safe with each other (disjoint packages) once T3.1 has landed the
shared primitives. They are not parallel-safe with T3.1.

Each of these has a per-game DESIGN.md section (§2.7 JOUST, §2.9 FAPPY, §2.11 SCHLONIC) that
describes the deck layout being removed. Update the section in the same commit as the game, or
phase 6 inherits a pile of stale prose.

### Phase 4 — The remaining host surfaces

| id | Task | Model / effort | Depends | Verify |
|---|---|---|---|---|
| T4.1 | DRAWING. Height-bound: its 16:10 board letterboxes against height, so vertical chrome the shell reclaims turns into board width at 1.6x | opus / high | T3.1 | GATE + E2E |
| T4.2 | EMOJI_CHARADES. Note it gates on `hostView.status`, not `phase` — a different axis from every other game | opus / high | T3.1 | GATE + E2E |
| T4.3 | RECREATE. The most divergent: three primary buttons, its own `p-5` inside the shell's gutter, the only game with the turn counter top-right and the team on its own row | opus / high | T3.1 | GATE + E2E |
| T4.4 | GEO. The reference implementation — mostly adopting names it already invented | opus / medium | T3.1 | GATE + E2E |

All four are parallel-safe with each other.

### Phase 5 — The display surfaces

| id | Task | Model / effort | Depends | Verify |
|---|---|---|---|---|
| T5.1 | Collapse the two timer chips into one primitive | opus / high | T4.4 | GATE + E2E |
| T5.2 | Marquee primitive; migrate the six surfaces that have one; restore the missing bulbs | opus / high | T5.1 | GATE + E2E |
| T5.3 | Fix the TV gutter inversion (four surfaces reserve for absent chips; EMOJI uses a seventh idiom, an empty grid column) | opus / medium | T5.2 | GATE + E2E |
| — | **HUMAN CHECKPOINT** — TRIVIA and SONG_GUESS have no marquee at all. Do they get one? | — | T5.2 | — |

### Phase 6 — Write it down

| id | Task | Model / effort | Depends | Verify |
|---|---|---|---|---|
| T6.1 | `DESIGN.md` §2.0B "Takeover anatomy" — the chapter that was never written | opus / high | T5.3 | human read |
| T6.2 | Reconcile §2.4–§2.11 with what shipped | opus / high | T6.1 | human read |
| T6.3 | `docs/minigame-authoring-guide.md` — it currently says nothing about host layout, the rail, the dock gutter or the canvas, which is why every new game re-derives them from a neighbour | opus / medium | T6.1 | human read |
| T6.4 | ADR-0005 recording the decision and its guardrails | opus / high | T6.1 | human read |

`TASKS.md` has an unchecked item D9 for "full-screen takeover shell rules". T6.1 closes it.

---

## 4) Guardrails — give this section to every subagent

**The gate.** Every change ends in a runnable check and the output is the evidence.
`pnpm lint && pnpm typecheck && pnpm test`. Anything under `apps/client/src/**`,
`packages/minigames/**/*.tsx` or `tests/e2e/**` also needs
`CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e`. If a check fails, say so with
the output. If a step was skipped, say that.

**A live preview stack SIGTERMs the Playwright webServers.** Stop any preview before running e2e or
the suite reds out on connection refused.

**Node 25.** `package.json` declares `engines.node: 25.x`. A fresh worktree needs `pnpm install`
before anything runs.

**Worktree rules.** Work only in the current worktree; never `cd` to the main checkout. The git
stash stack is shared across worktrees and other sessions may be using it — never bare
`git stash` / `git stash pop`. Prefer a WIP commit.

**e2e structural contracts.** These are load-bearing and cheap to keep:
- `page.locator("header")` wraps the mini-rail — asserted in `smoke.spec.ts:12` and twice in
  `intro-countdown.spec.ts` (`:115`, `:122`).
- Accessible names `"Open host controls"`, `"Open overrides panel"`, `"Overrides"`.
- The CTA label regex in `tests/e2e/hostShell.ts:3`.
- `role="dialog"` on the override panel.
- The dock is absent at `MINIGAME_INTRO` and present at `MINIGAME_PLAY`.
- `/dev/minigame/<slug>` previews labelled `"Host Preview"` and `"Display Preview"`.
- Specs share one in-memory room state and run single-worker in filename order; a spec must call
  `ensureSetupPhase(hostPage)` on the way out.

**Behavioural invariants.** Escape hatches are never removed — the host can always skip, redo and
override score (`AGENTS.md:205`). New host controls go through the override surface, not inline
chrome (`SPEC.md:377`). Touch targets 44px or larger. The host drives every phase; nothing
auto-advances. Every minigame canvas keeps the bottom-right dock gutter clear.

**Abstraction policy** (`docs/adr/0002`, `docs/adr/0003`): abstract only at three or more call sites
with identical semantics; no behaviour-switch props; no multi-flag configuration objects; keep
phase-specific surfaces explicit where behaviour diverges; prefer explicit small helpers over
configurable abstractions.

**House component idiom.** A component is a folder with `index.tsx`, a colocated `styles.ts`
imported as `import * as styles from "./styles"`, and a `copy.ts` for every user-facing string.
Style exports use semantic keys (`container`, `heading`, `card`), never a `ClassName` suffix.
`index.tsx` caps at 260 lines, `styles.ts` at 140. No inline `style` prop. No hex colours in a house
`styles.ts`. No raw Tailwind palette names — only `bg surface surfaceAlt text muted primary heat
success danger gold teamA-teamH`, plus `mutedWarm`, `mutedWarmDim` and `ember`.

**Tests.** `node:test` + `node:assert/strict` + `renderToStaticMarkup`, asserted with regexes
against an HTML string. There is no Vitest, no jsdom and no Testing Library in this repo, whatever
`AGENTS.md` §9 says. Colocate as `index.test.tsx`. Host components render through
`apps/client/src/testSupport/renderWithProviders`. Note assertions run against escaped HTML
(`/Frank&#x27;s/`).

**The sandbox is the judging instrument.** `/dev/minigame/<slug>` drives the real runtime and the
real shell. It now previews the host at 1280x800, the party's actual Android tablet — it used to lie
and show a 1024x768 iPad. Two traps when measuring in it:
- `vw`/`vh` inside the scaled device frame resolve against the **browser viewport**, not the device
  box. Set the browser to exactly 1280x800 or every clamp reads wrong.
- A hidden browser pane never delivers `ResizeObserver` callbacks. Anything that sizes itself from
  one — the DRAWING canvas, for instance — will sit at its default 300x150 and look like a bug that
  isn't there. Front the pane before trusting a canvas measurement.

**Tailwind.** `apps/client/tailwind.config.ts` enumerates its `content` globs. A new
`packages/<name>` needs a line there or every class it declares is silently purged.

**Commit voice.** This repo's commit subjects are a short imperative image, not a changelog line —
"Shape the team, do not dress it: the genre becomes the bird's own outline". Match it. End commit
messages with the Co-Authored-By trailer the session is configured with. Commit straight to the
working branch; this repo does not use pull requests.

---

## 5) Unknowns to resolve, not assume

**The keyframe coupling (T1.3).** `styleTokens` reaches global keyframes through Tailwind arbitrary
values — `motion-safe:[animation:pulse_0.7s_ease-in-out_infinite]`,
`motion-safe:[animation:shimmer_3s_linear_infinite]`. Those keyframes live in
`apps/client/src/index.css`, app-global, and `tailwind.config.ts` `theme.extend` contains only
`fontFamily` and `colors` — no keyframes, no animation, no plugins. Moving the tokens into a package
makes that coupling cross a boundary it has never crossed. Two candidate fixes: lift the keyframes
into `theme.extend.keyframes` / `theme.extend.animation`, or ship a CSS file from the package that
the client imports. Prove one under a real `pnpm build` before committing to it. Note that minigame
packages already depend on client-owned CSS this way (`fappy-scene-enter`, `schlonic-scene-enter`,
and all ten `cast-*` keyframes), so whatever is chosen here sets the pattern for an existing crack.

**`packages/minigames/core` cannot host React today.** Its test script is
`tsx --test "src/**/*.test.ts"` — no `.tsx` glob, no `--tsconfig`. `packages/cast` has the correct
shape and is the one to copy. Do not put the new components in `core`.

**Unquoted `tsx --test` globs stop at two levels.** Quote them or deep colocated tests never run and
the suite goes green having tested nothing.

**`packages/minigames/*/src/client/**` is in none of the four house-rule globs today.** That is why
a minigame `styles.ts` can write `shadow-[0_0_8px_#f97316]` while `apps/client` cannot. The 28
violations T1.4/T1.5/T1.6 clear are catalogued in `BACKLOG.md:428-493`, which also argues for the
SVG-primitive carve-out: 13 of them are pure SVG scene primitives with legitimately no `styles.ts`.

---

## 6) Progress log

The orchestrator appends one line per completed task: `- [x] T1.1 <sha> — what actually changed`.
Re-read this section from disk at the top of every iteration; do not trust memory of it.

- [x] T0.1 `b44ef49` — sandbox host preview retargeted from 1024x768 (4:3 iPad) to 1280x800 (16:10
  Android tablet): `HOST_DEVICE`, the frame aspect, the preview column split and its test. Authored
  in the `host-tablet-layout-audit-d735c1` worktree and left uncommitted there; carried into this
  worktree by patch along with this plan document, which was likewise untracked there. Gate green,
  e2e 36 passed.
- [x] T1.1 `067f25b` — `packages/surface` (`@wingnight/surface`) scaffolded on `packages/cast`'s
  exact manifest shape: same scripts, same catalog devDeps, same tsconfig, same quoted
  `tsx --test "src/**/*.test.ts" "src/**/*.test.tsx"` with `--tsconfig ../../tsconfig.tsx-runtime.json`.
  Omits cast's `@wingnight/shared` dependency (nothing uses it yet). Entry `src/index.ts` is a header
  comment plus `export {}`. Glob independently probed by the orchestrator with a three-levels-deep
  `.tsx` test that renders React — it ran, so the suite is not silently empty. Tailwind `content` in
  `apps/client/tailwind.config.ts` gained the package's glob. Gate green (lint/typecheck/test all 0).
- [x] T1.2 `f659315` — `styleTokens` moved to `packages/surface/src/styleTokens/`; git records a pure
  rename (0 insertions, 0 deletions), so the tokens are byte-identical. 29 importer `styles.ts` files
  across `HostControlPanel`, `HostPhaseBody`, `PlayersSurface` and `AdminConfigWizard` now import
  `@wingnight/surface` by package root; `apps/client` declares the workspace dependency. The
  `motion-safe:[animation:pulse_…]` / `[animation:shimmer_…]` arbitrary values were deliberately left
  untouched — they still reach keyframes in `apps/client/src/index.css`, so the coupling now crosses a
  package boundary. That is T1.3's to resolve. Gate green, e2e 36 passed.
- [x] T1.8 `264a1cf` — TRIVIA `"No assigned team"` → `"No team assigned"`, matching the other eight.
  RECREATE dock gutter: the first attempt added `pb-[clamp(5rem,7vw,5.5rem)]` to the top-level
  `container` and was REJECTED by the orchestrator — a full-width bottom band to clear a bottom-right
  corner, pushing up every child of the flex column and enlarging the ~268px of dead air on the game
  with the worst canvas share (33%). It had copied the header's `pr-[clamp(9rem,15vw,12rem)]`, which is
  itself one of the bugs in the diagnosis (RECREATE has `timerKey: null`, so that reserve holds space
  for a chip that never renders). Repaired: `container` restored to plain `p-5`, and the reserve taken
  on the button itself as `w-[calc(100%-4.5rem)]`, costing horizontal space in one element and no
  vertical space anywhere. `min-h-14` touch target unchanged. Gate green, e2e 36 passed.
- [x] T1.3 `13fb2c8` — keyframe coupling closed by shipping the definitions from the package
  (`packages/surface/src/keyframes.css`, exported as `@wingnight/surface/keyframes.css`, imported once
  in `apps/client/src/main.tsx`); `@keyframes pulse`/`shimmer` removed from `apps/client/src/index.css`.
  Only two keyframes are actually referenced by the tokens (`pulse` via `stageTimerUrgent`,
  `stageTimerTimeUp`, `stageEyebrowTimeUp`; `shimmer` via `heatStripShimmer`). Option (a),
  `theme.extend.keyframes`, was tried and DISPROVED under a real `pnpm build`: the built CSS kept
  `animation: shimmer 3s linear infinite` and contained zero `@keyframes shimmer`, because Tailwind v3
  only emits a keyframes block for the `animate-*` utility that names it and an arbitrary
  `[animation:…]` never generates one — silent, and green on all three checks. Verified by
  rule-by-rule diff of the built stylesheet (1829 rules before and after, none added, none lost, order
  only) and by `getAnimations()` in the live app with a negative control. Sets the pattern for the
  `cast-*` and `*-scene-enter` keyframes, not migrated here. Gate green, e2e 36 passed.
- [x] T1.6 `33389cf` — five over-cap files cut on their real seams, 69 files, +2045/−1436. Audit line
  counts were stale (raw: 405/324/376/309/312, not 337/272/334/290/264 — `max-lines` skips blanks and
  comments). Host surfaces gave up `RunningTotals`, `ShotHistory`, `LegHistory`, `RunHistory`, plus
  `Corridor`/`Zone`/`RelayClock`; SONG_GUESS was under cap and was cut anyway so the fourth
  `RunningTotals` clone sits at the same path with the same shape. **All four `RunningTotals`
  `index.tsx` and `copy.ts` are now byte-identical** — they take `{pendingPointsByTeamId,
  activeTurnTeamId, teamNameByTeamId, note?}` instead of a package-specific view, which is what had
  made them unshareable. SCHLONIC's `styles.ts` is the one genuine divergence (flat box, no gold) and
  is a decision for the sharing task. `Perch` and `ZoneProps` split on scene contents; `Perch` lost its
  `styles.ts`/`copy.ts` and is now a pure SVG primitive. Behaviour pinned by rendering each extracted
  surface against its pre-split self across every phase branch and asserting string equality. Gate
  green, e2e 36 passed with zero flakes on a stable tree. NOTE: the orchestrator's first commit missed
  26 untracked new directories (`git commit -- <path>` does not add untracked files); amended before
  the log was written.
- [x] T1.5 `0ac8706` — 11 hardcoded JSX strings moved into colocated `copy.ts` across
  `DisplayDrawingSurface`, `HostDrawingSurface`, `EmojiPicker`, `HostEmojiCharadesSurface` and
  `GeoGuessMap` (glyphs only — sparks, ticks, magnifier, zoom `+`/`−` U+2212 — no wording changed).
  The inline `style` prop on DRAWING's ink swatches became a literal `[--ink-color:#…]` class per
  palette entry with `bg-[var(--ink-color)]` in `styles.ts`, following the cast's per-instance CSS
  variable precedent; interpolated class fragments are never generated by Tailwind, so the six known
  inks are enumerated. Orchestrator re-probed with a temporarily widened config: **38 → 26 problems**,
  `no-hardcoded-component-jsx-text` and `no-inline-style-prop` both at 0. Gate green, e2e 36 passed.
- [x] T1.4 `6a0de41` — house rules extended to `packages/minigames/*/src/client/**` and
  `packages/surface/src/**` across all four rule blocks. **The brief's premise was wrong and the
  subagent corrected it**: four of the rules gate internally on a hardcoded tree list in
  `tools/eslint-plugin-wingnight/rules/houseComponentPaths.mjs`, so adding globs alone would have been
  inert — that marker list, not a missing glob, is why a minigame `styles.ts` could write a raw hex.
  `component-entry-file-name` also kept its tree list in two places; collapsed to one constant.
  SVG-primitive carve-out written as a path rule (`*Scene/**/index.tsx`) disabling ONLY
  `require-styles-import-in-component-entry`; a bare version would have been too wide by 7, so three
  scene roots and four class-bearing animated parts are explicitly excluded. Orchestrator verified via
  `calculateConfigForFile` over all 78 `index.tsx` under `packages/`: 29 carved out (the original 25
  plus 4 new landmarks from the Backdrop split), **0 of which have a `styles.ts` and 0 of which contain
  `className`** — the exemption reaches only files with nothing to style. `SchlonicScene/Backdrop`
  (367 lines) split into `SpiritCatcher`/`TownCluster`/`AllandaleStation`/`Marina` rather than excused;
  proven byte-identical against `git show HEAD:` with a negative control. Block 1 (`react-hooks`)
  deliberately NOT extended to minigames: 10 hand-narrowed rAF/hold dep arrays that cannot be widened
  without restarting a game loop. Deferred to BACKLOG.md with line numbers, along with 49 hex literals
  + 1 raw palette class across 7 packages (a design pass, not a config chore). `pnpm lint` exits 0.
  Gate green, e2e 36 passed.
- [x] T1.7 `e7eb1af` — sandbox host preview now renders the real `TakeoverTimerChip`, composed
  exactly as `MinigamePlayTakeover` composes it (first child of the `relative flex h-full min-h-0
  flex-col p-[clamp(1rem,2vw,1.75rem)]` container — the sandbox's `hostCanvas` already carried that
  identical class string, so no positioning change was needed). New
  `SandboxStage/resolveSandboxHostRoomState/` builds the minimal `RoomState` the chip reads, sourcing
  `timerKey` from `resolveMinigameDefinition` the way the shell does: `null` outside play and for the
  six host-paced games, so the chip truthfully renders nothing; a timer **paused at full duration**
  (45/60/90s) for GEO/DRAWING/EMOJI_CHARADES, since the sandbox has no gameConfig to count down from
  and a live value would race the wall clock in a server-rendered test. Colocated tests assert the chip
  is present for GEO and absent for TRIVIA. Client tests 533 → 538. Gate green, e2e 36 passed.

**Phase 1 complete.** All eight tasks landed green. `pnpm lint` exits 0 with the house rules now
governing `packages/minigames/*/src/client/**` and `packages/surface/src/**`.
- [x] T2.1 `52a5087` — `docs/takeover-layout-api.md`, 650 lines, prose only. Shell owns rail +
  clock + dock; `resolveActiveTeamName` dies in all nine because `MinigamePlayTakeover:24` currently
  passes `activeRoundTeamName` (the ROUND's team) where every game wants the TURN's — verified by the
  orchestrator, and the actual root cause of the nine copies. Slot maps for both layouts; **no
  bottom-right slot for a control exists**, which is what kills the TRIVIA and RECREATE dock
  collisions geometrically rather than by nine more hand-typed paddings. Top-right budget abolished,
  not corrected: the clock is the last item of a flex rail row, so an empty slot takes no width.
  `packages/surface` deliberately exports NO dock-gutter token (exporting one invites a tenth
  hand-typed reserve). Four-band z-index scale whose mechanism is `relative isolate` on the body — the
  game is sandboxed by geometry, not by agreement on numbers; `position: fixed` banned outright
  because the sandbox's CSS-scaled device frame captures it via the transformed ancestor. §12 is a
  fact table of every cited string, number and line. Orchestrator spot-checked four claims (all
  correct) and confirmed the arithmetic reproduces the audit's measured 1227×747 and 887. Gate green;
  e2e correctly not run (docs only). **Corrected two plan errors**: header assertions are
  `intro-countdown.spec.ts:149`/`:157` not `:115`/`:122`; override rule is `SPEC.md:380` not `:377`.
  Seven proposals in §11 flagged for the owner.

### Owner's decisions on the T2.1 proposals (2026-09-21)
P1 accepted — the rail is a slot, not a component; the plan's "four components" is three plus a slot.
P2 accepted — `RunningTotals`, not "standings panel". P3 noted — re-check the deck against ADR-0002 at
the end of phase 4. P4 accepted — drop `MinigameSurface`'s takeover `overflow-y-auto` in T2.3.
**P5, P6 and P7 are pulled into scope**: hide the dock toggle while the override panel is open (T2.3);
team dots take the team's real colour via `teamThemeByTeamId` (T2.3); "positive verdict first" becomes
a house rule, with DRAWING's inverted pair fixed in T4.1.
- [x] T2.2 `2bcd1bc` — `<TakeoverStage>` and `<TakeoverCanvas>` in `packages/surface`, 21 colocated
  tests. Props are slots only, no flag, no variant, no config object: Stage takes
  `{rail, clock, counter?, children, deck?, actions?}`, Canvas takes
  `{rail, clock, counter?, children, actions?, readout?}`. Shell slots required (the game always
  forwards them), game slots optional. `counter`/`clock` render **bare** into the flex row with no
  wrapper, which is the mechanism behind the abolished top-right budget — an unfilled slot leaves no
  element. Bottom-right 4.5rem applied in four places by the layouts; **no gutter token exported**, and
  a test asserts no export matches `/gutter|dock|reserve/`. Root and body both `relative isolate`;
  no `z-[1100]`, no `fixed`, no landmark element (protects the `locator("header")` contract).
  No `copy.ts` — neither layout renders a user-facing string. Deviations: Canvas `actions` max-width
  uses 4.5rem not GEO's 6rem (§6's "one number" beats §5's citation; 4.5rem still clears the dock's
  real 42.4px intrusion); chrome insets take GEO's existing `clamp(0.6rem,1.2vw,1rem)`; the deck is a
  styled slot wrapper, not a third component. Orchestrator independently mutation-tested: stripping
  `isolate` reddens exactly 1 test, dropping `pr-[4.5rem]` reddens exactly 1, restore returns 21/21 —
  the tests bite. Gate green; e2e correctly not run (nothing outside `packages/surface`).
  **Handed to T2.3**: `MinigameHostRendererProps` needs `rail` and `clock` as two separate ReactNode
  props (not one `chrome` object); `TakeoverTimerChip/styles.ts:4` must lose `absolute right/top z-10`
  or the §6 mechanism is inert; `SandboxStage/index.tsx:188-190` must move with it or the sandbox
  resumes lying about the corner; and when P4 drops `overflow-y-auto` from `MinigameSurface`, the
  sibling `[&>*]:min-h-full` on the same line means the replacement must still hand the layout a
  full-height box or a short body sits at content height.
- [x] T2.3 `c6bc1e1` — shell draws the takeover chrome as structural layout. `MinigameHostRendererProps`
  gained `rail: ReactNode` and `clock: ReactNode` as two separate props (not a `chrome` object —
  ADR-0002); `MinigamePlayTakeover` fills them with the real `HostMiniRail` and `TakeoverTimerChip`;
  `MinigameIntroStage` passes `null`/`null`. `TakeoverTimerChip/styles.ts` stripped of
  `absolute right-… top-… z-10` — without that the §6 mechanism is inert — with a `styles.test.ts`
  that reddens if positioning returns. P4 applied: `takeoverInner` is now
  `flex min-h-0 flex-1 flex-col [&>*]:min-h-full`, only `overflow-y-auto` removed (`min-h-full` kept
  deliberately, since dropping it would be an unrequested layout change to nine unmigrated games).
  `activeTeamName` fixed at source via `selectHeaderContext`; the subagent went further and verified
  `apps/server/src/minigames/runtime/index.ts:62` writes `state.activeTurnTeamId` and
  `hostView.activeTurnTeamId` in the same pass, so the two are identical on every snapshot and the
  nine `resolveActiveTeamName` copies are **provably** redundant — none deleted here. P5: the dock
  renders only when `isPlayerHeld && !isOverrideDockOpen`, with the CTA-bar branch split out so hiding
  the dock cannot fall through to it; new `host-takeover-dock.spec.ts` covers open→absent→Escape→back.
  P6: `selectHeaderContext` now returns `activeTeamId` and the rail composes
  `dotAccentClassName`/`tintClassName` from the existing `teamThemeByTeamId`, so the dot and its halo
  are the team's colour; `miniRailTeamDotUnassigned` keeps the house accent for "No team assigned".
  Nine games proven unchanged: zero source files touched under `packages/minigames/*/src/client`, and
  all 18 host surfaces (9 games × 2 phases) rendered byte-identical across three prop shapes.
  Client tests 538 → 544. Gate green, e2e 36 passed.
  **KNOWN INTERIM REGRESSION, accepted:** no game forwards `clock` yet, so GEO, DRAWING and
  EMOJI_CHARADES draw no host-tablet play clock until T4.1/T4.2/T4.4. The TV keeps its own timer. A
  ratchet test in `MinigameDevSandbox/index.test.tsx` asserts the chip is ABSENT for GEO and must be
  flipped back to `match(/00:45/)` by the commit that gives GEO its clock slot — it reddens first if
  that commit forgets. The rail is NOT a regression: the shell never drew it at `MINIGAME_PLAY`, and
  unmigrated games still draw their own.
- [x] T2.4 `bd42f9a` — TRIVIA migrated to `<TakeoverStage>` (no deck). §3's rule is about *covering*,
  not size: a question card is meaning concentrated in one place, so floating chrome lands on a word
  the host is reading aloud. **Canvas share 36% → 82.7%**: the card now fills the body slot
  (`flex-[3]` question / `flex-[2]` answer) instead of sitting at content height in a centred column;
  question type 2.6rem → 3.4rem, verdicts 72px → 88px. Verdicts moved out of the body into the
  `actions` foot row, which is what fixes the dock collision structurally. The subagent REPRODUCED the
  old bug before fixing it: forcing the card to the height a long question produces gave a real
  42.4×20.8px overlap and `elementFromPoint` at the circle's centre returned `"Open host controls"` —
  the dock stole the press. Latent only because the sample question is short. TRIVIA's `styles.ts`
  contains no `4.5rem`, no `isolate`, no z-index — only comments naming them. Deleted:
  `resolveActiveTeamName` (8 definitions remain, one per unmigrated game — orchestrator verified),
  the team chip, the meta block and six style keys. Also fixed beyond brief:
  `resolveSandboxHostRoomState` returned `null` whenever `timerKey` was null, which made the sandbox
  rail read "Pre-game" with no team for six of nine games — the sandbox lying about the rail exactly
  as it used to lie about the corner.
- [x] T2.5 (measurement only, no code) — INDEPENDENT measurement by a second agent: **82.5%**
  (card 1229×606 = 744,774px² + two buttons 569×88 = 100,144px², over the 1,024,000px² device box),
  agreeing with T2.4's 82.7% to within clamp/rounding noise. Method: browser set to exactly 1280×800
  (so `vw`/`vh` resolve against the device box), pane fronted (so `ResizeObserver` fires),
  `offsetWidth`/`offsetHeight` rather than `getBoundingClientRect` (the frame is CSS-scaled).
  Dock gutter confirmed BEHAVIOURALLY, not just geometrically: circle at left 1212–1260 / top 732–780,
  Incorrect at left 614–1183 / top 687–775 — 29px horizontal gap, and `elementFromPoint` returns the
  dock button at the circle's centre and the Incorrect button at its own right edge. Both hit their own
  target. Screenshot: `docs/screenshots/t2.5-trivia-takeover-host-1280x800.png`.

### Canvas share ledger
| Game | Before | After | Task |
|---|---|---|---|
| TRIVIA | 36% | **82.5%** (independently measured) | T2.4 |
| GEO | 90% | **89.9%** (held — correct for the reference) | T4.4 |
| JOUST | 60% | **89.9%** (deck removed) | T3.1 |
| FAPPY | 59% | **89.9%** (deck removed; 16:9 scene +92% area) | T3.2 |
| SONG_GUESS | 62% | **71.1%** (Stage, deck removed) | T3.4 |
| SCHLONIC | 59% | **89.9%** (deck removed; world +90% area) | T3.3 |
| DRAWING | 53.7% | **59.1%** (board 938→984 wide; Stage chosen, full-bleed refused at 78.3%) | T4.1 |
| EMOJI_CHARADES | 58.3% | **59.7%** (deck KEPT — dropping it costs 14% of tap surface) | T4.2 |
| RECREATE | 33.1% | **74.7%** (dead air 269px → 0) | T4.3 |

**Caveat on this ledger:** the per-game figures were measured by different agents against slightly
different definitions (body-slot area vs. the specific card-plus-controls the audit measured). Each
was independently reproduced and every direction is sound, but the column is not one consistent
metric — T4.3's agent measured TRIVIA at 72.7% on its own yardstick against the 82.5% recorded here.
Treat the deltas as real and the absolute numbers as approximate.

**HUMAN CHECKPOINT REACHED** — the anatomy is on the tablet and awaiting the owner's read before the
remaining eight games adopt it.

### Checkpoint passed, with a reorder (2026-09-22)
The owner cleared the T2.5 checkpoint and accepted the orchestrator's recommendation to **run GEO
(T4.4) before JOUST (T3.1)**, against the plan's written order. Reasons:
- TRIVIA validated `<TakeoverStage>`. **Nothing has exercised `<TakeoverCanvas>` yet**, and that is
  the half phase 3 bets on — JOUST, FAPPY and SCHLONIC all go full-bleed. The T3.1 checkpoint asks
  "is full-bleed right" of someone who has never seen full-bleed under the new layout.
- GEO is the safest test of the Canvas because the Canvas was modelled on GEO ("GEO's model,
  generalised", spec §2). If the Canvas is wrong, GEO is where it shows up cheapest.
- GEO is the least work in the plan (opus/medium, "mostly adopting names it already invented").
- GEO is one of the three games with a play clock, so it closes a third of the T2.3 clock regression
  and flips the ratchet test back.
- Verified GEO does NOT depend on T3.1's shared primitives: its host surface is `GeoGuessMap`,
  `copy.ts`, `index.tsx`, `styles.ts` — no `RunningTotals`, no history strip.
Cost accepted: T3.1 also lands the shared primitives that unblock T3.2/T3.3/T3.4 to run in parallel,
so that parallelism is delayed by one task.
- [x] T4.4 `9af6dc7` — **GEO migrated to `<TakeoverCanvas>`, pulled ahead of phase 3.** Canvas share
  89.9% (layout root/body/map frame all 1229×749; `.leaflet-container` 1227×747 = 89.5%, the audit's
  exact numbers) — held, not improved, which is the right outcome for the reference implementation.
  Deleted: a hand-typed `bottom-[clamp(4.9rem,9vh,5.6rem)]`, `max-w-[calc(100%-6rem)]`, the
  `pr-[clamp(9rem,15vw,12rem)]` top-right reserve, the `floating = "absolute z-[1100]"` helper, the
  rail, the team chip and `resolveActiveTeamName` (7 definitions remain). **Clock restored for GEO** —
  the T2.3 interim regression is one-third closed, and the ratchet test is flipped back to
  `match(/00:45/)`.
  **The Leaflet question is settled by pixels, not class strings.** Hashing the chrome-row region at
  a true 1280×800: as shipped and with GEO's own map-frame `isolate` removed are byte-identical
  (`afb80b11…`, 1864 bytes); with BOTH isolations removed the region collapses to 170 bytes — a flat
  Leaflet tile painting over the chip. So the layout's `isolate` on the body is sufficient on its own
  to contain z-1000. GEO's own isolate is still load-bearing one level in (removing it takes the photo
  plate from 151,396 to 19,392 bytes) and sits inside band 0 where §5 permits it —
  `body.contains(mapFrame) && body !== mapFrame` verified true.
  Dock reachability behavioural: `elementFromPoint` at the circle's centre returns
  `BUTTON aria-label="Open host controls"`, with the stack top-down dock → leaflet-container → map
  wrapper. Nothing GEO draws is above it.
  Screenshot: `docs/screenshots/t4.4-geo-takeover-host-1280x800.png`, captured **un-scaled** at a true
  1280×800 and deliberately re-shot against `content/sample` via `WN_CONTENT_ROOT_DIR` — the first
  pass picked up the live pack and would have committed a photograph of identifiable people into
  `docs/`, defeating the pack's gitignore.
  One intentional behaviour change: at play with no prompt GEO used to drop to the intro panel; it now
  keeps the takeover and renders the waiting note in the body, so the rail and clock stay on the
  tablet through the gap. Gate green, e2e 36 passed.
  **Interrupted-agent note:** this task was interrupted mid-flight; its writes survived but its
  verification did not, and it had edited `geo/package.json` without running `pnpm install`, so the
  tree was red on missing workspace links. One repair agent finished it. The only genuine test failure
  was the first agent's own over-strict regex (it assumed `readout` content was one level below the
  slot wrapper; GEO passes two bare tiles, so it is two) — fixed and mutation-checked.

### Verdict on `<TakeoverCanvas>` (from the GEO migration)
**Fits.** GEO gave up code without giving up a pixel, and every slot §5 names had an obvious home.
Two caveats carried into T3.1: (1) the Canvas was *derived* from GEO, so this proves the
generalisation did not break its source, not that the abstraction travels — JOUST is the real test,
since its `RunningTotals` deck must survive as a `readout`, a shape GEO never exercised; (2) `actions`
takes the gutter as a max-width but `readout` takes it as a bottom offset, so a **tall** `readout`
grows upward into the body unconstrained. GEO's two tiles are short so nothing surfaced. Watch this
when a four-team running-totals panel lands in `readout` at T3.1.
- [x] T3.1 `044437d` — **JOUST full-bleed on `<TakeoverCanvas>`, 60% → 89.9%** (arena 887×689 →
  1229×749). The 330px deck is gone: counts → `counter`, the four controls plus `arenaHint` →
  `actions` (the hint used to be a row *under* the lane, costing it height), `ShotResultCard` +
  `RunningTotals` → `readout`, lane/shooter labels → a `pointer-events-none` plate in the body.
  `resolveActiveTeamName` deleted — **6 definitions remain** (drawing, emoji-charades, fappy,
  recreate, schlonic, song-guess), orchestrator verified; the brief's "7" was stale. Dock proof: 36
  points sampled across the circle (centre + radii 10/20 at 30° steps), **0 misses**. DESIGN.md §2.7
  rewritten in the same commit.
  **The tall-`readout` hazard GEO flagged is NOT real, and the real one was unguarded.** Height
  measured: a row is 33px, so eight teams — the room's hard max — is 311px against a 677px budget; it
  would take ~23 teams to reach the rail. But `readout` was right-anchored with **no `max-w` at all**,
  and JOUST's result plaque names everyone a shot felled: a cleared rack is nine names on one line,
  measured at **1154px of the 1229px canvas**. Fixed in two places deliberately — `packages/surface`
  gives `readout` the same `max-w-[calc(100%-4.5rem)]` `actions` has (one number, now five
  applications; spec §5/§6 amended with the height arithmetic), and JOUST caps its own plaque at
  `clamp(16rem,26vw,22rem)` because the layout cannot know how wide a game's card should be. Worst
  case 1154×179 → 523×186.
  **Shared: `RunningTotals` → `packages/surface/src/RunningTotals/`.** Three call sites (JOUST, FAPPY,
  SONG_GUESS), identical semantics and byte-identical styles. Two findings: (1) **the "house card" was
  never a house card** — the three identical copies were written in JOUST's dusk-desert hexes
  (`#3a200d` is the arena frame's own border, `#1a0e05`→`#0a0604` its result plaque, DESIGN.md §2.7),
  which a house-component path may not carry; substituted value-for-value to `border-ember/20`,
  `from-surface to-bg`. **SCHLONIC's variant is the only one of the four already written in house
  tokens.** (2) Sharing closed a real bug invisible from inside a deck: the row had `justify-between`
  and no gap, so floated at content width the longest name met its points at a measured **0px**
  ("Honky Tonk Heat0 pts"). The shared row takes `gap-4` — the one thing SCHLONIC's variant had and
  the other three didn't.
  **NOT shared, deliberately: the history strips.** ADR-0002 wants three call sites with *identical
  semantics*; these are three shapes — `ShotHistory` pads to a fixed slot count with no active notion,
  `LegHistory` is data-length with an active chip plus a crash badge, `RunHistory` is a vertical list
  of two cells per row. Collapsing needs `items`+`renderItem`+`isActive`+`padTo`+`tone`: a multi-flag
  configuration object, or a render prop wearing a hat. The genuinely identical residue is the `title`
  class string, which §8 calls a token, not a component — left for the wider token pass.
  **NOT built: the arena frame** (§8 assigns it to T3.1). Only one of its three call sites is
  full-bleed yet — JOUST is `h-full w-full` while FAPPY and SCHLONIC are still `min-h-0 flex-1` — and
  §8's "paints nothing, children carry the interaction" design would move the click target off two
  games' containers, a behavioural change colliding with T3.2/T3.3. **Recommend it lands at T3.3.**
  Gate green, e2e 36 passed. Screenshot: `docs/screenshots/t3.1-joust-takeover-host-1280x800.png`.

**HUMAN CHECKPOINT REACHED** (post-T3.1, "is full-bleed right, before three more games follow"), with
two decisions attached: SCHLONIC's `RunningTotals` styling, and whether the arcade games share a
surface language the design system should name or have simply been copying JOUST.

### Owner's decisions at the T3.1 checkpoint (2026-09-22)
Full-bleed approved; FAPPY, SCHLONIC and SONG_GUESS proceed.
- **SCHLONIC adopts the shared `RunningTotals`** (T3.3). It costs SCHLONIC ~73px of vertical
  (131px → 204px, +56%) and turns its points and active row gold, but it has ~677px of readout budget
  and the alternative is keeping a fourth near-clone — the exact thing this project exists to remove.
  SCHLONIC's local copy is deleted at T3.3.
- **The arcade surface-language question is DEFERRED**, not dropped. Each migration substitutes house
  tokens value-for-value as JOUST's did; the question of whether the arcade games genuinely share a
  surface language or have been copying JOUST's dusk-desert palette is logged to BACKLOG and revisited
  in phase 6, when DESIGN.md is reconciled anyway.
- [x] T3.2 `84d3ecb` — **FAPPY full-bleed, 59.3% → 89.9%** (corridor 887×685 → 1229×749). The corridor
  letterboxes against WIDTH, so the deck was starving it in the one axis it needed: the 16:9 scene goes
  887×499 → 1225×689, **+92% area**. Slots: leg count / "Flying: X" / `LegHistory` / gates / `RelayClock`
  → `counter` (995px of content + 60px gaps in a 1198px row, 143px slack at four legs); Skip leg, Reset
  turn and the hint → `actions` (the hint was its own row under the corridor, costing 28px of height);
  finish card + shared `RunningTotals` → `readout`. **Deliberate divergence from JOUST**: who is flying
  is a chip in `counter`, not a body plate — FAPPY's bird is pinned at `left-[20cqw]`, exactly where
  JOUST's top-left plate would sit. `crashesChip` deleted: the deck's leg card said "2 crashes" in words
  while the chips say "2×", the same fact twice on one row; `data-fappy-crashes` moved onto `LegHistory`'s
  crash span so `fappy-sandbox.spec.ts:48` still works. Dock proof: **49 samples** (centre + radii 10/20
  at 15° steps, a superset of JOUST's 36), 0 misses. Flight loops verified under Playwright, never a
  backgrounded pane: host bird took 14 distinct transforms across 20 consecutive rAF frames, the display
  mirror 16 across 20. DESIGN.md §2.9 rewritten. `LegHistory` stays local; no arena frame built.
- [x] T3.4 `4eebc6a` — **SONG_GUESS → `<TakeoverStage>`, deck removed, 62.1% → 71.1%** (body 887×717 →
  1229×592). **Chose Stage over Canvas, with §3 reasoning**: (1) once the answer card actually fills the
  body — it never did, 190px of content in a 717px column, so ~70% of the "console" was black — every
  corner holds the title, artist or hint, and floating chrome covers a word the host reads aloud; (2) a
  Canvas has exactly two floating slots, `actions` and `readout`, **both on the same edge** and each
  bounded at `calc(100%-4.5rem)`, which is nowhere to put nine tap targets (Play/Pause/Replay/Skip,
  Reveal, Title ✓✗, Artist ✓✗, Next) plus a totals panel — and §5 is explicit there is no bottom-right
  slot for a *control*. **The deck going is a separate axis from Canvas/Stage**, and the arithmetic says
  keeping it could not have won: the shell's mini-rail is 33px against the game's own 20px strip, so a
  deck-keeping Stage lands at 887×706 = **61.2%**, a regression. `SongScoringDeck` renamed
  `SongScoringPad` (it is no longer in a deck; `data-song-guess-scoring` kept). Dock proof: 37 samples ×
  4 beats, 0 misses. Audio proved untouched live — one `<audio>` node, same DOM node across a full turn
  (play→pause→replay→pause→reveal→mark title→mark artist→next), src still absolute on the server origin.
  e2e parity replayed assertion-by-assertion against the live sandbox rather than run (concurrent agent
  held the ports); orchestrator ran the real suite: 36 passed.

**Phase 3 complete.** `resolveActiveTeamName` is down to **4** definitions (drawing, emoji-charades,
recreate, schlonic) from nine.

### Open items raised in phase 3, for the owner
1. **FAPPY's dead taps.** `<TakeoverCanvas>`'s `actions` row is `pointer-events-none` with
   `[&>*]:pointer-events-auto` — right for the map it was drawn for, wrong for a game whose body IS the
   button. FAPPY's 507px hint sentence now swallows flaps: **764×48, 4.0% of the corridor**, dead where
   it was live. A plain `pointer-events-none` on the hint is inert (equal specificity, the layout's rule
   ordered later), so the fix belongs in `packages/surface`, not in FAPPY. JOUST has the same shape but
   not the same cost — its body is a drag surface, not one big button. **Not fixed; needs a call.**
2. **P3 is now decidable and the answer has moved.** With SONG_GUESS off the deck, `<TakeoverStage>`'s
   `deck` slot has **zero** call sites today and a projected **two** after phase 4 (EMOJI_CHARADES,
   RECREATE) — below ADR-0002's three-call-site bar. §4's "exactly three, with nothing to spare" no
   longer holds.
3. **SONG_GUESS has no `DESIGN.md` section at all** (§2.8 is Cast; the per-game sections skip it). Not
   invented here — a gap for phase 6.
- [x] T3.3 `1b42982` + `ca5619b` — **SCHLONIC full-bleed, 59.3% → 89.9%** (stage 887×685 → 1229×749;
  16:9 world 883×497 → 1225×689, **+90% area**). Nothing went in the body and the arithmetic is why:
  the runner sits at `SCHLONIC_WORLD.runnerX = 46` of 160 world units = 28.75% = 353px into a 1229px
  canvas, against JOUST's top-left plate reaching 303px at its clamp — and a held jump is ~27 of 90
  world units, a springboard ~81, so the hen crosses the top-left sky on any decent bounce. Follows
  FAPPY: who is running is a chip. The JUMP legend was floating chrome *inside* the body (forbidden by
  §5) at the actions row's own inset, so it moved into `actions` rather than being deleted — during a
  run it is the only place "hold for height" is said. `resolveActiveTeamName` deleted: **3 remain**
  (drawing, emoji-charades, recreate). Dock: 37 of 49 sampled points fall inside the circle, **all 37
  resolve to the toggle, 0 misses**; independently, no SCHLONIC slot box intersects the dock's box at
  all. Runner motion verified under Playwright (`frames > 200`, jumps, airborne, `endedAtX > 400`).
  DESIGN.md §2.11 rewritten.
  **Shared `RunningTotals` adopted** (owner's decision): local copy deleted, cost measured side-by-side
  in one browser — 194×131 → 172×204, +56% tall and 22px narrower. Budget: readout bottom y=677, chrome
  row bottom y=51 → **626px available**, card uses 204, 422px spare; clears at eight teams too.
  `RunHistory`'s `gap-2` widened to `gap-4` for the same reason the shared card has it.
  **Dead-tap fix in `<TakeoverCanvas>`** (`ca5619b`): `[&>*]:pointer-events-auto` →
  `[&_:is(button,a,input,select,textarea)]:pointer-events-auto`, one module-private `liveControls`
  const on all three floating rows. **The row grants the pointer to controls, not to children** — no
  prop, no config object, and it fails safe the right way round: a forgotten class on a sentence costs
  a dead tap target, a button is live for being a button. Applied to `chromeRow` and `readout` too,
  where §4/§5 forbid controls so it matches nothing and both go fully transparent — that was the larger
  loss, the chrome row being 1198×38 across the top of every canvas. Verified in-browser: FAPPY's hint
  now `none` and `elementFromPoint` at its centre resolves to `[data-fappy-arena]`, so the flap lands.
  SCHLONIC live overlay **104,346px² → 11,520px², 10.1% of the zone given back**. Orchestrator
  independently mutation-tested: reverting to the blanket rule reddens exactly 2 tests, restore returns
  28/28. JOUST needed nothing (drag surface, everything goes passive for free).
  **Arena frame REJECTED, nothing built.** Stripped to what the three actually share it is six
  utilities and no structure — which §8's own rule sends to tokens, not a component. It fails as a token
  too, because **the three call sites are not three**: four of the six utilities are dictated by the
  body slot rather than chosen, and the two that are a design decision (`rounded-xl` + the inset
  vignette) are DESIGN.md §2.7's marquee frame, which JOUST and FAPPY share *by descent* (same
  `#3a200d`, same desert) and which SCHLONIC deliberately is not — §2.11 says it "looks like nothing
  else in the show on purpose". Two call sites with identical semantics plus one coincidence; ADR-0002
  g1 wants three. The component form also fails twice on its own terms: §8's "paints nothing" sketch
  needs border/background/`touch-none` as a class string from the game (the `surfaceClassName`/`tone`
  prop §8 itself rejects), and FAPPY's and SCHLONIC's frames are not passive wrappers — they carry
  pointer handlers, an armed/locked cursor and the `data-*-arena` hooks the e2e specs click. §8's
  component-table row struck through in the spec with the three strings tabled.
  Gate green, e2e 36 passed, `schlonic-sandbox.spec.ts` 4 passed alone.
- [x] T4.1 `fbf5d60` — **DRAWING → `<TakeoverStage>`, no deck, 53.7% → 59.1%** (board 938×586 →
  984×615). **Full-bleed measured and REFUSED**: it would have been an 1133×708 board at 78.3%, but a
  floating `actions` row for DRAWING is five `<button>`s — exactly what the new pointer selector grants
  `pointer-events-auto` — putting ~700×44px of the board dead to drawing, one of them CLEAR under the
  artist's moving hand. Nineteen points is what §3's covering rule costs here and the agent took it.
  **Height-bound arithmetic**: `area = 1.6 × (body_h − 18)²`, so `d(area)/d(body_h) ≈ 1,968px²` — one
  pixel of chrome is 1.6 pixels of board width. Net −29px of chrome → +29px board height → **+46px
  board width** (46 = 1.6 × 29 ✓). Side width proven free: the framed board is 1002px in a 1151px slot,
  so the 68px palette column sits entirely inside the 149px letterbox bar and deleting it would widen
  the board by **0px**. 59.1% is the Stage ceiling, not a compromise. **Clock restored** (`01:00`).
  **P7 fixed — DRAWING was the last outlier**, `verdictCorrect` now before `verdictIncorrect`. Dock:
  49 samples, 41 hit the toggle, 8 fall through the rounded corners, **0 have any DRAWING element in
  the hit stack**. DESIGN.md §2.5 rewritten. Flagged: "Sketch Booth" could not be deleted (asserted by
  an e2e spec and a client test, both out of scope) so it became a nameplate on the palette post at
  0.55rem — worth a second opinion.
- [x] T4.2 `08c1e2d` — **EMOJI_CHARADES → `<TakeoverStage>` WITH the deck, 58.25% → 59.68%.** The deck
  was re-tested rather than assumed and **kept**: cells are `aspect-square`, so width and cell size
  move together — at 887px a cell is 83px and a whole catalog tab fits without scrolling; at the full
  1229px each cell is 118px and a row falls off. **Widening makes the picker hold less.** Counterfactual
  measured: "Stage, no deck" gives a grid of 362,555px² against the 419,551px² it has — **14% smaller
  tap surface** for a prettier 71.7% body reading. Canvas rejected on both halves of §3's rule: the
  picker's buttons live in the *body*, so the new `[&_:is(button,…)]` grant never reaches them — they
  would be covered *and* dead. **`hostView.status` enumerated**: the union has exactly two members
  (`playing`, `turn_complete`) plus two non-status cases (`minigameHostView === null`, `phase !== "play"`);
  all eight combinations verified, six live and two by unit test. `turn_complete` drops the deck and the
  body takes the full 1229×689 — which only works because an unfilled slot collapses to nothing.
  **Clock restored** (`01:30`). Deck width moved off its odd fifth `clamp(240px,25vw,330px)` onto the
  house `clamp(230px,28vw,330px)`. Dock: 49 samples, 0 picker cells; rect-intersection over all 43
  interactive elements — **0 intersect**, nearest clears by 30px. DESIGN.md §2.6 rewritten.
- [x] T4.3 `fce1bf2` — **RECREATE → `<TakeoverStage>`, no deck, 33.1% → 74.7%, dead air 269px → 0.**
  Reproduced the audit's 33% and 269px exactly before changing anything, then accounted for every pixel:
  72px → the foot row, ~51px net returned by deleting the surface's own header and team row, **~246px
  into the body**. Frames 469×352 → 485×622 (writing) and 229×171 → 485×305 ×2 (**+3.8× picture area**);
  the scored reveal moved into a 3fr column that previously stood *completely empty*. Per beat: writing
  33.1→74.7, judging 34.4→74.7, scored 24.3→74.7. **The three primary buttons were never three** — they
  are three beats of one turn, never two on screen at once, so all three became one `actions` row.
  **Deck refused against §3's own table**: RECREATE's bench is the *wider* column (`2fr_3fr` = 485/728,
  toggles a two-column grid of 360px buttons) and a 330px sidebar could never hold it. **T1.8's
  hand-typed `w-[calc(100%-4.5rem)]` deleted** — the layout's `pr-[4.5rem]` gives the button a right
  edge of 1183 against the circle's 1212, 29px clear; bare `w-full` in the old `p-5` would have reached
  1235 and collided, which is what T1.8 was patching by hand. **Exactly one `<header>`** in the host
  shell, measured. DESIGN.md §2.10 rewritten.

**Phase 4 complete. All nine games migrated.** `resolveActiveTeamName` is at **zero** definitions
repo-wide, down from nine. The T2.3 interim clock regression is **fully closed** — GEO (T4.4),
DRAWING (T4.1) and EMOJI_CHARADES (T4.2) all forward and draw their clocks.

### P3 is now decided by the code
`<TakeoverStage>`'s `deck` slot has **exactly one** call site — EMOJI_CHARADES, which kept it and proved
it should. SONG_GUESS, RECREATE, TRIVIA and DRAWING are all deckless. One call site is far below
ADR-0002's three-call-site bar, so §4's "exactly three, with nothing to spare" is dead. **Open for the
owner**: keep `deck` as a slot on the layout anyway (it costs nothing when unfilled, and the empty-slot
collapse is already tested), or remove it and let EMOJI compose its own column in the body.

### A verification note worth keeping
Phase 4's e2e could not be verified for several hours: the machine was at load 7–14 (a VM, Logic Pro,
stray node processes) and the suite took **1.6 hours** instead of 2.1 minutes, with 2 hard failures and
4 flakes. None were real. The decisive evidence was `admin-config-wizard` failing after **32.4 minutes**
under load and passing **4/4 in 19.2 seconds** at load 2.4 on identical code — and a later isolation
attempt not even reaching the tests, because vite could not boot inside its 120s window at load 9.5. The
tree was held uncommitted until a run at load 2.09 returned **36 passed (2.1m)**. If this suite goes
strange again, check `uptime` before reading the failures.
- [x] T5.1 `f6d2ec0` — **the two timer chips are NOT collapsed, and the refusal is the finding.** They
  are a container and a presenter that happen to draw similar pills: `TakeoverTimerChip` calls
  `useHostRoomState()` and fires `useTimesUpChime()`, and its own comment says isolation is *the whole
  point of it* — `useNowTickMs` ticks 4×/sec and the chip exists so the joust arena / easel / schlonic
  zone do not re-render on every tick. Sharing it means stripping the context read out, which pushes
  the 4 Hz tick back up into `MinigamePlayTakeover` and re-breaks what the component exists to fix —
  and `packages/surface` carries no client context by design (owner decision P1). The TV chip is a pure
  `({remainingSeconds}) => JSX` presenter. Two call sites, below ADR-0002's bar anyway, and a merge
  would need `size`/`variant`/`timeUpLabel` props (guardrail 2).
  **The drift the task was commissioned to prevent was already at zero**: both chips take seconds from
  `resolveRemainingTimerSeconds` and `hostControlPanelCopy.timerValue` / `displayBoardCopy.minigameTimerValue`
  are *the same function reference* (`formatClockSeconds`). Neither can say a different second.
  **What was actually duplicated: `const URGENT_THRESHOLD_SECONDS = 10;` typed verbatim in FOUR files**
  — both chips and both eating heroes — so retuning urgency on the tablet would have turned the TV to
  heat at a different moment. Four call sites, identical semantics, clears the bar. Extracted to
  `apps/client/src/utils/timerUrgency/` as two predicates (`isTimerUrgent`, `isTimerTimeUp`), not an
  enum, because the eating heroes read them independently — the TV's big number stays urgent while the
  label flips to time's up. **The threshold is deliberately not exported**, on the same reasoning §6
  uses to withhold the dock-gutter token. `EatingStage` keeps its `!timer.isPaused` guard visible at the
  call site rather than as a flag in the helper (ADR-0003 g3): a clock paused on zero has not called
  time on anyone. Pure extraction, zero behaviour change. Clamps and keyframes deliberately NOT unified
  — host `clamp(1rem,1.6vw,1.6rem)` + `pulse` (opacity) vs TV `clamp(1.2rem,2vw,2.2rem)` + `heatpulse`
  (scale) is essential, not a skin: a 48px rail pill at arm's length and an overlay read across a room
  cannot share one `vw` clamp. The TV chip correctly KEEPS its `absolute … z-10` — on the TV it
  genuinely is an overlay; §6's stripping applied only to the host chip in the rail row, and that
  guard test still passes. Orchestrator independently mutation-tested: threshold 10→15 reddens exactly
  1 test, restore byte-identical. Gate green, e2e 36 passed at load 2.84.
  **Flagged**: the new tests protect the module, not the call sites — nothing stops a future edit
  hand-typing `<= 10` again. A source-scanning guard test would catch it; judged disproportionate here.
- [x] T5.2 `2c71b43` — **marquee shared as three tokens, and the missing bulbs restored.** All six
  marquees live in `packages/minigames/*`, **none in `apps/client`** — which settles where the shared
  thing must live before it is a question. The byte-identical claim holds, with a wrinkle the audit's
  grep missed: EMOJI_CHARADES spells the keys `teamName`/`showTitle`, so a grep for the marquee names
  finds only five. Verified mechanically by a migration script that compares all 15 declarations and
  aborts on divergence — all 15 matched. **Unlike `RunningTotals`, no colour substitution was needed**:
  both strings and the bulb ring were already house tokens (`text-text`, `text-gold`, `border-gold/45`).
  The absence of a substitution is recorded in the token comment, because last time there was one.
  **The bulb asymmetry is an omission, not a decision, and the proof is the word `relative`.** All three
  bulbless marquees still carry `relative` on the container, which exists for nothing except positioning
  the absolutely-placed bulb ring — and none of the three renders anything else absolute inside it
  (zero occurrences, checked). Nobody keeps a positioning context for an ornament they rejected.
  Chronology: DRAWING born with the marquee and bulbs 2026-06-11; JOUST copied it 2026-09-16 byte-for-
  byte *except* the `marqueeBulbs` line; FAPPY and SCHLONIC copied JOUST; GEO and EMOJI_CHARADES were
  restyled onto it 2026-09-21 and both *added* bulbs. Nothing in DESIGN.md §2.7/§2.9/§2.11 asks for a
  plainer marquee. Restored in all three.
  **Tokens, not a component**, applying §8's own rule and T5.1's judgement: the three strings are
  identical but the marquee *container* is not — two padding values and DRAWING's background differ six
  ways — so a `<Marquee>` would have to take the container as a prop, which is the `surfaceClassName`/
  `tone` prop §8 already refused for the arena frame at T3.3. Consumed by re-export from each game's
  `styles.ts`, the idiom already at `AdminConfigWizard/ReviewStep/styles.ts:3`, so no call site changed.
  Honest cost recorded: a token cannot make the omission unrepresentable the way a component would.
  Orchestrator independently mutation-tested: pointing JOUST's bulb span at another token reddens
  exactly 1 test, restore returns 125/125. Gate green, e2e 36 passed at load 2.70.
  **Noted, out of scope:** DRAWING dropped its brown hex for house tokens at 14:31 on 2026-09-21, two
  hours *after* GEO and EMOJI_CHARADES copied that brown — so DESIGN.md §2.5's reasoning ("read as a
  different app beside every other surface") now describes DRAWING as the only surface *without* it.
  A real inconsistency, left alone.

### Checkpoint decision (2026-09-23): TRIVIA and SONG_GUESS both get a marquee
- [x] T5.2b `8154765` — marquee added to both, from the shared tokens, with the bulb ring
  (a seventh and eighth without it would recreate the bug T5.2 had just fixed). **All eight
  marquee-bearing displays now carry bulbs**; RECREATE is the ninth and has its own masthead.
  **Both marquees are a `<div>`, not a `<header>`**, deliberately: `page.locator("header")` is the
  suite's strict handle on the host mini-rail and the sandbox puts both previews on one page, so a
  second `<header>` naming the same team turns `sandbox-content-pack.spec.ts`'s
  `header >> text=Molten Metal` from one match into two. EMOJI_CHARADES's marquee is already a `<div>`,
  so this is in-house. Reason commented at both call sites.
  **Redundant chrome resolved rather than stacked**: TRIVIA's `"ON THE CLOCK: <TEAM>"` caption removed
  (the marquee says it, and reading the same fact twice is what was removed from FAPPY earlier) — but
  the turn-complete signal it *also* carried moved into the counter cell rather than dying with it, and
  now changes colour as well as wording, because at TV distance a wording change alone is not an event.
  SONG_GUESS's `"SONG 1 OF 3"` **moved, not removed** — it was already the marquee title's exact
  tracking, weight and colour, unframed; side effect worth knowing is that it previously rendered only
  in the two clip phases, so the reveal and set-closing screens now carry it for the first time.
  `introTitle` renamed `showTitle` and used by both the intro heading and the marquee — one string,
  because it is one name. **SONG_GUESS now names the active team at all**, closing that gap.
  Ink at 1920×1080: TRIVIA rows 341–739 → 26–812; SONG_GUESS rows 488–592 → 26–619. Nothing truncates.
  DESIGN.md gains **§2.12 TRIVIA ("Question Card")** and **§2.13 SONG_GUESS ("Lounge Set")**, placed
  after §2.11 so the nine per-game languages stay contiguous.
  One existing test's assertion was flipped with justification: `closes the set without putting scores
  on the TV` had asserted the team name was absent at `done`; the marquee legitimately names it there
  now, so the assertion inverted AND the test's actual stated intent was guarded explicitly for the
  first time with `doesNotMatch(/\+\d/)`. Orchestrator reviewed that diff specifically — it is a
  strengthening, not a paper-over. Gate green, e2e 36 passed at load 2.85.
- [x] T5.3 `22fed4a` — **the TV's gutter inversion fixed by §6's mechanism, not by correcting numbers.**
  **The audit was stale in both directions.** It said four surfaces reserved for absent chips; the true
  state was **nine surfaces reserving, six of them for nothing** — and TRIVIA and SONG_GUESS reserve too,
  because T5.2b's new marquees were written with the same `pr-` copied in, so the count *grew* after the
  audit. The TV chip draws only when `remainingTimerSeconds !== null`, which traces back through
  `useMinigameCountdown` → `resolveStageViewModel` to a server timer that only starts when
  `timerKey !== null` — GEO, DRAWING and EMOJI_CHARADES only.
  **The three that DO have a clock were wrong in the other direction, which nobody had spotted**: the
  chip was `absolute right-[clamp(1rem,2vw,2rem)]` anchored to the *shell*, not the marquee, so at 1920
  it lands at **x=1856 — on top of the marquee's gold border and its dotted bulb ring** — while the
  reserve clearing space for it sat 34px further in at 1822. The reserve and the thing it reserved for
  never agreed on where the corner was.
  Fix: `MinigameDisplayRendererProps` gains `clock: ReactNode` (the display twin of the host prop); the
  chip is extracted to `DisplayBoard/StageSurface/MinigameTimerChip/` and **loses its `absolute … z-10`**;
  all nine surfaces render `{clock}` in their marquee's meta cell (RECREATE at the end of its masthead)
  and **all nine reserves are deleted**. EMOJI_CHARADES's `aria-hidden` `min-h-[1px]` spacer — the
  seventh idiom — is deleted and its third grid column now holds the clock, which is where the mockup
  (`emoji-charades-display/02-clue-wall.html`, `.timer-block`) always drew it. The sandbox's Display
  Preview now composes the chip too, so it stops lying about the TV corner the way it once did about the
  tablet's. One new token, `marqueeMeta`, which JOUST/FAPPY/SCHLONIC already carried byte-identically
  (three call sites *before* the change, eight after). **No gutter number exported** — the
  `/gutter|dock|reserve/i` guard test still returns `[]`.
  Measured at 1920×1080: SCHLONIC's meta cell `padding-right` 268.8px → 0, usable width 381.8 → 650.6,
  readout three lines → one, **marquee height 145.1px → 87.5px** — the dead reserve was costing 57.6px
  of arena height on every JOUST/FAPPY/SCHLONIC turn. EMOJI_CHARADES: chip `absolute` → `static`, right
  edge 1856 → **1822, the marquee's actual content edge**.
  **This reverses T5.1's recorded judgement** that the TV chip should keep its overlay because on a TV
  it genuinely is one. Nine hand-typed reserves and the mockups disagreed. Orchestrator independently
  mutation-tested: re-anchoring the chip absolutely takes client tests 551 → 550 pass / 1 fail, restore
  byte-identical. (First attempt was a false green — a `perl` call exited 0 without matching, so the
  `||` fallback never ran and the file was never mutated. Worth remembering: verify a mutation actually
  applied before trusting that it failed to redden anything.) Gate green, e2e 36 passed at load 2.75.
  **Noted, not done:** `NowPlayingSurface` is a second `absolute right-4 top-2 z-30` TV overlay that no
  game reserves for; it only draws while music plays, but it is the one remaining thing that can land on
  a marquee.

**Phase 5 complete.** The display surfaces are consolidated: one urgency threshold, three shared marquee
tokens, bulbs on all eight marquee-bearing TVs, marquees added to the two that had none, and the clock
laid out rather than floated on all nine.
