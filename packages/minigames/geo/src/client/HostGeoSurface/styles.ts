// Map First (DESIGN.md §2.4): the chart is the tablet. Everything the host
// needs floats on it as glass, because the map is the thing a team's thumb is
// actually working in and a fixed column was taking a third of it.
//
// `isolate` keeps Leaflet's own stacking (panes at z-400, controls at z-1000)
// inside this frame. Without it those layers compete with the host shell's
// chrome in the same context and the map paints straight over the corner dock.
export const container =
  "relative isolate h-full min-h-0 w-full overflow-hidden rounded-2xl border border-text/10 bg-[#0e1419]";

// Intro phase renders inside the deck, where a full-bleed chart would be
// nonsense — it gets the plain note instead.
export const introContainer = "flex flex-col gap-3";

export const statusNote =
  "rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-text/85";

// Every floating layer rides above Leaflet's controls.
const floating = "absolute z-[1100]";

export const rail = `${floating} left-[clamp(0.6rem,1.2vw,1rem)] top-[clamp(0.6rem,1.2vw,1rem)] flex flex-wrap items-center gap-2 pr-[clamp(9rem,15vw,12rem)]`;

const chip =
  "inline-flex min-h-9 items-center gap-2 rounded-full border border-text/10 bg-bg/85 px-3.5 text-[0.78rem] font-semibold text-muted backdrop-blur";

export const teamChip = `${chip} border-primary/35 bg-primary/15 text-text`;

export const teamChipDot = "h-2.5 w-2.5 shrink-0 rounded-full bg-primary";

export const counterChip = chip;

export const counterChipValue = "font-extrabold text-text";

export const plate = `${floating} left-[clamp(0.6rem,1.2vw,1rem)] top-[clamp(3.9rem,7vh,4.6rem)] w-[clamp(14rem,26vw,20rem)] overflow-hidden rounded-[1.25rem] border border-text/15 bg-gradient-to-br from-surfaceAlt to-surface shadow-[0_22px_50px_rgba(0,0,0,0.7)]`;

export const plateShot = "relative aspect-[4/3]";

export const platePhoto = "h-full w-full object-cover";

export const plateEdge =
  "pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent";

export const plateCaption = "flex flex-col gap-1 px-3.5 pb-3 pt-2.5";

export const plateEyebrow =
  "text-[0.6rem] font-extrabold uppercase tracking-[0.28em] text-primary";

export const plateTitle =
  "m-0 text-balance text-[clamp(0.95rem,1.7vw,1.15rem)] font-extrabold leading-tight text-text";

export const plateHint = "m-0 text-[0.82rem] leading-snug text-muted";

// Bottom-left, so the turn's one action never sits under the corner dock's
// gutter and never covers the pin the team just placed.
export const actionBar = `${floating} bottom-[clamp(0.6rem,1.2vw,1rem)] left-[clamp(0.6rem,1.2vw,1rem)] flex max-w-[calc(100%-6rem)] items-center gap-3`;

const actionButton =
  "min-h-14 shrink-0 rounded-2xl px-[clamp(1.2rem,3vw,2.2rem)] text-[clamp(0.95rem,1.6vw,1.1rem)] font-black uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-40";

export const submitButton = `${actionButton} bg-primary text-bg shadow-[0_12px_28px_rgba(249,115,22,0.3)] hover:bg-primary/90 disabled:shadow-none`;

export const nextPromptButton = `${actionButton} border border-text/15 bg-bg/85 text-text backdrop-blur hover:bg-surfaceAlt`;

export const mapInstruction =
  "rounded-xl bg-bg/70 px-3 py-2 text-[0.82rem] text-text/75 backdrop-blur";

export const turnCompleteNote = `${floating} bottom-[clamp(0.6rem,1.2vw,1rem)] left-[clamp(0.6rem,1.2vw,1rem)] max-w-[calc(100%-6rem)] rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-medium text-text backdrop-blur`;

// Clear of the corner dock (§2.0A): the dock owns a ~4.5rem circle in the
// bottom-right, so the verdict sits above it rather than under it.
export const verdict = `${floating} bottom-[clamp(4.9rem,9vh,5.6rem)] right-[clamp(0.6rem,1.2vw,1rem)] flex gap-2.5`;

const tile =
  "min-w-[8.5rem] rounded-[1.1rem] border px-4 py-2.5 text-right backdrop-blur";

export const distanceTile = `${tile} border-text/10 bg-bg/88`;

export const pointsTile = `${tile} border-primary/40 bg-gradient-to-br from-primary/25 to-primary/[0.07]`;

export const tileLabel =
  "text-[0.62rem] font-extrabold uppercase tracking-[0.24em] text-muted";

export const tileValue =
  "mt-1 font-mono text-[clamp(1.5rem,3vw,1.9rem)] font-extrabold leading-none tabular-nums text-text";

export const pointsTileValue = `${tileValue} text-primary`;

export const tileUnit = "ml-[0.3em] text-[0.42em] text-muted";

export const mapFallback =
  "flex h-full w-full items-center justify-center text-sm text-muted";
