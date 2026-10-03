// The callout hangs low over the waterfront for the beat, under the pile: every beat ends on the
// hen and the line (principles §7, §9), so the words take the boardwalk, never the climb. A dark
// pool rises from the bottom edge so they read over any pile.
export const overlay =
  "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center justify-end gap-[clamp(0.2rem,0.6vh,0.6rem)] bg-gradient-to-t from-bg/85 via-bg/50 to-transparent px-[4%] pb-[clamp(0.8rem,2.4vh,2.4rem)] pt-[clamp(3rem,10vh,8rem)] motion-safe:animate-[scene-callout_520ms_cubic-bezier(0.2,1.4,0.4,1)_both]";

// The small line over the big one: "HAND IT TO", the takeover's accent label at TV size.
export const lead = "text-[clamp(1rem,1.5vw,1.8rem)] font-extrabold uppercase tracking-[0.24em] text-primary";

// The big line, in the show's voice: what just happened, or the next player's name.
export const line =
  "m-0 font-voice text-[clamp(3rem,6.4vw,7rem)] font-bold italic leading-none text-text [text-shadow:0_0_28px_theme(colors.primary/45%)]";

// A mount is the line moving, so its word burns gold, the score colour.
export const lineMounted =
  "m-0 font-voice text-[clamp(3rem,6.4vw,7rem)] font-bold italic leading-none text-gold [text-shadow:0_0_28px_theme(colors.gold/45%)]";

// What the climb banked, in the score face beside the word: the points land with the beat.
export const result = "flex items-baseline gap-[0.6em]";

export const points = "font-score text-[clamp(2.4rem,4.6vw,5rem)] font-extrabold tabular-nums leading-none text-gold";

export const share = "text-[clamp(1rem,1.5vw,1.8rem)] font-extrabold uppercase tracking-[0.18em] text-text/80";

export const handoffAfter = "flex items-baseline gap-[0.6em]";

export const handoffAfterName = "font-voice text-[clamp(1.8rem,3.2vw,3.6rem)] font-bold italic leading-none text-text";
