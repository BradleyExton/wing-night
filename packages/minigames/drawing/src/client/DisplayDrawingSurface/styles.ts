export const stage =
  "flex h-full w-full flex-col gap-[clamp(0.7rem,1.2vh,1.2rem)] bg-bg p-[clamp(0.8rem,1.4vw,1.6rem)]";

// Grand bulb marquee (DESIGN.md §2.5): team + pending left, show title
// center, pending pill right.
export const marquee =
  "relative grid grid-cols-[1fr_auto_1fr] items-center gap-6 rounded-2xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-[clamp(1.4rem,2.4vw,2.4rem)] py-[clamp(0.8rem,1.4vh,1.3rem)] shadow-[inset_0_0_36px_rgba(251,191,36,0.2),0_8px_20px_rgba(0,0,0,0.55)]";

export const marqueeBulbs =
  "pointer-events-none absolute inset-[7px] rounded-xl border-4 border-dotted border-gold/45";

export const marqueeTeamName =
  "m-0 text-[clamp(1.2rem,2vw,2.1rem)] font-black uppercase tracking-[0.06em] text-text";

export const marqueeTitle =
  "text-center text-[clamp(0.8rem,1.2vw,1.3rem)] font-extrabold uppercase tracking-[0.34em] text-gold";

export const marqueePending =
  "text-right font-mono text-[clamp(1.1rem,1.8vw,1.9rem)] font-extrabold text-gold";

export const canvasArea = "relative flex min-h-0 flex-1";

export const idleOverlay =
  "absolute inset-0 z-10 grid place-items-center px-[10%] text-center";

export const idleText =
  "m-0 font-serif text-[clamp(1.4rem,2.4vw,2.6rem)] italic text-[#f3eee2]/70";

export const revealOverlay =
  "absolute inset-0 z-20 grid place-items-center px-[8%]";

export const revealPlaqueCorrect =
  "grid min-w-[60%] grid-cols-[auto_1fr_auto] items-center gap-[clamp(1.2rem,2.4vw,2.4rem)] rounded-2xl border-[3px] border-[#5fe093] bg-gradient-to-b from-[#2a4d1f] to-[#0e2a14] px-[clamp(1.8rem,3vw,3rem)] py-[clamp(1.2rem,2vh,2rem)] shadow-[0_0_70px_rgba(47,184,108,0.4),0_14px_32px_rgba(0,0,0,0.6)]";

export const revealPlaqueIncorrect =
  "grid min-w-[60%] grid-cols-[auto_1fr] items-center gap-[clamp(1.2rem,2.4vw,2.4rem)] rounded-2xl border-[3px] border-[#ff8a8a] bg-gradient-to-b from-[#4d1f1f] to-[#2a0e0e] px-[clamp(1.8rem,3vw,3rem)] py-[clamp(1.2rem,2vh,2rem)] shadow-[0_0_70px_rgba(240,64,64,0.35),0_14px_32px_rgba(0,0,0,0.6)]";

export const revealCheckCorrect =
  "text-[clamp(2.8rem,4.4vw,4.4rem)] font-black leading-none text-[#2fb86c] [text-shadow:0_0_24px_rgba(47,184,108,0.6)]";

export const revealCheckIncorrect =
  "text-[clamp(2.8rem,4.4vw,4.4rem)] font-black leading-none text-[#ff8a8a] [text-shadow:0_0_24px_rgba(240,64,64,0.5)]";

export const revealAnswer =
  "font-serif text-[clamp(2.2rem,3.8vw,4rem)] font-bold italic leading-[1.05] text-text";

export const revealAnswerLabelCorrect =
  "mb-1.5 block font-sans text-[clamp(0.72rem,1vw,1rem)] font-extrabold not-italic uppercase tracking-[0.32em] text-[#2fb86c]";

export const revealAnswerLabelIncorrect =
  "mb-1.5 block font-sans text-[clamp(0.72rem,1vw,1rem)] font-extrabold not-italic uppercase tracking-[0.32em] text-[#ff8a8a]";

export const revealAward = "text-right font-mono";

export const revealAwardPoints =
  "text-[clamp(2.6rem,4vw,4rem)] font-black leading-none text-gold [text-shadow:0_0_18px_rgba(251,191,36,0.5)]";

export const revealAwardTeam =
  "mt-1.5 block font-sans text-[clamp(0.72rem,0.95vw,0.95rem)] font-bold uppercase tracking-[0.28em] text-muted";

export const spark =
  "absolute z-10 animate-pulse text-xl text-gold [text-shadow:0_0_10px_#fbbf24]";

export const sparkOne = "left-[12%] top-[10%]";

export const sparkTwo = "right-[14%] top-[18%] [animation-delay:0.3s]";

export const sparkThree = "bottom-[20%] left-[22%] [animation-delay:0.6s]";

export const sparkFour = "bottom-[14%] right-[28%] [animation-delay:0.9s]";

export const statusLine =
  "m-0 text-center text-[clamp(0.78rem,1.1vw,1.2rem)] font-extrabold uppercase tracking-[0.26em] text-primary";
