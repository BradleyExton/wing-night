# DESIGN.md

UI guidance for Wing Night (Host + Display)

This file defines the visual system, surface rules, and theme direction
for MVP. If it is not defined here, it is not part of the MVP visual
system.

------------------------------------------------------------------------

# 0) Visual Theme (MVP)

Theme Name: **Spicy Broadcast**

Intent: - Game-show drama - Warm heat energy - High contrast TV
readability - Competitive but not neon arcade - Bold, simple, glanceable

The theme must feel intense and exciting while remaining readable from
across a room.

No additional colors may be introduced without updating this document.

------------------------------------------------------------------------

## 0.1 Canonical Color Tokens

These are semantic tokens --- not raw Tailwind colors.

bg #121212\
surface #1C1C1C\
surfaceAlt #242424

text #FFFFFF\
muted #A3A3A3

primary #F97316 (burnt orange)\
heat #EF4444 (intense red)\
success #22C55E\
danger #DC2626\
gold #FBBF24\
teamA #F97316\
teamB #06B6D4\
teamC #84CC16\
teamD #D9DEE6 (chrome)\
teamE #D98324\
teamF #14B8A6\
teamG #60A5FA\
teamH #EC4899

Rules: - Never use more than 2 accent colors on a single screen. -
primary (orange) is the default emphasis color. - heat (red) is reserved
for urgency or escalation. - gold is reserved for winner moments or
celebration. - success/danger are functional only (never decorative).

Team accent rules: - `teamA` through `teamH` are identity accents for
team cards and standings rows only (left border + small dot). - Team
tokens must not be used for timers, status states, CTA buttons, or
winner celebrations. - An accent must stay clear of the reserved
semantics above as well as of the other accents: a team the room reads
as `gold` looks like it is winning and one it reads as `heat` looks
like a warning. Three of them failed that on 2026-09-19 and were
retuned (`docs/team-identity.md`, "Colour"): `teamD` was 15 from `heat`
and 20 from `teamH`, `teamE` was 10 from `gold`. `teamD` is now chrome
rather than a hue, which is metal's own palette and the one accent that
can never collide with one. `teamA` is still `primary` exactly; it is
the known remaining overlap.

------------------------------------------------------------------------

# 1) Design Goals

**Party-first** - Maximize glanceability. - Large typography. - Clear
state transitions. - Avoid visual clutter.

**Two distinct surfaces** - Host UI (tablet-first, touch friendly) -
Display UI (TV-first, spectator-first)

------------------------------------------------------------------------

# 2) Surface Rules

## 2.0A Host Surface Anatomy

The Host shell is a single-canvas tablet controller. Every phase composes the same six pieces. Future Host surfaces should reuse this language instead of inventing parallel shapes — the utility classes live in `packages/surface/src/styleTokens/index.ts`, imported as `@wingnight/surface`. They used to live in `apps/client/src/components/HostControlPanel/styleTokens/`, which is why the minigame packages could not reach them: a minigame may not import `apps/client` (`AGENTS.md` §3.1) and so could not obey the rule in `AGENTS.md` §16 that told it to use these. Moving them into a package is what made both rules obeyable at once, and it is the same reason `packages/cast` exists for the bird.

-   **Mini-rail** — the top strip of every stage hero. Tiny inline rail showing round number, sauce, minigame, and the active-team color pill. Replaces the older kicker + title + description chrome; rail is data, not navigation.
-   **Stage hero** — left ~65% of the canvas. Dramatic eyebrow + headline + meta, or a live datum like a timer or score. Subtle radial-gradient glow backdrop. Phases pick their own glow variant (default vs eating).
-   **Control deck** — right ~35% of the canvas. Vertical stack of deck-groups: small uppercase group head + tappable rows + inline create form. No card chrome — rows are separated by 1px dividers, not borders.
-   **CTA + heat strip** — full-bleed bottom row of the viewport. Primary action button always visible per §2.1, on every phase the host drives. A heat-color shimmer strip sits across the top of the bar to add energy without competing with the button.
-   **Override entry** — a `⋯ Overrides` button lives at the foot of the deck. It opens the floating override dock. Override actions are never inline in the deck flow — they're an escape hatch, not a primary path.
-   **Takeover** — during `MINIGAME_PLAY`, the deck collapses and the minigame package owns the full canvas. The shell steps out of the way; the minigame's own surface owns the "we're done" trigger. Read that narrowly: the shell stops drawing the *deck*, not the room's context, and **§2.0B is what it means in full**. This one sentence was the entire specification for the phase for nine minigames, and §2.0B exists because it was not enough.
-   **Corner dock** — the takeover is the one phase where the tablet leaves the host's hands, so the CTA bar and the overrides entry both collapse into a single quiet circle in the bottom-right corner. Tapping it reveals the phase's primary action and `Overrides` as labelled pills over a scrim; tapping the scrim, the circle or `Escape` puts them away. Two taps, not one — a player's thumb resting on the canvas can't end their own turn. While collapsed the circle carries the same `heat` dot the overrides entry does, so a turn that needs review still reaches the host. The dock layers above anything the minigame draws, so a ~4.5rem gutter stays clear at that corner. A minigame no longer types that reserve itself: the takeover layouts apply it, in the four slots §2.0B names, and `packages/surface` deliberately exports no token carrying the number.

## 2.0B Takeover Anatomy (`MINIGAME_PLAY`)

§2.0A's takeover bullet — "the deck collapses and the minigame package owns the
full canvas; the shell steps out of the way" — was the entire specification for
this phase, and nine minigame packages each invented an anatomy from it. That
cost the show a host who relearned the tablet between games: the turn counter
appeared in four places, the primary advance in five, and two surfaces put a
verdict button underneath the corner dock. This section is the anatomy that
should have been written down. The full contract, with the arithmetic, is
`docs/takeover-layout-api.md`; what follows is the law a tenth minigame needs.

The correct reading of §2.0A is narrower than it sounds: **the shell stops
rendering the control deck. It does not stop rendering the room's context.**

-   **The shell owns** the mini-rail (round, sauce, minigame, the active team's
    name and its real colour), the play clock, and the corner dock. It also owns
    the bottom-right gutter and the z-index budget, because both are properties
    of the canvas rather than of any game.
-   **The game owns** the body, and the turn's own counts and controls — in the
    slots below, and nowhere else.
-   **A game never computes the active team name.** `activeTeamName` on
    `MinigameHostRendererProps` is authoritative: the shell resolves it once with
    the rail's own precedence (`selectHeaderContext` — the turn's team, else the
    round's), so the string on the props and the string in the rail are the same
    string. Nine packages used to carry a byte-identical `resolveActiveTeamName`
    because the shell passed the *round's* team where every game wanted the
    *turn's*; that is fixed at the source and there are now zero copies. A
    surface must not render the name as chrome — the rail says it, and saying it
    twice on one canvas is the duplication this anatomy exists to end — but a
    sentence that needs the name may still use it.

### The two layouts, and how to choose

`packages/surface` exports two named layouts, never one with a `fullBleed` flag
(ADR-0002 guardrail 2): `<TakeoverStage>` for panels, `<TakeoverCanvas>` for a
full-bleed body with the chrome floating over it. A game changes layout by
changing which component it renders, which shows up in a diff as the structural
change it is.

**The rule is about covering, not about size.** Use a Canvas when chrome can
float over the body without hiding something the host must read or press; use a
Stage when it cannot. The mechanical test is whether the body's meaning is
spread evenly across it or concentrated in one place. A map, an arena, a
corridor and a zone are spread — a chip in one corner costs a corner of
scenery. A question, a pair of picture frames, an emoji grid and a song console
are concentrated — a chip over them covers a word.

Two games measured the rule rather than guessing at it, and both are worth
knowing before reaching for the bigger number:

-   **DRAWING has the largest body of the nine and is still a Stage.** Full
    bleed was measured, not assumed: an 1133x708 board, **78.3%** of the tablet
    against the **59.1%** the Stage gives. It was refused, because a floating
    `actions` row for DRAWING is five `<button>`s — undo, clear, skip, correct,
    incorrect — and under the pointer rule below a button takes the pointer for
    being a button. That is ~700x44px of the picture the TV is mirroring gone
    dead to ink, with CLEAR sitting under the artist's moving hand. Nineteen
    points is what the covering rule costs here, and it is worth paying.
-   **SONG_GUESS refused the Canvas on the shape of the slots.** A Canvas has
    exactly two floating slots, `actions` and `readout`, **both on the same
    edge** and each bounded at `calc(100%-4.5rem)`. SONG_GUESS's host surface is
    nine tap targets (play/pause, replay, skip, reveal, title ✓✗, artist ✓✗,
    next) plus a `RunningTotals` panel, and there is nowhere on one edge to put
    them. It is a Stage, and it dropped its deck anyway — the two are separate
    axes.

Today: Stage for TRIVIA, DRAWING, EMOJI_CHARADES, RECREATE and SONG_GUESS;
Canvas for GEO, JOUST, FAPPY and SCHLONIC. The migrations more than doubled
TRIVIA's share of the tablet and RECREATE's, took the three arcade games from
about three-fifths of it to about nine-tenths, and left GEO on the nine-tenths
it already had.

**Read the canvas-share figures in this chapter and in §2.4-§2.13 as deltas,
not as one metric.** Each is a real measurement, reproduced at a true 1280x800
against the tablet's 1,024,000px, and each was taken by the migration that
moved that game — against what that game calls its canvas. Those definitions
differ: body-slot area for one game, card-plus-controls for another. Two
honest measurements of TRIVIA, taken two tasks apart against those two
definitions, came out at 82.5% and 72.7%. Every direction here is sound and
every jump is real; the third
significant figure is not a number two games can be compared on.

### `<TakeoverStage>` — the slots

Three rows: a rail row, a main row of body plus an optional deck column, an
optional actions row at the foot.

-   **`rail` (shell).** `<HostMiniRail />`, forwarded untouched. A game never
    draws a rail of its own, and never wraps this slot in a second `<header>`,
    `<nav>` or other landmark: the rail is the only `<header>` on the host
    carrying round/sauce/team text, and the e2e suite locates it that way.
-   **`counter` (game, read-only).** The turn's live counts, right of the rail
    and left of the clock: "Photo 2 of 3", "Shot 2 of 5", "+3 pending". **No tap
    targets** — the rail row is read-only, and a control there sits beside the
    clock, which is exactly where a host will not look for it. It may not repeat
    the team name or the minigame name.
-   **`clock` (shell).** `<TakeoverTimerChip />`, which renders nothing when the
    room has no timer — six of the nine minigames carry `timerKey: null`.
-   **`children` — the body (game).** Everything the host reads. It may **not**
    hold a control that reaches the bottom-right corner; that is the rule that
    fixed TRIVIA's `INCORRECT` and RECREATE's `Next target`, both of which sat
    under the dock as the last flow child of a body with no reserve.
-   **`deck` (game, optional).** A `clamp(230px,28vw,330px)` scrolling right
    column. It has exactly one call site — EMOJI_CHARADES, which re-tested it
    and kept it: the picker's cells are `aspect-square`, so widening the body
    makes it hold *less*, and going deckless costs 14% of the tap surface.
-   **`actions` (game, optional).** The foot row, full width under both body and
    deck. Everything that ends a beat. **The positive verdict comes first.**

### `<TakeoverCanvas>` — the slots

One body filling the takeover's padding box, with the chrome floating over it.
`rail`, `counter`, `clock` and `children` carry the same rules; the row floats
instead of sitting above. Two more slots, both floating along the bottom edge:

-   **`actions` (game, optional), bottom-left.** The turn's one or two controls
    and the hint that explains them. Bottom-left is the one corner where a
    control is neither under the dock nor over the pin a team just placed, and a
    hint here costs the arena no height at all — JOUST, FAPPY and SCHLONIC all
    used to spend a row under the board on one sentence.
-   **`readout` (game, optional), bottom-right, *above* the dock.** The turn's
    numbers, where the host's eye already is after a result: distance and
    points, the last shot's score, `RunningTotals`.

**There is no bottom-right slot for a control.** That corner belongs to the
dock, and the only two things it does are end the turn and open overrides. A
game that wants a button there has misunderstood the phase — the tablet is in
the players' hands.

A Canvas body may not float its own chrome (if a chip belongs on the canvas it
belongs in a slot), may not take the gutter itself, and may not set `isolate` on
itself. The layout has all three.

### The corner budget, and why there is no gutter token

The bottom-right budget is **4.5rem**, and the arithmetic is the dock's. At
1280x800 the takeover's `clamp(1rem,2vw,1.75rem)` padding resolves to 25.6px and
the dock's `clamp(0.75rem,1.6vw,1.25rem)` offset to 20px, so the 48px circle
intrudes **42.4px** into the body's content box. 4.5rem is 72px, clearing it by
about 30px, which is right for a thumb.

One number, five applications, all of them in the layouts: Stage gives it to
`actions` as right padding and to `deck` as bottom padding inside its own scroll
container; Canvas gives it to `actions` as a max-width and to `readout` as both
a bottom offset and a max-width. A reserve is taken *inline*, never as a
full-width bottom band — a band pushes up every child of a flex column and costs
vertical space on games that have none to spare, while an inline reserve costs
width in one row and nothing anywhere else.

**The top-right reserve was abolished rather than corrected.** There used to be
nine hand-typed reserves in three idioms, and five of them held
`pr-[clamp(9rem,15vw,12rem)]` — 192px of rail width — for a clock that never
draws, while the two games whose clock *does* draw reserved nothing and let it
land on DRAWING's pending-points number. The fix is not a better number: the
clock stopped being an overlay and became the last item of a flex row. **An
unfilled slot takes no width; a filled one pushes the `counter` left.** Nothing
in that row is wrapped in a box of its own, because an empty wrapper would still
cost a gap. The TV was corrected the same way at phase 5, where the count had
quietly grown to nine reserving surfaces, six of them for nothing.

**`packages/surface` deliberately exports no dock-gutter token**, and a test
asserts no export matches `/gutter|dock|reserve/i`. Handing out the value is an
invitation to hand-type a tenth reserve, which is the mess the layouts exist to
end. The same reasoning keeps `URGENT_THRESHOLD_SECONDS` unexported from
`apps/client/src/utils/timerUrgency/`, which ships two predicates instead: that
number had been typed out four times across both component trees, and a module
that hands it out invites a fifth `remainingSeconds <= 10`.

### The z-index scale, and why its mechanism is geometry

-   **Band 0 — the game's interior.** The body slot is `relative isolate`, so it
    is a stacking context. Inside it a game may use **any** z-index it likes,
    including the z-400/z-1000 Leaflet assigns itself, and none of it escapes.
-   **Band 1 — the game's floating chrome, `z-10`.** The Canvas's `actions` and
    `readout`. Applied by the layout to the slot wrapper; a game never writes it.
-   **Band 2 — the shell's chrome, `z-20`.** The rail row, `counter` and `clock`,
    so a game with a lot to say can never bury the round number or the clock.
-   **Band 3 — the shell's controls, `z-[1100]`, reserved.** `HostTakeoverDock`,
    rendered outside the layout, above anything a minigame can raise.

Bands 1 and 2 are local — the layout root isolates too — so these two small
numbers cannot collide with anything else the app stacks.

**The mechanism is the isolation, not an agreement about numbers, and it was
proved rather than asserted.** GEO is the hard case: Leaflet reaches z-1000 and
GEO's own chrome used to pick `z-[1100]`, kept off the dock by a single word in
a different file. Hashing the chrome-row pixels at a true 1280x800 during the
GEO migration: as shipped, and with GEO's own map-frame `isolate` removed, the
region is byte-identical (1864 bytes); with **both** isolations removed it
collapses to 170 bytes — a flat Leaflet tile painting over the clock. The
layout's `isolate` on the body holds the line alone. A game is sandboxed by
geometry, which is why it may be careless inside its body and must not reach for
a number outside it.

**`position: fixed` is banned anywhere in the takeover.** The dev sandbox renders
the host shell inside a CSS-scaled device frame, and a transformed ancestor
captures fixed positioning — so a fixed element pins to the frame rather than to
the tablet, and the surface looks right everywhere except where it is judged.
The corner dock is `absolute` for this reason and says so in its own styles.

### Pointer events belong to controls, not to children

The Canvas's three floating rows are `pointer-events-none` so they never eat a
thumb aimed at the body, and each hands the pointer back with
`[&_:is(button,a,input,select,textarea)]:pointer-events-auto` — **to controls,
not to every child.**

The first version granted it to every direct child, the way the corner dock
does. That was right for the map the Canvas was drawn around, where every child
of `actions` was a button, and wrong for a game whose body *is* the button:
FAPPY shipped with a hint sentence in that row killing 764x48px of its corridor,
4.0% of a surface where a tap means flap. The game could not opt out — a plain
`pointer-events-none` on the sentence is inert against it, equal specificity and
the layout's rule ordered later. So the fix belongs to the layout, and it is a
narrower selector rather than an `interactive` prop or a per-slot config object.

**It fails safe the right way round**: a forgotten class on a sentence costs one
tap target, while a button is live for being a button. It also made the read-only
rows fully transparent, since this section forbids a control in `counter`, `clock` and
`readout` — which was the larger win, the chrome row being a full-width strip
across the top of every canvas. SCHLONIC's live overlay went from 104,346px² to
11,520px², 10.1% of the zone given back.

### What gets shared, and what was measured and refused

The house rule is ADR-0002's: three or more call sites with identical semantics,
no behaviour-switch props, no multi-flag configuration objects. Applied to this
canvas it produced two layouts, one component and a set of tokens — and five
refusals, which are as much a part of the anatomy as the slots.

-   **The history strips are not one strip.** `ShotHistory` pads to a fixed slot
    count with no active notion, `LegHistory` is data-length with an active chip
    and a crash badge, `RunHistory` is a vertical list of two cells per row.
    Three call sites but three *shapes*: collapsing them needs
    `items` + `renderItem` + `isActive` + `padTo` + `tone`, which is the
    configuration object the ADR forbids, or a render prop wearing a hat.
-   **The genuinely identical residue is a class string, and moving it is a
    no-op.** The three strips' `title` really is byte-identical
    (`text-[0.6rem] font-extrabold uppercase tracking-[0.28em] text-mutedWarmDim`).
    Hoisting it means editing two packages so that the tablet renders exactly
    what it rendered before. A token earns its place when drift would be
    dangerous, not when two strings happen to match.
-   **The arena frame was refused.** Stripped of colour, background and
    interaction it is six utilities and no structure, four of them dictated by
    the body slot rather than chosen. The two that *are* a design decision —
    `rounded-xl` and the inset vignette — are §2.7's marquee frame, which JOUST
    and FAPPY share by descent and which SCHLONIC deliberately does not: §2.11
    says its zone "looks like nothing else in the show on purpose". Two call
    sites with identical semantics plus one coincidence is not three. The
    component form fails twice more: it would take the border and background as
    a class string from the game, and FAPPY's and SCHLONIC's frames are not
    passive wrappers — they carry the pointer handlers and the `data-*-arena`
    hooks five e2e specs click.
-   **The two timer chips were not merged.** They are a container and a
    presenter that happen to draw similar pills. The host's `TakeoverTimerChip`
    reads room context and fires the time's-up chime; isolating the 4 Hz tick
    from the arena, the easel and the zone is *the whole point of it*, and
    sharing it would push that tick back up into the component it exists to
    protect them from. The drift the merge was meant to prevent was already
    zero — both chips take their seconds from `resolveRemainingTimerSeconds` and
    format them through the same function reference. What was actually
    duplicated was the urgency threshold, and that is what got extracted.
-   **There is no `<Marquee>` component** — *as of the consolidation.* Its two
    text styles and its bulb ring were byte-identical across six TV surfaces and
    shipped as three tokens; the *containers* were not identical — two padding
    values and a background differed — so a component would have had to take the
    container as a prop. The honest cost was recorded: a token cannot make an
    omission unrepresentable the way a component can, which is how three of those
    six surfaces came to be copied without their bulbs in the first place.
    **Overtaken 2026-09-23 (ADR-0006):** there is one now, `<NeonMarquee>`, and
    it is shareable for the reason the refusal named — it takes content and no
    class string, so there is no container to configure (§2.2D). The three
    tokens and `marqueeMeta` are gone with the containers they dressed.

**The pattern worth carrying into the tenth minigame: share the thing that would
drift dangerously, refuse the thing that merely looks alike.** `RunningTotals`
is shared across four games because four copies of a scoring panel will
eventually disagree about a number — and sharing it closed a real bug no one
could see from inside a deck, a row with `justify-between` and no gap that put
a team's name flush against its points at a measured 0px. An arena frame that
looks like another arena frame will not hurt anybody.

### What does not change at this phase

-   Escape hatches are never removed: the host can always skip, redo and
    override score (`AGENTS.md` §11). They live behind the corner dock here, not
    on the canvas.
-   New host controls go through the override surface, not inline chrome
    (`SPEC.md`, "Host Override Access"). A minigame's `actions` row is the
    turn's controls, not the room's.
-   Touch targets stay ≥ 44x44 CSS px (§2.1), including in `actions`, where the
    gutter has already taken 72px of the row's width.
-   **The host drives every phase. Nothing auto-advances**, and no minigame ends
    its own turn on a clock.
-   The layouts never branch on phase. They take elements and place them; a game
    computes its slot contents however its own view type requires — `phase` for
    eight of the nine, `hostView.status` for EMOJI_CHARADES — and passes nothing
    for a slot it has nothing for this beat. A slot left unfilled collapses to no
    space at all, which is what makes both the clock and the deck work.

## 2.1 Host UI (Tablet Optimized)

-   Touch targets ≥ 44x44 CSS px
-   Primary actions always visible — except during `MINIGAME_PLAY`, where they live one tap deep in the corner dock (§2.0A)
-   Avoid dense tables
-   Prefer cards and large rows
-   No hover-only interactions
-   Primary action uses `primary` token

## 2.2 Display UI (TV Optimized)

-   Never vertically scroll
-   Must fill viewport (`min-h-[100dvh]`)
-   Root: flex column layout
-   Primary display target is a 4K TV (typically 65-75") viewed from across a living room
-   No global fixed header block on display
-   Footer standings remains fixed
-   Main area flexible but no overflow
-   **The stage is full-bleed.** Every stage but the fallback paints its own frame — the hearth's
    flame, a team's genre texture, a minigame's ember gradient or arena — and carries whatever
    padding its own content needs, so `StageSurface`'s canvas adds no inset. An inset there shows
    the page's `bg` around the show on three sides while the deck below (§2.2C) runs edge to edge,
    which reads as a border around the play area. The fallback is the one stage that keeps one,
    because it is a page rather than a show.
-   Extremely high contrast
-   Read-only surface
-   Phase/round orientation should be lightweight and rendered inside stage surfaces
-   Typography and key visual surfaces must use fluid scaling (`clamp`) so 4K remains legible while 1080p/720p still fit
-   Avoid tiny informational text on display surfaces; critical game context should remain readable at distance

Timer must be the most visually dominant element during EATING.

### 2.2A Now-Playing Strip

A single full-bleed row directly above the fixed standings footer, shown only on the phases that
own music (SETUP's lobby playlist, MINIGAME_INTRO's team anthem). Mockup:
`apps/client/public/mockups/now-playing/`.

-   It shares the standings footer's hairline top edge so the two read as one bottom band, but the
    row itself is warm glass like the setup cards (§2.2B): heat pools at the left behind the
    equalizer and fades out under the title, so it belongs to the show rather than the chrome.
-   State is carried by a five-bar equalizer in `primary` inside a lit badge, which animates only
    while the music is actually playing (frozen and dimmed when paused). The bars run on different
    periods rather than shared delays so they never fall into lockstep. It honours
    `prefers-reduced-motion`.
-   No transport glyphs, ever. The display is a read-only surface (§2.2) — pause and skip live on
    the host tablet, and a pause icon on the TV would imply something the room can press.
-   Track titles are derived from the filename, never authored: `01-hot-in-herre.mp3` renders as
    "Hot In Herre". Only the first letter of each word is touched, so `TNT` survives as `TNT`.
-   The lobby playlist shows its position ("3 / 12") and keeps its row through a host pause, because
    a playlist is a standing thing. An anthem is a one-shot: no position, and the row leaves with
    the music rather than sitting frozen as though paused.
-   Music never hard-cuts. A track fades in over about a second when it starts and fades out just
    under a second before it stops or is swapped (`musicVolumeRamp`), under the host's master
    volume. A returning track picks up where it faded out (`musicPositionMemory`, kept on the TV),
    so a seven-minute anthem is heard across a night rather than its first thirty seconds four
    times; a track that finished starts from the top.

### 2.2D Minigame Marquee ("Neon Heat Line")

The strip across the top of every minigame on the TV — the show's name, the team whose turn it
is, the turn's readout and the room's clock. One component, `<NeonMarquee>` from
`packages/surface`, worn by all nine display surfaces including RECREATE, which used to hang its
own masthead. Decided 2026-09-23 on a prototype round of eight directions
(`apps/client/public/mockups/minigame-marquee/`, direction 07); ADR-0006 records the pick and
the seven refusals. It replaces the gold-bordered bulb marquee DRAWING built and seven surfaces
copied, whose container was the one piece the shared text tokens could not stop drifting.

-   **No box.** No border, no background, no bulb ring. The stage's own material shows through
    and the marquee is made of light: a small neon-tube kicker naming the show (Monoton,
    `font-marquee-title`, white core with a `gold` halo, and the whole sign dips for a frame every
    few seconds — `signflicker`, stepped, because a tube cuts rather than fades), and under it the
    team's name large in white light (Anton, `font-marquee-name`). Both faces are by ROLE, the same
    on every game whatever the team's genre face is; the TV preloads them with the roster's.
-   **The clock is a line.** Under the whole row runs a glass track; the shell's
    `MinigameTimerLine` lights it from the left and the lit length burns down as the turn runs,
    `gold` at the live end through `primary` to `heat`, with a white-hot tip. Time is space: the
    room reads the line, and the digits in the neon pill at the row's right (`MinigameTimerChip`,
    white light in a `primary` tube) are the footnote. In the last ten seconds both turn `heat` and
    pulse; at zero the line is out and the pill reads TIME'S UP. A host-paced game gets the dark
    track alone — the rule under the sign — and the clock and its line are two slots on the
    display props (`clock`, `clockLine`), both `null` together, both costing nothing absent.
-   **Slots, not styling.** A game passes what the marquee *says*: `title`, `teamName`, `pending`
    (lit `gold` beside the name), `readout` (the turn's counts, right of centre, read-only, the same
    rule as the host rail's `counter`). It never passes a class string. This is the refusal §2.0B
    recorded of a configurable container, kept: the component is shareable precisely because
    nothing about its look is a prop.
-   **Accent budget.** `gold` for the sign and the pending points (the marquee's standing
    exception to §0.1), `primary` and `heat` on the clock only. The team's own colour does not
    reach the marquee; the name in white light is the team, and direction 02 of the round (the
    team's colour flooding the bar) was refused for making the chrome look like identity.
-   A `<div>`, never a `<header>`: `page.locator("header")` is the e2e suite's strict handle on
    the host rail, and the sandbox draws both surfaces on one page.

## 2.2B Setup Lobby ("Hearth")

The SETUP stage is the screen the room looks at longest, so it is the one display surface that
spends its motion budget. Built direction: the "Turbulent" hearth
(`apps/client/public/mockups/setup/03-volcano.html`), polished.

-   One flame, sized by height and anchored to the floor, so the whole silhouette shows on a 1080p
    panel and a 4K one alike. Four gradient layers (`heat` → `primary` → `gold`/`ember` → `text`)
    flicker on separate clocks; the edges are SVG turbulence. Embers and a few white-hot sparks rise
    through it.
-   The frame is finished, not flat: a breathing heat bloom under the flame, a vignette and a top
    fade so the wordmark sits in shadow, and a film-grain overlay that keeps the big soft gradients
    from banding on a large panel.
-   The wordmark carries the light: white with a warm foot via `background-clip: text`, with an
    ember band that sweeps through every few seconds. Its glow is a `drop-shadow` on a wrapper,
    never a `text-shadow` (which shows straight through clipped text).
-   The lobby is full-bleed: the flame, vignette and cast are the frame, so the stage carries no
    inset of its own — as no stage does (§2.2). Anything that reads as a border around the hearth
    is a bug.
-   Three bands, top to bottom: the wordmark, the lineup, and a floor the cast owns. The floor is
    reserved space (`SetupStageBody` padding matched to the `CastParade` strip), so the birds
    never walk behind the cards.
-   Round cards are warm glass: a hairline `ember` rule along the top edge, a faint glow pooling
    under it, a large embossed round number, and three tiers of type — one eyebrow line (the
    round number as a small `primary` mono tag, then its label), the sauce as the headline, the
    mini-game as a pill. Open slots keep the same footprint but go dashed and dim: no `primary`
    anywhere on them, and the instruction is a sentence-case footnote under the dash.
-   The room's status ("Waiting for teams") is a pill in the top-left corner, the twin of the
    now-playing pill in the top-right (§2.2A): same insets, same glass, same badge. The two read
    as one top line and the centre of the screen belongs to the wordmark and the lineup.
-   Entrance choreography on mount only: eyebrow → wordmark → cards in reading order → the corner
    status pill, ~1s end to end. Everything infinite honours `prefers-reduced-motion` per §8.
-   Accent budget: `primary` plus the flame's own gradient. `gold` appears only inside the flame
    and the wordmark's sweep, never as UI chrome.

## 2.2C The Deck (standings footer)

The fixed standings band (§3.2) is not chrome. It is the front edge of a stage, and the lobby cast
walks and dances on it (§2.8, "Lobby parade") — so it is drawn as a physical slab rather than as a
bar across the bottom of the screen. `DisplayBoard/StandingsSurface`; the slab's layers are
`DeckChrome`, one team's panel of it is a `StandingBay`.

-   **It is flat gradients standing in for geometry.** Nothing is drawn in perspective. Back to
    front: the hearth's `wash` pooling on the face, one `sheen` across the whole band, the `tread`
    (the deck's top surface, an unbroken strip over every bay because the top of a stage is one
    plane however the face below it is panelled), the `nosing` (a hard bright line immediately over
    a hard shadow — this is what reads as a *thickness*, and without it the tread is only a lighter
    stripe), the `lip` as a specular sweep hottest under the flame, and a shaded `plinth` foot.
-   **The sheen is load-bearing.** One light direction crossing every panel joint is what makes four
    tinted rectangles read as ONE slab. Remove it and the bays go back to being four cards.
-   **The joints are routed, not drawn.** The band's own background shows through the 1px grid gaps,
    so it *is* the seam: a warm hairline at the lip falling to black at the foot, against the dark
    inset edge each bay carries down its own sides. Light line between two dark ones is how a deck
    panel meets a deck panel.
-   **The chrome never paints outside its own box.** The footer sits above the stage in the display's
    stacking order, so a layer reaching up past the deck line would be drawn OVER the cast — the
    birds would be behind the platform they are standing on. The floor they stand on belongs to the
    stage (`SetupStageBody` `floor`) and meets the deck's tread at the boundary.
-   **The lobby floor is lit for one reason: shade.** It runs dark where it recedes and warms into a
    sill at the deck line, because a black pool under a bird on black is no pool at all. Every bird
    in the parade carries one (`CastParade` `shadow`), hung outside its bounce layer so a hop lifts
    the bird off a shadow that stays put, and shrinking and fading on the bird's own jive clock
    (`cast-jive-shadow` answers `cast-jive` frame for frame — change one, change the other). This is
    JOUST's `GroundShadow` trade (§2.7): no body, no data, and the difference between a row standing
    on a stage and a strip of stickers.
-   **A bay's height is fixed for the night.** The name box always reserves two lines, so every bay's
    rank label lands on the same line across the whole deck and a team renaming itself cannot reflow
    the stage above.
-   **The leader's stretch of lip runs gold**, clipped to its own bay, so the platform itself says who
    is ahead before the score does. Gold here is a winner accent per §0.1, not decoration.
-   Accent budget: the team tint on the face (an identity use, like the standings dot) plus the
    hearth's `primary` wash. The deck's own material is warm neutral, never a team colour.

------------------------------------------------------------------------

## 2.3 Team-Turn Context (Host + Display)

-   During `EATING`, `MINIGAME_INTRO`, and `MINIGAME_PLAY`, both host and display must show:
    -   Active team name
-   Team-turn context should remain visible without scrolling and without requiring interaction.
-   Team-turn context in these phases is active-team only (no turn-progress label).
-   Display context is informational only; it must not expose host-only answer data.

## 2.4 GEO Minigame Surface Language ("Map Theatre" + "Map First")

GEO used to wear a vintage-expedition "Field Journal" costume — serif
type, gold double-rule frames, sepia tiles, a rotated polaroid, a
postmark, and reveal stats as rubber stamps — deliberately distinct from
the broadcast shell around it. It was retired on 2026-09-21: it was the
only minigame in the night dressed as something else, and on a dark TV
the sepia basemap read as a white rectangle. GEO now wears the same kit
as DRAWING, EMOJI_CHARADES, JOUST, FAPPY and SCHLONIC. Directions:
`apps/client/public/mockups/geo-display/03-map-theatre.html` and
`geo-host/02-map-first.html`.

-   **Sans typography and the house card.** No `font-serif` anywhere on
    these surfaces, no `gold` framing, no rotation, and nothing that
    reads as paper. The §0.1 scoped gold exception GEO used to hold is
    gone; `gold` appears only where every other minigame puts it — the
    marquee. Accent budget is `gold` (marquee) plus `primary` (the live
    mark, the CTA, the points tile), with `success` functional on the
    answer pin.
-   **Dark map tiles.** OSM only publishes a light basemap, so the tile
    pane is inverted and hue-rotated back (`.geo-map-dark` in
    `index.css`, applied via `client/mapTheme`). This replaces the sepia
    filter and is what makes the chart belong on the stage. A second
    tile provider was rejected: a LAN party may not be able to reach one.
-   **Leaflet's own chrome never ships.** `zoomControl` is off on both
    surfaces — its white browser buttons are exactly the foreign
    furniture this language exists to remove. The tablet draws its own
    control strip instead, and the required OSM attribution is restyled
    rather than hidden.
-   **Reveal stats are stat tiles**, the shape the rest of the show uses
    for a number worth reading: an `Off by` tile and a `primary` `Points`
    tile. Not stamps, not seals, not rotated. The number and its unit are
    sized separately (`client/formatGeoDistance`).
-   **Display — "Map Theatre".** Marquee row on top (team + pending
    points, "Geo", then the meta cell: photo counter and the clock —
    GEO is one of the three games with a play timer, and on the TV that
    chip is laid out in the marquee rather than floated over its corner),
    and under it the dark chart as the arena for the *whole* turn, not
    just the reveal. The photo rides in a
    corner card bottom-left; the live status pill, then the reveal tiles
    and pin legend, ride bottom-right. The room watches the pin land
    while the table argues, and the reveal is the answer pin appearing
    and the map closing on the pair.
-   **This costs a projection.** `GeoMinigameDisplayView.currentGuess`
    carries the team's in-progress pin to the TV. It is the room's own
    input, already on the tablet in front of them — not a disclosure. The
    answer coordinates stay host-only until the guess is locked in, which
    is what the answer-safety tests pin.
-   **Host layout is a `<TakeoverCanvas>`** (§2.0B,
    `docs/takeover-layout-api.md` §5) — and GEO is where the Canvas came
    from. "Map First" was the only surface of the nine that already put
    the body full bleed with the chrome floating over it, so the layout
    was drawn from this game and generalised; migrating GEO onto it gave
    up code without giving up a pixel, holding the 1229x749 it already
    had. Every name in the slot map is one GEO invented:
    -   `counter`, read-only in the chrome row: the photo counter. The
        team chip that used to sit beside it is gone — the shell's rail
        arrives in the `rail` slot and already says the round, the sauce
        and whose turn it is.
    -   `clock`, forwarded untouched and drawing: `geoSeconds`.
    -   The body: the chart, edge to edge, with the photo card an
        absolutely-placed plate inside it. The plate is body content, not
        chrome — it is the question the host reads out, and the Canvas's
        floating slots are for the turn's chrome. An empty bank or a photo
        that has not landed yet draws a waiting note *in the body* rather
        than dropping the takeover, so the rail and the clock stay on the
        tablet through the gap.
    -   `actions`, bottom-left: the turn's one `primary` CTA with the tap
        instruction beside it.
    -   `readout`, bottom-right *above* the dock: the reveal tiles.
    -   Deleted with the migration: a hand-typed
        `bottom-[clamp(4.9rem,9vh,5.6rem)]`, a `max-w-[calc(100%-6rem)]`,
        the `pr-[clamp(9rem,15vw,12rem)]` top-right reserve, and a
        `floating = "absolute z-[1100]"` helper that had picked the corner
        dock's own band and was kept off it by a single `isolate` in a
        different file. That trap is what §2.0B's z-index scale exists to
        remove.
-   **The map frame keeps an `isolate` of its own**, one level inside the
    body. Leaflet parks its panes at z-400 and this map's control strip at
    z-1000, and without a stacking context around the frame those layers
    paint over the plate that is their sibling. It sits inside Band 0,
    where §2.0B permits a game any z-index it likes — and the layout's own
    `isolate` on the body is what keeps all of it off the shell's chrome
    and the dock, proved in pixels at the migration.
-   **Quick views stay**, restyled as house glass on the right edge with
    the zoom buttons — `World` and `Barrie`, because the night's photos
    are either around the home town or nowhere near it, and panning
    between the two by hand was the slowest part of a turn. They live in
    `leafletConstants`. The right edge and vertically centred, because
    both right-hand corners are spoken for: the chrome row runs across the
    top and the dock owns the bottom. Leaflet's attribution is shunted
    left of the dock for the same reason — a credit OSM's licence requires
    may not sit under the circle.
-   **The reveal happens on the chart the team just pinned**, on both
    surfaces — the tablet no longer swaps its map out for a verdict
    panel.

## 2.5 DRAWING Minigame Surface Language ("Showtime Easel")

The DRAWING surfaces follow the "Showtime Easel" prototype direction
(`apps/client/public/mockups/drawing-host/05-easel-deck.html` and
`drawing-display/06-easel-grand.html`), rebuilt on the house tokens: an
easel silhouette under game-show marquee chrome, in the same materials
every other surface uses.

-   Materials: `surfaceAlt`/`surface` panels behind `gold` borders for
    the marquee, the prompt card and both easel frames. The mockups' wood
    gradient and brown marquee were scoped hex material colors and were
    dropped for house tokens on 2026-09-21. What carries "easel" is the
    *silhouette* — the framed board and, on the TV, the splayed legs —
    not the timber.
-   (Superseded 2026-09-23 — the TV marquee is the shared neon sign, §2.2D; what follows describes the bulb marquee it replaced.) **The brown did not stay dropped elsewhere, and DRAWING is now the
    odd one out.** GEO and EMOJI_CHARADES were restyled onto the marquee
    hours *before* this surface dropped its brown, and TRIVIA and
    SONG_GUESS were given one later still, so the marquee container
    `bg-gradient-to-b from-[#3a1d09] to-[#1a0c04]` is on seven of the
    eight TV marquees and this one is the exception. Across the minigame
    `styles.ts` files the gold-bordered card splits eighteen brown to
    four in house tokens. The reason this section used to give for
    dropping it — that it "read as a different app beside every other
    surface" — now describes DRAWING itself.
-   (Superseded 2026-09-23 — the TV marquee is the shared neon sign, §2.2D; what follows describes the bulb marquee it replaced.) **The direction is DRAWING's, and the other seven follow it.** The
    marquee's team name, its title, its bulb ring and its meta row are
    already one shared string apiece from `packages/surface`
    (`marqueeTeamName`, `marqueeTitle`, `marqueeBulbs`, `marqueeMeta`).
    The container is the one piece still copied per game, and it is
    exactly where the drift landed. It cannot be hoisted as it stands: a
    house-component path may carry no raw hex, which is why
    `RunningTotals` had to be substituted value-for-value when it moved
    into the package. And
    §0.1's scoped-material exception is for *scene* content — this
    surface's inks, JOUST's desert (§2.7), SCHLONIC's bay (§2.11) —
    where the material is the thing the room is looking at. A marquee is
    chrome, and the exception was never meant to reach it. The dusk
    desert belongs to JOUST's arena, not to the frame around every other
    game's.
    **This is written, not built:** the eighteen literals are still in
    the tree and lint does not yet see them, because
    `no-hardcoded-hex-colors-in-styles` does not gate the minigame client
    trees. Until they land, expect DRAWING's marquee to look unlike the
    rest — that is a known debt, not a design decision.
-   The chalkboard board (`#0E2624` family with a faint 30px grid) is
    the one scoped material that stays: it is the drawing content
    surface, shared pixel-for-pixel by tablet and TV, and chalk needs
    slate to read against.
-   `gold` is the marquee/framing accent (prompt card, the neon sign's
    halo and pending points per §2.2D, easel edge) — a scoped exception
    to the §0.1 "winner moments only" rule. Every minigame marquee holds
    the same exception; GEO's §2.4 once held a wider one and no longer
    does.
-   Verdict controls are `success`/`danger` tinted buttons with
    check/cross icons (host) and matching opaque reveal plaques
    (display) — functional success/danger usage per §0.1, at the same
    weight EMOJI_CHARADES uses in §2.6. The plaques are opaque: the
    held sketch stays on the board behind them.
-   **Host layout is a `<TakeoverStage>` with no deck**
    (`docs/takeover-layout-api.md` §3-§4) — and it is the case that rule
    was written around. DRAWING has the biggest body of the nine and is
    still not a `<TakeoverCanvas>`, because chrome that floats over this
    body does not cost a corner of scenery the way it does on JOUST's
    lane (§2.7) or SCHLONIC's zone (§2.11): **the board is the one body
    on the tablet the host both reads and presses, every pixel of it.**
    A floating toolbar covers the drawing, and under the layout's
    pointer rule its buttons take the pointer, so it would also put a
    live CLEAR under the artist's moving hand. Measured at 1280x800:
    full bleed would be an 1133x708 board, 78% of the tablet against the
    59% the Stage gives — the nineteen points are what the rule costs,
    and they are worth it.
-   Three rows and nothing else. The shell's mini-rail arrives in the
    layout's `rail` slot and already says the round, the sauce and whose
    turn it is, so this surface draws no rail, no identity strip and no
    team chip of its own. What it puts in the slots:
    -   `counter`, read-only in the rail row: the prompt, then the
        pending points. The prompt is not a count, but it is the turn's
        one glance-at-without-acting read, and the rail row is where it
        is free — DRAWING is one of the three games with a play clock,
        the clock chip is 48px tall, and anything shorter than that in
        that row costs the board nothing. Keep the prompt to one line;
        a wrapped prompt is paid for in board area.
    -   `clock`, forwarded untouched and drawing: `drawingSeconds`.
    -   The body: the ink palette as a vertical rail down the left, the
        board taking the rest. The empty-bank note and the transient
        result pill float over the board rather than holding rows.
    -   `actions`, the foot row: undo/clear/skip, then **Correct before
        Nope** (§4, owner decision P7 — this surface was the only one of
        the nine with the destructive verdict on the left). A bare row
        at the 44px touch target, not a panelled toolbar.
-   **The board letterboxes to 16:10 against the *height* the rows leave
    it, so every vertical pixel of chrome is worth 1.6 pixels of board
    width — and side width is free.** Measured at 1280x800: the board is
    984x615 inside a 1151px-wide slot, so the palette column and 149px
    of letterbox bar sit in slack the board was never going to use,
    while the foot row's own border and padding cost 18px of height and
    29px of width. Columns are free here; rows are not. No second
    toolbar row, no wrapped rail, no prompt card of its own.
-   No control overlaps the drawing canvas, and none of them takes a
    column of its own — the deck column this surface used to carry cost
    the board ~40% of the tablet for controls the artist presses a
    handful of times a turn.
-   The booth's own name sits at the head of the ink palette rather than
    in the rail row: §4 keeps a game's names out of the row the shell
    owns, and the palette column is the one place on this surface where
    a sign costs the board nothing.
-   Display layout: the shared neon marquee (§2.2D) — "Live Sketch" as the
    kicker, the team under it, the pending points and then the clock on the
    right, the burning line beneath — (Superseded 2026-09-23 — the TV marquee is the shared neon sign, §2.2D; the rest of this bullet describes the bulb marquee it replaced.) grand bulb marquee — team on the left, the "★ Live
    Sketch ★" title centre, and the meta cell on the right holding the
    pending points and then the clock — easel with splayed legs, status
    line beneath. The clock is *in* that cell, not floated over the
    corner: this was one of only three TV surfaces whose chip ever drew,
    and it used to be anchored to the shell rather than to the marquee,
    landing on the gold border and the bulb ring.
-   Ink palette is drawing content, not UI chrome, and is exempt from
    the 2-accent budget: chalk `#F3EEE2`, plus `#F97316` (primary),
    `#EF4444` (heat), `#FBBF24` (gold), `#06B6D4` (teamB), `#84CC16`
    (teamC). Strokes render with a soft same-color glow.
-   Both canvases keep a fixed 16:10 aspect ratio (JS letterbox fit, not
    CSS `aspect-ratio`) so normalized strokes render identically on
    tablet and TV.
-   The TV canvas is read-only and answer-safe: prompt text appears only
    in the post-result reveal plaque. During the reveal the display
    holds the finished sketch on the board, dimmed, until the reveal
    window expires. The host gets the same result as a transient pill
    floated over its own board, not a row in the layout.

## 2.6 EMOJI_CHARADES Minigame Surface Language ("Clue Board")

The EMOJI_CHARADES surfaces follow the "Hybrid" host direction
(`apps/client/public/mockups/emoji-charades-host/04-hybrid.html`) and the
"Clue Board" display direction
(`emoji-charades-display/02-clue-wall.html`): a fixed board of clue slots
under the shared neon marquee (§2.2D). It used to sit under the bulb marquee
DRAWING built, with its container the brown gradient §2.5 recorded as debt; the
sign replaced both on 2026-09-23 and the ★ Emoji Charades ★ title lost its stars
with the bulbs.

-   **Emoji are content, not chrome.** They are full-colour unicode and
    are exempt from the §0.1 two-accent budget, exactly as DRAWING's ink
    palette is (§2.5). The chrome around them stays within budget:
    `gold` frames (marquee, subject card, newest-slot ring) plus
    `primary` for live data (timer, canvas caret, search focus ring).
    Got It / Skip are green/red gradient buttons — functional
    success/danger per §0.1, not decorative accents.
-   `gold` as a framing accent on these surfaces is a scoped exception to
    the §0.1 "winner moments only" rule, like DRAWING's §2.5 exception.
    Outside these surfaces the §0.1 rule stands.
-   The subject card reuses DRAWING's prompt-card treatment — serif
    italic on a `surfaceAlt` → `surface` panel inside a gold border — so
    the two minigames read as the same show.

There is **no deck picker**. The turn is dealt "People in This Room" (the
first deck in the file long enough to carry a turn) and opens on its first
subject, so no clock is spent browsing. The deck-selection screens in
`04-hybrid.html` and `02-clue-wall.html` are design history, not a surface.

A subject may be **locked to its own emoji**: the tablet's search, tabs and
catalog all disappear and the picker offers exactly the authored list under a
caption naming the subject. It is a running joke about one person in the room,
authored in content (`lockedEmojis`), and the reducer refuses anything off the
list so the bit cannot be broken from the tablet. The TV never sees it.

**Host layout is a `<TakeoverStage>` with a deck**
(`docs/takeover-layout-api.md` §3), and the arrangement is the one this surface
already had: the body is the picker column (clue canvas → persistent search
field → category tabs → emoji grid), the deck column is subject card → Got It →
Skip → back/clear. What changed is who owns the chrome around them.

-   **It is a Stage because every pixel of the body is a tap target.** The
    Canvas test asks whether chrome can float over the body without covering
    something the host must read or press; over an emoji grid there is nowhere
    the answer is yes. The cells are `<button>`s in the body rather than in a
    floating row, so they would be covered and dead at once.
-   **It keeps the deck because this body does not want width.** The cells are
    `aspect-square`, so width and cell size move together: the 887px the deck
    leaves draws a whole catalog tab — forty to fifty emoji — at 83px a cell,
    while the full 1229px would blow each cell up to 118px and push a row off
    the bottom. The 330px the deck costs is width the picker would spend on
    holding less. It measures 887x689 of the tablet's 1280x800, 59.7% against
    the 58% it had, and the emoji grid inside it takes all 21px of the gain —
    reclaimed from the description paragraph and the "Clueing <team>" chip this
    surface no longer draws, because the shell's own rail arrives in the
    layout's `rail` slot and already says the round, the sauce and whose turn
    it is.
-   **The verdicts stay in the deck**, which §4 allows as readily as the foot
    row. `actions` runs full width under both columns, so putting them there
    would cost the grid ~90px of the one axis it is short in to buy width it
    has no use for.
-   `counter`, read-only in the rail row: the subjects left — the subject
    card's old third line — then the points banked this turn. `clock` draws
    here and is new on the surface: EMOJI_CHARADES is one of the three games
    with a play-phase timer and one of the two that reserved nothing for it
    (§6). The corner dock's 4.5rem is the deck's own scroll padding now, and
    the `pr-[4.5rem]` the utility row used to type is gone.
-   **The layout is chosen per `hostView.status`, not per phase** (§10): this
    is the only surface of the nine whose host view is a union on a status.
    When the turn completes the counter and the deck collapse to nothing and
    the closing panel takes the whole 1229x749 canvas — an empty slot costs no
    space, the same mechanism that lets a game with no clock pay nothing for
    one. The intro beat is a panel in the host's own control deck rather than a
    takeover, so it carries no chrome at all: the briefing line and the subject
    card, which the host needs before the first tap.
-   Search is **always visible but never permanently expensive**: it
    occupies its own row only, and the keyboard is summoned on focus,
    overlaying the grid and retracting on Done. The keyboard must never
    permanently reserve height — the control deck and the verdict buttons
    keep their full size at all times.
-   The landing tab is **Top**, sectioned used-this-turn → used-tonight →
    charades staples. Frequency ranking, not alphabetical or unicode
    order, is what puts the likely next tap on the first screen.
-   Emoji cells are ≥44px touch targets per §2.1 and the grid scrolls;
    the bottom fade is the scroll affordance.

**Display layout**: the shared neon marquee (§2.2D: active team + pending
points, show title as the kicker, the turn timer as pill and burning line), the clue board, then the
standings footer per §3.2. That third cell used to be an `aria-hidden`
`min-h-[1px]` spacer holding a column open for a chip absolutely
positioned somewhere else — a seventh idiom for the same reserve nine
surfaces were typing. The chip is laid out in the cell now, which is
where `02-clue-wall.html` always drew it (`.timer-block`).

-   The board is a fixed 6×5 grid of all `MAX_EMOJIS_PER_SUBJECT` slots,
    letterboxed into whatever height the marquee and footer leave.
-   **Emoji never scale with sequence length.** Cell size is a function
    of available space alone, so a 3-emoji clue and a 28-emoji clue are
    equally legible from across the room. This is the load-bearing
    decision of the surface: shrink-to-fit was prototyped
    (`01-hero-line.html`) and rejected for collapsing to unreadable
    glyphs as a clue approaches the cap.
-   Filled slots are lit; the remainder stay as dashed ghost slots, so
    the room can always see how much clue is left to come.
-   The newest slot carries a gold ring and a 420ms `pop` — the one beat
    of drama, borrowed from the rejected `03-ribbon.html` direction.
-   Answer-safe per §2.3: the display never receives subject text outside
    the post-result reveal. The reveal is DRAWING's plaque (§2.5), not a
    full-bleed wash: a check/cross, the resolved subject in serif italic
    and a gold award readout, over a board dimmed to 0.3.
-   **The board holds the clue through the reveal.** The runtime empties
    the sequence in the same update that raises the verdict, so the TV
    keeps the emoji that were on it the render before — otherwise the
    room loses the clue at the exact moment the answer would make sense
    of it. Same hold DRAWING keeps for its sketch, pinned to the reveal
    that caught it so a subject resolved on an empty board never
    resurrects the last one's clue. (The prototype dimmed to 0.12 under
    an opaque wash, which erased a board it had nothing on anyway.)

## 2.7 JOUST Minigame Surface Language ("Centennial Beach at Dusk")

The JOUST (Slingshlong) surfaces put a side-on beach lane under the same
marquee chrome the drawing easel uses. It is the SAME shore SCHLONIC runs
along on a summer morning (§2.11) — Kempenfelt Bay, seen from Centennial
Beach — at dusk, so the two games share the city and are still told apart
from the sofa by the hour:

-   Scene materials are drawing content, not UI chrome, and are exempt
    from the 2-accent budget like the drawing inks: dusk sky
    (`#160c2a` → `#4a1f3f` → `#c2582c`), a fixed star field (`#fde7c5`, one
    seeded constellation so the tablet and the TV agree and nothing
    twinkles), the sun going down over the head of the bay (`#f9a51a`, half
    into the far treeline, with its column broken across the water in the
    same dashes SCHLONIC's morning uses), Oro's bank and treeline across the
    bay hazed to two purples (`#4a1e42` / `#2f1234`) with a few porch lights
    on it (`#ffd9a0`), the bay carrying the sky (`#8c3d48` → `#3b1c44` →
    `#241233`, glitter `#ffc46b`), the beach wet at the water's edge
    (`#b8894e`) and dry sand below the floor line (`#d3a75f` / `#ad8340`) with
    broken wind lines, and the landmarks in one silhouette (`#22102b`) with
    downtown's windows the only thing lit (`#ffcf8a`). The props a lane is
    furnished with — beach furniture, not cacti — wear the bright paint the
    real things come in (white `#f3e9d6`, Muskoka red `#c8433a`, canvas
    `#e8b23a`), because they are things a shot hits. Slingshot wood is
    `#6b4423`. The shooter is `primary` orange.
-   **The city is drawn once.** The far skyline (downtown's slabs, the stepped
    block of City Hall, a spire) and the Spirit Catcher are the same
    `@wingnight/scenery` components SCHLONIC stands; each takes a palette, so
    the morning paints them in haze and the dusk paints them in silhouette.
    Downtown sits on the far horizon at the west end, half off the frame the
    way a skyline is, and the Spirit Catcher stands on the beach BEHIND the
    rack: a giant steel bird overlooking a rack of hens is the joke, and the
    city built its half of it first. Everything stays hazed, flat and quiet so
    a bird on a shelf still wins the eye, and every landmark is a solid sweep —
    anything finer reads as a TV aerial at TV distance. There is no second
    Spirit Catcher, and no marina: its masts stood exactly where the shooter
    and the bench are drawn, and read as wires through them.
-   **The backdrop bleeds; the world does not.** The lane is a 160×90 world
    letterboxed into whatever frame it gets, and the sky, the bay and the sand
    are painted 400 units past it on every side (`BACKDROP_BLEED`) outside the
    world clip, so a frame that is not 16:9 meets its edges with scene and
    never a seam. Everything that moves stays inside the clip.
-   **Weight and flight are drawn, not just simulated.** Every standing bird
    and every built tower casts a pool of shade on what it stands on
    (`GroundShadow`, the post's dark at 0.3) — a depth cue with no body, so
    a bird on a shelf reads as ON it. While a shot replays, the head leaves a
    fading ghost trail of its last eight frames (`JOUST_TRAIL_FRAMES`), so
    the room can read the arc of a flight that crossed the lane in under a
    second; it collapses to nothing once the shooter stops. While the band is
    being drawn, a dashed ring at the pull radius shows the room how much of
    the band is in hand — the ring is full power.
-   **The shot is the cast's schlong.** The thing on the band is drawn by
    `@wingnight/cast`'s `resolveSchlongPaths` along its own physics bodies —
    the five shaft links and the head are the spine, so every flop the
    integrator gives it is in the outline, and the glans is a cap of the
    head body's own radius, so what the room sees hit is the circle the
    integrator hit. A soft outline with a flared glans and a rim at the neck,
    a gloss up the lit side and a spot on the head, two balls off the tail,
    and a cartoon face in screen space whose pupils look where it is going
    (down the lane while it waits). It keeps `primary` orange: it is the
    team's shot, and nothing else on the beach is orange. The replay draws
    between the track's 24 Hz keyframes (`useShotReplay` is fractional), so
    the flight moves on every screen frame rather than every third one.
-   **The shot is a KIND, and the kind is a silhouette first.** A pack may
    author a loadout (`shooters` in `joust.json`): each kind carries its own
    physics profile and its own three inks, and both surfaces draw it from
    those — the Shooter's radii and link spacing are the integrator's, so a
    Log is visibly longer and fatter on the band before it has flown, and a
    Pencil is a thin quick line. Colour is second: kind inks are drawing
    content, exempt from the two-accent budget like the sand and the cacti,
    and a pack keeps them off the eight team colours because the hens in the
    lane wear those. The sample ships the Standard in `primary` orange (its
    old colour), a bark-brown Log, a violet Pencil and a rubber-red Bouncer.
    The tablet's picker (`HostJoustSurface/Loadout`) rides in the arena's sky
    at top-right the way the lane plate rides top-left — a row of the kinds
    drawn by `resolveSchlongPaths` at one shared scale, the loaded one ringed
    in `gold`, spent ones dimmed and dead — and only its buttons take the
    pointer, so a pull that starts beside it still pulls. It is hidden when
    the pack carries one kind. The TV names the loaded kind on its status line
    ("Rob is up with The Log"), replays a track as the kind that flew it, and
    draws the ghost in that kind's light ink.
-   **The lane is the room.** Every player who is not shooting stands in it
    as the very same cast bird the setup lobby wanders (§2.8) — their own
    generated head and all — and the shooting team stands behind the
    slingshot. Birds wear their own team's colour here, not a scene hex, so
    the lane reads as the other teams at a glance and the turn marker needs
    no caption. A bird felled on an earlier shot lies on its own spot at
    half opacity, still in its colours: the damage is countable at TV
    distance without reading a number.
-   **The lane is built, not lined up.** Players stand on scaffolding —
    slabs on legs — at different heights, so a flat shot ploughs the sand
    and only an arc reaches a shelf. The timber is drawn from the same
    boxes the integrator collides against: what looks like a leg IS a leg,
    and a shot that clips one stops there. What the timber is DRESSED as is
    its height (`PerchSkin`): a shelf under a points tier of rise is a dock
    on dark pilings at the water's edge, decking and cleats on top
    (`#8a6a45` / `#4f3a22`); one over it is a lifeguard tower, white timber
    (`#efe6d3`) with a low red rail (`#c8433a`) along the platform. The skin
    repaints the same legs and plank and hangs its trim off the plank's
    current ends, so it folds with the frame; the strain overlay, the
    target ring, the grit, the points tag and the rubble are untouched.
-   **Whoever is shooting walks up, and walks off.** The bench stands in
    turn order, not roster order (`resolveBenchOrder`): whoever shoots next
    is nearest the post, then the one after, and when the next shot opens the
    shooter walks off to the far end of the line and turns their back on the
    lane while everybody else steps up a spot — so the room sees the turn go
    round the table without a caption. The line has one spot per teammate and
    fills from the far end in the order they finished, so a player who has
    walked off never moves again and the one gap is always the spot the
    shooter stepped up from. The walk is the client's own beat
    (`useBenchWalk`, about 14 world units a second on `requestAnimationFrame`,
    the FAPPY handoff pattern): a walking bird wears the cast's `walk` pose
    and faces where it is going, a parked one wears `still` — not `idle`,
    because the bench is scenery and §8's ambient-loop rule applies to it —
    and each is wrapped in its own groove (`resolveCharacterGrooveClassName`)
    so a line stepping up together does not march. `prefers-reduced-motion`
    teleports, as the replay skips the flight. Nothing about a spot crosses
    the wire. While the band is drawn the shooter at the post reaches for it:
    the figure is drawn wingless and its wing goes on a layer of its own
    (`ArenaHen`'s `wingAimAt`, the FAPPY wing convention), turned about the
    shoulder toward the shooter's tail, and the whole bird leans back with
    the pull, up to fifteen degrees at full draw. Through the replay the
    shooter stays at the post watching. Both surfaces still name them, so the
    room knows it is their go without being told twice.
-   `<CharacterFigure>` is the cast drawing as a bare `<g>`, which is what
    lets the lane place it under its own transform. JOUST scales it by
    `CHARACTER_STAND_HEIGHT` so the bird and the physics pin are one
    creature, and stands it up from the pin's two body centres — the lean
    is the rotation, so nothing in the scene needs an angle.
-   `gold` is the marquee/framing accent (marquee border, pending points,
    the impact burst, the result plaque) — a scoped exception to the §0.1
    "winner moments only" rule, like DRAWING's §2.5.
-   **The beach stops at the arena's edge.** `#3a200d`, `#1a0e05` and
    `#0a0604` are this lane's own frame and plaque, and they leaked: the
    result plaque, the hint card and the secondary buttons on this
    surface — and the running-totals card three other games copied
    verbatim — are chrome wearing a scene colour. Hoisting that card into
    `packages/surface` forced a value-for-value substitution to
    `border-ember/20` and `from-surface to-bg`, because a house-component
    path may carry no raw hex, and the substitution is the answer to the
    question it raised: the arcade games were not agreeing on a surface
    language, they were copying one game's skin. §2.5 carries the
    direction for the rest of it.
-   **Host layout is a `<TakeoverCanvas>`** (`docs/takeover-layout-api.md` §5):
    the lane is full bleed, filling the takeover's padding box edge to edge —
    1229x749 of the tablet's 1280x800, 89.9% against the 60% the 330px control
    deck left it. The deck is gone, and so is the mini-rail strip this surface
    used to draw: the shell's own rail arrives in the layout's `rail` slot and
    already says the round, the sauce and whose turn it is. Everything the deck
    held went to a slot the layout places, and JOUST hand-types none of them:
    -   `counter`, read-only in the chrome row: shot count, the turn's shot
        chips, how many are still standing, the team's pending points.
    -   `actions`, floating bottom-left: Next shot, then the skip and reset
        escape hatches, then the hint that used to sit on a row under the lane
        costing it height.
    -   `readout`, floating bottom-right above the corner dock: the result
        plaque and the running totals.
    -   The lane name and whose go it is are the scene's own identity rather
        than chrome, so they ride in the body as a plate over the sky, and take
        no pointer — every pixel of the frame under them fires the shot.
-   Display layout: marquee (team, "Centennial Beach", shot count, how many are
    still standing, pending), the lane, a status line beneath. The result
    plaque drops over the top of the lane only once the replay has landed,
    and names who went over rather than scoring a zone.
-   The lane is an SVG with a fixed 160×90 viewBox and `xMidYMid meet`,
    so the letterboxed scene maps identically on tablet and TV and the
    tablet's pointer math is the inverse of the same fit.
-   The replay is the game, not ambient decoration: §8's infinite-animation
    rule does not bite. `prefers-reduced-motion` skips the flight and shows
    the landing frame.

## 2.9 FAPPY Minigame Surface Language ("The Corridor")

The FAPPY (Fappy Bird) surfaces fly the cast (§2.8) through JOUST's desert (§2.7),
under the same marquee chrome and, on the tablet, the same full-bleed canvas:

-   Scene materials are JOUST's, on purpose: the dusk sky and sand. The
    obstacle is the cast's schlong (§2.7, the same `resolveSchlongPaths`
    drawing JOUST fires) standing up from the sand in bubblegum pink
    (`#f9a3bc`, outlined `#8e2a52`) — the one hue in the desert that is
    neither its sand nor its sky, so a row of them reads from the sofa.
    Each frame the shaft is re-bent from its balls on the sand up to a head
    whose top IS the sim's `champTop`: the tip sways on a slow wave and the
    middle of the shaft follows a beat behind, so it whips rather than tilts,
    and at full stretch of its bob the shaft thins a little. A gloss up the
    lit side, veins wandering up the shaft (the cast's own, §2.8), a rim at
    the neck, a face on the head whose pupils turn to watch the bird once it
    is close. **The row is a line-up, not a fence.** Each gate is dealt one
    of three kinds by the course seed, so every screen dresses it alike:
    the bubblegum one (the staple, half the deal), a big dark one
    (`#4b2a20`, a wider shaft and a bigger head, swinging slow and heavy)
    and a slim pale one (`#f4e3d3`, quick and twitchy). The head's top is
    the sim's `champTop` whatever the build, so a kind is a look and never
    an advantage; the drawn head stays inside the gate's column, which is
    the hitbox. **It jiggles.** Besides the idle sway, a champ whips in the
    wake of a bird that has just gone past — a damped ring in the ticks
    since the sim counted the gate, each kind at its own weight — and the
    balls squash and stretch with it and breathe a little on their own.
    **Some of them spit.** About two in five are spitters, on a beat of
    their own: over the last twenty-odd ticks of it the head hinges open at
    the rim, the eyes going back with it over a dark wet cavity — that is
    the tell — and on the beat an off-white glob leaves the neck, thrown up
    and towards the bird, and falls on its own gravity while the head snaps
    shut with a gulp down the shaft. A glob that lands is not a crash: it is
    spent, the bird is shoved down harder than an eagle shoves it, the scene
    kicks sideways, and goo rides the bird's face and drips off over the
    next second. The beat, the arc and the hit are the sim's, so the tablet,
    the server and the TV agree on every glob; only the open head and the
    goo are the renderer's. Over some gates a bald eagle
    (dark brown, white head and tail, `#f9a51a` beak and talons) hangs in
    the sky as the thing to duck under, its feathered wings beating on the
    shoulders (bump one and it tumbles off, gone for the leg). Behind the
    corridor a starfield, a low sun on the horizon and two bands of dunes
    that slide at a fifth and a half of the scroll, so the world has depth.
    Each leg takes off from a sand cliff on the left and lands on one on the
    right, where the next player's bird stands facing the flyer (a gold
    pennant on the last leg); strata lines, a tuft or two and a barrel
    cactus give the sand a surface, and a gold dashed strip along the
    landing plateau says where to come down. Past the plateau a dark rock
    wall closes the sky. Drawing content, exempt from the two-accent budget
    like the JOUST arena.
-   The bird is the leg's player's own cast hen — their costume head, their
    team's accent and apparel — so who is flying is visible from the sofa.
    A leg nobody is rostered for flies the drawn hen in the team colour.
    **The wing beats.** The hen is drawn without its wing (in the cast's
    `fly` pose, legs tucked; the waiter on the cliff stands in `idle`) and the
    cast's `<CharacterWing>` sits on a layer over it, turned about the shoulder
    each frame: one wingbeat per tap, read straight off the physics (a flap
    sets the velocity, so the ticks since the last tap are in it), a wing
    held out on a glide, folded on a perch.
-   The scene is a 16:9 box letterboxed with container units, world units
    mapped with one custom property, so tablet and TV draw the same world.
    The gate layer is an SVG in world units; the bird is an HTML box moved by
    a transform on its wrapper, so the costume head's halo filter is
    rasterised once and composited, never recomputed per frame — which is
    also why the wing is a separate layer and not a moving part of the hen.
-   The relay clock is the scoreboard: mono, tabular, `text` under par,
    `gold` past it, `heat` in the last fifteen seconds, in the display marquee
    and, on the tablet, as the last chip of the takeover's chrome row. It is
    FAPPY's own clock, not the shell's — this minigame's `timerKey` is null, so
    the layout's `clock` slot is empty and takes no width, and a relay clock is
    a count the host reads without acting on it, which is what `counter` is for.
-   **Two beats the sim never sees**, both short because the clock runs
    through them and both the same for every team. *The handoff* (1.4 s): the
    bird lands next to the one waiting, squashes and settles with a puff of
    sand, the waiter hops twice with its wing up (stepping towards the wall on
    the first hop if the landing came down close, so the two stand side by
    side and never one over the other — the plateau is 56 units wide and the
    waiter stands at 78% of it for the same reason), and a callout drops over
    the corridor — on the tablet "Hand it to *Caitlin*", on the TV *Caitlin*
    in serif italic with "You're up — grab the tablet" — while the status
    lines say the same. The tablet ignores taps for the whole beat, so the
    finger that just landed cannot launch the next player's bird. Then the
    corridor wipes: the next leg slides in from the right. *A crash* (0.55 s):
    the bird goes over where it hit, sinks a little, a puff of sand and a
    sideways kick on the scene that dies out; taps are ignored so a player
    mashing through sees that they crashed. The TV replays a few ticks behind
    the tablet, so it holds a finished leg a little longer than the tablet
    does and finishes the flight it has before it switches: the room always
    sees the landing and the crash, never a cut to the next start.
-   **Host layout is a `<TakeoverCanvas>`** (`docs/takeover-layout-api.md` §5),
    the same one JOUST takes in §2.7: the corridor is full bleed and is still
    the whole flap surface (no scroll, no zoom), filling the takeover's padding
    box edge to edge — 1229x749 of the tablet's 1280x800, 89.9% against the 59%
    the 330px control deck left it, and the 16:9 scene inside it goes from
    887x499 to 1225x689. The deck is gone, and so is the mini-rail strip this
    surface used to draw: the shell's own rail arrives in the layout's `rail`
    slot and already says the round, the sauce and whose turn it is. Everything
    the deck held went to a slot the layout places, and FAPPY hand-types none
    of them:
    -   `counter`, read-only in the chrome row: the leg count, who is flying,
        the leg chips (which now carry the crash count the deck's card used to
        repeat in words), the gates cleared, and the relay clock last.
    -   `actions`, floating bottom-left: the skip and reset escape hatches,
        then the hint that used to sit on a row under the corridor costing it
        28px of height.
    -   `readout`, floating bottom-right above the corner dock: the finish card
        and the running totals with the par line under them.
    -   Who is flying stays a chip rather than becoming a plate over the scene
        the way JOUST's lane name does: the bird is pinned at 20% of the
        scene's width, and a plate on the top-left sky would sit in its flight
        path.
-   Display: marquee (team, "Fappy Bird", leg, gates, clock), the corridor, a
    status line; the plaque drops once the relay is through or the limit has
    caught the team.
-   The flight is the game: §8's infinite-animation rule does not bite.
    `prefers-reduced-motion` on the display shows the landing frame only.

## 2.10 RECREATE Minigame Surface Language ("Forgery Studio")

The RECREATE surfaces are a gallery back room: the TV hangs a doctored party
photo (the target), the team on the tablet writes the prompt they think made
it, and the forger — the image model — paints their version next to it.

-   The picture is never the referee. Points come from the host ticking the
    target's secret ingredients against the prompt as read aloud, so the
    surfaces keep the pictures and the appraisal visually separate: matte
    frames up top, the grading bench underneath (TV) or beside them (tablet).
-   Frames are matte and dark (`surface` border and mat, on a `surfaceAlt`
    wall) — the art is the party's own photos, so the frame stays out of
    their way. A photo that does not fill its frame is matted, not
    letterboxed. The forgery's frame holds a pulsing "Painting…" while the
    model works and a plain-words reason when it bails; the frame is never
    empty and never spins forever.
-   `primary` is the studio's accent (title, the one button to press, the
    points seal); `success` is the tick, and functional only. That is the
    two-accent budget; no gold, heat or team tokens inside these surfaces.
-   Secrets stage in, never out: while the team writes, the TV shows only the
    target and "ingredients sealed"; the prompt and the ingredient chips
    appear the moment it is sent; the authored prompt only once the score is
    locked. In PASS_AND_PLAY the tablet is in the team's hands, so the
    checklist is absent from the host view too until the prompt is in.
-   **Host layout is a `<TakeoverStage>` with no deck**
    (`docs/takeover-layout-api.md` §3, §4): the body is a photograph beside
    either the prompt the team is typing or the prompt the host reads aloud
    while ticking ingredients, so there is no corner a floating chip could take
    that is not a word or a tap target — and the grading bench is the wider of
    the two columns, not a sidebar, so the 330px deck §3 pencilled in could
    never have held it. Gone with the layout: the studio-title header strip and
    its `pr-[clamp(9rem,15vw,12rem)]` reserve for a clock RECREATE has never
    had, the team line the shell's mini-rail already says, this surface's own
    `p-5` inside the shell's gutter, and the `w-[calc(100%-4.5rem)]` T1.8
    hand-typed onto "Next target". The body is 1229x622 of the tablet's
    1280x800 — 74.7% against the 33% the old content-height stack painted, the
    worst share of the nine.
    -   `counter`, read-only in the rail row: "Target n of m", the one thing
        worth keeping off the header strip. It was the only turn counter in the
        nine sitting top-right by hand; now it is top-right because that is
        where the slot is.
    -   The body, on all three beats: pictures left, bench right, 2fr/3fr.
        Writing — the target (and the original, if the pack carries one) |
        the composer, a textarea that takes the column's height. Judging — the
        target and the forgery | the bench: their prompt in a quote block,
        ingredient toggles at ≥56px, the running tally. Scored — the same two
        pictures, now full size | the points seal and the real prompt, centred
        in the column that used to stand empty.
    -   `actions`, the foot row: one beat-ender per beat, always in the same
        place. "Send to the forger" while they write, "Lock in the score" with
        "let them rewrite" as the redo hatch beside it while the host grades,
        "Next target" — or the turn-complete note — once it is scored. RECREATE
        is the only game with three primaries, and they are three beats of one
        turn rather than three buttons at once. The row's dock gutter is the
        layout's.
-   Display: masthead, two frames (target | original while writing, target |
    forgery after), the appraisal under a hairline: title, their prompt in
    italics, ingredient chips that fill `success` as the host ticks, the
    points seal and the real prompt on lock.
-   **RECREATE wears the shared neon marquee since 2026-09-23** (§2.2D), with
    "Forgery Studio" as the kicker and the appraisal office's subtitle in the
    readout slot; the masthead below is what it hung before. It was the one
    display without a bulb marquee, and that was the
    gallery reading rather than an omission: the other eight wear a game-show
    frame, and a back room hangs a masthead. The clock slot sits at the end of
    that masthead and draws nothing — `timerKey: null` — so the rule runs the
    full width of the wall. It used to stop 18rem short of it, holding space
    for a chip this game has never had.

## 2.11 SCHLONIC Minigame Surface Language ("Kempenfelt Bay Zone")

The SCHLONIC surfaces are the one place in the night that is supposed to look
like a 16-bit platformer, and they look like nothing else in the show on
purpose: a bright summer morning on Kempenfelt Bay, so the room knows which
game it is watching from the sofa before a word is read — and, because
everyone on that sofa is from Barrie, knows where it is watching it from.

-   **The two cast members finally meet, and the hen is the hero.** The runner
    is the player's own bird (§2.8) — team colour, their generated head, their
    team's apparel, the same character that parades in the lobby and flies
    FAPPY's corridor. Everything standing in its way is the cast's schlong
    (§2.8, the same `resolveSchlongPaths` JOUST fires). The shore is furnished
    with dicks and a chicken is running down it; that is the joke, and
    nothing else on screen has to carry it.
-   **The zone is the city's own shoreline.** The runner runs the south shore of
    Kempenfelt Bay, facing east down the water into the morning sun, and the
    backdrop is four banks scrolling at their own share of the zone: clouds and
    gulls; Oro's treeline across the water; downtown's slabs, the stepped block
    of City Hall and a spire at the west end; and the near waterfront strip —
    the Spirit Catcher, the marina, Allandale Station. The city put a giant
    steel bird on that shore decades before this game put a small one on it,
    which is the joke nobody from here has to be told. Every bank is hazed,
    flat and quiet: it is a backdrop, and a pink one with a face still has to
    win the eye. Each bank is only as wide as the zone's own length needs
    (`bandWidth`), so a long zone never outruns its skyline and a short one
    does not pay for scenery it never reaches. The landmarks themselves —
    the Spirit Catcher, the town cluster, Allandale Station, the marina — now
    live in `@wingnight/scenery` as bare `<g>` components taking a palette,
    because JOUST looks out over the same shore at dusk (§2.7); this scene
    only says what colour the morning makes them.
-   Scene materials are their own (`packages/minigames/schlonic/.../palette.ts`):
    a sky that runs `#1f7fc4` to `#cfeaf7`, the bay `#2f8fc4` between a deep
    `#2b6ea6` and a shallow `#63b8de`, beach `#f0dcae`, park `#4fb87c`, and the
    ground itself turf `#3fa34d` over the bluff's sand `#d8bb86` over soil
    `#8a5a2b` — so a pit is a bite out of the shoreline with sand at the lips,
    the way the real bluffs go. Wings are `#f5902b` on a `#fff1d6` bone.
    Drawing content, not UI
    chrome — exempt from the two-accent budget the way the JOUST arena and the
    drawing inks are. The letterbox bars around the 16:9 world are near-black
    (`#0d1f14`): they are outside the world, and painting them sky-blue made
    the shore read as floating.
-   **Three readings of one creature, told apart at speed.** The schlong is
    drawn three ways and the room has to know which is which in a glance:
    *a FACE* — on a pink, a dark or a pale one, dealt by its index the way
    FAPPY deals its champs (§2.9), veins and all — is alive, an enemy, and
    pops when landed on; *crimson, stubby, several of them and no face* is a
    thorn bed that hurts however you arrive; *pink with a red-and-white PAD
    strapped over the glans* is a springboard, the only one on your side. The
    face means alive and the pad means safe — colour alone was never going
    to carry three meanings, which is also why the enemy can come in three
    skins without the reading changing.
-   **The collectible is the one thing out there that is not a schlong.** It is
    a sauced party wing — a fat orange lobe on a pale bone, the night's own
    name picked up off the floor by a chicken, and nobody asks where they came
    from. That it shares no outline with the furniture is the point and not a
    detail: the zone's three hazards are one silhouette read three ways, so
    "grab this" can only separate from "avoid that" by being a different shape
    entirely. Every wing in a zone is drawn identically — a collectible line
    reads as a line because the eye stops resolving it after the first one —
    and the drawing is sized off the sim's own `wingRadius`, so what the room
    reaches for is the hitbox rather than a guess at it.
-   The bird has no spine to bend, so its pose is how it is turned and how
    tightly it is tucked: on its feet it runs and leans with the ground, and
    the moment it leaves the ground it tucks and spins. The spin is the Sonic
    move and the rule at once — being a ball is what pops a badnik — and both
    the spin and the step's bob come off the distance travelled, so the tablet
    and the TV draw the same runner from the same frame with nothing
    synchronised. The bird turns about the hitbox's own centre; a group inside
    it stands the cast on that centre and tucks it in, because a spin and a
    stance are different transforms and neither should know about the other.
-   **Wings are the score and the health bar at the same time.** That is the
    whole design, so the tally is the one number both surfaces put in their
    chrome: the tablet's takeover `counter` and the TV's marquee, in `gold`. A hit flashes
    the bird for the sim's own mercy window and bursts a handful of wings out
    of it, tumbling as they go; the burst is decoration, and none of it can be
    caught back.
-   The zone is generated once per seed and scrolled with a transform, never
    rebuilt. Wings and popped badniks are hidden through refs as they are
    taken — a zone carries a couple of hundred of them and the loop runs at
    60fps — and nothing in the scene is React-driven per frame, which is what
    keeps a costume head's halo filter rasterised once.
-   The whole zone is the jump surface (no scroll, no zoom, no text selection):
    down jumps, and holding climbs higher. On the tablet it is now the whole of
    it — there is no chrome drawn inside the zone at all. The
    `JUMP / HOLD FOR HEIGHT` legend still sits bottom-LEFT, but as the takeover
    layout's own bottom-left slot rather than as a box the arena paints, and it
    takes no pointer there, so the pixels under it still jump.
-   The display runs a few ticks behind the tablet, so it holds a finished run
    a little longer than the tablet does and finishes the run it has before it
    switches: the room always sees the post or the hole, never a cut to the
    next start line.
-   **Host layout is a `<TakeoverCanvas>`** (`docs/takeover-layout-api.md` §5),
    the same one JOUST takes in §2.7 and FAPPY in §2.9: the zone is full bleed
    and is still the whole jump surface, filling the takeover's padding box edge
    to edge — 1229x749 of the tablet's 1280x800, 89.9% against the 59% the 330px
    control deck left it, and the 16:9 world inside it goes from 883x497 to
    1225x689. The deck is gone, and so is the mini-rail strip this surface used
    to draw: the shell's own rail arrives in the layout's `rail` slot and already
    says the round, the sauce and whose turn it is. Everything the deck held went
    to a slot the layout places, and SCHLONIC hand-types none of them:
    -   `counter`, read-only in the chrome row: the run count, who is running,
        and the wing tally last — still gold and mono, because it is the score
        and the health bar at once.
    -   `actions`, floating bottom-left: the skip and reset escape hatches, the
        JUMP legend out of the arena, then the hint that used to sit on a row
        under the zone costing it 28px of height.
    -   `readout`, floating bottom-right above the corner dock: the zone-clear
        card, the run list with each run's outcome, and the running totals with
        the par line under them.
    -   Who is running stays a chip rather than becoming a plate over the scene
        the way JOUST's lane name does, and for a sharper version of FAPPY's
        reason: the hen is pinned at 46 of the world's 160 units — 28.75%, 353px
        into a 1229px canvas — and a held jump is worth ~27 of the world's 90
        units while a springboard is worth ~81, so it crosses the top-left sky on
        any decent bounce.
-   Display: marquee (team, "Kempenfelt Bay Zone", and a meta cell holding run
    and wings), the zone, a status line; an outcome plaque over the beat and
    the points plaque once the team is through. **The meta cell is a row, not a
    reserve.** It used to carry 268.8px of `padding-right` against a clock this
    game never draws, which squeezed its readout onto three lines and made the
    marquee 145.1px tall; laid out rather than reserved it is 87.5px, and the
    57.6px went back to the zone on every turn. JOUST and FAPPY were paying the
    same on the same row.
-   The run is the game: §8's infinite-animation rule does not bite.
    `prefers-reduced-motion` on the display shows how the run ended, without
    the running.

## 2.12 TRIVIA Minigame Surface Language ("Question Card")

TRIVIA has no scene, no arena and no artwork: the whole surface is one question
set as large as a 1080p TV will carry, under the marquee the rest of the show
wears. Its language is what it refuses to draw.

-   **The question is the surface.** It is `clamp(2.8rem,6.5vw,8rem)`, black
    weight, balanced across at most 22ch, with a short `primary` rule under it
    and nothing else on the stage. At 1920 the 22ch cap is never the binding
    constraint — the line box is, so the question is width-bound rather than
    height-bound and re-centres into whatever height the marquee leaves instead
    of shrinking or truncating.
-   **It wears the shared neon marquee** (§2.2D; before 2026-09-23 the grand bulb
    marquee of §2.5, the one DRAWING built, as the rest of this bullet describes): the team
    on the left, "Trivia" as the show title in the centre, the turn's remaining
    questions on the right, and the dotted bulb ring inset inside the gold
    border. **Eight of the nine displays wear a marquee** — RECREATE is the
    ninth and hangs its own masthead instead (§2.10) — and this was the seventh
    to get one. It takes its four class strings (`marqueeTeamName`,
    `marqueeTitle`, `marqueeBulbs`, `marqueeMeta`) from `packages/surface`'s
    `styleTokens` rather than copying them, which is what stopped three earlier
    surfaces losing the ring. Only the container is still per-game, and §2.5
    records where its colour is going.
-   **The team is named once.** The surface used to caption the question with
    "On the clock: MOLTEN METAL" in small grey caps; the marquee's left cell is
    where the other displays say it, so the caption went with the marquee's
    arrival rather than living alongside it. A fact the room can read twice on
    one canvas is the duplication these migrations exist to remove.
-   **The budget is the clock.** TRIVIA is host-paced and dropped its unenforced
    timer (2026-09-20), so the TV has no clock to run down: the questions
    remaining in the marquee's right cell are the room's only sign of how much
    turn is left. At zero the cell changes words to "Turn complete" *and*
    changes colour to `primary`, because at TV distance a wording change alone
    is not an event. The last question stays on the wall under it — it is
    nobody's to answer, and clearing it would leave the room staring at nothing.
-   The TV's counter is not the tablet's. The host's counter is operational
    ("3 questions left" — what is still his to run); the TV's is the room's
    ("3 questions to go"). SCHLONIC splits the same counter the same way, and
    each surface's `copy.ts` owns its own words.
-   **Host layout is a `<TakeoverStage>` with no deck, and TRIVIA was the first
    of the nine to take it** — it is the game the anatomy was proved on, not a
    late adopter. Far from nothing changing on the tablet, this was the largest
    single gain of the project: the question card used to sit at its own
    content height in a centred column with 355px of dead air, the second-worst
    canvas share of the nine, and it now fills the body slot (`flex-[3]`
    question over `flex-[2]` answer) at roughly four-fifths of the tablet.
    -   `counter`, read-only in the rail row: the questions still to run. It
        disappears once the turn is spent, because the turn-complete panel
        already says so and "0 questions left" beside it says it twice.
    -   `clock`, forwarded and drawing nothing: TRIVIA is host-paced and
        `timerKey: null`, and an unfilled slot costs no width.
    -   The body: the question card, edge to edge.
    -   `actions`, the foot row: **CORRECT before INCORRECT**, and moving them
        out of the body is what fixed a live bug rather than a preference.
        INCORRECT was the last flow child of a body with no reserve, so with a
        question long enough to push the card down it landed under the corner
        dock's circle and the dock took the press. The layout gives this row the
        gutter as right padding, so the geometry cannot come back.
    -   Deleted with the migration: the team chip and the meta block the rail
        now says, and the `resolveActiveTeamName` copy every one of the nine
        carried.

## 2.13 SONG_GUESS Minigame Surface Language ("Lounge Set")

SONG_GUESS is the one game where the thing to attend to is not on the screen at
all — the TV is the speaker, and the room should be listening rather than
reading. Its surface is deliberately near-empty, and its job is to say who is up,
what they are listening to and where in the set they are, without ever drawing
the eye off the song.

-   **It wears the shared neon marquee** (§2.2D; before 2026-09-23 the grand bulb
    marquee of §2.5, as the rest of this bullet describes): the team on the left, "Who's
    That Song" as the show title in the centre, "Song 2 of 4" on the right, and
    the dotted bulb ring inset inside the gold border. Eighth and last of the
    eight TV surfaces that wear one; RECREATE is the ninth display and hangs a
    masthead instead (§2.10).
-   **It is the surface that never said whose turn it was.** Until the marquee
    landed, SONG_GUESS was the only one of the nine displays that never rendered
    `activeTeamName` — §2.3 asks both surfaces to carry the active team through
    `MINIGAME_PLAY`, and this one quietly did not. The marquee's left cell is the
    fix, and it stays up through the reveal and through the screen that closes
    the set, so the room always knows whose set just ended.
-   **The show's name was written and never shown.** "Who's That Song" existed
    in `copy.ts` and painted only on the intro screen. It is the marquee title
    now, and it is one string: the intro heading and the marquee read the same
    `showTitle`, because it is one name.
-   **The counter was already the marquee, unframed.** "SONG 1 OF 3" rendered in
    `text-gold`, extrabold, at `tracking-[0.34em]` — the marquee title's exact
    tracking, weight and colour, floating above the prompt with no frame around
    it. It is the marquee's counter cell now rather than a second thing in the
    marquee's clothes, which also means the reveal and the set's last screen
    carry it for the first time.
-   **Scores never go on this surface.** The display view carries the turn's
    pending points and the TV shows none of them: "Scores go up at the end of
    the round" is the copy, the deck (§2.2C) is where a number belongs, and a
    `+N` on the wall mid-set would turn a listening game into a scoreboard.
-   The body under the marquee stays a single centred line — "🎵 Listen
    closely…", then "Lock in your answers", then the answer — in the serif
    italic that is this game's own voice, with a five-bar `primary` equalizer
    that animates only while the clip is actually playing. The equalizer is a
    motif, not analysis: the TV shows that something is playing, it does not
    read the waveform.
-   `gold` is the framing accent (marquee border, the counter, the revealed
    title) — the same scoped exception to §0.1 that DRAWING's §2.5 and JOUST's
    §2.7 take.
-   **Host layout is a `<TakeoverStage>` with no deck.** It migrated with the
    arcade games rather than with the panels, and it is the surface that showed
    the two choices are separate axes: it refused the Canvas *and* dropped its
    deck in the same change.
    -   **Canvas refused on the shape of the slots, not on size.** A Canvas has
        exactly two floating slots and both sit on the bottom edge, each bounded
        at `calc(100%-4.5rem)`. This turn needs nine tap targets — play/pause,
        replay, skip, reveal, title ✓✗, artist ✓✗, next — plus a totals panel,
        and there is nowhere on one edge to put them. §2.0B is also explicit
        that no bottom-right slot for a *control* exists at all.
    -   **The deck went because keeping it could not have won.** The old column
        was 330px against a 887px body that held about 190px of content — most
        of the "console" was black. And a deck-keeping Stage arrives at a
        *worse* share than the surface started with, because the shell's rail
        is 33px where the game's own strip was 20px. Dropping it took the body
        from 887x717 to 1229x592, roughly 62% of the tablet to 71%.
    -   `counter`, read-only in the rail row: the song counter, then the points
        banked this turn. `clock` is forwarded and draws nothing — SONG_GUESS is
        `timerKey: null` — which is what retired this file's hand-typed
        `pr-[clamp(9rem,15vw,12rem)]` reserve for a chip that never came.
    -   The body: the answer card, with `RunningTotals` beside it as an
        `<aside>`. It is read-only, so it is body content rather than chrome —
        the body is everything the host reads, and this pane is all that
        survives of the deck.
    -   `actions`, the foot row: the transport, the reveal, the two scoring
        pairs and next. `SongScoringDeck` is `SongScoringPad` now, because it is
        no longer in a deck.
    -   **The clip plays from the TV, and that is why the tablet could be
        rebuilt around it.** The single `<audio>` node lives on the display
        surface with its `src` absolute on the server origin; the host's
        transport only dispatches actions. No arrangement of host slots can
        restart a song.

## 2.8 Cast (shared character system)

Every rostered player has a little hen that recurs across the show.
The drawing lives in `@wingnight/cast` — its own package, so the
minigames can draw the cast too and there is exactly one hen in the repo —
and the look resolves from the player *name* (`resolvePlayerAppearance`), so
Brad is the same character every night regardless of roster order. The
candidates that lost to it are kept in `apps/client/public/mockups/cast/`,
and `mockups/cast/rig.html` is the shipped drawing taken apart: its parts,
pivots and every pose as a filmstrip.

The package also owns the other recurring character, the schlong that JOUST
fires, FAPPY stands in a row and SCHLONIC furnishes a hill with:
`resolveSchlongPaths` draws one along any spine (physics bodies, or a bend a
surface made) and `resolveSchlongFace` puts the face on it, so the three games
are one creature and none has a copy that can drift.

The package exports the bird two ways: `<Character>` for a page, which wraps
it in its own `<svg>`, and `<CharacterFigure>` for a surface that has an SVG
already and wants to place the bird in it (JOUST's lane, §2.7). It also owns
the `teamA`–`teamH` class table, so a team's bird, its standings dot and its
row edge all come off one table and can never drift onto different hues.

Which of the eight a team gets is the theme's call, not the cast's:
`resolveTeamThemeById` (docs/team-identity.md) weighs the genre kit, an
authored `color` and the cross-team collision pass, and every surface — TV and
host tablet alike — reads the resulting map. The cast keeps a bare id hash for
the one case with no seating list in reach, painting a bird
(`resolveCharacterFillClassName`); it is deliberately not exported otherwise,
because a surface that reached for it painted the host tablet in colours the
TV disagreed with.

-   **One colour per bird.** The whole silhouette (tail, body, wing, neck,
    head, comb) is the player's team accent (`teamA`–`teamH`, via
    `resolveCharacterFillClassName`, so it matches that team's standings dot);
    unassigned players are `mutedWarm`. Faces are two white eyes, the JOUST
    convention (§2.7); beak (two mandibles), wattle and legs are `primary`,
    outlined in `bg` so they hold on an orange team. The face, the beak and
    the wattle belong to the drawn head alone; a costume head wears none of
    them. A 2-unit `bg` stroke
    separates the silhouette from the flame glow. The one shade the bird gets
    is that same ink at a fifth (`fill-bg/20`) in a crescent along the belly,
    so the body reads as round and no second hue is spent; the far leg is the
    near one at 70%, so two legs read as one behind the other.
-   **It is a rig, not a picture.** The hen is six parts drawn back to
    front — tail, far leg, body, near leg, wing, head with its neck — and
    each is wrapped on its own pivot (`CHARACTER_PIVOTS`: tail root, hips,
    shoulder, neck base) so a pose is a rotation per part and never a redraw.
    The figure takes a `pose` (`CHARACTER_POSES`): `still` (the default, and
    what a surface that drives the parts itself asks for), `idle` (breathing,
    the tail with it, a double peck every four seconds), `walk` (legs ±30°
    about the hips half a stride apart, a bob on every footfall, the head
    nodding against it, the tail swaying, the wing tucking), `fly` (both
    legs tucked back, no loop) and `dance` (the player's own move — bounce,
    headbang, flap or shuffle, seeded off the name like the body — as two
    states of its parts that a `data-beat` toggle on a `group/beat` ancestor
    transitions between, so it is on the room's beat and not on a clock).
    A dancing bird moves on TWO clocks: the beat, and a **jig** under it —
    quick feet at a tempo of its own, a hop, a tail or a wing going its own
    way (`danceJigs` next to the figure, `cast-jig-*` keyframes). Each part is
    wrapped twice for it, because one element carries one transform and the
    beat is already using the inner one. The beats are `cast-*` keyframes in the
    client's `index.css`; which part carries which beat in which pose is the
    `poses` table next to the figure. Every beat is `motion-safe`: a room that
    asked for less motion gets the bird standing still. The wing is drawn with
    three feather tips on its trailing edge and hangs from the shoulder at the
    front of the body, so a flap about `CHARACTER_PIVOTS.wing` lifts the tip.
-   Character fills are **content, not chrome**: like the DRAWING inks (§2.5)
    they are exempt from the §0.1 two-accent budget, and using team tokens as
    a character's identity colour is an identity use like the standings dot,
    not a timer/status/CTA use. No skin tones, no new colours.
-   Silhouette first: three bodies, three combs and two tails, and a neck so
    the head has somewhere to be; no detail below the illustration spec's 3%
    floor. Names are never lettered under a character on the TV.
-   **Costume head.** An `avatarSrc` on the player is worn as the bird's own
    head, and worn **bare**: the image replaces the drawn head circle and
    eyes, and nothing else of the chicken's head is drawn — no comb planted
    in the player's hair, no beak or wattle poking out from behind a cheek,
    and no prop across the face (see *Team apparel*). A generated head
    already has its own hat, glasses and beard, and a second set fighting
    them reads as two heads on one neck. Everything below the chin is still
    entirely a bird, which is where the joke lives. It is a
    **bobblehead** (44 tall on a 72-tall bird): at party distance the face is
    the identity, and a coin-sized one reads as "a face" rather than whose.
    A filter dilates the image's alpha into a `bg` halo, the stroke an image
    cannot take. The contract is that `avatarSrc` is a head with a real alpha
    silhouette — hair, beard, chin, nothing below — which is what
    `pnpm import:avatars` writes: it generates on a magenta key, flood-fills
    the key out from the border (so the dark line art inside the face
    survives) and crops to what is left. The head file itself lives in the
    night pack (`~/wing-night-content/local/assets/avatars/`), not in the
    client's `public/`, and `avatarSrc` names it pack-relative
    (`avatars/rob.png`). The server serves it at
    `/content-assets/<path>` and `resolveContentAssetSrc` addresses it against
    the server origin — the TV is a different origin, so a root-relative head
    URL 404s there. Until that origin resolves (one paint), the bird wears its
    drawn head rather than nothing. A photo or a boxed sprite in that
    field renders as a rectangle on a neck, on purpose. The one palette
    departure is flat skin and hair tints, which a face needs.
-   **Genre carriers.** A team's `genre` (`teams.json` in the night pack) is
    stated ONCE, and which way depends on the genre. Most are carried by the
    bird's own SHAPE (`resolveTeamSilhouette`): metal, punk and rock are
    `spiky` (jagged comb, pointed tail, cut feather edges, a dorsal ridge),
    country is `broody` (settled low, belly near the floor, legs all but
    gone) and disco is `preener` (tall and chesty, a high sickle tail). The
    three sit on one axis — spiky at one end, squat at the other — so a new
    genre is placed on it rather than drawn from scratch. Pop is the ORIGIN of
    that axis, not a point on it: "smooth, round, upright" describes the stock
    bird, so pop carries itself in motion instead (`TeamTheme.dance` — pop is
    the team whose birds bounce) and keeps the star shades for a player with
    no generated head. A team is never both shaped and dressed; the two are
    the same statement a few units apart and the prop wins an argument nobody
    wanted. A genre with neither keeps the stock bird, whose body, comb and
    tail come from the player's own name hash.

    Shape beats a prop because of arithmetic: one bird is 76px on a 1080p TV,
    a prop is a few pixels of that, and anything that crosses a player's
    photographed face is dropped outright — which used to leave the pop and
    country teams wearing nothing at all on a real night. A silhouette has
    neither problem. The shapes may change freely but `CHARACTER_BOX`,
    `CHARACTER_FOOT`, `CHARACTER_HEAD_CENTRE` and `CHARACTER_PIVOTS` may not:
    JOUST stands the bird on a physics pin and FAPPY beats its wing on its own
    layer. Two shapes carry a silhouette and neither is the obvious one — the
    TAIL does most of the work (the only organ with no head, leg, wing or
    photograph competing for its space), and the BELLY LINE is the leg dial,
    since the hip pivot and the foot are fixed but dropping the belly from
    y=56 to y=68 swings visible orange from 15 units to 3. `spiky` is the one
    place the house line style bends: its outline is mitered, because a 2-unit
    round join blunts a point by a unit and at 76px a unit is the whole point.

-   **Team apparel.** What is left of props after the silhouettes: `hat`,
    `shades` and `medallion`, drawn from the palette the bird already has
    (`text`, `bg`, the team colour) and placed off the head's anchors
    (`Character/geometry`). Only pop's shades are mapped to a genre today; the
    other two are drawings kept in the vocabulary, not assignments. `collar`
    was deleted on 2026-09-21 — a dark band slung under a chin with studs on
    it read as a necklace rather than as metal, and metal is shaped now.
    Three rules hold for any prop added later. A prop that sits ON the head —
    the hat and the shades — is dropped on a costume head, so a genre carried
    only by one of those reads by colour alone. A prop must fit INSIDE the
    body at the anchor it hangs from: `head.cx` is the HEAD's centre, not the
    chest's, and the silhouette's right edge at the shoulder line is only
    x≈59 against a prop reaching x≈69, which is why disco's old lapels hung
    off the bird's edge into the background. And no pointed light shape goes
    near the beak, whichever way the points face and whatever is behind them:
    that is a mouth full of teeth from across a room. The rule is a radius,
    not a colour — within ~16 units of the head centre, a point reads as a
    tooth.

-   **Lobby parade.** On SETUP the cast parades at the foot of the stage
    (`SetupStageBody/CastParade`), `z-1` behind the lobby content and above
    the flame, exactly as the embers do. Two teams at a time: one walks in
    from the left edge and one from the right (the cast's `walk`, each bird
    facing the way it goes), they dance facing each other for fourteen
    seconds, walk back out their own edges, and the next pair walks in. An
    odd last team dances alone; players seated nowhere yet parade as a group
    of their own in `mutedWarm`, so nobody is missing while the host seats
    the room. Nothing fades: a bird is on the floor or off the edge, and the
    walk on and off IS the group's transform transition (`resolveParadeFrame`
    is the pure timeline; its beats and the transition length are one number
    in two places). Once a pair is on the floor every bird also bounces off its
    feet on a layer of its own inside the mirror (`cast-jive`, the bird's own
    period and phase, pivot on the floor) over a pool of shade that stays on the
    floor while it does (§2.2C), so the huddle jostles instead of
    standing in a row; walking on and off, that layer is still. A team is a huddle — birds overlap a little — so six fit a
    half of the floor. A bird stands ~12vh tall (about 130px at 1080p): the
    head is the identity and the costume head is a bobblehead, so anything
    shorter turns faces back into coins. The intro and host lineups
    (`TeamLineup`) stand in `idle`; JOUST's rack stands `still`.
-   **No two birds are the same bird.** A floor where every hen lands the beat
    on the same millisecond with the same feet reads as a chorus line, not as a
    party, so each one carries a **groove**: its footwork tempo and phase, its
    bounce period and phase, and how late it lands the beat
    (`resolveCharacterGroove`, eight CSS custom properties). They are three
    short tables drawn independently off three bit ranges of the player's name
    hash — a hundred-odd grooves out of fourteen lines, and stable, so Brad
    dances Brad's dance night after night and reordering the roster reshuffles
    nothing. Custom properties inherit, so a surface hangs the groove on
    whatever it wraps a bird in and every part of the drawing reads it; the
    cast's own shorthands carry house fallbacks, so an ungrooved bird still
    walks and dances properly. The walk reads them too — a team arriving
    together does not drum its feet in unison.
-   **The dance is on the beat.** The display taps its one `<audio>` with a
    Web Audio analyser (`DisplayBoard/useBeatClock`): the low band's energy
    against its own last two-thirds of a second picks out the kicks
    (`createBeatClock`, pure and tested), and every kick flips `data-beat` on
    the display root (`group/beat`). A dancing bird's parts answer that
    through a CSS transition, so the room's own music is what moves them and
    the whole floor lands each step within a beat of each other — every bird on
    the same kick, none of them on the same millisecond. Before the room has
    tapped, or when the host pauses, a 120 BPM metronome keeps it alive; the real
    beat takes back over the moment it is heard. For the analyser to hear
    anything the server sends `Access-Control-Allow-Origin` on its media
    routes and the element is `crossOrigin="anonymous"` — without both, the
    graph is tainted and the ROOM goes silent, not just the birds. The tapped
    element is never released: it can be tapped once, and its sound only
    reaches the speaker through the graph. It is §8 ambient motion:
    `prefers-reduced-motion` parks the first pair on the floor and stops the
    clock.

------------------------------------------------------------------------

# 3) Layout System

## 3.1 Grid Strategy

Display: - 12-column grid - Generous padding (p-10 typical)

Host: - 4--6 column responsive grid - p-4 (mobile) / p-6 (tablet)

Maintain 8px spacing rhythm.

------------------------------------------------------------------------

## 3.2 No-Scroll Display Layout Pattern

Root: - min-h-\[100dvh\] - flex flex-col - overflow-hidden

Main: - flex-1 min-h-0 - Centered content - Stage-local context row (round + phase) when needed

Footer: - Standings snapshot, drawn as the deck (§2.2C) - fixed height for the
night, so the stage above never reflows

------------------------------------------------------------------------

# 4) Typography

Display: - Round headline: text-5xl to text-7xl - Timer: text-7xl or
larger - Use tabular or monospace numerals for timers - Keep supporting
copy concise and scan-friendly

Host: - Section titles: text-xl to text-2xl - Interactive rows: text-lg+

## 4.1 4K Display Baseline (TV-First)

-   For 4K display routes, treat these as practical minimums:
    -   Section titles: ~36px+
    -   Step labels / phase labels: ~22px+
    -   Card titles: ~24px+
    -   Supporting card metadata: ~18px+
-   Use `clamp(min, viewport-scaling, max)` for display typography and key media sizes.
-   The 4K baseline should drive sizing decisions; lower resolutions should scale down without clipping or overlap.

------------------------------------------------------------------------

# 5) Emotional Phase Guidelines

## MINIGAME_INTRO

-   Bold
-   Dramatic
-   High contrast
-   primary accent allowed
-   Opens the round as well as the turn, so the first briefing of a round
    carries the weight the round intro screen used to

## EATING

-   Timer in primary (orange)
-   Under 10 seconds: subtle heat pulse using heat token
-   Background remains dark

## MINIGAME_PLAY

-   Clear active team highlight
-   Minimal distractions
-   Focused layout

## FINAL_RESULTS

-   Winning team highlighted with gold
-   Optional subtle celebration effect
-   No rainbow or multi-color explosion

------------------------------------------------------------------------

# 6) Components (Preferred Patterns)

Buttons: - One dominant primary action per screen - Secondary actions
grouped

Cards: - surface or surfaceAlt background - Subtle borders only (no
heavy outlines)

Standings: - Sorted top-to-bottom - Leader indicated via accent border
or subtle glow - No excessive decoration

Timer Component: - Accepts `endsAt` - Renders remaining - Uses large
typography - Visual escalation only when necessary

------------------------------------------------------------------------

# 7) Accessibility & Ergonomics

-   High contrast ratios
-   Large click targets
-   Clear labels with icons when appropriate
-   Never rely on color alone for state

------------------------------------------------------------------------

# 8) Motion & Feedback

Use motion sparingly.

Allowed: - Subtle fade transitions between phases - Light pulse for low
timer - Small highlight animation when scores update - Subtle low-frequency
ambient motion on setup/idle display surfaces when it improves perceived
liveliness and avoids distraction
-   Display surfaces with ambient motion must provide a reduced-motion fallback (`prefers-reduced-motion`) that disables non-essential infinite animations.

Avoid: - Constant motion - Background animations - Long transitions

------------------------------------------------------------------------

# 9) Non-Goals (MVP)

-   No advanced theming system
-   No light mode
-   No elaborate onboarding UI
-   No player mobile UI
-   No complex animation system

------------------------------------------------------------------------

End goal: A dramatic, warm, game-show style interface that is readable
from across a room and controlled confidently from a tablet.
