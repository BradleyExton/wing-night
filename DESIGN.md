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
