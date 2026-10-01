import { takeoverLabelAccent } from "@wingnight/surface";

// The arena: the street full-bleed in the takeover's body slot, and the two thumb zones over it.
// No scroll, no zoom, no text selection under a frantic thumb. The corner dock's gutter and the
// bottom-left chrome are the layout's (docs/takeover-layout-api.md §6).
export const container =
  "relative h-full w-full touch-none select-none overflow-hidden rounded-xl border-2 border-surfaceAlt bg-bg shadow-[inset_0_0_30px_theme(colors.shade/50%)]";

export const containerLocked = "opacity-80";

// Each block's street slides in from the right as the last one wipes; the remount keys it, and
// the keyframes live in the client's index.css (SCHLONIC's `scene-enter`).
export const blockEnter = "h-full w-full motion-safe:animate-[scene-enter_420ms_ease-out_both]";

// The left thumb: a pad the left 35% of the arena, held to walk, the side of its centre being
// the way. A faint wash marks it off from the peck zone without drawing a box over the street.
export const walkPad =
  "absolute bottom-0 left-0 top-0 z-10 flex w-[35%] touch-none select-none items-center justify-between bg-gradient-to-r from-shade/25 to-transparent px-[6%]";

// The right thumb: the rest of the arena, any tap a peck. It stops short of the bottom edge so the
// corner dock's circle is never under it — a mashed peck must not land on the dock.
export const peckZone =
  "absolute bottom-[5.5rem] left-[35%] right-0 top-0 z-10 flex touch-none select-none items-center justify-center";

// The ghosted thumb glyphs: big and faint, there to teach the two zones on the first block and
// gone once the thumbs have found them.
const ghost = "pointer-events-none text-text/25 transition-opacity duration-500";

export const walkGlyph = `${ghost} font-score text-[clamp(2.5rem,6vw,4.5rem)] leading-none`;

export const peckRing = `${ghost} flex h-[clamp(6rem,14vw,9rem)] w-[clamp(6rem,14vw,9rem)] items-center justify-center rounded-full border-4 border-text/20 font-score text-[clamp(1rem,2.4vw,1.6rem)] font-extrabold tracking-[0.2em]`;

export const faded = "opacity-0";

// The handoff callout drops over the street for the beat: a dim pool in the middle of the scene
// and the next player's name, nothing else.
export const handoffOverlay =
  "pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 bg-[radial-gradient(ellipse_at_center,theme(colors.bg/75%)_0%,transparent_68%)] motion-safe:animate-[scene-callout_520ms_cubic-bezier(0.2,1.4,0.4,1)_both]";

export const handoffLead = takeoverLabelAccent;

export const handoffName =
  "font-voice text-[clamp(2rem,5vw,3.4rem)] font-bold italic leading-none text-text [text-shadow:0_0_24px_theme(colors.primary/45%)]";
