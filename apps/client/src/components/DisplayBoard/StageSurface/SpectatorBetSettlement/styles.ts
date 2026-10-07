// The settlement band on the turn's results (mockups/spectator-bets, frame 6): three cells — the
// line, the turn's score, the side it fell — on a dark glass strip, and under it who called it in
// the show's voice. The side is `primary`: it is the reveal, not points won, so it stays off gold.
export const band =
  "relative z-10 grid grid-cols-3 items-end gap-[clamp(1.5rem,3vw,3.5rem)] rounded-2xl border-t border-text/10 bg-[linear-gradient(180deg,theme(colors.surface/90%)_0%,theme(colors.bg/95%)_100%)] px-[clamp(1.4rem,2.4vw,2.8rem)] py-[clamp(0.8rem,1.4vw,1.4rem)]";

export const cell = "flex flex-col items-center gap-[0.4em]";

export const label =
  "text-[clamp(0.7rem,0.9vw,1rem)] font-extrabold uppercase tracking-[0.28em] text-mutedWarm";

// The `readoutFigure` face at the band's own size (the token's size is the marquee's).
export const value =
  "font-score text-[clamp(2rem,3.4vw,3.8rem)] font-black leading-none tabular-nums text-text";

// The value's size, so the three labels sit on one line over three figures on one baseline.
export const side =
  "text-[clamp(2rem,3.4vw,3.8rem)] font-black uppercase leading-none tracking-[0.06em] text-primary [text-shadow:0_0_18px_theme(colors.primary/45%)]";

export const callers =
  "relative z-10 m-0 font-voice text-[clamp(1.1rem,1.8vw,2.1rem)] italic leading-tight text-mutedWarm";

export const callerNames = "font-sans font-extrabold not-italic text-text";
