export const container = "flex h-full min-h-0 flex-col gap-3 select-none";

// Mini-rail strip, echoing the host shell anatomy (DESIGN.md §2.0A). Right
// padding keeps the pending chip clear of the shell's absolute timer chip.
export const rail =
  "flex flex-wrap items-center gap-x-4 gap-y-1 px-1 pr-[clamp(9rem,15vw,12rem)] text-xs font-extrabold uppercase tracking-[0.22em] text-muted";

export const railTitle = "text-primary";

export const railTeam = "flex items-center gap-2 text-text";

export const railTeamDot = "h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_#f97316]";

export const railPending = "ml-auto font-mono text-sm tracking-normal text-gold";

export const introCard =
  "rounded-xl border border-text/10 bg-surface px-5 py-4 text-base leading-relaxed text-text/90";

export const statusRow =
  "flex flex-wrap items-baseline gap-x-5 gap-y-1 px-1 font-mono text-sm text-muted";

export const statusProgress = "text-base font-extrabold text-text";

export const statusShotHit = "font-extrabold text-success";

export const statusShotClose = "font-extrabold text-gold";

export const statusShotMiss = "font-extrabold text-heat";

export const padInstruction = "m-0 px-1 text-xs uppercase tracking-[0.2em] text-muted";

// Five zones on a 3×3 grid with dead bands (the gap) between them: the four
// edge bands are found by feel against the bezel, the centre is the only
// zone that costs anything, and a tap in a gap is ignored, never guessed.
export const pad =
  "grid min-h-0 flex-1 touch-none grid-cols-[1fr_2fr_1fr] grid-rows-[1fr_2fr_1fr] gap-[clamp(0.6rem,1.5vw,1.2rem)]";

const zoneBase =
  "flex items-center justify-center rounded-2xl border-2 text-[clamp(1.2rem,2.6vw,2.2rem)] font-black uppercase tracking-[0.18em] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30";

export const zoneUp = `${zoneBase} col-start-2 row-start-1 border-text/15 bg-surfaceAlt text-text active:bg-primary/20`;

export const zoneLeft = `${zoneBase} col-start-1 row-start-2 border-text/15 bg-surfaceAlt text-text active:bg-primary/20`;

export const zoneRight = `${zoneBase} col-start-3 row-start-2 border-text/15 bg-surfaceAlt text-text active:bg-primary/20`;

export const zoneDown = `${zoneBase} col-start-2 row-start-3 border-text/15 bg-surfaceAlt text-text active:bg-primary/20`;

export const zoneFire = `${zoneBase} col-start-2 row-start-2 flex-col gap-1 border-primary bg-primary/15 text-primary`;

export const zoneFireCharging = `${zoneBase} col-start-2 row-start-2 flex-col gap-1 border-heat bg-heat/30 text-text`;

export const fireHint = "text-[0.6em] font-bold tracking-[0.3em] opacity-80";

export const doneCard =
  "rounded-xl border border-gold/40 bg-surface px-5 py-4 text-center text-base font-bold text-gold";
