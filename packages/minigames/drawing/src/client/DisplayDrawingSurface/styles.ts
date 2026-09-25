export const stage =
  "flex h-full w-full flex-col gap-[clamp(0.7rem,1.2vh,1.2rem)] bg-bg p-[clamp(0.8rem,1.4vw,1.6rem)]";

// The marquee is `<NeonMarquee>` from @wingnight/surface (DESIGN.md §2.2D);
// this surface only says what it reads.

export const canvasArea = "relative flex min-h-0 flex-1";

export const idleOverlay =
  "absolute inset-0 z-10 grid place-items-center px-[10%] text-center";

export const idleText =
  "m-0 font-serif text-[clamp(1.4rem,2.4vw,2.6rem)] italic text-text/70";

export const revealOverlay =
  "absolute inset-0 z-20 grid place-items-center px-[8%]";

// Opaque fill: the held sketch stays on the board behind the plaque, so a
// translucent panel let strokes cut through the answer text.
export const revealPlaqueCorrect =
  "grid min-w-[60%] grid-cols-[auto_1fr_auto] items-center gap-[clamp(1.2rem,2.4vw,2.4rem)] rounded-2xl border-[3px] border-success/60 bg-surface px-[clamp(1.8rem,3vw,3rem)] py-[clamp(1.2rem,2vh,2rem)] shadow-[0_0_60px_theme(colors.success/30%),0_14px_32px_theme(colors.shade/60%)]";

export const revealPlaqueIncorrect =
  "grid min-w-[60%] grid-cols-[auto_1fr] items-center gap-[clamp(1.2rem,2.4vw,2.4rem)] rounded-2xl border-[3px] border-danger/60 bg-surface px-[clamp(1.8rem,3vw,3rem)] py-[clamp(1.2rem,2vh,2rem)] shadow-[0_0_60px_theme(colors.danger/30%),0_14px_32px_theme(colors.shade/60%)]";

export const revealCheckCorrect =
  "text-[clamp(2.8rem,4.4vw,4.4rem)] font-black leading-none text-success";

export const revealCheckIncorrect =
  "text-[clamp(2.8rem,4.4vw,4.4rem)] font-black leading-none text-danger";

export const revealAnswer =
  "font-serif text-[clamp(2.2rem,3.8vw,4rem)] font-bold italic leading-[1.05] text-text";

export const revealAnswerLabelCorrect =
  "mb-1.5 block font-sans text-[clamp(0.72rem,1vw,1rem)] font-extrabold not-italic uppercase tracking-[0.32em] text-success";

export const revealAnswerLabelIncorrect =
  "mb-1.5 block font-sans text-[clamp(0.72rem,1vw,1rem)] font-extrabold not-italic uppercase tracking-[0.32em] text-danger";

export const revealAward = "text-right font-mono";

export const revealAwardPoints =
  "text-[clamp(2.6rem,4vw,4rem)] font-black leading-none text-gold";

export const revealAwardTeam =
  "mt-1.5 block font-sans text-[clamp(0.72rem,0.95vw,0.95rem)] font-bold uppercase tracking-[0.28em] text-muted";

export const spark =
  "absolute z-10 motion-safe:animate-pulse text-xl text-gold";

export const sparkOne = "left-[12%] top-[10%]";

export const sparkTwo = "right-[14%] top-[18%] [animation-delay:0.3s]";

export const sparkThree = "bottom-[20%] left-[22%] [animation-delay:0.6s]";

export const sparkFour = "bottom-[14%] right-[28%] [animation-delay:0.9s]";

export const statusLine =
  "m-0 text-center text-[clamp(0.78rem,1.1vw,1.2rem)] font-extrabold uppercase tracking-[0.26em] text-primary";
