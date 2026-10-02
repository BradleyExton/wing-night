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

// The two thumb zones are their own components (`WalkPad/`, `PeckZone/`), each half the arena.

// The handoff callout drops over the street for the beat: a dim pool in the middle of the scene
// and the next player's name, nothing else.
export const handoffOverlay =
  "pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 bg-[radial-gradient(ellipse_at_center,theme(colors.bg/75%)_0%,transparent_68%)] motion-safe:animate-[scene-callout_520ms_cubic-bezier(0.2,1.4,0.4,1)_both]";

export const handoffLead = takeoverLabelAccent;

export const handoffName =
  "font-voice text-[clamp(2rem,5vw,3.4rem)] font-bold italic leading-none text-text [text-shadow:0_0_24px_theme(colors.primary/45%)]";
