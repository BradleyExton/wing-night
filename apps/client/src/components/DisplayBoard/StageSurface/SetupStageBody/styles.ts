export const container =
  "relative isolate flex h-full flex-col items-center justify-evenly overflow-hidden px-[clamp(2rem,4vw,4rem)] py-[clamp(1.5rem,3vw,3rem)] text-center";

// Stacking, back to front: ambient floor glow → heat bloom → flame → embers → vignette
// and grain → content. The vignette sits ABOVE the flame so its tips dim into the frame
// rather than ending in a hard edge behind the wordmark.
export const ambient =
  "pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_100%,rgba(249,115,22,0.3)_0%,transparent_60%),radial-gradient(ellipse_45%_35%_at_50%_100%,rgba(239,68,68,0.3)_0%,transparent_55%),radial-gradient(ellipse_90%_50%_at_50%_0%,rgba(8,4,2,0.55)_0%,transparent_65%)]";

export const heatBloom =
  "pointer-events-none absolute bottom-[-12%] left-1/2 z-0 h-[62%] w-[72%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(251,191,36,0.3),rgba(249,115,22,0.16)_45%,transparent_100%)] blur-3xl [animation:breathe_5s_ease-in-out_infinite] motion-reduce:[animation:none]";

export const vignette =
  "pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(18,18,18,0.6)_0%,transparent_30%),radial-gradient(ellipse_75%_72%_at_50%_45%,transparent_48%,rgba(0,0,0,0.62)_100%)]";

export const grain = "display-grain pointer-events-none absolute inset-0 z-[1]";

// Entrance choreography. Everything mounts hidden and reveals top-down: eyebrow, wordmark,
// then the round cards in reading order, then the status pill last. Delays live inside
// the shorthand (see Embers/styles.ts for why) and `both` keeps the hidden start state.

export const header =
  "relative z-[2] flex flex-col items-center gap-[clamp(0.6rem,1vw,1.1rem)]";

export const eyebrowRow = `flex items-center gap-[clamp(0.8rem,1.2vw,1.5rem)] [animation:reveal_700ms_cubic-bezier(0.2,0.7,0.2,1)_0ms_both] motion-reduce:[animation:none]`;

export const eyebrowRuleLeft =
  "h-px w-[clamp(3rem,6vw,8rem)] bg-gradient-to-r from-transparent to-mutedWarm/70";

export const eyebrowRuleRight =
  "h-px w-[clamp(3rem,6vw,8rem)] bg-gradient-to-l from-transparent to-mutedWarm/70";

export const eyebrow =
  "text-[clamp(0.85rem,1.1vw,1.2rem)] font-extrabold uppercase tracking-[0.42em] text-mutedWarm [text-shadow:0_0_20px_rgba(0,0,0,0.7)]";

// The glow is a drop-shadow on the wrapper rather than a text-shadow on the wordmark:
// text-shadow paints behind the glyphs and shows straight through background-clip text.
export const headingGlow =
  "[filter:drop-shadow(0_0_28px_rgba(251,191,36,0.32))_drop-shadow(0_0_90px_rgba(249,115,22,0.28))]";

export const heading = `setup-wordmark m-0 text-[clamp(3.5rem,9vw,12rem)] font-black uppercase leading-[0.9] tracking-[-0.02em] [animation:heroReveal_900ms_cubic-bezier(0.2,0.7,0.2,1)_120ms_both,shine_9s_ease-in-out_2.4s_infinite] motion-reduce:[animation:none]`;

export const rounds =
  "relative z-[2] grid w-full max-w-[1500px] grid-cols-4 gap-y-[clamp(0.6rem,1.1vw,1.4rem)] gap-x-[clamp(0.7rem,1.3vw,1.6rem)]";

const roundBase = `relative isolate flex flex-col items-center overflow-hidden rounded-[clamp(0.6rem,0.9vw,1.1rem)] px-[clamp(0.8rem,1.1vw,1.2rem)] py-[clamp(0.9rem,1.4vw,1.5rem)] text-center [animation:reveal_700ms_cubic-bezier(0.2,0.7,0.2,1)_var(--reveal-delay,0s)_both] motion-reduce:[animation:none]`;

// A lit card: warm glass with a hairline ember rule along the top edge that fades into the
// corners, and a faint glow pooling under that rule.
export const round = `${roundBase} border border-primary/20 bg-[linear-gradient(180deg,rgba(46,22,9,0.84)_0%,rgba(14,7,3,0.93)_100%)] backdrop-blur-[3px] [box-shadow:inset_0_1px_0_rgba(255,214,170,0.14),0_18px_40px_-20px_rgba(0,0,0,0.8)] before:absolute before:inset-x-[12%] before:top-0 before:z-[1] before:h-px before:bg-gradient-to-r before:from-transparent before:via-ember before:to-transparent before:content-[''] after:pointer-events-none after:absolute after:inset-0 after:z-0 after:bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(249,115,22,0.16),transparent_70%)] after:content-['']`;

// An open slot: same footprint, dashed and dim, so the lineup reads as "eight seats, six
// filled" rather than two broken cards.
export const roundPlaceholder = `${roundBase} border border-dashed border-mutedWarmDim/50 bg-bg/80 opacity-90 backdrop-blur-[2px]`;

// Staggered in reading order. Slots past the eighth share the last delay.
export const roundRevealDelays: readonly string[] = [
  "[--reveal-delay:360ms]",
  "[--reveal-delay:420ms]",
  "[--reveal-delay:480ms]",
  "[--reveal-delay:540ms]",
  "[--reveal-delay:600ms]",
  "[--reveal-delay:660ms]",
  "[--reveal-delay:720ms]",
  "[--reveal-delay:780ms]"
];

export const roundWatermark =
  "pointer-events-none absolute -right-[0.06em] -top-[0.18em] z-0 select-none font-mono text-[clamp(3.2rem,5.5vw,7rem)] font-black leading-none tracking-[-0.06em] text-text/[0.06]";

export const roundNum =
  "relative z-[1] font-mono text-[clamp(0.7rem,0.95vw,1.05rem)] font-extrabold uppercase tracking-[0.32em] text-primary";

export const roundLabel =
  "relative z-[1] mb-2 mt-1 text-[clamp(0.75rem,1vw,1.15rem)] font-bold uppercase tracking-[0.18em] text-mutedWarm";

export const sauce =
  "relative z-[1] m-0 text-[clamp(1.2rem,2vw,2.8rem)] font-black uppercase leading-[0.95] tracking-[-0.005em] text-text [text-shadow:0_0_18px_rgba(249,115,22,0.45),0_2px_0_rgba(0,0,0,0.4)]";

export const sauceMuted =
  "relative z-[1] m-0 text-[clamp(1.2rem,2vw,2.8rem)] font-black uppercase leading-[0.95] tracking-[-0.005em] text-mutedWarmDim";

export const minigame =
  "relative z-[1] mt-[0.8em] inline-flex items-center gap-[0.55em] rounded-full border border-text/10 bg-text/[0.05] px-[0.95em] py-[0.38em] text-[clamp(0.68rem,0.9vw,1rem)] font-bold uppercase tracking-[0.2em] text-mutedWarm";

export const minigameDot =
  "h-[0.5em] w-[0.5em] rounded-full bg-primary/85 [box-shadow:0_0_8px_rgba(249,115,22,0.7)]";

export const additionalRounds =
  "relative z-[2] mt-2 text-[clamp(0.85rem,1.1vw,1.2rem)] font-bold uppercase tracking-[0.28em] text-mutedWarmDim";

// Dark pill keeps the status legible where it crosses the flame's bright core.
export const waiting = `relative z-[2] inline-flex items-center gap-[0.8em] rounded-full border border-primary/30 bg-bg/70 px-[1.5em] py-[0.7em] text-[clamp(0.85rem,1.1vw,1.2rem)] font-bold uppercase tracking-[0.32em] text-mutedWarm backdrop-blur-md [box-shadow:0_0_40px_rgba(249,115,22,0.18),inset_0_1px_0_rgba(255,214,170,0.1)] [animation:reveal_700ms_cubic-bezier(0.2,0.7,0.2,1)_900ms_both] motion-reduce:[animation:none]`;

export const waitingBeacon =
  "relative flex h-[0.8em] w-[0.8em] items-center justify-center";

export const waitingRing =
  "absolute inset-0 rounded-full bg-primary/60 [animation:radar_2.2s_cubic-bezier(0,0,0.2,1)_infinite] motion-reduce:hidden";

export const waitingDot =
  "relative h-[0.7em] w-[0.7em] rounded-full bg-primary [box-shadow:0_0_12px_theme(colors.primary),0_0_24px_rgba(249,115,22,0.6)]";
