// The locked question's spread on the TV (mockups/phone-answers, frame 7): one bar per choice, the
// count at its end, the right one carrying ✓ and the words "The answer". Neutral bars are glass;
// the answer's bar is `success` — and its tag says so, because colour is never the only signal.
export const root = "flex w-full max-w-[min(88vw,90rem)] flex-col gap-[clamp(0.5rem,1vw,1rem)]";

export const row =
  "grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] items-center gap-[clamp(0.6rem,1.2vw,1.4rem)] text-[clamp(1rem,1.7vw,2.1rem)] font-extrabold text-text";

export const name = "flex min-w-0 flex-wrap items-baseline gap-x-[0.5em] text-left";

export const letter = "text-primary";

export const answerTag = "text-[0.6em] font-black uppercase tracking-[0.14em] text-success";

// One pip per seated phone: the bar's length is the team, its lit pips the phones that chose it.
export const track = "flex h-[clamp(1.2rem,2.2vw,2.6rem)] gap-[0.3em]";

const pipBase = "flex-1 rounded-md transition-colors duration-500 motion-reduce:transition-none";

export const pip = `${pipBase} bg-text/[0.06]`;

export const pipLit = `${pipBase} bg-muted/60`;

export const pipAnswer = `${pipBase} bg-success`;

export const count = "min-w-[1.5em] text-right font-score text-[1.3em] font-black leading-none tabular-nums text-text";
