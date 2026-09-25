// The deck (DESIGN.md §2.2C). The band's own background is what shows through
// the 1px grid gaps, so it IS the panel joints: a bright warm seam at the lip
// falling to black at the foot, against the dark inset edge each bay draws on
// itself. Light line between two dark ones reads as a routed groove, which is
// how a real stage deck is made — and it is why there is no `border-t` here
// any more, the chrome's lip is the top edge.
export const footer =
  "relative z-10 isolate shrink-0 grid gap-px bg-[linear-gradient(180deg,theme(colors.glow/32%)_0%,theme(colors.glow/8%)_34%,theme(colors.shade/55%)_100%)]";

// One equal column per team, and the team count is only known at runtime, so the track
// listing can't be a static utility class. It is applied through a ref so the declaration
// stays here with the rest of the styling rather than becoming an inline style prop.
//
// Both render branches carry this ref and a zero count clears the listing, because React
// reuses the same <footer> node across the empty/populated swap and does not diff a style
// written imperatively — leaving it set would strand the empty state in a stale track.
export const applyFooterColumns =
  (columnCount: number) =>
  (element: HTMLElement | null): void => {
    if (element === null) {
      return;
    }

    element.style.gridTemplateColumns =
      columnCount > 0 ? `repeat(${columnCount}, minmax(0, 1fr))` : "";
  };

// An empty deck is still a deck: the chrome draws around this, so the slab is
// there for the cast to walk on before a single team exists.
export const emptyLabel =
  "relative z-[1] bg-bg px-[clamp(1rem,2.2vw,3rem)] py-[clamp(1.4rem,2.6vh,2.6rem)] text-center text-[clamp(0.95rem,1vw,1.55rem)] text-muted";
