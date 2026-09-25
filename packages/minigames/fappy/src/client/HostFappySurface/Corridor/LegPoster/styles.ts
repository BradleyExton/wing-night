import { takeoverLabelAccent } from "@wingnight/surface";

// The poster over a dead arena. A leg that has not been tapped yet is a still
// corridor with a bird standing on a cliff — the one moment in FAPPY where the
// scene says nothing and the whole tablet can be used to answer the room's
// question, which is whose turn it is.
//
// `pointer-events-none` is load-bearing: the corridor IS the flap button, so a
// poster that took a tap would cost the player their first flap and look like
// a dead tablet. It is centred, so it never reaches the takeover's bottom-right
// dock gutter either.

// Scene art, licensed by DESIGN.md §2.9: the corridor's night sky pooled behind the poster.
const sceneNightVeil =
  "bg-[radial-gradient(ellipse_at_center,rgba(22,12,42,0.82)_0%,rgba(22,12,42,0)_72%)]";

const ENTER = "motion-safe:animate-[scene-callout_420ms_cubic-bezier(0.2,1.4,0.4,1)_both]";

export const overlay = `pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-[clamp(0.4rem,1vh,0.9rem)] ${sceneNightVeil} ${ENTER}`;

// After a crash the same poster waits out the crash beat before it drops, so
// it never lands on top of the tumble the player needs to see. The delay is
// folded into the animation SHORTHAND — a separate `animation-delay` utility
// is overwritten by the shorthand and does nothing.
export const overlayRespawn = `pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-[clamp(0.4rem,1vh,0.9rem)] ${sceneNightVeil} motion-safe:animate-[scene-callout_420ms_cubic-bezier(0.2,1.4,0.4,1)_550ms_both]`;

export const head =
  "h-[clamp(3.5rem,13vh,6rem)] w-[clamp(3.5rem,13vh,6rem)] overflow-hidden rounded-full border-4 border-current shadow-[0_0_2rem_theme(colors.shade/60%)]";

export const kicker =
  takeoverLabelAccent;

export const name =
  "font-voice text-[clamp(2.2rem,6vw,4rem)] font-bold italic leading-none text-text [text-shadow:0_0_28px_theme(colors.primary/45%)]";

export const prompt =
  "rounded-full border border-primary/50 bg-bg/70 px-4 py-1.5 text-[0.78rem] font-extrabold uppercase tracking-[0.3em] text-primary backdrop-blur";
