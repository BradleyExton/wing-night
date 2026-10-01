// The callout hangs low over the street for the beat, under the hen's feet: every beat ends on the
// hen (principles §7, §9) — the walk to the next teammate, the geese lifting her off the top of the
// frame, the slump at the bell — so the words take the pavement, never the bird. A dark pool rises
// from the bottom edge so they read over any setting.
export const overlay =
  "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center justify-end gap-[clamp(0.2rem,0.6vh,0.6rem)] bg-gradient-to-t from-bg/85 via-bg/50 to-transparent px-[4%] pb-[clamp(0.8rem,2.4vh,2.4rem)] pt-[clamp(3rem,10vh,8rem)] motion-safe:animate-[scene-callout_520ms_cubic-bezier(0.2,1.4,0.4,1)_both]";

// The small line over or under the big one: "HAND IT TO", the takeover's accent label at TV size.
export const lead = "text-[clamp(1rem,1.5vw,1.8rem)] font-extrabold uppercase tracking-[0.24em] text-primary";

// The big line, in the show's voice (Playfair italic, the visual cohesion pass): the next player's
// name, or what just happened to the hen.
export const line =
  "m-0 font-voice text-[clamp(3rem,6.4vw,7rem)] font-bold italic leading-none text-text [text-shadow:0_0_28px_theme(colors.primary/45%)]";

// The bay is the punchline, so its line burns heat rather than glowing primary.
export const lineBay =
  "m-0 font-voice text-[clamp(3rem,6.4vw,7rem)] font-bold italic leading-none text-heat [text-shadow:0_0_28px_theme(colors.heat/45%)]";

// Who takes the tablet after a block that went wrong: the same handoff, a size down.
export const handoffAfter = "flex items-baseline gap-[0.6em]";

export const handoffAfterName =
  "font-voice text-[clamp(1.8rem,3.2vw,3.6rem)] font-bold italic leading-none text-text";
