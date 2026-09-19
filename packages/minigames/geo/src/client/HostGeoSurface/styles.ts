// The tablet is held in landscape and handed round the table, so the journal
// page fills the canvas and never scrolls: a fixed header band, then a two
// column body that grows into whatever height is left.
export const container =
  "flex h-full min-h-0 flex-col gap-3 border-2 border-double border-gold/40 bg-surfaceAlt p-4 font-serif";

// Right padding keeps the header meta clear of the shell's absolute timer chip.
export const header =
  "flex flex-wrap items-baseline gap-x-5 gap-y-1 border-b border-gold/30 pb-2.5 pr-[clamp(9rem,15vw,12rem)]";

export const headerTitle =
  "m-0 text-xl font-bold uppercase tracking-[0.25em] text-gold";

export const headerMeta = "m-0 ml-auto text-sm italic text-muted";

export const teamLine =
  "m-0 text-sm font-semibold uppercase tracking-[0.18em] text-text";

export const teamName = "ml-2 text-gold";

export const statusNote =
  "border border-gold/30 bg-surface px-4 py-3 text-sm italic text-text/85";

// Same note, but it takes the foot of the dossier where the action button was.
export const dossierNote =
  "mt-auto border border-gold/30 bg-surface px-4 py-3 text-sm italic text-text/85";

// Portrait falls back to a single column; landscape gives the chart the room.
export const playBody =
  "grid min-h-0 flex-1 gap-4 md:grid-cols-[minmax(14rem,1fr)_minmax(0,1.9fr)]";

// Scrollable only as a portrait safety valve — in landscape the column fits.
export const dossierColumn = "flex min-h-0 flex-col gap-3 overflow-y-auto";

export const chartColumn = "flex min-h-0 flex-col gap-2";

// The photo keeps a fixed frame rather than stretching into whatever height is
// left: a party snapshot filling a tall slab crops to somebody's chin.
export const polaroid =
  "relative -rotate-1 flex shrink-0 flex-col border-8 border-text bg-text shadow-xl";

export const polaroidPhoto = "aspect-[4/3] w-full object-cover";

export const polaroidCaption =
  "m-0 shrink-0 px-2 py-1.5 text-center text-sm font-bold italic text-bg";

export const promptHint = "m-0 shrink-0 text-base italic leading-snug text-muted";

// `isolate` keeps Leaflet's own stacking (panes at z-400, controls at z-1000)
// inside this frame. Without it those layers compete with the shell's chrome
// in the same context and the map paints straight over the host's corner dock.
export const mapFrame =
  "isolate min-h-0 flex-1 overflow-hidden border border-gold/40 [&_.leaflet-tile-pane]:sepia [&_.leaflet-tile-pane]:brightness-95";

export const mapFallback =
  "flex h-full w-full items-center justify-center bg-surface text-sm italic text-muted";

export const mapInstruction = "shrink-0 text-xs italic text-muted";

// mt-auto pins the turn's one action to the foot of the dossier, so it lands
// in the same place whether or not the exhibit carries a hint.
const actionButton =
  "mt-auto min-h-14 w-full shrink-0 px-5 font-serif text-base font-bold uppercase tracking-[0.2em] transition disabled:cursor-not-allowed disabled:opacity-40";

export const submitButton = `${actionButton} border-2 border-gold bg-gold/10 text-gold hover:bg-gold/20`;

export const nextPromptButton = `${actionButton} border-2 border-text/30 bg-surface text-text hover:bg-surface/60`;

// Once the guess is stamped the chart column carries the verdict instead, so
// the page keeps its shape between guessing and scoring.
export const resultPanel =
  "flex min-h-0 flex-1 flex-col items-center justify-center gap-6 border border-gold/30 bg-surface";

// The verdict owns the chart's column, so it is sized to fill it rather than
// floating small in the middle of an empty frame.
export const distanceStamp =
  "inline-block -rotate-3 border-[3px] border-primary px-6 py-3 font-serif text-[clamp(1.35rem,2.8vw,2.4rem)] font-black uppercase tracking-[0.12em] text-primary opacity-90";

export const pointsSeal =
  "flex h-[clamp(7rem,13vw,11rem)] w-[clamp(7rem,13vw,11rem)] rotate-6 flex-col items-center justify-center rounded-full border-4 border-gold text-gold";

export const pointsSealValue =
  "font-serif text-[clamp(2rem,4vw,3.5rem)] font-black leading-none";

export const pointsSealLabel =
  "mt-0.5 text-[0.55rem] font-bold uppercase tracking-[0.3em]";
