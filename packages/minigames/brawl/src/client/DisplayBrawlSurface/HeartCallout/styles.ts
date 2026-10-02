// "Caitlin bought a heart" hangs low over the pavement like the ending callouts (BeatCallout), on
// a dark pool under the hen's feet, so it never covers her — a size down from them, because it is
// news, not an ending, and the hen is about to start walking under it.
export const overlay =
  "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center justify-end gap-[clamp(0.2rem,0.5vh,0.5rem)] bg-gradient-to-t from-bg/80 via-bg/40 to-transparent px-[4%] pb-[clamp(0.8rem,2.4vh,2.4rem)] pt-[clamp(2.5rem,8vh,6rem)] motion-safe:animate-[scene-callout_520ms_cubic-bezier(0.2,1.4,0.4,1)_both]";

// "FOUR HEARTS · −3 WORTH": where the tally's three went, in the hearts' heat.
export const lead = "text-[clamp(0.9rem,1.3vw,1.6rem)] font-extrabold uppercase tracking-[0.24em] text-heat";

// The name in the show's voice and what she did, one line.
export const line =
  "m-0 flex items-baseline gap-[0.35em] font-voice text-[clamp(2.2rem,4.4vw,5rem)] font-bold italic leading-none text-text [text-shadow:0_0_24px_theme(colors.heat/40%)]";

export const name = "text-text";

export const verb = "text-text/80";
