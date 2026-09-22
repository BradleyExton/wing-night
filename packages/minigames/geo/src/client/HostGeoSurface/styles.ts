// GEO is a `<TakeoverCanvas>` (docs/takeover-layout-api.md §3): the chart is
// the tablet, and a chip in one corner costs a corner of scenery rather than a
// word the host has to read.
//
// Nothing here positions the takeover's chrome and nothing here reserves the
// corner dock. The rail, the clock, the counter's place in the row, the
// bottom-left actions and the bottom-right readout are all the layout's — and
// so is the z-index budget. The `floating = "absolute z-[1100]"` helper this
// file used to carry picked the dock's own number and was kept off the dock by
// a single `isolate` in this same file; that is the trap §7 exists to remove.

// Intro phase renders inside the deck, where a full-bleed chart would be
// nonsense — it gets the plain note instead. Not a takeover: `rail` and
// `clock` are both null on this beat, so it draws neither.
export const introContainer = "flex flex-col gap-3";

export const statusNote =
  "rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-text/85";

// The map frame, filling the layout's body slot edge to edge.
//
// `isolate` here rather than on the body (§5 forbids a second isolation on the
// body, and the layout already has that one). It is still load-bearing, one
// level in: Leaflet parks its own panes at z-400 and this map's zoom strip at
// z-1000, and without a stacking context around the frame those layers would
// paint over the plate that is their sibling. Containing them here keeps the
// game's interior exactly that — interior — and means nothing GEO draws ever
// competes with the shell's chrome row or the corner dock again.
export const map =
  "relative isolate h-full min-h-0 w-full overflow-hidden rounded-2xl border border-text/10 bg-[#0e1419]";

const chip =
  "inline-flex min-h-9 items-center gap-2 rounded-full border border-text/10 bg-bg/85 px-3.5 text-[0.78rem] font-semibold text-muted backdrop-blur";

// The rail row's read-only count (§5, `counter`). Glass rather than solid: on a
// Canvas this chip floats over the map instead of sitting on a panel.
export const counter = chip;

// The prompt itself — the photo the team is guessing at and the title the host
// reads out. Body content, not chrome: it is the question, and the Canvas's
// slots are for the turn's chrome. It is absolutely positioned inside the body
// slot, which Band 0 (§7) allows without qualification.
//
// `top` clears the shell's chrome row, which is taller than the chip row GEO
// used to float there because it carries the mini-rail and the play clock.
export const plate =
  "absolute left-[clamp(0.6rem,1.2vw,1rem)] top-[clamp(4.4rem,8vh,5.2rem)] w-[clamp(14rem,26vw,20rem)] overflow-hidden rounded-[1.25rem] border border-text/15 bg-gradient-to-br from-surfaceAlt to-surface shadow-[0_22px_50px_rgba(0,0,0,0.7)]";

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

// The turn's one control, plus the hint that explains it (§5, `actions`). The
// layout floats this bottom-left — the one corner where a control is neither
// under the dock nor over the pin the team just placed — and constrains its
// width so it cannot run under the corner. Neither the position nor the
// `max-w-[calc(100%-6rem)]` this file used to hand-type is here any more.
const actionButton =
  "min-h-14 shrink-0 rounded-2xl px-[clamp(1.2rem,3vw,2.2rem)] text-[clamp(0.95rem,1.6vw,1.1rem)] font-black uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-40";

export const submitButton = `${actionButton} bg-primary text-bg shadow-[0_12px_28px_rgba(249,115,22,0.3)] hover:bg-primary/90 disabled:shadow-none`;

export const nextPromptButton = `${actionButton} border border-text/15 bg-bg/85 text-text backdrop-blur hover:bg-surfaceAlt`;

export const mapInstruction =
  "rounded-xl bg-bg/70 px-3 py-2 text-[0.82rem] text-text/75 backdrop-blur";

export const turnCompleteNote =
  "m-0 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-medium text-text backdrop-blur";

// The turn's numbers (§5, `readout`). The layout lifts them clear of the
// corner dock, so the `bottom-[clamp(4.9rem,9vh,5.6rem)]` that used to be
// typed here — the number the spec did not want copied into four more games —
// is gone with it.
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
