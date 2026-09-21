// The whole corridor is the flap button: no scroll, no zoom, no text
// selection under a frantic thumb.
export const container =
  "relative min-h-0 flex-1 touch-none select-none overflow-hidden rounded-xl border-2 border-[#3a200d] bg-[#160c2a] shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]";

export const containerArmed = "cursor-pointer";

export const containerLocked = "cursor-not-allowed opacity-80";

// Each leg's corridor slides in from the right as the last one wipes; the
// remount keys it, the keyframes live in the client's index.css.
export const legEnter = "h-full w-full motion-safe:animate-[fappy-scene-enter_480ms_ease-out_both]";

// The handoff callout drops over the corridor for the beat: a dim pool in
// the middle of the scene and the next player's name, nothing else.
export const handoffOverlay =
  "pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-[radial-gradient(ellipse_at_center,rgba(22,12,42,0.7)_0%,rgba(22,12,42,0)_68%)] motion-safe:animate-[fappy-callout_520ms_cubic-bezier(0.2,1.4,0.4,1)_both]";

export const handoffLead = "text-[0.7rem] font-extrabold uppercase tracking-[0.34em] text-gold";

export const handoffName =
  "font-serif text-[clamp(2rem,5vw,3.4rem)] font-bold italic leading-none text-text [text-shadow:0_0_24px_rgba(251,191,36,0.55)]";
