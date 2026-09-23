# ADR-0005: One Shared Host/Display Surface Package, and Two Named Takeover Layouts

Status: Accepted
Date: 2026-09-23

## Context

Two house rules contradicted each other, and a minigame host surface could not obey both:

1. `AGENTS.md:62` — minigame packages never import from `apps/client`.
2. `AGENTS.md:259` — host surfaces should prefer the Host language utilities exported from
   `apps/client/src/components/HostControlPanel/styleTokens/index.ts`. That path is the one this
   decision moved; the rule now points at `packages/surface`, which is the whole point of it.

Three independent mechanisms enforced the first: `apps/client/package.json` declares no
`main`/`types`/`exports`, `tsconfig.base.json` declares no `paths`, and no minigame package declared
the dependency. The design system was unreachable from the packages that draw most of the game UI,
so the second rule was advice nobody could take.

Nine minigame packages each invented an anatomy for `MINIGAME_PLAY` instead — one "surface language"
apiece, `DESIGN.md` §2.4 to §2.11. Measured at the party's real tablet size (1280x800) before this
work:

1. Canvas share ran 33% to 90%, median ~59%. GEO proved the shell permits 90%; nothing structural
   stopped the rest.
2. `resolveActiveTeamName` was copy-pasted verbatim into all nine host entry files, because
   `MinigamePlayTakeover` passed the round's team where every game wanted the turn's.
3. The turn counter appeared in four places and the primary advance in five, so a host relearned
   the tablet between games.
4. The dock gutter existed as nine hand-typed paddings in three idioms. Five games reserved a
   top-right corner for a clock they never draw; two games that do have a clock reserved nothing.
5. Two controls sat underneath the corner dock — TRIVIA's `INCORRECT` and RECREATE's `Next target`.

`packages/cast` had already solved this shape once, and its entry file says why it exists: it is a
package rather than a client component "so a minigame package can draw a player's bird too".

## Decision

1. `packages/surface` (`@wingnight/surface`) is the shared host/display design system, reachable
   from `apps/client` and from every minigame package. `HostControlPanel/styleTokens` moved here
   unchanged; the two keyframes the tokens reach ship from the package as `keyframes.css`.
2. The shell owns the takeover chrome. `MinigamePlayTakeover` renders the real mini-rail, the play
   clock and the corner dock as structural layout, and a game renders a body and forwards `rail`
   and `clock` as two `ReactNode` props — never one `chrome` object. The TV took the same shape:
   `MinigameDisplayRendererProps` gained `clock`, and all nine display surfaces lay it out instead
   of reserving space beside a floated one.
3. The package exports two named layouts, `<TakeoverStage>` (rail row, body, optional deck) and
   `<TakeoverCanvas>` (full-bleed body with chrome floating over it), never one component with a
   `fullBleed` flag. ADR-0002 guardrail 2 forbids behaviour-switch props and ADR-0003 guardrail 4
   prefers explicit small helpers; a game changes layout by changing which component it renders,
   which reads in a diff as the structural change it is.
4. Layout props are slots and nothing else — no variant, no tone, no configuration object. An
   unfilled slot renders no element at all, which is what lets the same layout serve a game with a
   clock and a game without one.
5. Everything else ships as tokens unless it clears ADR-0002's bar of three call sites with
   identical semantics. One component cleared it: `RunningTotals`.
6. The house component idiom is enforced on `packages/minigames/*/src/client/**` and
   `packages/surface/src/**`, not only on `apps/client`. The three colour rules follow with the
   colour migration and not before — see Cost 3.

The anatomy itself — the slot maps, the corner arithmetic, the z-index bands — is specified in
`DESIGN.md` §2.0B and, with the full derivations, in `docs/takeover-layout-api.md`. This ADR records
the decision and the rules that constrain the next change to it.

## Guardrails

1. **The shell owns the takeover chrome; a game renders a body and forwards `rail` and `clock`.** A
   game never draws a rail, never positions the clock, and never computes the active team name —
   `activeTeamName` on the renderer props is authoritative and is resolved once, by the rail.
2. **`packages/surface` carries no client context.** That is why the rail is a slot rather than a
   component (owner decision P1, 2026-09-21), and it is why the host timer chip stayed in
   `apps/client`: it reads room state and isolates a 4 Hz tick from the arena, the easel and the
   zone.
3. **No gutter token is exported.** The 4.5rem bottom-right reserve is applied by the layouts and
   nowhere else, because handing out the number invites a tenth hand-typed copy — which is the mess
   the layouts exist to end. A test asserts no export matches `/gutter|dock|reserve/i`. The same
   reasoning keeps `URGENT_THRESHOLD_SECONDS` unexported from `apps/client/src/utils/timerUrgency/`,
   which ships two predicates instead.
4. **The z-index mechanism is geometry, not numbers.** The body slot is `relative isolate`, so a
   game may use any z-index it likes — including the z-1000 Leaflet assigns itself — and none of it
   escapes. This was proved at T4.4 by pixel-hashing the chrome row at a true 1280x800, not
   asserted: with the layout's isolation in place the region is byte-identical whether or not GEO
   isolates too, and with both removed it collapses to a flat tile painted over the clock.
5. **Pointer events belong to controls, not to children.** The Canvas's floating rows are
   `pointer-events-none` and hand the pointer back with
   `[&_:is(button,a,input,select,textarea)]:pointer-events-auto`. It fails safe the right way round:
   a forgotten class on a sentence costs one tap target, while a button is live for being a button.
6. **`position: fixed` is banned anywhere in the takeover.** The dev sandbox renders the host shell
   inside a CSS-scaled device frame, and a transformed ancestor captures fixed positioning — so a
   fixed element looks right everywhere except where the surface is judged.
7. **Behaviour is unchanged.** Escape hatches are never removed (`AGENTS.md` §11); new host controls
   go through the override surface, not inline chrome (`SPEC.md:380`); touch targets stay 44px or
   larger; the host drives every phase and nothing auto-advances.

## Non-Goals

1. No NPM extraction. `packages/surface` is monorepo-local, exactly as `packages/cast` is.
2. No third layout, and no configurable one. A game that fits neither is a design conversation, not
   a prop.
3. No whole-client design system. The package holds what the host tablet and the TV both draw.
4. No colour migration. The minigame `styles.ts` files still carry raw hex from before the semantic
   tokens existed; that is a design pass, tracked in `BACKLOG.md`.
5. No change to shared contracts, room state, phase behaviour or minigame scoring.

## Consequences

### Positive

1. All nine host surfaces migrated — five on `<TakeoverStage>`, four on `<TakeoverCanvas>`.
2. Canvas share moved from 33-90% (median ~59%) to 59-90%. RECREATE went 33% to 74.7% and its 269px
   of dead air to zero; TRIVIA 36% to 82.5%; JOUST, FAPPY and SCHLONIC to 89.9% with the 330px deck
   gone.
3. `resolveActiveTeamName` is at zero definitions, down from nine, fixed at the source rather than
   deleted nine times.
4. Both dock collisions are fixed geometrically rather than by padding: there is no bottom-right
   slot for a control, so a game cannot put one there. TRIVIA's bug was reproduced before it was
   fixed — a forced-height question card gave a real 42.4x20.8px overlap and the dock won the press.
5. The top-right budget is abolished rather than corrected. The clock is the last item of a flex
   row, so an unfilled slot takes no width, and nine hand-typed TV reserves were deleted with it —
   worth 57.6px of arena height on every JOUST, FAPPY and SCHLONIC turn.
6. Sharing `RunningTotals` across four games exposed a bug no copy could see from inside a 330px
   deck: `justify-between` with no gap put the longest team name flush against its points at a
   measured 0px.
7. The house component idiom now governs `packages/minigames/*/src/client/**`, which is most of the
   game UI and was previously ungoverned.

**The percentages above are approximate and the deltas are not.** The per-game figures were measured
by different agents against slightly different definitions of "the canvas" — body-slot area against
the specific card and controls the original audit measured — and one measured TRIVIA at 72.7% on its
own yardstick where the plan's ledger records 82.5%. Every figure was independently reproduced and
every direction is sound, but the column is not one consistent metric. Read the movement, not the
digits.

### Cost / Tradeoffs

1. A fourth package in the graph, and one more hop between a host surface and the class string it
   renders.
2. A token cannot make an omission unrepresentable the way a component can. That is how three TV
   marquees came to be copied without their bulbs, and the marquee remains three tokens.
3. Extending the lint globs was the cheap half, and it was not what had been keeping the minigame
   trees out. Three rules — the two colour rules and the `ClassName`-suffix rule — gate internally
   on a hardcoded tree list in `tools/eslint-plugin-wingnight/rules/houseComponentPaths.mjs`, so a
   glob alone would have been inert for them. Adding the minigame trees to that list reports 50
   findings: 49 hex literals and one raw palette class across seven of the nine packages. The globs
   are in place and the marker list deliberately is not, so those three rules still do not reach
   the minigame trees until the colour pass lands.
4. Nine packages now depend on one layout file. A mistake in it is a mistake in every game at once,
   which is the trade this ADR is making on purpose.

## What Was Measured and Refused

Five abstractions were measured against ADR-0002's bar and turned down. The refusals are part of the
decision, not the residue of it.

1. **The three history strips.** Three call sites but three shapes: `ShotHistory` pads to a fixed
   count, `LegHistory` is data-length with an active chip and a crash badge, `RunHistory` is two
   cells a row. Collapsing them needs `items` + `renderItem` + `isActive` + `padTo` + `tone` — the
   configuration object guardrail 2 forbids.
2. **The arena frame.** Two call sites with identical semantics plus one coincidence. The two
   utilities that are a real design decision are §2.7's marquee frame, which JOUST and FAPPY share
   by descent and which SCHLONIC deliberately does not — §2.11 says its zone looks like nothing else
   in the show on purpose.
3. **The merged timer chip.** A container and a presenter that happen to draw similar pills. Merging
   would push a 4 Hz tick back into the component that exists to isolate it, and the drift the merge
   was commissioned to prevent was already zero — both chips format the same seconds through the
   same function reference. What was actually duplicated was the urgency threshold, typed verbatim
   in four files, and that is what got extracted.
4. **A shared `<Marquee>` component.** Identical strings, six different containers, so the component
   would have had to take the container as a prop.
5. **The `deck` slot's own justification.** It was argued for on three call sites and, as the
   migrations landed, fell to one — EMOJI_CHARADES, which re-tested the deck rather than assuming
   it and kept it because widening the picker makes it hold less.

**The rule: share the thing that would drift dangerously, refuse the thing that merely looks alike.**
`RunningTotals` is the positive case and it earned its place immediately.

## Still Open

1. The `deck` slot has one call site, below ADR-0002's bar. Keep it as a slot that costs nothing
   when unfilled, or remove it and let EMOJI_CHARADES compose its own column in the body.
2. The arcade surface language. Three games shared a "house" card that was actually JOUST's private
   dusk-desert palette. Each migration substituted house tokens value for value; whether those games
   genuinely share a language DESIGN.md should name is unanswered.
3. `NowPlayingSurface` is the one remaining TV overlay nothing reserves for — `absolute right-4
   top-2 z-30`, drawn only while music plays, and the last thing that can land on a marquee.
4. The colour migration in `BACKLOG.md`, which is the only thing standing between the minigame trees
   and the three marker-gated lint rules.

## Verification Strategy

Per task: `pnpm lint && pnpm typecheck && pnpm test`, plus
`CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e` for anything under
`apps/client/src/**`, `packages/minigames/**/*.tsx` or `tests/e2e/**`.

Two habits this project added, both worth keeping:

1. **Layout claims are settled in a browser at a true 1280x800**, through `/dev/minigame/<slug>`
   with the pane fronted: `vw`/`vh` resolve against the browser viewport inside the scaled device
   frame, and a hidden pane never fires `ResizeObserver`. Dock reachability is proved with
   `elementFromPoint` sampled across the circle, not by comparing rectangles.
2. **Every shared primitive is mutation-tested** rather than trusted — strip the `isolate`, drop the
   gutter, retune the threshold, and confirm exactly the expected tests redden. One such check was a
   false green because the mutation never applied; verify it landed before trusting a green.

## Rollout

Tracked in `docs/host-surface-consolidation-plan.md`, one task per commit:

1. Phase 1 — `packages/surface` created, `styleTokens` moved, the keyframe coupling closed, the
   lint rules widened, the over-cap files cut on the seams the shared primitives would follow.
2. Phase 2 — the layout API written as prose first, the two layouts implemented, the shell taught
   to draw the chrome, TRIVIA migrated as the first adopter.
3. Phases 3 and 4 — the remaining eight games, GEO pulled ahead of JOUST so `<TakeoverCanvas>` was
   exercised before three games bet on it.
4. Phase 5 — the display surfaces: one urgency threshold, the marquee tokens and their missing
   bulbs, the TV clock laid out rather than floated.
5. Phase 6 — `DESIGN.md` §2.0B, the per-game sections, the authoring guide and this ADR.

## Implementation Outcome (2026-09-23)

1. Nine of nine host surfaces on the shared layouts. On the TV, eight marquees on the shared tokens
   and their bulb ring, RECREATE on its own masthead, and all nine laying the clock out rather than
   reserving space beside a floated one.
2. `resolveActiveTeamName`: zero definitions. Hand-typed dock and clock reserves: zero.
3. `packages/surface` exports two layouts, one component and the token set, and no gutter number.
4. `pnpm lint` exits 0 with the house rules governing the minigame client trees.
5. Every phase closed on a green `pnpm lint && pnpm typecheck && pnpm test`, and every phase that
   touched a rendered surface on a green `pnpm test:e2e` (36 passed).

Residual risk: phase 4's e2e suite once took 1.6 hours instead of 2.1 minutes and produced two hard
failures and four flakes, none of them real — the same spec failed after 32 minutes at load 9 and
passed in 19 seconds at load 2.4 on identical code. If this suite goes strange, check `uptime`
before reading the failures.
