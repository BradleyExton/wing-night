// The whole zone is the jump button: no scroll, no zoom, no text selection under a frantic
// thumb — and now the whole of it, with nothing of ours drawn on top. The corner dock's gutter
// is the layout's (docs/takeover-layout-api.md §6) and so is the bottom-left chrome that used to
// sit in here.
//
// It fills the Canvas's body slot edge to edge, so it no longer sets `min-h-0 flex-1`: it is not
// a column's child any more — the body slot has a definite height and the frame takes all of it.
export const container =
  "relative h-full w-full touch-none select-none overflow-hidden rounded-xl border-2 border-[#1f6b34] bg-[#0d1f14] shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]";

export const containerArmed = "cursor-pointer";

export const containerLocked = "cursor-not-allowed opacity-80";

// Each run's zone slides in from the right as the last one wipes; the remount keys it, and the
// keyframes live in the client's index.css.
export const runEnter = "h-full w-full motion-safe:animate-[schlonic-scene-enter_420ms_ease-out_both]";

// The handoff callout drops over the zone for the beat: a dim pool in the middle of the scene
// and the next player's name, nothing else.
export const handoffOverlay =
  "pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-[radial-gradient(ellipse_at_center,rgba(12,26,16,0.72)_0%,rgba(12,26,16,0)_68%)] motion-safe:animate-[schlonic-callout_520ms_cubic-bezier(0.2,1.4,0.4,1)_both]";

export const handoffLead = "text-[0.7rem] font-extrabold uppercase tracking-[0.34em] text-gold";

export const handoffName =
  "font-serif text-[clamp(2rem,5vw,3.4rem)] font-bold italic leading-none text-text [text-shadow:0_0_24px_rgba(251,191,36,0.55)]";
