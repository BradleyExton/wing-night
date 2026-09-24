# ADR-0006: One TV Marquee, the Neon Heat Line

Status: Accepted
Date: 2026-09-23

## Context

Every minigame on the TV opened with the same strip — the show's name, the team whose turn it
is, the turn's readout, the room's clock — and every one of the eight that wore it carried its own
copy of the container: a gold-bordered box with a dotted bulb ring and a brown gradient, differing
only in a padding value and, on DRAWING, the background. ADR-0005's consolidation hoisted the
three text styles and the meta row into `packages/surface` and explicitly refused a `<Marquee>`
component, because a shared container would have had to take each game's padding and background
as a class string — a configuration prop by another name. The drift landed exactly where the
refusal left it: in the container.

The owner's verdict on 2026-09-23 was blunter than drift: the marquee "isn't on brand". It read as
generic game-show chrome rather than as this show. A prototype round of six wildly different
directions was built as static mockups (`apps/client/public/mockups/minigame-marquee/`), the
owner liked two, and two hybrids of those two were added. The pick was direction 07.

## Decision

1. **The TV marquee is one component, `<NeonMarquee>` in `packages/surface`, and all nine
   display surfaces render it** — including RECREATE, which hung its own masthead. It takes
   content (`title`, `teamName`, `pending`, `readout`, `clock`, `clockLine`) and never a class
   string. That is what makes ADR-0005's refusal and this decision agree: the container it refused
   was one a game would configure; this one is not configurable, which is the whole reason it can
   be shared.
2. **The look is "Neon Heat Line"** (DESIGN.md §2.2D): no box, a Monoton neon kicker for the show,
   the team's name large in Anton white light, and the clock as a full-width line under the row
   that burns down from gold through orange to red with a white-hot tip, the digits in a neon pill
   as the footnote.
3. **The clock reaches a surface as two slots**, `clock` (the pill) and `clockLine` (the lit
   length), both from the shell, both `null` together. The line is `MinigameTimerLine`, a sibling
   presenter to `MinigameTimerChip`, taking the room timer's `durationMs` as its total. The
   marquee owns the dark glass track; the shell owns what lights it. A host-paced game gets the
   track alone.
4. **Two faces by role, not genre**: `font-marquee-title` (Monoton) and `font-marquee-name`
   (Anton) are new Tailwind tokens, so a chrome decision never reads as `font-genre-disco` in a
   marquee. The TV preloads both with the roster's faces.
5. **Copy loses its stars.** "★ Live Sketch ★" and "★ Emoji Charades ★" were the bulb marquee's
   ornament and become "Live Sketch" and "Emoji Charades".

## What was refused

- **01 Broadcast Bug** (a skewed sports score bug), **05 Jumbotron** (an LED dot-matrix board):
  loud, legible, and not this show.
- **02 Team Banner** (the team's colour floods the bar, its genre face sets the name): refused
  because it makes the chrome look like identity, and because it needs the team's colour and face
  on the display props, which only the rail and the lobby get today.
- **04 Sauce Label** (a cream-paper bottle label): the only direction that said "wings" rather
  than "game show", refused because its paper and kraft browns are new material colours §0.1 does
  not have, and a marquee is chrome, where the scoped-material exception was never meant to reach.
- **03 Neon Sign** and **06 Heat Line** on their own, and **08 Neon Sign, Burning**: the owner
  liked 03 and 06 both; 07 is the hybrid that keeps the whole of each (the sign's light, the
  line's clock, the big name) and was preferred over 08, which kept the centred tube title as the
  hero and shrank the name.
- **A single letter that flickers** (in the mockup): refused in the build. It splits the title
  string across elements, which every unit test and e2e text locator on a show title would then
  have to know about. The whole sign flickers instead, which a tired transformer also does.

## Consequences

- Eight `styles.ts` files lose their marquee container and four surface tokens
  (`marqueeTeamName`, `marqueeTitle`, `marqueeBulbs`, `marqueeMeta`) are gone. The eighteen
  brown-gradient literals DESIGN.md §2.5 recorded as debt are gone with them, and the hex rule can
  now be turned on for the minigame client trees without hitting a marquee.
- `MinigameDisplayRendererProps` gains a required `clockLine`. A tenth minigame passes both slots
  through to `<NeonMarquee>` and has no marquee decisions to make.
- The five display unit tests that pinned the bulb ring now pin `data-neon-marquee` — that the
  surface hangs the shared sign and not a private one, which was always what the ring test was for.
