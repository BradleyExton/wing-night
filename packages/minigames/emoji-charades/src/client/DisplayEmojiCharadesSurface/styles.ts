// TV surface per DESIGN.md §2.6 ("Clue Board"): fixed 6x5 board of clue slots,
// letterboxed into whatever height the marquee and footer leave. Emoji never
// scale with sequence length — cell size is a function of space alone.
export const container =
  "flex h-full min-h-0 flex-col gap-[clamp(0.7rem,1.2vh,1.2rem)]";

export const marquee =
  "flex items-center justify-between gap-6 rounded-2xl border-2 border-gold bg-gradient-to-b from-surfaceAlt to-surface px-[clamp(1.4rem,2.4vw,2.4rem)] py-[clamp(0.8rem,1.4vh,1.3rem)]";

export const teamName =
  "text-[clamp(1.2rem,2vw,2.1rem)] font-black uppercase tracking-[0.06em] text-text";

export const pendingPoints =
  "ml-3 font-mono text-[clamp(0.95rem,1.4vw,1.5rem)] font-extrabold text-gold";

export const showTitle =
  "text-[clamp(0.8rem,1.2vw,1.3rem)] font-extrabold uppercase tracking-[0.34em] text-gold";

export const board =
  "grid aspect-[6/5] max-h-full w-full max-w-[1500px] grid-cols-6 grid-rows-5 gap-[clamp(0.4rem,0.9vw,0.9rem)]";

export const boardArea =
  "relative grid min-h-0 flex-1 justify-items-center gap-[clamp(0.4rem,1vh,0.9rem)] [grid-template-rows:1fr_auto]";

export const slotFilled =
  "flex items-center justify-center rounded-2xl bg-text/5 text-[min(11vh,6.4vw)] leading-none";

// Newest slot keeps the one beat of drama borrowed from the ribbon direction.
export const slotNewest =
  "flex animate-[emojipop_420ms_cubic-bezier(0.2,1.4,0.4,1)] items-center justify-center rounded-2xl bg-gold/15 text-[min(11vh,6.4vw)] leading-none ring-[3px] ring-gold";

export const slotEmpty =
  "rounded-2xl border-2 border-dashed border-text/10 bg-text/[0.02]";

export const statusLine =
  "text-center text-[clamp(0.72rem,1.1vw,1.1rem)] font-bold uppercase tracking-[0.24em] text-muted";

export const statusCount = "font-mono text-gold";

export const deckGrid =
  "grid min-h-0 flex-1 content-center gap-[clamp(0.6rem,1.4vw,1.4rem)] sm:grid-cols-2 lg:grid-cols-3";

export const deckCard =
  "rounded-2xl border-2 border-gold/40 bg-surfaceAlt px-6 py-5 text-center";

export const deckCardDisabled =
  "rounded-2xl border-2 border-dashed border-text/10 bg-surfaceAlt px-6 py-5 text-center opacity-50";

export const deckCardLabel =
  "text-[clamp(1.2rem,2vw,2rem)] font-extrabold text-text";

export const deckCardMeta =
  "mt-2 text-[clamp(0.72rem,1vw,1rem)] font-bold uppercase tracking-[0.18em] text-muted";

export const sectionTitle =
  "text-center text-[clamp(1.5rem,3vw,3rem)] font-black uppercase tracking-[0.08em] text-text";

export const sectionHint = `${statusLine} mt-2`;

// Reveal overlay: the board dims behind it for the 2s window (§2.6).
export const revealOverlay =
  "absolute inset-0 z-10 flex flex-col items-center justify-center gap-[clamp(0.6rem,1.4vh,1.4rem)] rounded-2xl bg-bg/95";

export const revealIconCorrect =
  "text-[clamp(3rem,7vw,6rem)] leading-none text-success";

export const revealIconSkipped =
  "text-[clamp(3rem,7vw,6rem)] leading-none text-danger";

export const revealLabel =
  "text-center text-[clamp(0.72rem,1.1vw,1.1rem)] font-extrabold uppercase tracking-[0.3em] text-muted";

export const revealAnswer =
  "text-center font-serif text-[clamp(2.4rem,6vw,5.5rem)] font-bold italic text-text";

export const revealAward =
  "inline-flex items-baseline gap-3 rounded-full border-2 border-gold px-6 py-1";

export const revealAwardPoints =
  "font-mono text-[clamp(1.4rem,2.6vw,2.4rem)] font-black text-gold";

export const revealAwardTeam =
  "text-[clamp(0.8rem,1.2vw,1.2rem)] font-extrabold uppercase tracking-[0.2em] text-text";

export const boardDimmed = "opacity-10 transition-opacity";
