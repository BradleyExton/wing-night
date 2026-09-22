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

The Host shell is a single-canvas tablet controller. Every phase composes the same six pieces. Future Host surfaces should reuse this language instead of inventing parallel shapes — the utility classes live in `apps/client/src/components/HostControlPanel/styleTokens/index.ts`.

-   **Mini-rail** — the top strip of every stage hero. Tiny inline rail showing round number, sauce, minigame, and the active-team color pill. Replaces the older kicker + title + description chrome; rail is data, not navigation.
-   **Stage hero** — left ~65% of the canvas. Dramatic eyebrow + headline + meta, or a live datum like a timer or score. Subtle radial-gradient glow backdrop. Phases pick their own glow variant (default vs eating).
-   **Control deck** — right ~35% of the canvas. Vertical stack of deck-groups: small uppercase group head + tappable rows + inline create form. No card chrome — rows are separated by 1px dividers, not borders.
-   **CTA + heat strip** — full-bleed bottom row of the viewport. Primary action button always visible per §2.1, on every phase the host drives. A heat-color shimmer strip sits across the top of the bar to add energy without competing with the button.
-   **Override entry** — a `⋯ Overrides` button lives at the foot of the deck. It opens the floating override dock. Override actions are never inline in the deck flow — they're an escape hatch, not a primary path.
-   **Takeover** — during `MINIGAME_PLAY`, the deck collapses and the minigame package owns the full canvas. The shell steps out of the way; the minigame's own surface owns the "we're done" trigger.
-   **Corner dock** — the takeover is the one phase where the tablet leaves the host's hands, so the CTA bar and the overrides entry both collapse into a single quiet circle in the bottom-right corner. Tapping it reveals the phase's primary action and `Overrides` as labelled pills over a scrim; tapping the scrim, the circle or `Escape` puts them away. Two taps, not one — a player's thumb resting on the canvas can't end their own turn. While collapsed the circle carries the same `heat` dot the overrides entry does, so a turn that needs review still reaches the host. The dock layers above anything the minigame draws, so a minigame surface must keep a ~4.5rem gutter clear at that corner rather than putting a control underneath it.

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
    inset of its own (the other phases keep theirs on `StageSurface`'s canvas). Anything that
    reads as a border around the hearth is a bug.
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
    points, `GEO`, photo counter), and under it the dark chart as the
    arena for the *whole* turn, not just the reveal. The photo rides in a
    corner card bottom-left; the live status pill, then the reveal tiles
    and pin legend, ride bottom-right. The room watches the pin land
    while the table argues, and the reveal is the answer pin appearing
    and the map closing on the pair.
-   **This costs a projection.** `GeoMinigameDisplayView.currentGuess`
    carries the team's in-progress pin to the TV. It is the room's own
    input, already on the tablet in front of them — not a disclosure. The
    answer coordinates stay host-only until the guess is locked in, which
    is what the answer-safety tests pin.
-   **Host — "Map First".** The chart is the tablet. Rail chips (team,
    photo counter) float top-left, the photo card under them, the turn's
    one `primary` CTA bottom-left with the tap instruction beside it, and
    the verdict tiles bottom-right *above* the corner dock's gutter. The
    map keeps the whole canvas instead of a third of it, which is the
    thing a team's thumb is actually working in.
-   **Quick views stay**, restyled as house glass on the right edge with
    the zoom buttons — `World` and `Barrie`, because the night's photos
    are either around the home town or nowhere near it, and panning
    between the two by hand was the slowest part of a turn. They live in
    `leafletConstants`. The right edge, because the tablet's top-right
    belongs to the shell's timer chip and its bottom-right to the dock.
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
    the marquee, the prompt card and both easel frames. The mockups'
    wood gradient and brown marquee were scoped hex material colors;
    they read as a different app beside every other surface and were
    dropped on 2026-09-21. What carries "easel" is the *silhouette* —
    the framed board and, on the TV, the splayed legs — not the timber.
-   The chalkboard board (`#0E2624` family with a faint 30px grid) is
    the one scoped material that stays: it is the drawing content
    surface, shared pixel-for-pixel by tablet and TV, and chalk needs
    slate to read against.
-   `gold` is the marquee/framing accent (prompt card, bulb-dotted
    marquee, pending-points chips, easel edge) — a scoped exception
    to the §0.1 "winner moments only" rule. Every minigame marquee holds
    the same exception; GEO's §2.4 once held a wider one and no longer
    does.
-   Verdict controls are `success`/`danger` tinted buttons with
    check/cross icons (host) and matching opaque reveal plaques
    (display) — functional success/danger usage per §0.1, at the same
    weight EMOJI_CHARADES uses in §2.6. The plaques are opaque: the
    held sketch stays on the board behind them.
-   Host layout is canvas-first. The board is the surface; everything
    else is a strip around it. One mini-rail row on top (§2.0A) with
    the identity left, the prompt card centered and pending points
    right; the ink palette as a vertical rail down the left of the
    board; one toolbar row at the foot (undo/clear/skip, then
    Nope/Correct). No control overlaps the drawing canvas, and none of
    them takes a column of its own — the deck column this surface used
    to carry cost the board ~40% of the tablet for controls the artist
    presses a handful of times a turn.
-   The board letterboxes to 16:10 against the *height* the strips
    leave, so leftover width is free: the ink rail costs the board
    nothing, but a second toolbar row or a wrapped mini-rail costs it
    real area. Keep both to one line.
-   Display layout: grand bulb marquee (team, "Live Sketch" title,
    pending points), easel with splayed legs, status line beneath.
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
under the same bulb marquee DRAWING uses.

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

**Host layout** reuses the §2.0A shell language: mini-rail on top, then a
left picker column (clue canvas → persistent search field → category
tabs → emoji grid) beside the standard control deck column (subject card
→ Got It → Skip → back/clear).

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

**Display layout**: bulb marquee (active team + pending points, show
title, turn timer), the clue board, then the standings footer per §3.2.

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

## 2.7 JOUST Minigame Surface Language ("Dusk Desert")

The JOUST (Slingshlong) surfaces put a side-on desert lane under the same
marquee chrome the drawing easel uses:

-   Scene materials are drawing content, not UI chrome, and are exempt
    from the 2-accent budget like the drawing inks: dusk sky
    (`#160c2a` → `#4a1f3f` → `#c2582c`), a fixed star field (`#fde7c5`, one
    seeded constellation so the tablet and the TV agree and nothing
    twinkles), a sun with a soft glow, two mesa ranges on the horizon
    (`#3a1738` / `#63293a`) kept below the dunes' crests so nothing in the
    sky competes with a bird on a shelf, sand (`#d6ac63` / `#b58a45`) with
    broken wind lines below the floor, cactus greens (`#3f9d55` family),
    slingshot wood (`#6b4423`). The shooter is `primary` orange.
-   **The backdrop bleeds; the world does not.** The lane is a 160×90 world
    letterboxed into whatever frame it gets, and the sky, ranges and sand are
    painted 400 units past it on every side (`BACKDROP_BLEED`) outside the
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
    team's shot, and nothing else in the desert is orange. The replay draws
    between the track's 24 Hz keyframes (`useShotReplay` is fractional), so
    the flight moves on every screen frame rather than every third one.
-   **The lane is the room.** Every player who is not shooting stands in it
    as the very same cast bird the setup lobby wanders (§2.8) — their own
    generated head and all — and the shooting team stands behind the
    slingshot. Birds wear their own team's colour here, not a scene hex, so
    the lane reads as the other teams at a glance and the turn marker needs
    no caption. A bird felled on an earlier shot lies on its own spot at
    half opacity, still in its colours: the damage is countable at TV
    distance without reading a number.
-   **The lane is built, not lined up.** Players stand on scaffolding —
    slabs on legs in the slingshot's own wood (`post` / `postDark`) — at
    different heights, so a flat shot ploughs the sand and only an arc
    reaches a shelf. The timber is drawn from the same boxes the integrator
    collides against: what looks like a leg IS a leg, and a shot that clips
    one stops there.
-   **Whoever is shooting steps up.** The turn goes round the shooting team
    one player at a time, and their bird walks from the bench to the post
    while the rest wait. Both surfaces name them, so the room knows it is
    their go without being told twice.
-   `<CharacterFigure>` is the cast drawing as a bare `<g>`, which is what
    lets the lane place it under its own transform. JOUST scales it by
    `CHARACTER_STAND_HEIGHT` so the bird and the physics pin are one
    creature, and stands it up from the pin's two body centres — the lean
    is the rotation, so nothing in the scene needs an angle.
-   `gold` is the marquee/framing accent (marquee border, pending points,
    the impact burst, the result plaque) — a scoped exception to the §0.1
    "winner moments only" rule, like DRAWING's §2.5.
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
-   Display layout: marquee (team, "Desert Lanes", shot count, how many are
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
    lit side, a rim at the neck, a face on the head whose pupils turn to
    watch the bird once it is close. Over some gates a bald eagle
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
-   Host: header rail (studio title, "Target n of m"), team line, then a
    two-column stage — writing: target | composer (tall textarea, character
    count, one primary button); judging: both pictures small | the bench
    (their prompt in a quote block, ingredient toggles at ≥56px, running
    tally, lock, and "let them rewrite" as the redo hatch). Scored: points
    seal, the real prompt, next target or turn-complete note.
-   Display: masthead, two frames (target | original while writing, target |
    forgery after), the appraisal under a hairline: title, their prompt in
    italics, ingredient chips that fill `success` as the host ticks, the
    points seal and the real prompt on lock.

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
    does not pay for scenery it never reaches.
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
    *pink with a FACE* is alive, an enemy, and pops when landed on; *crimson,
    stubby, several of them and no face* is a thorn bed that hurts however you
    arrive; *pink with a red-and-white PAD strapped over the glans* is a
    springboard, the only one on your side. The face means alive and the pad
    means safe — colour alone was never going to carry three meanings.
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
    chrome: the tablet's rail and the TV's marquee, in `gold`. A hit flashes
    the bird for the sim's own mercy window and bursts a handful of wings out
    of it, tumbling as they go; the burst is decoration, and none of it can be
    caught back.
-   The zone is generated once per seed and scrolled with a transform, never
    rebuilt. Wings and popped badniks are hidden through refs as they are
    taken — a zone carries a couple of hundred of them and the loop runs at
    60fps — and nothing in the scene is React-driven per frame, which is what
    keeps a costume head's halo filter rasterised once.
-   The whole zone is the jump surface (no scroll, no zoom, no text selection):
    down jumps, and holding climbs higher. The only chrome inside it is a
    `JUMP / HOLD FOR HEIGHT` legend, bottom-LEFT, because the bottom-right
    belongs to the host's corner dock (§2.0A).
-   The display runs a few ticks behind the tablet, so it holds a finished run
    a little longer than the tablet does and finishes the run it has before it
    switches: the room always sees the post or the hole, never a cut to the
    next start line.
-   Host: rail with the wing tally, the zone as the whole jump surface, a deck
    of run card (player, banked) → zone-clear card → skip/reset → run list with
    each run's outcome → totals. Display: marquee (team, "Kempenfelt Bay Zone",
    run, wings), the zone, a status line; an outcome plaque over the beat and
    the points plaque once the team is through.
-   The run is the game: §8's infinite-animation rule does not bite.
    `prefers-reduced-motion` on the display shows how the run ended, without
    the running.

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
