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
