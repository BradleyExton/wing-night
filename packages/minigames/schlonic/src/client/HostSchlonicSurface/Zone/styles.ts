import { takeoverLabelAccent } from "@wingnight/surface";

// The whole zone is the jump button: no scroll, no zoom, no text selection under a frantic
// thumb — and now the whole of it, with nothing of ours drawn on top. The corner dock's gutter
// is the layout's (docs/takeover-layout-api.md §6) and so is the bottom-left chrome that used to
// sit in here.
//
// It fills the Canvas's body slot edge to edge, so it no longer sets `min-h-0 flex-1`: it is not
// a column's child any more — the body slot has a definite height and the frame takes all of it.
// Scene art, licensed by DESIGN.md §2.11: the zone's green frame and ground. The zone looks like
// nothing else in the show on purpose, so it carries no token.
const sceneZone = "border-[#1f6b34] bg-[#0d1f14]";

export const container = `relative h-full w-full touch-none select-none overflow-hidden rounded-xl border-2 ${sceneZone} shadow-[inset_0_0_30px_theme(colors.shade/50%)]`;

export const containerArmed = "cursor-pointer";

export const containerLocked = "cursor-not-allowed opacity-80";

// Each run's zone slides in from the right as the last one wipes; the remount keys it, and the
// keyframes live in the client's index.css.
export const runEnter = "h-full w-full motion-safe:animate-[scene-enter_420ms_ease-out_both]";

// The handoff callout drops over the zone for the beat: a dim pool in the middle of the scene
// and the next player's name, nothing else.
// Scene art (§2.11): the zone's own ground pooled behind the callout.
const sceneZoneVeil =
  "bg-[radial-gradient(ellipse_at_center,rgba(12,26,16,0.72)_0%,rgba(12,26,16,0)_68%)]";

export const handoffOverlay = `pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 ${sceneZoneVeil} motion-safe:animate-[scene-callout_520ms_cubic-bezier(0.2,1.4,0.4,1)_both]`;

export const handoffLead = takeoverLabelAccent;

export const handoffName =
  "font-voice text-[clamp(2rem,5vw,3.4rem)] font-bold italic leading-none text-text [text-shadow:0_0_24px_theme(colors.primary/45%)]";
