// Canvas-first takeover (DESIGN.md §2.5): a one-line rail on top, the easel
// taking every pixel between, and a single toolbar row at the foot. The deck
// column the surface used to carry cost the board ~40% of the tablet for
// controls the artist presses a handful of times a turn.
export const container = "flex h-full min-h-0 flex-col gap-[clamp(0.4rem,1vh,0.75rem)]";

// Mini-rail strip, echoing the host shell anatomy (DESIGN.md §2.0A). The
// prompt rides in its middle column so the artist reads it without the board
// giving up any height to a card.
// `auto` on the outer columns rather than `1fr`: the identity strip wrapping
// to a second line costs the board ~40px of height it never gets back.
export const rail =
  "grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-3";

export const railIdentity =
  "flex items-center gap-4 whitespace-nowrap text-xs font-extrabold uppercase tracking-[0.22em] text-muted";

export const railTitle = "text-primary";

export const railTeam = "flex items-center gap-2 text-text";

export const railTeamDot =
  "h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_theme(colors.primary)]";

export const railPending = "text-right font-mono text-sm font-extrabold text-gold";

// Prompt card keeps the gold marquee framing of §2.5, on the app's own
// surface tokens rather than a scoped brown.
export const promptCard =
  "flex flex-col items-center justify-self-center rounded-2xl border-2 border-gold bg-gradient-to-b from-surfaceAlt to-surface px-[clamp(1rem,2vw,1.75rem)] py-1.5 text-center";

export const promptCardLabel =
  "text-[0.55rem] font-extrabold uppercase tracking-[0.3em] text-gold";

export const promptCardText =
  "m-0 font-serif text-[clamp(1.2rem,2.4vw,1.9rem)] font-bold italic leading-tight text-text";

export const waitingNote =
  "rounded-2xl border border-text/10 bg-surface px-4 py-2 text-sm text-muted";

export const introCard =
  "rounded-2xl border-2 border-gold bg-gradient-to-b from-surfaceAlt to-surface px-5 py-4 text-base leading-6 text-text/90";

// Canvas row: ink rail down the left, board taking the rest. The board
// letterboxes to 16:10 against the available height, so the rail's width is
// slack the board was never going to use.
export const easelRow = "flex min-h-0 flex-1 gap-[clamp(0.35rem,0.8vw,0.6rem)]";

export const inkRail =
  "flex h-fit w-14 shrink-0 flex-col items-center gap-2 self-center rounded-2xl border border-text/10 bg-surface py-2";

export const easelArea = "relative min-h-0 min-w-0 flex-1";

// Transient (2s) result line, floated over the board rather than holding a
// row of its own in the layout.
export const revealLine =
  "pointer-events-none absolute left-1/2 top-3 z-10 m-0 -translate-x-1/2 rounded-full border border-gold/40 bg-bg/90 px-4 py-1.5 text-sm font-semibold italic text-text/85";

// The shell floats the host's corner dock over the bottom-right of the
// takeover canvas (DESIGN.md §2.0A), so the toolbar keeps a gutter clear of
// it rather than putting a control underneath.
export const toolbar =
  "flex shrink-0 items-center gap-[clamp(0.35rem,0.9vw,0.7rem)] rounded-2xl border border-text/10 bg-surface px-3 py-2 pr-[4.5rem]";

export const toolGroup = "flex items-center gap-2";

export const toolButton =
  "min-h-11 rounded-xl border border-text/10 bg-surfaceAlt px-4 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-text transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40";

export const verdictGroup = "ml-auto flex items-center gap-2";

// Functional success/danger per §0.1, in the same weight the other host
// verdict controls use (see EMOJI_CHARADES §2.6).
const verdictBase =
  "flex min-h-11 items-center gap-2 rounded-xl border-2 px-[clamp(0.9rem,1.8vw,1.5rem)] text-sm font-extrabold uppercase tracking-[0.1em] text-text transition disabled:cursor-not-allowed disabled:opacity-40";

export const verdictCorrect = `${verdictBase} border-success/60 bg-success/20 hover:bg-success/30`;

export const verdictIncorrect = `${verdictBase} border-danger/60 bg-danger/20 hover:bg-danger/30`;

export const verdictIcon = "text-lg leading-none";

// Inks are drawing content, not UI accents, so the swatches carry their own
// color inline and the tray stays on surface tokens.
export const inkLight =
  "h-11 w-11 rounded-full border-2 border-black/40 transition disabled:cursor-not-allowed disabled:opacity-40";

export const inkLightSelected =
  "outline outline-[3px] outline-offset-2 outline-gold";
