export const card =
  "rounded-2xl border border-text/10 bg-surfaceAlt px-6 py-6 text-left shadow-2xl md:px-8 md:py-8";

// The lobby owns the whole stage, edge to edge: its flame, vignette and cast
// are the frame, so any inset here would read as a border around the show.
export const setupCard = "h-full max-h-full overflow-hidden text-left";

// So does every other stage that is a SHOW rather than a page, which is all of
// them but the fallback: the eating clock, a team's intro, a minigame's arena
// and the two results screens each paint their own frame — an ember gradient,
// a vignette, a genre texture — and each carries the padding its own content
// needs. An inset here painted a strip of the page's `bg` around that frame on
// three sides while the deck below ran edge to edge, which reads as a border
// around the show (DESIGN.md §2.2B). `MinigameIntroStageBody` used to escape
// it with `absolute inset-0`; there is nothing left to escape.
export const fullStageCanvas =
  "relative isolate h-full max-h-full overflow-hidden text-left";

// The fallback is the exception, and it is one because it is not a show: a
// context header over a line of text, sitting on the display's own background.
// It keeps the inset the display row used to carry.
export const stageCanvas = `${fullStageCanvas} px-4 py-3 md:px-8 md:py-4 [@media(max-height:850px)]:py-2`;

// Every stage mounts inside this, keyed by stage mode, so a phase change is one
// subtle fade of one duration on every stage (DESIGN.md §8) — the stages' own
// staged beats play inside it. `stage-enter` lives in the surface package's
// keyframes.css; reduced motion gets the cut.
export const stageEnter =
  "h-full min-h-0 motion-safe:[animation:stage-enter_400ms_cubic-bezier(0.2,0.8,0.2,1)_both]";

export const stageBody =
  "relative z-10 h-full min-h-0 px-4 pb-3 pt-1 md:px-8 md:pb-4 2xl:px-12";

export const surfaceContextRow = "mb-3 flex items-center justify-between gap-3";

export const surfaceContextMeta =
  "m-0 text-xs font-semibold uppercase tracking-[0.16em] text-muted";

export const surfaceContextBadge =
  "inline-flex rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary";

export const title = "m-0 text-4xl font-bold text-text md:text-5xl";

export const timerWrap =
  "mt-6 rounded-xl border border-primary/40 bg-primary/10 px-5 py-6 text-center";

export const timerLabel =
  "m-0 text-xs font-semibold uppercase tracking-[0.18em] text-primary/90";

export const timerValue =
  "mt-3 font-score text-7xl font-black leading-none tabular-nums text-primary md:text-8xl";

export const fallbackText = "mt-5 text-xl text-text/85";
