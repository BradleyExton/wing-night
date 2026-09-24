// The pace strip under the TV's marquee. Every pixel of height here is
// 16/9 pixels of width off the letterboxed corridor below it, so the whole
// row is one bird-head tall and the bar is drawn THROUGH it rather than
// stacked under it: ~30px at 1080p, against the 60px the line-up already
// costs.
export const container = "relative mx-auto h-[clamp(1.5rem,2.1vh,1.9rem)] w-[min(72%,60rem)] shrink-0";

// The full window, 0 to the limit. Centred on the row so the heads ride it.
export const rail =
  "absolute inset-x-0 top-1/2 h-[0.3rem] -translate-y-1/2 rounded-full bg-text/10";

// Every position below is a custom property the component writes on the strip's
// root through a ref — the house rule bans JSX `style` props, and the scene next
// door already moves its bird the same way. One write per frame on one element,
// and the geometry stays here rather than being typed into the markup.
export const railRun =
  "absolute inset-y-0 left-0 w-[var(--fappy-pace-run,0%)] rounded-full bg-gold/45";

// Time spent PAST par, running on toward the limit. Heat, because past par
// every tenth is costing the team a point it already had.
export const railOverrun =
  "absolute inset-y-0 left-[var(--fappy-pace-par,50%)] w-[var(--fappy-pace-overrun,0%)] rounded-full bg-heat/70";

// Par: the finish line of the ghost's race, and the point the score stops
// paying full. Unlabelled on purpose — the marquee directly above already
// prints `par 0:50` under the points, and a second gold caption on a 30px row
// landed straight on top of the parked ghost.
export const parTick =
  "absolute left-[var(--fappy-pace-par,50%)] top-1/2 h-[0.85rem] w-[0.14rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold";

export const limitLabel =
  "absolute right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%+0.35rem)] text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-mutedWarmDim";

// The team's own bird, placed by how much of the COURSE it has cleared: it
// reaches the par tick exactly when it finishes.
export const birdMark =
  "absolute left-[var(--fappy-pace-bird,0%)] top-1/2 h-full w-[auto] aspect-square -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-[0.12rem] border-current bg-bg shadow-[0_0_0.5rem_currentColor] transition-[left] duration-300 ease-out";

// The par-pace hen, placed by the clock. Faint, because it is not in the
// race — it is the race's shadow. Parked on the par tick once par is gone.
export const ghostMark =
  "pointer-events-none absolute left-[var(--fappy-pace-ghost,0%)] top-1/2 h-[115%] w-[auto] aspect-square -translate-x-1/2 -translate-y-1/2 opacity-50";

export const ghostMarkParked = "opacity-30";

export const label = "sr-only";
