export const container = "flex h-full min-h-0 flex-col gap-3";

// Mini-rail strip, echoing the host shell anatomy (DESIGN.md §2.0A).
export const rail =
  "flex flex-wrap items-center gap-x-4 gap-y-1 px-1 pr-[clamp(9rem,15vw,12rem)] text-xs font-extrabold uppercase tracking-[0.22em] text-muted";

export const railTitle = "text-primary";

export const railTeam = "flex items-center gap-2 text-text";

export const railTeamDot = "h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_#f97316]";

// The ring tally is the one number the tablet holder should feel: it is the score and the health
// bar at once.
export const railRings = "ml-auto flex items-baseline gap-2 font-mono text-base tracking-normal text-gold";

export const railRingsLabel = "text-xs text-mutedWarmDim";

export const introCard =
  "rounded-xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-5 py-4 text-base text-text/90 shadow-[inset_0_0_24px_rgba(251,191,36,0.16)]";

export const playArea = "flex min-h-0 flex-1 gap-3";

export const arenaColumn = "flex min-h-0 min-w-0 flex-1 flex-col gap-2";

// The whole zone is the jump button: no scroll, no zoom, no text selection under a frantic
// thumb. The bottom-right gutter is the host's corner dock (DESIGN.md §2.0A), which layers over
// anything drawn here — nothing of ours goes under it.
export const arenaFrame =
  "relative min-h-0 flex-1 touch-none select-none overflow-hidden rounded-xl border-2 border-[#1f6b34] bg-[#0d1f14] shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]";

export const arenaFrameArmed = "cursor-pointer";

export const arenaFrameLocked = "cursor-not-allowed opacity-80";

// The jump legend sits low-LEFT, clear of the corner dock.
export const jumpLegend =
  "pointer-events-none absolute bottom-3 left-3 flex flex-col gap-0.5 rounded-lg bg-[rgba(12,26,16,0.6)] px-3 py-1.5";

export const jumpLegendLabel = "text-sm font-extrabold uppercase tracking-[0.28em] text-gold";

export const jumpLegendHint = "text-[0.65rem] uppercase tracking-[0.2em] text-mutedWarmDim";

// Each run's zone slides in from the right as the last one wipes; the remount keys it, and the
// keyframes live in the client's index.css.
export const runEnter = "h-full w-full motion-safe:animate-[schlonic-scene-enter_420ms_ease-out_both]";

// The handoff callout drops over the zone for the beat: a dim pool in the middle of the scene
// and the next player's name, nothing else.
export const handoffOverlay =
  "pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-[radial-gradient(ellipse_at_center,rgba(12,26,16,0.72)_0%,rgba(12,26,16,0)_68%)] motion-safe:animate-[schlonic-callout_520ms_cubic-bezier(0.2,1.4,0.4,1)_both]";

export const handoffLead = "text-[0.7rem] font-extrabold uppercase tracking-[0.34em] text-gold";

export const handoffName =
  "font-serif text-[clamp(2rem,5vw,3.4rem)] font-bold italic leading-none text-text [text-shadow:0_0_24px_rgba(251,191,36,0.55)]";

export const arenaHint = "m-0 px-1 text-center text-sm italic text-muted";

export const deck = "flex w-[clamp(230px,28vw,330px)] flex-col gap-3";

export const runCard =
  "rounded-xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-4 py-3 shadow-[inset_0_0_24px_rgba(251,191,36,0.16)]";

export const runCounter = "text-[0.62rem] font-extrabold uppercase tracking-[0.3em] text-gold";

export const runningName = "m-0 mt-1 text-lg font-black text-text";

export const runMeta = "mt-1 flex flex-wrap items-center gap-2 text-xs text-mutedWarmDim";

export const finishCard =
  "rounded-xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-4 py-3 text-center";

export const finishTitle = "m-0 text-base font-black uppercase tracking-[0.2em] text-gold";

export const finishPoints = "font-mono text-2xl font-extrabold text-text";

export const deckRows = "flex flex-col gap-2";

export const deckRowButton =
  "w-full rounded-lg border-2 border-mutedWarmDim/60 bg-surface px-3 py-2 text-sm font-bold uppercase tracking-[0.14em] text-text disabled:opacity-45";

export const historyRow = "flex flex-col gap-1 rounded-lg border border-mutedWarmDim/40 px-3 py-2";

export const historyTitle = "text-[0.6rem] font-extrabold uppercase tracking-[0.28em] text-mutedWarmDim";

export const historyEntry = "flex items-center justify-between gap-2 text-xs text-text";

export const historyEntryActive = "text-gold";

export const totalsCard = "flex flex-col gap-1 rounded-lg border border-mutedWarmDim/40 px-3 py-2";

export const totalsTitle = "text-[0.6rem] font-extrabold uppercase tracking-[0.28em] text-mutedWarmDim";

export const totalsRow = "flex items-center justify-between gap-2 text-xs text-muted";

export const totalsRowActive = "text-text";

export const totalsPoints = "font-mono text-text";

export const totalsNote = "text-[0.6rem] uppercase tracking-[0.18em] text-mutedWarmDim";
