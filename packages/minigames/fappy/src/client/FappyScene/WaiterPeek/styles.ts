// The waiter stands ~365 world units down a 160-unit viewport, so for most of
// a leg the bird the flyer is aiming at is not on the screen at all. This is
// that bird, pinned to the right edge with its nose over the bezel, until the
// real one scrolls into view and takes over.
//
// Everything is sized in `cqw` — the scene is the container query context — so
// the bubble is the same fraction of the corridor on the tablet and on the TV,
// exactly like the birds it stands in for.
//
// The opacity is written by the scene's paint loop, not by React: the corridor
// re-renders only when the course changes, and a peek that needed a render per
// frame would be a second loop on the tablet's budget.
export const bubble =
  "pointer-events-none absolute right-[1.2cqw] top-[16cqh] z-10 flex max-w-[26cqw] items-center gap-[1cqw] rounded-l-full rounded-r-lg border border-current bg-bg/80 py-[0.8cqh] pl-[0.8cqw] pr-[1.6cqw] opacity-0 backdrop-blur transition-opacity duration-300 will-change-[opacity]";

export const head = "h-[7cqw] w-[7cqw] shrink-0 overflow-hidden rounded-full border-2 border-current";

export const text = "flex min-w-0 flex-col leading-tight";

export const name =
  "truncate text-[2.4cqw] font-extrabold uppercase tracking-[0.08em] text-text";

export const line = "truncate text-[1.9cqw] italic text-mutedWarm";
