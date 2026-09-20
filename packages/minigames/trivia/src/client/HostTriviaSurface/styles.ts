// Play-phase takeover fills the host canvas: header strip up top, the
// question card centered in the remaining space, verdict buttons directly
// beneath it. Intro phase renders inside the deck, where the container's
// flex styles degrade gracefully to a plain stack.
export const container = "flex h-full min-h-0 flex-col gap-[clamp(1rem,2vh,1.5rem)]";

// TRIVIA is host-paced, so no timer chip is pinned to the takeover's
// top-right corner and the header gets the full width.
export const header = "space-y-3";

export const description = "max-w-3xl text-sm leading-6 text-muted";

export const meta = "flex flex-wrap gap-2";

export const metaBlock =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-text/10 bg-surface px-4 py-2";

export const metaLabel =
  "text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted";

export const metaValue = "text-sm font-semibold text-text";

// Centers the prompt + verdict stack in the leftover canvas height.
export const playArea =
  "flex min-h-0 w-full flex-1 flex-col justify-center gap-[clamp(1rem,2.2vh,1.75rem)]";

export const promptShell =
  "overflow-hidden rounded-[1.75rem] border border-text/10 bg-gradient-to-br from-surfaceAlt to-surface";

export const promptSection =
  "border-b border-text/10 px-[clamp(1.25rem,2.5vw,2.25rem)] py-[clamp(1.25rem,2.5vh,2rem)]";

export const answerSection =
  "px-[clamp(1.25rem,2.5vw,2.25rem)] py-[clamp(1.25rem,2.5vh,2rem)]";

export const promptLabel =
  "text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary/90";

export const answerLabel =
  "text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted";

export const promptValue =
  "mt-3 text-balance text-[clamp(1.5rem,3vw,2.6rem)] font-semibold leading-tight text-text";

export const answerValue =
  "mt-3 text-[clamp(1.25rem,2.4vw,2.1rem)] font-semibold leading-tight text-text/92";

// The spent turn takes the verdict buttons' place rather than sitting above
// them greyed out: dimmed CORRECT/INCORRECT still read as controls, and the
// tablet is in the team's hands, so "there is nothing left to press" has to be
// the loudest thing on the canvas.
export const turnComplete =
  "flex min-h-[clamp(64px,9vh,88px)] flex-col justify-center gap-1 rounded-2xl border border-primary/25 bg-primary/10 px-5 py-4 text-center";

export const turnCompleteTitle =
  "text-[clamp(1rem,1.4vw,1.3rem)] font-extrabold uppercase tracking-[0.12em] text-text";

export const turnCompleteHint = "text-sm font-medium text-text/80";

export const statusNote =
  "rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-text/85";

export const actions = "grid gap-[clamp(0.75rem,1.5vw,1.25rem)] sm:grid-cols-2";

const verdictButtonBase =
  "min-h-[clamp(64px,9vh,88px)] rounded-2xl border px-5 text-[clamp(1rem,1.4vw,1.3rem)] font-extrabold uppercase tracking-[0.12em] text-text transition disabled:cursor-not-allowed disabled:opacity-50";

// Functional success/danger per DESIGN.md §0.1 — these buttons score answers.
export const correctButton = `${verdictButtonBase} border-success/60 bg-success/20 hover:bg-success/30`;

export const incorrectButton = `${verdictButtonBase} border-danger/60 bg-danger/20 hover:bg-danger/30`;
