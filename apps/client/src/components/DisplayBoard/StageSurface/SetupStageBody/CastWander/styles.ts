export const container =
  "pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[clamp(4rem,9vh,11rem)] overflow-visible";

export const unassignedFill = "text-mutedWarm";

// Character height, not width, is the legibility knob: 7vh is ~150px on a 4K
// TV and ~75px at 1080p, both well above the illustration spec's 3% floor.
// Every lane shares ONE cycle length so the stagger below never drifts into
// a clump: `strut` shows a bird for ~24% of its cycle, and sixteen lanes
// spaced 4s apart over a 64s cycle keep three or four on screen at a time
// with the whole cast turning over about once a minute.
const walkerBase =
  "absolute bottom-[6%] h-[clamp(3.25rem,7vh,9rem)] will-change-transform motion-safe:[animation:strut_64s_linear_var(--walk-delay,0s)_infinite]";

export const waddle =
  "block h-full motion-safe:[animation:waddle_0.8s_ease-in-out_infinite]";

// One entry per lane, Embers-style: origin, span and phase are authored
// constants, so a lane is a static utility class and no position is ever
// computed at render. The delay rides inside the `animation` shorthand on
// purpose: a separate `animation-delay` utility loses to the shorthand's
// reset and every lane would compute to 0s. Delays are negative so the first birds are already out
// on first paint. A roster longer than the lane list wraps onto it from the top.
export const lanes: readonly string[] = [
  `${walkerBase} left-[3%] [--walk-span:18vw] [--walk-delay:0s]`,
  `${walkerBase} left-[62%] [--walk-span:14vw] [--walk-delay:-4s]`,
  `${walkerBase} left-[30%] [--walk-span:20vw] [--walk-delay:-8s]`,
  `${walkerBase} left-[82%] [--walk-span:10vw] [--walk-delay:-12s]`,
  `${walkerBase} left-[14%] [--walk-span:16vw] [--walk-delay:-16s]`,
  `${walkerBase} left-[48%] [--walk-span:22vw] [--walk-delay:-20s]`,
  `${walkerBase} left-[70%] [--walk-span:12vw] [--walk-delay:-24s]`,
  `${walkerBase} left-[22%] [--walk-span:14vw] [--walk-delay:-28s]`,
  `${walkerBase} left-[56%] [--walk-span:18vw] [--walk-delay:-32s]`,
  `${walkerBase} left-[8%] [--walk-span:24vw] [--walk-delay:-36s]`,
  `${walkerBase} left-[40%] [--walk-span:12vw] [--walk-delay:-40s]`,
  `${walkerBase} left-[76%] [--walk-span:14vw] [--walk-delay:-44s]`,
  `${walkerBase} left-[34%] [--walk-span:26vw] [--walk-delay:-48s]`,
  `${walkerBase} left-[66%] [--walk-span:16vw] [--walk-delay:-52s]`,
  `${walkerBase} left-[18%] [--walk-span:10vw] [--walk-delay:-56s]`,
  `${walkerBase} left-[52%] [--walk-span:20vw] [--walk-delay:-60s]`
];
