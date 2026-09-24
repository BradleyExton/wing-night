# The takeover layout API

Written for T2.1 of `docs/host-surface-consolidation-plan.md`. This is the contract that
`<TakeoverStage>` and `<TakeoverCanvas>` are built to in T2.2, that `MinigamePlayTakeover` is wired
to in T2.3, and that nine minigame host surfaces are rewritten against in T2.4 and phases 3–4. It
was prose written before any of it existed.

**Status: built.** All of it shipped — both layouts, the shell wiring, all nine host surfaces and,
in phase 5, the TV. Read this document as the contract and the arithmetic behind it; read
`DESIGN.md` §2.0B for the shorter version a tenth minigame needs, and §2.4-§2.13 for what each game
actually does with the slots. Where a projection here was overtaken by a measurement — the deck's
call sites (§4, §8), the arena frame (§8), the token pass (§8) — the section says so at the point
of the claim rather than being quietly rewritten, because the refusals are worth as much as the
things that shipped.

Read it as law about **where things go**, not about how they look. The measured problem is not that
the nine surfaces are ugly — it is that a host moving from SCHLONIC to TRIVIA to GEO relearns the
tablet each time, because the turn counter lives in four different places and the primary advance
in five. Placement is the product.

Everything asserted here was checked against this worktree. Section 12 lists the file and line of
every claim so a reviewer can re-check it rather than trust it.

---

## 1) What the shell owns, and what the game owns

`DESIGN.md:91` says the deck collapses at `MINIGAME_PLAY` and "the minigame package owns the full
canvas. The shell steps out of the way." That was read as *the shell renders nothing*, and it is
why nine packages each grew a rail. The correct reading is narrower: **the shell stops rendering
the control deck. It does not stop rendering the room's context.**

From T2.3 onwards the boundary is:

| Piece | Owner | Where it comes from |
|---|---|---|
| Round / sauce / minigame / active-team rail | **Shell** | `HostMiniRail`, which already renders `<header>` and already has a `MINIGAME_PLAY` branch in `selectHeaderContext` |
| Play clock | **Shell** | `TakeoverTimerChip`, which returns `null` when there is no room timer |
| Primary advance for the *phase*, overrides | **Shell** | `HostTakeoverDock`, rendered by `HostControlPanel`, unchanged |
| The bottom-right dock gutter | **Shell** | Applied by the layout. Never hand-typed by a game again |
| The z-index budget | **Shell** | Declared in §7. A game's own stacking is confined to its body |
| Everything inside the body | **Game** | The map, the arena, the board, the question, the frames |
| The turn's own controls and counts | **Game** | In the slots §4 and §5 name, and nowhere else |

The shell owning the rail has one consequence that touches every package: **`resolveActiveTeamName`
is deleted from all nine host `index.tsx` files.** It exists nine times, byte-identical, because
`MinigamePlayTakeover` passes `activeRoundTeamId === null ? null : activeRoundTeamName` — the
*round's* team — while the games want the *turn's* team, so each one re-derives it from
`minigameHostView.activeTurnTeamId`. `selectHeaderContext` already resolves this correctly for the
rail: at `MINIGAME_PLAY` it takes `activeTurnTeamId ?? activeRoundTeamId`.

**What the game receives instead:** `MinigameHostRendererProps.activeTeamName` stays on the props
and becomes authoritative — the shell resolves it once, with `selectHeaderContext`'s precedence, so
the string on the props and the string in the rail are the same string. A game must not render it
as chrome; the rail says it, and saying it twice on one canvas is the duplication this project
exists to remove. A game may still use it inside body copy where a sentence needs it. As shipped,
none of the nine does: RECREATE's `teamLine` was the one candidate and the rewrite deleted the row
it lived on, so `activeTeamName` is read by no host surface today and `resolveActiveTeamName` is at
zero definitions repo-wide, down from nine.

**What the game does not receive, and should:** the team's colour. Every team dot on every host
surface is `bg-primary`, in four different spellings, so the dot is never actually the team's
colour — while `selectHostTeamMaps` already builds `teamThemeByTeamId` and simply is not on
`MinigameHostRendererProps`. `HostMiniRail`'s own `miniRailTeamDot` has the same bug. This spec
did not fix it; P6 was pulled into scope at T2.3 and it is fixed at the source instead. The rail
composes its dot and halo from `teamThemeByTeamId` via `selectHeaderContext`, so the dot is the
team's real colour, and `miniRailTeamDotUnassigned` keeps the house accent for "No team assigned".
No game ever draws a team dot now, so the four spellings went with the chips.

---

## 2) Two layouts, never one with a flag

`docs/adr/0002` guardrail 2 forbids behaviour-switch props and multi-flag configuration objects;
`docs/adr/0003` guardrail 4 prefers explicit small helpers over configurable abstractions. So the
package exports two named layouts:

- **`<TakeoverStage>`** — rows. A rail row on top, a main row (body plus an optional deck column),
  an optional actions row at the foot. For games made of panels the host reads and presses.
- **`<TakeoverCanvas>`** — one full-bleed body with the chrome floating over it. For games whose
  body is a single continuous region that should be as large as the tablet allows.

There is no `fullBleed` prop, no `variant`, no `layout="stage" | "canvas"`. Two imports, two names.
A game changes layout by changing which component it renders, which shows up in a diff as a
structural change, because it is one.

Both layouts are pure presentation and live in `packages/surface`. They take no room state and call
no hooks that read it: `packages/surface` has no dependency on `@wingnight/shared` and minigame
packages may not import `apps/client` (`AGENTS.md:62`). Room-derived content reaches them as
elements, from the shell.

---

## 3) Choosing between them

**The rule.** Use `<TakeoverCanvas>` when chrome can float over the body without covering something
the host must read or press. Use `<TakeoverStage>` when it cannot.

That is a question about the body's content, and it has a mechanical test: *is the body's meaning
spread evenly across it, or concentrated?* A map, an arena, a corridor and a zone are evenly spread
— a chip in one corner costs a corner of scenery. A question card, a pair of picture frames, an
emoji picker and a song console are concentrated — a chip over them covers words.

**The assignment.**

| Game | Layout | Why |
|---|---|---|
| GEO | Canvas | The chart is the tablet. Already built this way; mostly adopting names it invented |
| JOUST | Canvas | The arena is evenly spread scenery; `arenaHint` becomes a floating hint |
| FAPPY | Canvas | Same, the corridor |
| SCHLONIC | Canvas | Same, the zone. Its `jumpLegend` is already a floating bottom-left chip |
| DRAWING | Stage, no deck | **The board is not floatable-over.** Floating the toolbar over the easel covers the drawing. It is already rail + easel + toolbar; it becomes a Stage with three rows and no deck |
| TRIVIA | Stage, no deck | Question card and two verdicts. Nothing to float over |
| EMOJI_CHARADES | Stage with deck | Picker left, subject and verdicts right — already a two-column grid |
| RECREATE | Stage with deck | Frames left, composer/appraisal bench right — already `md:grid-cols-[2fr_3fr]` |
| SONG_GUESS | Stage with deck | A console, not an arena. T3.4 judges whether it should become a Canvas; the rule above says no |

**The layout column survived contact; the deck column did not.** Every game landed on the layout
this table predicted — five Stages, four Canvases — and the rule was never overridden. But two of
the three predicted decks went: SONG_GUESS is a Stage *with no deck*, and RECREATE is a Stage with
no deck. The reason is the same in both cases and worth carrying: **which layout and whether to keep
a deck are separate questions**, and this table ran them together. RECREATE's bench turned out to be
the *wider* of its two columns, which a 330px sidebar could never have held; SONG_GUESS's nine tap
targets needed the foot row's full width. Only EMOJI_CHARADES's deck survived, and only because it
was re-measured rather than inherited (§4).

DRAWING is the interesting case and the reason the rule is phrased about *covering* rather than
about size. Its body is the largest single element of any Stage game, and it still is not a Canvas:
full bleed was measured at 78.3% against the Stage's 59.1% and refused, because a floating `actions`
row for DRAWING is five buttons, and under §5's pointer rule a button takes the pointer for being
one — ~700x44px of the picture the TV is mirroring, with CLEAR under the artist's moving hand.

---

## 4) `<TakeoverStage>` — slots

```
┌──────────────────────────────────────────────────────────────┐
│ rail  (shell)                        counter (game)  clock   │  rail row
├───────────────────────────────────────────┬──────────────────┤
│                                           │                  │
│ children — the body (game)                │ deck (game, opt) │  main row
│                                           │                  │
├───────────────────────────────────────────┴──────────────────┤
│ actions (game, optional)                        ▓▓ reserved  │  foot row
└──────────────────────────────────────────────────────────────┘
```

### `rail` — shell only

Filled by `MinigamePlayTakeover` with `<HostMiniRail />`. A game never passes it and never renders
a rail of its own. The four byte-identical `rail` tokens in JOUST, FAPPY, SCHLONIC and SONG_GUESS,
and DRAWING's `railIdentity` / `railTitle` / `railTeam` / `railTeamDot`, are deleted rather than
shared.

`HostMiniRail` renders `<header>`, and the e2e suite depends on that element wrapping the rail
(§9). The layout must not wrap the rail slot in another `<header>`, `<nav>` or landmark.

### `counter` — game, read-only

The turn's live counts, right-aligned in the rail row, left of the clock. This is the one home for
every number the host glances at without acting on it:

- "Photo 2 of 3" (GEO `counterChip`)
- "Shot 2 of 5" (JOUST `shotCounter`), "Leg 2 of 4", "Run 2 of 3", "Song 3 of 6"
- "Target 2 of 3" (RECREATE `headerMeta`)
- "2 questions left" (TRIVIA `questionsLeftLabel`)
- "+3" pending for the active team (DRAWING `railPending`, JOUST `railPending`)

**May not contain:** a button, a link, an input, or anything with a tap target. The rail row is
read-only. A control there sits beside the clock, which is exactly where a host will not look for
it, and on a Canvas it would sit under the chrome row's `pointer-events-none`.

**May not contain:** the team name or the minigame name. The rail already carries both.

### `clock` — shell only

Filled with `<TakeoverTimerChip />`, or with nothing. See §6 — the corner budget turns entirely on
this slot being a slot rather than an overlay.

### `children` — the body, game

Everything the host reads. The layout gives it `min-h-0 flex-1` and `relative isolate` (§7), so a
game may absolutely position inside it freely and its z-indexes cannot escape.

**May not contain** a control that reaches the bottom-right corner. That is the rule that fixes
both live bugs: TRIVIA's `INCORRECT` and RECREATE's `Next target` land under the dock today because
each is the last flow child of a body with no bottom reserve. In a Stage, controls that end a beat
live in `actions` or in `deck`, and the layout reserves the corner on both.

### `deck` — game, optional

A fixed-width right column, the width the four arcade games converged on by hand:
`w-[clamp(230px,28vw,330px)]`. At 1280 that is 330px, and with the `gap-3` between it costs the
body exactly the 342px that shows up in the audit as `887` instead of `1228`.

**As shipped, the deck has exactly one call site: EMOJI_CHARADES.** This spec projected three
(EMOJI_CHARADES, RECREATE, SONG_GUESS) and called it "ADR-0002's three-call-site bar with nothing
to spare"; each of the other two was re-tested against §3 during its own migration and dropped it.
SONG_GUESS's bench is nine tap targets and a totals panel, which needs the foot row's full width;
RECREATE's is the *wider* of its two columns, a grid of 360px toggles a 330px sidebar could never
have held. EMOJI_CHARADES kept it on measurement rather than inheritance: its cells are
`aspect-square`, so widening the body makes the picker hold *less*, and going deckless costs 14% of
the tap surface.

One call site is far below the bar, so the deck is **a styled slot on `<TakeoverStage>`, not a
component** — see §8. Keeping it as a slot costs nothing when unfilled, and the empty-slot collapse
is the same mechanism the clock relies on. Removing it and letting EMOJI_CHARADES compose its own
column in the body remains open for the owner; the argument for keeping it is that a second
panel-shaped game wanting a right column should not have to re-derive its width.

The deck is a scrolling column (`deckRoot` is already `overflow-y-auto`), so the layout gives it
the dock gutter as bottom padding at no cost: short content never notices it, long content scrolls
past it.

### `actions` — game, optional

The foot row, full width under both the body and the deck. Everything that ends a beat: verdicts,
"Next photo", "Next target", "Next song", DRAWING's toolbar, EMOJI's utility row.

The layout gives this row the dock gutter as right padding. That is the T1.8 precedent, chosen by
the owner over a bottom band for a reason that holds generally: a full-width bottom reserve pushes
up every child of a flex column and costs vertical space on games that have none to spare, while an
inline reserve costs width in one row and nothing anywhere else.

**Ordering inside `actions`:** the positive verdict comes first. TRIVIA and EMOJI_CHARADES already
put `CORRECT` / `GOT IT` before the negative one; DRAWING was the only surface rendering "Nope"
before "Correct", and it was flipped when it migrated. All three now agree, and this is a house
rule rather than a preference (owner decision P7).

---

## 5) `<TakeoverCanvas>` — slots

```
┌──────────────────────────────────────────────────────────────┐
│ rail (shell)                         counter (game)  clock   │  floating chrome row
│                                                              │
│                                                              │
│   children — the body, full bleed, isolated                  │
│                                                              │
│                                              readout (game)  │  floating, above the dock
│ actions (game)                                  ▓▓ dock      │
└──────────────────────────────────────────────────────────────┘
```

Same four names as the Stage — `rail`, `counter`, `clock`, `children` — with the same rules, except
that the chrome row floats over the body instead of sitting above it. The row is
`pointer-events-none`, so it never eats a thumb aimed at the map underneath.

*Amended at T3.3.* As first written all three floating rows handed
`pointer-events-auto` to every direct child, the way `HostTakeoverDock` does — correct for the map
this layout was drawn around, where every child of `actions` was a button, and wrong for a game
whose body IS the button. FAPPY's hint sentence is a `<span>` in that row and killed 764x48px of the
corridor, 4.0% of it, where a tap means flap; SCHLONIC's `JUMP` legend is the same shape. A passive
child could not opt out — a plain `pointer-events-none` on the hint is inert, because it and the
generated `… > *` rule have equal specificity and the layout's is ordered later (verified in the
browser: `getComputedStyle` read `"auto"` with both classes on). **So a row now grants the pointer
to controls rather than to children**, matched as descendants:
`[&_:is(button,a,input,select,textarea)]:pointer-events-auto`. A control claims the pointer by being
one; a hint, a plaque and a running-totals card do not. It is a narrower selector, not a flag —
there is no `interactive` prop and no per-slot configuration object (ADR-0002 guardrail 2) — and it
fails in the safe direction, since a forgotten class on a sentence costs a dead tap target while a
button is live for being a button. The same one rule is on all three rows, which makes `counter`,
`clock` and `readout` fully transparent: §4 already forbids a control in the rail row and §5 forbids
one in `readout`, so the grant matches nothing there today and the chrome row stops holding a
full-width strip of the body's top edge against a thumb. Measured on SCHLONIC at 1280x800: 104,346px²
of live overlay under the old rule, 11,520px² (the two escape hatches) under this one — 10.1% of the
zone given back.

"Full bleed" here means the body fills the takeover's padding box, not the viewport. At 1280x800
the takeover container's `p-[clamp(1rem,2vw,1.75rem)]` resolves to 25.6px, leaving 1228.8 x 748.8
— which is the 1227x747 map the audit measured for GEO, and the 90%.

### `actions` — game, optional. Bottom-left, floating.

The turn's one or two controls, plus the hint that explains them. GEO's `actionBar` already sits
here, with its comment giving the reason: bottom-left is the one corner where a control is neither
under the dock nor over the pin the team just placed.

This is also where the hint text lands, which is the fifth of the five placements the audit found.
JOUST, FAPPY and SCHLONIC currently put `arenaHint` on a row *under* the board, costing the arena
height; as a floating bottom-left line it costs nothing.

The layout constrains this slot's width so it cannot run under the dock — GEO's
`max-w-[calc(100%-6rem)]`, generalised.

### `readout` — game, optional. Bottom-right, floating **above** the dock.

The turn's numbers where the host's eye already is after a result: distance and points (GEO's
`verdict`), the running totals panel, the last shot's score. The layout positions it clear of the
dock so the game does not hand-type GEO's `bottom-[clamp(4.9rem,9vh,5.6rem)]` four more times.

*Amended at T3.1.* As first written, this slot took the gutter as a bottom offset and nothing else,
while `actions` took it as a max-width — so `actions` was bounded in the axis it grows and this row
was not. GEO's two fixed tiles never showed it. JOUST's did: its result plaque names everyone a
shot felled, a cleared rack is nine names on one line, and a right-anchored row with no bound grows
leftward until it spans the canvas and stops being a readout (measured at 1154px of 1229 on the
sandbox's roster). The slot now carries `max-w-[calc(100%-4.5rem)]` as well, so **each floating
slot is bounded in the axis it grows, by the same one number**. Its children are ordinary flex
items, so content past the bound wraps inside them rather than being clipped.

The other axis is not bounded and does not need to be: `readout` grows *upward* from the dock, and
the room's largest possible standing — eight teams, `teamA`-`teamH` — makes `RunningTotals` 311px
tall against the 677px between the gutter and the chrome row. A game would need some twenty-three
teams to reach the rail. A `readout` that stacks rather than rows should check that budget; nothing
enforces it.

**There is no bottom-right slot for a control.** The bottom-right corner belongs to the dock. A
game that wants a button there has misunderstood the phase: the tablet is in the players' hands,
and the only two things that corner does are end the turn and open overrides.

### What a Canvas body may not do

- It may not render its own floating chrome. If a chip belongs on the canvas, it belongs in a slot.
  GEO's `floating` helper (`absolute z-[1100]`) is deleted; its five users become slot content.
- It may not take the dock gutter itself. The layout has it.
- It may not set `isolate` on itself. The layout already does, and a second isolation does no harm
  but signals the author did not read this document.

---

## 6) The corner budget

### The top-right is not a budget any more

`DESIGN.md:92` states a ~4.5rem bottom-right reserve in prose. In code there are **nine** hand-typed
reserves in **three** idioms, and five of the nine are guarding a corner that is empty:

| Reserve | Idiom | Game | Has a play clock? |
|---|---|---|---|
| `HostFappySurface/styles.ts:5` | `pr-[clamp(9rem,15vw,12rem)]` | FAPPY | **no** |
| `HostJoustSurface/styles.ts:5` | `pr-[clamp(9rem,15vw,12rem)]` | JOUST | **no** |
| `HostSchlonicSurface/styles.ts:5` | `pr-[clamp(9rem,15vw,12rem)]` | SCHLONIC | **no** |
| `HostSongGuessSurface/styles.ts:5` | `pr-[clamp(9rem,15vw,12rem)]` | SONG_GUESS | **no** |
| `HostRecreateSurface/styles.ts:8` | `pr-[clamp(9rem,15vw,12rem)]` | RECREATE | **no** |
| `HostGeoSurface/styles.ts:21` | `pr-[clamp(9rem,15vw,12rem)]` | GEO | yes |
| `HostDrawingSurface/styles.ts:63` | `pr-[4.5rem]` (bottom-right) | DRAWING | yes — **and nothing reserved top-right** |
| `HostEmojiCharadesSurface/styles.ts:111` | `pr-[4.5rem]` (bottom-right) | EMOJI_CHARADES | yes — **and nothing reserved top-right** |
| `HostRecreateSurface/styles.ts:63` | `w-[calc(100%-4.5rem)]` (bottom-right) | RECREATE | n/a |

Only GEO, DRAWING and EMOJI_CHARADES have a play-phase clock: `MINIGAME_DEFINITIONS` sets
`timerKey: null` for the other six, `resolveMinigameTimerSeconds` returns `null` for those, and
`TakeoverTimerChip` returns `null` when the room has no timer. So five games reserve 192px of rail
width for a chip that never draws, and the two games whose chip *does* draw reserve nothing — the
chip lands on top of DRAWING's `railPending`, the gold pending-points number in the right-hand
`auto` column of its rail.

**The fix is structural, not a better number.** The clock stops being an overlay and becomes the
last item in the rail row, in both layouts. A slot that is empty takes no width; a slot that is
filled pushes the `counter` left. The reserve follows from whether the chip renders because there
*is* no reserve — there is a flex row, and rows are how you reserve space for something that might
not be there.

Consequences for T2.2 / T2.3:

- `TakeoverTimerChip/styles.ts:4` loses `absolute right-[…] top-[…] z-10`. It keeps the pill:
  `rounded-full border border-text/10 bg-surface/90 …` and its three colour variants.
- `MinigamePlayTakeover` stops rendering the chip as a sibling of `MinigameSurface` and passes it
  into the layout's `clock` slot instead.
- The dev sandbox composes the chip itself, in `SandboxStage/index.tsx`, deliberately mirroring how
  `MinigamePlayTakeover` composes it. It must be updated in the same task or the sandbox goes back
  to lying about the corner it was just taught to tell the truth about (T1.7).
- All nine reserves in the table above are deleted. `packages/surface` exports **no** dock-gutter
  token, because exporting one is an invitation to type a tenth reserve by hand.

### The bottom-right is a budget, and it is 4.5rem

The dock is `absolute inset-0` on the host container; its cluster sits at
`bottom-[clamp(0.75rem,1.6vw,1.25rem)] right-[…]` with a 48px (`h-12 w-12`) circle. At 1280x800
that offset resolves to 20px, so the circle occupies the 48px square ending 20px from the container
edge. The body's content box starts 25.6px in, so the circle intrudes **42.4px** into it; at the
narrow end of the clamps the intrusion is ~44.8px. `DESIGN.md`'s ~4.5rem (72px) clears it by about
30px, which is right for a thumb.

The layouts apply 4.5rem, and only the layouts:

- `<TakeoverStage>`: `actions` gets it as right padding; `deck` gets it as bottom padding inside
  its own scroll container.
- `<TakeoverCanvas>`: `actions` gets it as a max-width constraint; `readout` gets it as a bottom
  offset **and** (T3.1) as a max-width. There is no bottom-right slot at all.

One number, five applications, zero occurrences in any `packages/minigames/**/styles.ts`.

GEO's Leaflet nudge — `[&_.leaflet-bottom.leaflet-right]:mr-[4.5rem]` in `GeoGuessMap/styles.ts:6`
— is not one of the nine and stays where it is. It moves Leaflet's own attribution control, which
the layout cannot reach.

---

## 7) The z-index scale

Today there is no scale. There are three numbers and a comment explaining each:

- `HostTakeoverDock/styles.ts:12` — `z-[1100]`, because Leaflet's map controls reach z-1000 and the
  host must always be able to reach the only two buttons they have.
- `TakeoverTimerChip/styles.ts:4` — `z-10`.
- `HostGeoSurface/styles.ts:19` — `absolute z-[1100]` for *all* of GEO's floating chrome, kept off
  the dock only by the `isolate` on its container at line 8.

That last one is the trap. GEO's chrome and the dock pick the same number, and the thing keeping
the dock on top is a single word in a different file. A minigame that copies GEO's `floating`
helper and forgets `isolate` paints its own chips over the dock — over skip, redo and end-turn.

### The declared budget

**Band 0 — the game's interior.** The body slot is `relative isolate`, so it is a stacking context.
Inside it a game may use **any** z-index it likes, including the z-400/z-1000 Leaflet assigns
itself, and none of it can escape. This is the whole mechanism: the game is sandboxed by geometry,
not by an agreement about numbers.

**Band 1 — the game's floating chrome: `z-10`.** `<TakeoverCanvas>`'s `actions` and `readout`
slots. Applied by the layout to the slot wrapper; the game does not write it.

**Band 2 — the shell's chrome: `z-20`.** The rail row, `counter` and `clock`. Above the game's
floating chrome, so a game with a lot to say can never bury the round number or the clock.

Bands 1 and 2 are local: the layout root is `relative isolate` too, so these two small numbers
cannot collide with anything else the app stacks.

**Band 3 — the shell's controls: `z-[1100]`, reserved.** `HostTakeoverDock`, rendered by
`HostControlPanel` outside the layout. It keeps its number. Once every body isolates, 1100 is belt
and braces rather than a requirement — but it is the number that has been right for a year and
lowering it buys nothing.

**Also in the root context, from the shell:** `OverrideDock` overlay `z-40`, floating trigger
`z-50` (hidden during the takeover — `showTrigger={false}`).

### What a minigame may and may not use

- **May:** any z-index, anywhere inside its body. `z-10` overlays on a scene, `z-20` callouts,
  Leaflet's own 400–1000. FAPPY's `handoffOverlay` and SCHLONIC's `handoffOverlay` are both `z-10`
  inside their arena frames and are correct as written.
- **May not:** any z-index on a slot's root element. The layout owns bands 1 and 2, and a game
  that sets `z-[1100]` on slot content is reaching for band 3.
- **May not:** `isolate` on the body. The layout has it.
- **May not:** `position: fixed` anywhere in the takeover. The sandbox renders the host shell inside
  a CSS-scaled device frame, and a transformed ancestor captures fixed positioning — which is why
  `HostTakeoverDock/styles.ts` is `absolute` and says so at line 5.

### One inversion this spec declares but does not fix

The dock at `z-[1100]` paints above the override panel at `z-40`. During the takeover, opening
overrides closes the dock (`setIsOpen(false); onOpenOverrides();`), so what remains on top is the
48px circle — and the override panel's desktop geometry is `md:bottom-4 md:right-4`, the same
corner. The circle floats over the panel's bottom-right corner. It is `pointer-events-none` at the
root with only the circle itself interactive, so it is a visual overlap rather than a dead control.
See proposal P5.

---

## 8) Tokens, not components — what shipped

Everything shared that has no structure ships as a style token from `packages/surface`: a named
export whose value is a class string, no component, no props.

**This section originally promised four new components and a broad token pass. One component
shipped, the second became a slot, the third was refused with reasons, and the token pass was
mostly overtaken.** The table is what it is now, not what was projected:

| Thing | Projected | What shipped |
|---|---|---|
| The two layouts (`<TakeoverStage>`, `<TakeoverCanvas>`) | nine call sites after migration | **Shipped at T2.2.** Nine call sites: Stage for TRIVIA, DRAWING, EMOJI_CHARADES, RECREATE, SONG_GUESS; Canvas for GEO, JOUST, FAPPY, SCHLONIC |
| The running-totals panel | four, already byte-identical | **Shipped at T3.1** as `RunningTotals`. Four call sites (JOUST, FAPPY, SCHLONIC, SONG_GUESS), and hoisting it closed a real bug — see below |
| The deck column | a component, three call sites | **Not a component: a styled slot on `<TakeoverStage>`.** One call site, EMOJI_CHARADES (§4) |
| ~~The arena frame~~ | three call sites | **Rejected at T3.3, see below.** Nothing built |
| ~~The mini-rail~~ | named among the four in the plan | **Not a component and never could be:** it is `HostMiniRail`, which reads client context. The layouts expose a `rail` slot and the shell fills it (owner decision P1) |

**The broad token pass did not happen, and most of its list dissolved.** The gold status card, the
waiting note, the quiet secondary button, the team chip, the hint line and the counter chip were
all listed here as future tokens. What actually happened: the **team chip was deleted**, not
hoisted — the shell's rail names the team and a surface saying it twice was the duplication being
removed. The **hint line** moved into each Canvas's `actions` slot, where it is one sentence in the
turn's own words rather than a shape. The **counter chip** is per-game content in `counter`. What
did ship as new tokens is small and specific: `marqueeTeamName`, `marqueeTitle`, `marqueeBulbs`,
`marqueeMeta` (T5.2, T5.3) and `miniRailTeamDotUnassigned` (T2.3) — five exports, taking
`styleTokens` from 55 to 60. (The four marquee tokens were retired on 2026-09-23 with the
containers they dressed: the TV marquee is one component now, `<NeonMarquee>`, and the clock
reaches it as two slots, `clock` and `clockLine` — DESIGN.md §2.2D, ADR-0006.)

**The gold status card is the one item on that list still genuinely open**, and it is a colour
question rather than a shape one: the same card exists in two systems, `from-[#3a1d09] to-[#1a0c04]`
at eighteen sites and `from-surfaceAlt to-surface` at four. It cannot be hoisted while it carries
raw hex — a house-component path may not — so the direction is recorded in `DESIGN.md` §2.5 and the
migration is `BACKLOG.md`'s.

**Why the rail could never be a component here.** The plan's decision names "the rail" among the
four, but the rail is `HostMiniRail`, which already exists, already renders the right `<header>`,
and reads room state through `useHostRoomState` — so it cannot move into `packages/surface`, which
has no dependency on `@wingnight/shared` and no access to the client's context. Its *tokens*
(`miniRail`, `miniRailStrong`, `miniRailDivider`, `miniRailTeamPill`, `miniRailTeamDot`) were
already in the package. Nothing new was needed: the layouts expose a `rail` slot and the shell
fills it. Accepted as clarification P1. Of the plan's four — rail, deck, standings panel, arena
frame — exactly one became a component (`RunningTotals`); two became slots and one was refused.

**The running-totals panel is not "standings".** T1.6 already made the four copies byte-identical,
taking `{ pendingPointsByTeamId, activeTurnTeamId, teamNameByTeamId, note? }`. It shows the round's
*pending* points, not the game's standings — `DisplayBoard/StandingsSurface` is the standings. It
keeps the name `RunningTotals` it already has in four packages. Naming recorded as P2, accepted.

**Two things came out of actually hoisting it, and both are worth keeping.** First, the "house card"
never was one: the three identical copies were written in JOUST's own dusk-desert hexes (`#3a200d`
is that arena frame's border, `#1a0e05`→`#0a0604` its result plaque), so what looked like three
games agreeing on a card was two games copying a third's skin. A house-component path may carry no
raw hex, so the move forced a value-for-value substitution to `border-ember/20` and
`from-surface to-bg` — the answer to the question that raised. SCHLONIC's variant, the one genuine
divergence, was the only one of the four already written in house tokens; the owner chose to drop it
for the shared card anyway at T3.3, costing SCHLONIC about 73px of height against a 626px readout
budget, because the alternative was keeping a fourth near-clone. Second, sharing closed a bug
invisible from inside a deck: the row had `justify-between` and no gap, so floated at content width
the longest team name met its points at a measured 0px ("Honky Tonk Heat0 pts"). The shared row
takes `gap-4` — the one thing SCHLONIC's variant had and the other three did not.

**The arena frame is neither a component nor a token — settled at T3.3, REJECTED.** T3.1 deferred it
because only one of its three call sites was full-bleed then; now all three are, and the three
strings can finally be compared as they will actually be written:

| Call site | The frame, after migration |
|---|---|
| JOUST `arenaFrame` | `relative h-full w-full overflow-hidden rounded-xl border-2 border-[#3a200d] bg-[linear-gradient(…)] shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]` |
| FAPPY `Corridor` | `relative h-full w-full touch-none select-none overflow-hidden rounded-xl border-2 border-[#3a200d] bg-[#160c2a] shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]` |
| SCHLONIC `Zone` | `relative h-full w-full touch-none select-none overflow-hidden rounded-xl border-2 border-[#1f6b34] bg-[#0d1f14] shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]` |

T3.1's own suspicion was right: stripped of colour, background and interaction it is
`relative h-full w-full overflow-hidden rounded-xl border-2 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]`
— six utilities and no structure, which §8's own rule sends to `styleTokens` rather than to a
component. **And it does not clear the bar as a token either, because the three call sites are not
three.** Four of the six are dictated by the body slot rather than chosen (`relative h-full w-full`
plus the clip every scrolled scene needs), and the two that *are* a design decision — `rounded-xl`
and the inset vignette — are DESIGN.md §2.7's marquee frame, which JOUST and FAPPY share by descent
(same `#3a200d` border, same desert). SCHLONIC's is not that frame: §2.11 says it "looks like nothing
else in the show on purpose", it is green on near-black, and its letterbox bars are a deliberately
different language. So the overlap is two call sites with identical semantics plus one coincidence,
and ADR-0002 guardrail 1 asks for three.

The component form fails a second time on its own terms. §8 sketched a frame that "takes children and
paints nothing", which means the border colour, the background and `touch-none select-none` arrive
as a class string from the game — a configuration object by another name, already rejected here as a
`surfaceClassName` or `tone` prop. And FAPPY's and SCHLONIC's frames are not passive wrappers at all:
they carry the pointer handlers, the armed/locked cursor, and the `data-fappy-arena` /
`data-schlonic-arena` hooks five e2e specs click. Moving the tap target onto an inner child to satisfy
the sketch is a behavioural change that buys nothing.

**Verdict: leave all three where they are.** Building it would be building a component to satisfy a
doc.

Anything not on this list needs three call sites with identical semantics before it becomes a
component. The bar is the bar.

---

## 9) The e2e contracts this must not break

Checked against the suite in this worktree.

- **`page.locator("header")` wraps the mini-rail.** Asserted in `tests/e2e/smoke.spec.ts:12`
  (pre-game) and `tests/e2e/intro-countdown.spec.ts:149` and `:157` (MINIGAME_INTRO). *The plan
  cites `intro-countdown.spec.ts:115` and `:122`; the assertions are actually at `:149` and `:157`.*
  All three are on phases other than `MINIGAME_PLAY`, where no `<header>` renders today. Putting
  `HostMiniRail` into the takeover **adds** a `<header>` at `MINIGAME_PLAY` and changes none of the
  three. Constraint: the rail must remain the only `<header>` on the host carrying round / sauce /
  team text. `OverrideDock/index.tsx:103` also renders a `<header>`, so two can coexist while the
  override panel is open; its text is "Overrides" and does not match any of the three locators.
- **The dock is absent at `MINIGAME_INTRO` and present at `MINIGAME_PLAY`** —
  `tests/e2e/host-takeover-dock.spec.ts:33-47`. The layouts do **not** render the dock. It stays in
  `HostControlPanel`, gated on `isPlayerHeld`. The layouts only reserve its corner.
- **Accessible names** `"Open host controls"`, `"Open overrides panel"`, `"Overrides"` — all in
  `apps/client/src/copy/host.ts`, untouched by this work.
- **The CTA label regex** `tests/e2e/hostShell.ts:6` — untouched; the dock's primary label is
  computed by `HostControlPanel`.
- **`role="dialog"`** on the override panel — `OverrideDock/index.tsx:97`, untouched.
- **`/dev/minigame/<slug>` previews labelled `"Host Preview"` / `"Display Preview"`** —
  `MinigameDevSandbox/copy.ts:17,19`, untouched. But see §6: the sandbox's own composition of the
  takeover must move with the shell's.
- **`startMinigameFromEating` waits for `"Skip run"`** (`hostShell.ts:116`), SCHLONIC's control.
  SCHLONIC is a phase-3 migration; whichever task moves that button must keep its label, or fix the
  helper in the same commit. Five specs walk through it.

---

## 10) Things the implementation will hit

### EMOJI_CHARADES gates on `hostView.status`, not `phase`

`EmojiCharadesMinigameHostView` is a discriminated union on `status: "playing" | "turn_complete"`,
and `HostEmojiCharadesSurface` branches on `hostView?.status === "playing"` at index.tsx:62 and
`=== "turn_complete"` at :161 — a different axis from every other game, which branches on
`phase === "play"`.

**The layouts must never branch on phase.** They take elements, they do not decide when to render
them. A game computes its slot contents however its own view type requires — `phase` for eight of
them, the union discriminant for EMOJI — and passes `null` for a slot it has nothing for this beat.
A layout that took `phase` and decided would be a behaviour-switch prop, and it would force EMOJI
to compute a phase it does not use and then re-narrow anyway.

Corollary: slots are `ReactNode | null`, never `boolean`-gated, and an empty slot must collapse to
no space rather than to an empty box. That is also what makes the clock slot work (§6).

### DRAWING is height-bound, so reclaimed vertical space is worth 1.6x

`DRAWING_CANVAS_ASPECT_RATIO = 16 / 10` and the board letterbox-fits with
`min(containerWidth, containerHeight * ratio)`. At 1280x800 the easel slot measures 1163x604 and
the board comes out 938x586 — height-bound, since width-bound would give 1163x727. Every pixel of
vertical chrome the shell reclaims becomes 1.6 pixels of board width. Twenty pixels of rail that
DRAWING no longer draws itself is thirty-two pixels of board.

This is why "reclaimed space" is not one number per game. For JOUST, FAPPY, SCHLONIC and
SONG_GUESS the prize is horizontal — deleting the 330px deck plus its `gap-3` returns the body from
887px to 1228px, a 38% widening, and is exactly where the measured `887` in the audit comes from.
For DRAWING the prize is vertical and multiplied. For TRIVIA and RECREATE the prize is that 355px
and 268px of dead air stop being dead, which is a distribution problem, not a size one.

### The `MinigameSurface` seam

`MinigameSurface/styles.ts:21-22` wraps the takeover's renderer in
`flex min-h-0 flex-1 flex-col overflow-y-auto [&>*]:min-h-full`. That `overflow-y-auto` exists so a
minigame that overgrows the canvas scrolls rather than bleeding under the CTA bar — but there is no
CTA bar at `MINIGAME_PLAY`, and a takeover that scrolls is a takeover whose layout is wrong. Under
this spec the body never overgrows: `<TakeoverStage>`'s rows and `<TakeoverCanvas>`'s single body
are both `min-h-0 flex-1`. T2.3 should reconsider whether the scroll container survives; if it
does, it must not become the game's excuse for a body taller than the tablet. Flagged, not decided
— see P4.

---

## 11) Proposals — the owner's call

Everything above this line follows from decisions already made, or from code. These do not.

**P1 — the rail is a slot, not a new component.** The plan names "the rail" among the four
structural components. I have specified it as a slot the shell fills with the existing
`HostMiniRail`, because `HostMiniRail` reads room state through client context and cannot live in
`packages/surface`, and its tokens are in the package already. *Rejected alternative:* a
presentational `<TakeoverRail>` in the package that `HostMiniRail` renders into — one more layer,
no second call site, and it would put the load-bearing `<header>` two files away from the component
the e2e suite names.

**P2 — call it `RunningTotals`, not the standings panel.** It shows the round's pending points, and
`StandingsSurface` on the TV is the standings. Four packages already have the name. *Rejected:*
`<TakeoverStandings>`, which would make two different things called standings.

**P3 — the deck column is contingent on T3.4 and T4.3.** After phase 3 it has exactly three call
sites: EMOJI_CHARADES, RECREATE, SONG_GUESS. If T3.4 decides SONG_GUESS is a Canvas after all, or
T4.3 flattens RECREATE's bench, it drops below the bar and should become tokens instead. Build it
in T2.2 if you want it ready; re-check the count at the end of phase 4.

**P4 — drop the takeover scroll container.** `MinigameSurface/styles.ts:21-22`'s `overflow-y-auto`
protects against a CTA bar that no longer exists on this phase. Removing it turns "my game is too
tall" from a silent scroll into a visible overflow, which is the feedback a nine-game migration
wants. *Rejected alternative:* keep it, and accept that a migrated game can quietly be 900px tall
on an 800px tablet.

**P5 — the override panel should outrank the dock.** The dock's `z-[1100]` paints its 48px circle
over the override panel's bottom-right corner (§7). Two fixes: raise the override overlay and panel
above 1100, or hide the dock's toggle while the override panel is open. I prefer the second — the
dock and the panel are the same escape hatch at two depths, and showing both at once is the
confusion, not just the overlap. Out of scope for T2.2/T2.3 either way; it is a `HostControlPanel`
change.

**P6 — the team dot is never the team's colour.** `teamThemeByTeamId` is built in
`selectHostTeamMaps` and is not on `MinigameHostRendererProps`; every host team dot, including the
shell's own `miniRailTeamDot`, is `bg-primary`. Now that the shell owns the rail, fixing it once
fixes it for all nine. It is a rail change, not a layout change, and I have not specified it.

**P7 — positive verdict first.** TRIVIA and EMOJI_CHARADES put the positive verdict before the
negative; DRAWING renders `verdictIncorrect` (index.tsx:223) before `verdictCorrect` (:236). I have
written "positive first" into §4 as the house rule. If the owner prefers the destructive action
away from the thumb instead, say so and DRAWING becomes the pattern rather than the outlier.

---

## 12) Verified facts

Every claim above, with where to check it. All paths are relative to the repo root in this
worktree.

**The shell**
- `apps/client/src/components/HostControlPanel/HostPhaseBody/MinigamePlayTakeover/index.tsx:19-28`
  — renders `<TakeoverTimerChip />` then `<MinigameSurface phase="play" …>`; line 24 passes
  `activeRoundTeamId === null ? null : activeRoundTeamName`, the round's team, not the turn's.
- `.../MinigamePlayTakeover/styles.ts:3-4` — `relative flex h-full min-h-0 flex-col
  p-[clamp(1rem,2vw,1.75rem)]`.
- `.../MinigamePlayTakeover/TakeoverTimerChip/index.tsx:32-34` — returns `null` when
  `remainingSeconds === null`, which happens exactly when `roomState.timer` is `null`.
- `.../TakeoverTimerChip/styles.ts:4` — `absolute right-[clamp(0.75rem,1.5vw,1.5rem)]
  top-[clamp(0.75rem,1.5vw,1.5rem)] z-10 rounded-full …`.
- `apps/client/src/components/HostControlPanel/HostMiniRail/index.tsx:12` — `<header
  className={styles.container}>`.
- `.../HostMiniRail/selectHeaderContext/index.ts:19-21` — at `Phase.MINIGAME_PLAY`,
  `activeTurnTeamId ?? activeRoundTeamId`.
- `.../HostMiniRail/styles.ts` — re-exports `miniRail`, `miniRailStrong`, `miniRailDivider`,
  `miniRailTeamPill`, `miniRailTeamDot` from `@wingnight/surface`.
- `apps/client/src/components/HostControlPanel/index.tsx:40` — `isPlayerHeld = hostMode ===
  "minigame_play"`; `:104-121` — dock at play, CTA bar otherwise.
- `.../HostTakeoverDock/styles.ts:5` — "Absolute, not fixed: the dev sandbox renders the host shell
  inside a CSS-scaled device frame"; `:12` — `pointer-events-none absolute inset-0 z-[1100]`;
  `:17` — cluster at `bottom-[clamp(0.75rem,1.6vw,1.25rem)] right-[clamp(0.75rem,1.6vw,1.25rem)]`;
  `:20` — `h-12 w-12` toggle.
- `.../OverrideDock/styles.ts:19` — `fixed inset-0 z-40`; `:8` — trigger `z-50`; `:29` — panel
  `md:bottom-4 md:right-4 md:top-4 md:w-[440px]`.
- `.../OverrideDock/index.tsx:97` — `role="dialog"`; `:103` — a second `<header>`.
- `.../MinigameSurface/styles.ts:14-15` — `takeoverCanvas`; `:21-22` — `takeoverInner`, with
  `overflow-y-auto [&>*]:min-h-full`.
- `.../selectHostTeamMaps/index.ts:10,32` — `teamThemeByTeamId` exists and is not on the renderer
  props (`packages/minigames/core/src/index.ts:118-131`).
- `apps/client/src/copy/host.ts:113` `"Open host controls"`, `:116` `"Overrides"`, `:180`
  `"Time's Up"`, `:212` `"No team assigned"`.

**Timers**
- `packages/shared/src/content/gameConfig/minigameDefinitions/index.ts` — `timerKey: null` at lines
  30 (TRIVIA), 52 (SONG_GUESS), 73 (JOUST), 85 (FAPPY), 97 (SCHLONIC), 128 (RECREATE); non-null at
  40 (`geoSeconds`), 107 (`drawingSeconds`), 145 (`emojiCharadesSeconds`).
- `apps/server/src/roomState/selectors/index.ts:89-93` — `resolveMinigameTimerSeconds` returns
  `null` when `timerKey === null`.

**The nine reserves** — the table in §6; each line number checked.

**Geometry**
- `packages/minigames/geo/src/client/HostGeoSurface/styles.ts:8-9` — `relative isolate h-full
  min-h-0 w-full`; `:19` — `const floating = "absolute z-[1100]"`; `:21` — the rail; `:55` —
  `actionBar` bottom-left with `max-w-[calc(100%-6rem)]`; `:69-71` — the verdict tiles above the
  dock at `bottom-[clamp(4.9rem,9vh,5.6rem)]`.
- `.../HostGeoSurface/GeoGuessMap/styles.ts:6` — `[&_.leaflet-bottom.leaflet-right]:mr-[4.5rem]`;
  `:14` — GEO's own zoom stack at `z-[1000]`.
- `packages/minigames/joust/src/client/HostJoustSurface/styles.ts:22` — `arenaFrame`; `:27` —
  `deck = "flex w-[clamp(230px,28vw,330px)] flex-col gap-3"`, byte-identical at
  `HostFappySurface/styles.ts:22`, `HostSchlonicSurface/styles.ts:28` and
  `HostSongGuessSurface/styles.ts:23`.
- `packages/minigames/fappy/src/client/HostFappySurface/Corridor/styles.ts:3-4` and
  `packages/minigames/schlonic/src/client/HostSchlonicSurface/Zone/styles.ts:4-5` — the other two
  arena frames, with `touch-none select-none`.
- `packages/minigames/drawing/src/client/strokeRendering/index.ts:6,17,22` —
  `DRAWING_CANVAS_ASPECT_RATIO = 16 / 10` and the letterbox fit.
- `packages/minigames/drawing/src/client/HostDrawingSurface/styles.ts:12-13` — rail
  `grid-cols-[auto_1fr_auto]`; `:25` — `railPending`, right column, under the shell's chip; `:63` —
  toolbar `pr-[4.5rem]`; index.tsx:223 / :236 — incorrect before correct.
- `packages/minigames/emoji-charades/src/client/HostEmojiCharadesSurface/index.tsx:62,161` — the
  `status` branches; `styles.ts:19` — a fifth deck width, `clamp(240px,25vw,330px)`.
- `packages/minigames/trivia/src/client/HostTriviaSurface/styles.ts:63` — `actions` with no right
  gutter; `.../HostRecreateSurface/styles.ts:63` — `w-[calc(100%-4.5rem)]`, the T1.8 repair.
- `packages/shared/src/roomState/index.ts:285-300` — `EmojiCharadesMinigameHostView` as a union on
  `status`.

**Arithmetic at 1280x800** (browser viewport set to exactly 1280x800, per the sandbox trap)
- `clamp(1rem, 2vw, 1.75rem)` → `2vw = 25.6px` → **25.6px**. Body box `1280 − 51.2 = 1228.8` wide,
  `800 − 51.2 = 748.8` tall; GEO's map measured 1227x747 with its 1px border. `1227 × 747 /
  1024000 = 89.5%` — the audit's 90%.
- `clamp(230px, 28vw, 330px)` → `28vw = 358.4px` → **330px**. `1228.8 − 330 − 12 (gap-3) = 886.8` —
  the audit's 887 for JOUST, FAPPY, SCHLONIC and SONG_GUESS.
- `clamp(9rem, 15vw, 12rem)` → `15vw = 192px` → **192px = 12rem**, the top-right reserve.
- `clamp(0.75rem, 1.6vw, 1.25rem)` → `1.6vw = 20.48px` → **20px**. Dock circle spans 20→68px from
  the container edge; body content box starts at 25.6px; intrusion **42.4px**.

**House law**
- `AGENTS.md` §3.1 — minigame packages never import `apps/client`. `AGENTS.md` §16 — host and
  display surfaces prefer the shared design system. **These two rules were in direct contradiction
  until T1.2**, because §16 pointed at `apps/client/src/components/HostControlPanel/styleTokens/`,
  which §3.1 forbids a minigame from reaching; a minigame surface could obey one or the other and
  not both, which is the root cause of nine invented anatomies. Both now point at
  `packages/surface`, reachable from either tree. Reconciled in both files at T6.2.
- `AGENTS.md` §11 (`:205-210`) — skip / redo / manual score override are never removed.
- `SPEC.md:380` — new host override controls go through the override surface, not inline chrome.
  *The plan cites `SPEC.md:377`; the rule is at `:380`.*
- `DESIGN.md:82-92` — §2.0A; `:91` the takeover bullet, `:92` the corner dock and its ~4.5rem;
  `:96` touch targets ≥ 44x44. §2.0A's pointer to the style tokens was stale after T1.2 and now
  reads `packages/surface/src/styleTokens/index.ts` (fixed at T6.2). §2.0B is the takeover's own
  anatomy; §2.4-§2.13 are the nine per-game surface languages.
- `docs/adr/ADR-0002-dry-readability-epic.md` Guardrails 1-3; `ADR-0003` Guardrail 4.
- `eslint.config.mjs:171-177` — 260-line cap on `packages/surface/src/**/index.tsx`;
  `:219-225` — 140-line cap on its `styles.ts`. `tools/eslint-plugin-wingnight/rules/
  houseComponentPaths.mjs:7-11` — `packages/surface/src/` is a full house-component path, so the
  new layouts owe a `styles.ts`, a `copy.ts` for any user-facing string, semantic style keys and no
  raw hex.
- `apps/client/tailwind.config.ts:4-10` — `packages/surface` and `packages/minigames/*` are both in
  `content`, so classes the layouts declare are generated.

**Sandbox**
- `apps/client/src/components/MinigameDevSandbox/SandboxStage/index.tsx:43` — `HOST_DEVICE = {
  width: 1280, height: 800 }`; `:188-190` — `hostCanvas` wrapping `<TakeoverTimerChip />` and
  `<MinigameSurface>`, mirroring `MinigamePlayTakeover`.
- `MinigameDevSandbox/styles.ts:57-58` — `hostCanvas` carries the takeover's exact class string.

---

## 13) Owner's decisions on §11 (2026-09-21)

Settled by the repo owner after reading this document. These are no longer proposals.

- **P1 — ACCEPTED.** The rail is a **slot**, not a fifth component. `HostMiniRail` reads client
  context and stays in `apps/client`; the shell passes it into the layout's `rail` slot. The plan's
  "four components" becomes three plus a slot, and `packages/surface` keeps no dependency on client
  context — which is the entire reason the package exists.
- **P2 — ACCEPTED.** `RunningTotals`, not "the standings panel". It shows pending points;
  `StandingsSurface` is the standings.
- **P3 — NOTED, and now decided by the code.** Re-check the deck column against ADR-0002's
  three-call-site bar at the end of phase 4. Both projected call sites went, and neither for the
  reason anticipated: SONG_GUESS stayed a Stage and dropped the deck anyway (they are separate
  axes), and RECREATE's bench turned out to be the *wider* of its two columns. The deck ends at
  **one** call site, EMOJI_CHARADES. It ships as a styled slot on `<TakeoverStage>` rather than a
  component (§4, §8). **Still open for the owner:** keep the slot — it costs nothing unfilled — or
  remove it and let EMOJI_CHARADES compose its own column in the body.
- **P4 — ACCEPTED.** `MinigameSurface`'s takeover `overflow-y-auto` is dropped in T2.3. A game that
  overflows the canvas must break visibly in the sandbox rather than scroll quietly; scrolling is
  wrong on this surface, and a silent 900px-tall migration is exactly the mistake the nine
  migrations could otherwise hide.
- **P5 — IN SCOPE, T2.3.** Hide the dock toggle while the override panel is open, rather than
  renumbering the z-scale.
- **P6 — IN SCOPE, T2.3.** Team dots take the team's actual colour. `teamThemeByTeamId` exists in
  the client and simply is not on the renderer props; once the shell owns the rail this is a
  one-place fix, and `bg-primary` in six files stops pretending to be six different teams.
- **P7 — IN SCOPE, house rule, DRAWING fixed in T4.1 and shipped.** Positive verdict first. DRAWING
  was the only outlier (`verdictIncorrect` before `verdictCorrect`), and on a tablet that is a
  misclick risk, not a preference. All verdict pairs now agree; the rule is stated in `DESIGN.md`
  §2.0B.
