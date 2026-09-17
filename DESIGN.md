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
teamD #F43F5E\
teamE #FACC15\
teamF #14B8A6\
teamG #60A5FA\
teamH #FB7185

Rules: - Never use more than 2 accent colors on a single screen. -
primary (orange) is the default emphasis color. - heat (red) is reserved
for urgency or escalation. - gold is reserved for winner moments or
celebration. - success/danger are functional only (never decorative).

Team accent rules: - `teamA` through `teamH` are identity accents for
team cards and standings rows only (left border + small dot). - Team
tokens must not be used for timers, status states, CTA buttons, or
winner celebrations.

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
-   **CTA + heat strip** — full-bleed bottom row of the viewport. Primary action button always visible per §2.1. A heat-color shimmer strip sits across the top of the bar to add energy without competing with the button.
-   **Override entry** — a `⋯ Overrides` button lives at the foot of the deck. It opens the floating override dock. Override actions are never inline in the deck flow — they're an escape hatch, not a primary path.
-   **Takeover** — during `MINIGAME_PLAY`, the deck collapses and the minigame package owns the full canvas. The CTA bar stays pinned. The shell steps out of the way; the minigame's own surface owns the "we're done" trigger.

## 2.1 Host UI (Tablet Optimized)

-   Touch targets ≥ 44x44 CSS px
-   Primary actions always visible
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

## 2.3 Team-Turn Context (Host + Display)

-   During `EATING`, `MINIGAME_INTRO`, and `MINIGAME_PLAY`, both host and display must show:
    -   Active team name
-   Team-turn context should remain visible without scrolling and without requiring interaction.
-   Team-turn context in these phases is active-team only (no turn-progress label).
-   Display context is informational only; it must not expose host-only answer data.

## 2.4 GEO Minigame Surface Language ("Field Journal")

The GEO minigame's host and display surfaces use a vintage-expedition
"Field Journal" look, distinct from the broadcast shell that frames them:

-   Serif typography throughout GEO surfaces (Tailwind `font-serif`);
    hints render as italic quoted field notes.
-   `gold` is permitted on GEO surfaces as the dossier framing accent
    (double-rule frames, header rules, postmark, points seal). This is a
    scoped exception to the §0.1 "winner moments only" rule; outside GEO
    surfaces the §0.1 rule stands.
-   `primary` is the rubber-stamp accent (distance "off course" stamp).
    Together with gold that is the 2-accent budget; no heat/team tokens
    inside GEO surfaces.
-   Photos and reveal maps sit in white-bordered, slightly rotated
    postcard/polaroid frames. Map tiles are sepia-filtered to match.
-   Reveal stats are stamps, not stat cards: rotated bordered distance
    stamp + circular gold points seal.

## 2.5 DRAWING Minigame Surface Language ("Showtime Easel")

The DRAWING surfaces follow the "Showtime Easel" prototype direction
(`apps/client/public/mockups/drawing-host/05-easel-deck.html` and
`drawing-display/06-easel-grand.html`): a wood-framed chalkboard easel
under game-show marquee chrome.

-   Materials: easel wood gradient (`#5A3318` → `#2C1808`, edge
    `#6A3D1A`), chalkboard board (`#0E2624` family with a faint 30px
    grid), marquee/prompt-card panels (`#3A1D09` → `#1A0C04` behind a
    `gold` border). These are scoped material colors for DRAWING
    surfaces only.
-   `gold` is the marquee/framing accent (prompt card, bulb-dotted
    marquee, pending-points chips, palette frame) — a scoped exception
    to the §0.1 "winner moments only" rule, like GEO's §2.4 exception.
-   Verdict controls are green/red gradient buttons with check/cross
    icons (host) and matching reveal plaques (display) — functional
    success/danger usage per §0.1.
-   Host layout reuses the §2.0A shell language: mini-rail strip on top,
    full-height easel canvas left, control deck column right (prompt
    card → Correct/Nope verdicts → undo/clear/skip row → palette grid).
    No control overlaps the drawing canvas.
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
    window expires.

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
    the §0.1 "winner moments only" rule, like GEO's §2.4 and DRAWING's
    §2.5 exceptions. Outside these surfaces the §0.1 rule stands.
-   The subject card reuses DRAWING's prompt-card treatment — serif
    italic on a `#3A1D09` → `#1A0C04` panel inside a gold border — so the
    two minigames read as the same show.

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
    the post-result reveal. During the reveal the board dims to 0.12
    behind a centred check/cross, the resolved subject in serif italic,
    and a gold award pill, until the reveal window expires.

## 2.7 JOUST Minigame Surface Language ("Dusk Desert")

The JOUST (Slingshlong) surfaces put a side-on desert arena under the same
marquee chrome the drawing easel uses:

-   Scene materials are drawing content, not UI chrome, and are exempt
    from the 2-accent budget like the drawing inks: dusk sky
    (`#160c2a` → `#4a1f3f` → `#c2582c`), sand (`#d6ac63` / `#b58a45`),
    cactus greens (`#3f9d55` family), slingshot wood (`#6b4423`). The
    shooter is `primary` orange; the champ is a cyan (`#22c9e6`) chosen to
    read as the opponent from across a room. Faces are two white eyes.
-   `gold` is the marquee/framing accent (marquee border, pending points,
    the impact burst, the result plaque) — a scoped exception to the §0.1
    "winner moments only" rule, like GEO's §2.4 and DRAWING's §2.5.
-   Host layout reuses the §2.0A shell language: mini-rail strip on top,
    full-height arena left (the touch surface), control deck column right
    (shot card → result → Next shot → skip/reset → shot chips → totals).
-   Display layout: marquee (team, "Desert Duel", shot count + pending),
    the arena, a status line beneath. The result plaque drops over the top
    of the arena only once the replay has landed.
-   The arena is an SVG with a fixed 160×90 viewBox and `xMidYMid meet`,
    so the letterboxed scene maps identically on tablet and TV and the
    tablet's pointer math is the inverse of the same fit.
-   The replay is the game, not ambient decoration: §8's infinite-animation
    rule does not bite. `prefers-reduced-motion` skips the flight and shows
    the landing frame.

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

Footer: - Standings snapshot

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

## ROUND_INTRO

-   Bold
-   Dramatic
-   High contrast
-   primary accent allowed

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
