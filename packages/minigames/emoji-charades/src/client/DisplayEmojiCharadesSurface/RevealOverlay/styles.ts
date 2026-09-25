// The 2s verdict window (DESIGN.md §2.6). It is DRAWING's reveal plaque, not
// a full-bleed wash: the clue is held on the board behind it and only dimmed,
// so the room reads the emoji and the answer in the same beat.
export const overlay =
  "absolute inset-0 z-10 grid place-items-center px-[8%] motion-safe:animate-[reveal_220ms_ease-out]";

const plaqueBase =
  "grid min-w-[60%] items-center gap-[clamp(1.2rem,2.4vw,2.4rem)] rounded-2xl border-[3px] px-[clamp(1.8rem,3vw,3rem)] py-[clamp(1.2rem,2vh,2rem)]";

export const plaqueCorrect = `${plaqueBase} grid-cols-[auto_1fr_auto] border-success bg-gradient-to-b from-success/25 to-bg shadow-[0_0_70px_theme(colors.success/40%),0_14px_32px_theme(colors.shade/60%)]`;

export const plaqueSkipped = `${plaqueBase} grid-cols-[auto_1fr] border-danger bg-gradient-to-b from-danger/25 to-bg shadow-[0_0_70px_theme(colors.danger/35%),0_14px_32px_theme(colors.shade/60%)]`;

const verdictIconBase =
  "text-[clamp(2.8rem,4.4vw,4.4rem)] font-black leading-none";

export const verdictIconCorrect = `${verdictIconBase} text-success [text-shadow:0_0_24px_theme(colors.success/60%)]`;

export const verdictIconSkipped = `${verdictIconBase} text-danger [text-shadow:0_0_24px_theme(colors.danger/50%)]`;

const labelBase =
  "mb-1.5 block text-[clamp(0.72rem,1vw,1rem)] font-extrabold uppercase tracking-[0.32em]";

export const labelCorrect = `${labelBase} text-success`;

export const labelSkipped = `${labelBase} text-danger`;

export const answer =
  "font-serif text-[clamp(2.2rem,3.8vw,4rem)] font-bold italic leading-[1.05] text-text";

export const award = "text-right font-mono";

export const awardPoints =
  "text-[clamp(2.6rem,4vw,4rem)] font-black leading-none text-gold [text-shadow:0_0_18px_theme(colors.gold/50%)]";

export const awardTeam =
  "mt-1.5 block font-sans text-[clamp(0.72rem,0.95vw,0.95rem)] font-bold uppercase tracking-[0.28em] text-muted";
