import { takeoverLabel } from "@wingnight/surface";

// The right-hand column of the takeover body on the writing beat, filling it
// rather than sitting at its content height.
export const container = "flex h-full min-h-0 flex-col gap-2";

export const label = `m-0 ${takeoverLabel}`;

// The textarea takes whatever the body has left instead of a hand-typed
// `min-h-[clamp(7rem,18vh,10rem)]`, which on the tablet stopped at 144px and
// left the column short — it is the biggest touch target on the surface and it
// is where the team is looking while they type.
export const textarea =
  "min-h-0 w-full flex-1 resize-none rounded-md border border-text/10 bg-text/[0.04] px-4 py-3 text-lg leading-snug text-text placeholder:text-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

// No footer row: the button that shared it is the foot row's now, so the count
// just tucks under its own corner of the textarea.
export const counter = "m-0 self-end text-xs tabular-nums text-muted";
