// Map Theatre (DESIGN.md §2.4): the marquee row every other minigame wears,
// and under it the dark chart as the arena for the whole turn. The photo rides
// in a corner card rather than owning the stage, because what the room is
// actually watching is the pin move.
export const stage =
  "flex h-full w-full flex-col gap-[clamp(0.7rem,1.2vh,1.2rem)] bg-bg p-[clamp(0.8rem,1.4vw,1.6rem)]";

export const marquee =
  "relative grid grid-cols-[1fr_auto_1fr] items-center gap-6 rounded-2xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-[clamp(1.4rem,2.4vw,2.4rem)] py-[clamp(0.8rem,1.4vh,1.3rem)] shadow-[inset_0_0_36px_rgba(251,191,36,0.2),0_8px_20px_rgba(0,0,0,0.55)]";

export const marqueeBulbs =
  "pointer-events-none absolute inset-[7px] rounded-xl border-4 border-dotted border-gold/45";

export const marqueeTeam = "flex items-baseline gap-[clamp(0.6rem,1.2vw,1.2rem)]";

export const marqueeTeamName =
  "m-0 text-[clamp(1.2rem,2vw,2.1rem)] font-black uppercase tracking-[0.06em] text-text";

export const marqueeTeamPoints =
  "font-mono text-[clamp(0.95rem,1.4vw,1.5rem)] font-extrabold text-gold";

export const marqueeTitle =
  "text-center text-[clamp(0.8rem,1.2vw,1.3rem)] font-extrabold uppercase tracking-[0.34em] text-gold";

// Right padding keeps the counter clear of the display's absolute timer chip
// pinned to the stage's top-right corner.
export const marqueeCounter =
  "pr-[clamp(8rem,14vw,18rem)] text-right text-[clamp(0.72rem,1vw,1.05rem)] font-extrabold uppercase tracking-[0.28em] text-mutedWarmDim";

export const marqueeCounterValue = "text-text";

// `isolate` keeps Leaflet's own stacking (panes at z-400, controls at z-1000)
// inside the arena. Without it those layers compete with the display shell's
// chrome in the same context and the map paints over it.
export const arena =
  "relative isolate flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-text/10 bg-[#0e1419]";

export const mapLayer = "absolute inset-0";

// The chart is a full-bleed photograph of the world, and a flat one reads as a
// screenshot. The vignette gives it an edge and, more usefully, guarantees the
// corner cards always have something dark to sit on.
export const vignette =
  "pointer-events-none absolute inset-0 z-[1050] bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.72)_100%)]";

export const idleBody = "grid flex-1 place-items-center px-[10%] text-center";

export const idleText =
  "m-0 text-[clamp(1.4rem,2.4vw,2.6rem)] font-semibold text-muted";

// Both corner stacks ride above Leaflet's controls (z-1000) and the vignette.
const cornerStack = "absolute z-[1100] flex flex-col";

export const plate = `${cornerStack} bottom-[clamp(1.4rem,3vh,3.2rem)] left-[clamp(1rem,2.4vw,2.6rem)] w-[clamp(17rem,30vw,34rem)] overflow-hidden rounded-[1.25rem] border border-text/15 bg-gradient-to-br from-surfaceAlt to-surface shadow-[0_26px_60px_rgba(0,0,0,0.75)]`;

export const plateShot = "relative aspect-[4/3]";

export const platePhoto = "h-full w-full object-cover";

// One primary hairline along the top edge — the house "this is the live thing"
// mark, and the surface's only use of primary outside the points tile.
export const plateEdge =
  "pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent";

export const plateCaption =
  "flex flex-col gap-1 px-[clamp(0.8rem,1.4vw,1.4rem)] py-[clamp(0.6rem,1.1vh,1.1rem)]";

export const plateEyebrow =
  "text-[clamp(0.6rem,0.85vw,0.9rem)] font-extrabold uppercase tracking-[0.3em] text-primary";

export const plateTitle =
  "m-0 text-balance text-[clamp(1.1rem,1.9vw,2rem)] font-extrabold leading-tight text-text";

export const plateHint =
  "m-0 text-[clamp(0.8rem,1.2vw,1.25rem)] leading-snug text-muted";

export const readout = `${cornerStack} bottom-[clamp(1.4rem,3vh,3.2rem)] right-[clamp(1rem,2.4vw,2.6rem)] items-end gap-[clamp(0.6rem,1.1vh,1rem)]`;

export const status =
  "inline-flex items-center gap-[0.7rem] rounded-full border border-primary/35 bg-bg/85 px-[clamp(0.9rem,1.5vw,1.5rem)] py-[clamp(0.35rem,0.7vh,0.7rem)] text-[clamp(0.7rem,1.05vw,1.1rem)] font-extrabold uppercase tracking-[0.18em] text-text backdrop-blur";

export const statusDot =
  "h-[0.6em] w-[0.6em] shrink-0 rounded-full bg-primary motion-safe:[animation:pulse_1.6s_ease-in-out_infinite]";

export const resultRow = "flex gap-[clamp(0.6rem,1.2vw,1.2rem)]";

// Reveal stats are stat tiles, the same shape the rest of the show uses for a
// number worth reading — not rotated rubber stamps.
const tile =
  "min-w-[clamp(8rem,13vw,13rem)] rounded-[1.1rem] border px-[clamp(0.9rem,1.6vw,1.6rem)] py-[clamp(0.6rem,1.2vh,1.2rem)] text-right backdrop-blur";

export const distanceTile = `${tile} border-text/10 bg-bg/88`;

export const pointsTile = `${tile} border-primary/40 bg-gradient-to-br from-primary/25 to-primary/[0.07]`;

export const tileLabel =
  "text-[clamp(0.6rem,0.9vw,0.95rem)] font-extrabold uppercase tracking-[0.26em] text-muted";

export const tileValue =
  "mt-1 font-mono text-[clamp(1.5rem,3vw,3.2rem)] font-extrabold leading-none tabular-nums text-text";

export const pointsTileValue = `${tileValue} text-primary`;

export const tileUnit = "ml-[0.3em] text-[0.42em] text-muted";

export const legendRow =
  "flex gap-[clamp(0.8rem,1.4vw,1.4rem)] text-[clamp(0.68rem,1vw,1.05rem)] font-bold uppercase tracking-[0.18em] text-muted";

export const legendEntry = "flex items-center gap-2";

export const legendGuessDot = "h-[0.7em] w-[0.7em] rounded-full bg-primary";

export const legendAnswerDot = "h-[0.7em] w-[0.7em] rounded-full bg-success";
