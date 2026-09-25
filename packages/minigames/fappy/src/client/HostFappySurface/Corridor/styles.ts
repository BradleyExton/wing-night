import { takeoverLabelAccent } from "@wingnight/surface";

// The whole corridor is the flap button: no scroll, no zoom, no text
// selection under a frantic thumb.
//
// It fills the Canvas's body slot edge to edge, so it no longer sets
// `min-h-0 flex-1`: it is not a column's child any more — the body slot has a
// definite height and the frame takes all of it.
// Scene art, licensed by DESIGN.md §2.9: the corridor's night sky. Not chrome, so no token.
const sceneNight = "bg-[#160c2a]";

export const container = `relative h-full w-full touch-none select-none overflow-hidden rounded-xl border-2 border-ember/20 ${sceneNight} shadow-[inset_0_0_30px_theme(colors.shade/50%)]`;

export const containerArmed = "cursor-pointer";

export const containerLocked = "cursor-not-allowed opacity-80";

// Each leg's corridor slides in from the right as the last one wipes; the
// remount keys it, the keyframes live in the client's index.css.
export const legEnter = "h-full w-full motion-safe:animate-[scene-enter_480ms_ease-out_both]";

// The handoff callout drops over the corridor for the beat: a dim pool in
// the middle of the scene and the next player's name, nothing else.
// Scene art, licensed by DESIGN.md §2.9: the night sky pooled behind a callout so the name reads
// over the scene. Its colour is the corridor's own sky, not a token.
export const sceneNightVeil =
  "bg-[radial-gradient(ellipse_at_center,rgba(22,12,42,0.7)_0%,rgba(22,12,42,0)_68%)]";

export const handoffOverlay = `pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 ${sceneNightVeil} motion-safe:animate-[scene-callout_520ms_cubic-bezier(0.2,1.4,0.4,1)_both]`;

export const handoffLead = takeoverLabelAccent;

export const handoffName =
  "font-voice text-[clamp(2rem,5vw,3.4rem)] font-bold italic leading-none text-text [text-shadow:0_0_24px_theme(colors.primary/45%)]";

// Who is up after them, a size down and dimmer: the tablet's owner reads the
// name above, the room reads this one and starts moving.
export const handoffThen =
  "mt-1 text-[0.85rem] font-semibold uppercase tracking-[0.2em] text-mutedWarm";
