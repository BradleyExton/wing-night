// Leaflet parks its attribution in the map's bottom-right corner, which on the
// tablet is the corner dock's gutter (§2.0A) — the dock would sit on top of a
// credit OSM's licence requires us to show. Shunting it clear is cheaper than
// re-homing it to the bottom-left, where the turn's CTA already lives.
export const root =
  "relative h-full w-full [&_.leaflet-bottom.leaflet-right]:mr-[4.5rem]";

export const map = "h-full w-full";

// Leaflet's own panes sit at z-index 400-1000, so the strip rides above them.
// Right edge, vertically centred: the tablet is held in landscape and a thumb
// rests there, and both right-hand corners are spoken for (§2.0A).
export const controlStrip =
  "absolute right-[clamp(0.5rem,1vw,0.9rem)] top-1/2 z-[1000] flex -translate-y-1/2 flex-col gap-1.5";

// A phone's chart is too narrow to give an edge away: the same buttons ride its top edge in a row,
// clear of the OSM credit along its foot.
export const controlRow = "absolute left-2 top-2 z-[1000] flex flex-row flex-wrap gap-1.5";

const controlButton =
  "min-h-11 rounded-xl border border-text/15 bg-bg/85 font-bold text-text shadow-lg backdrop-blur transition hover:bg-surfaceAlt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const viewButton = `${controlButton} px-3.5 text-xs uppercase tracking-[0.16em]`;

export const zoomButton = `${controlButton} min-w-11 text-lg leading-none`;

// Said once the tiles fail: a strip along the chart's top edge, under the shell's chrome row on the
// tablet and the card's eyebrow on a phone. It never takes a tap — the map under it still must.
const offlineNoteBase =
  "pointer-events-none absolute inset-x-2 z-[1000] m-0 rounded-xl bg-bg/85 px-3 py-2 text-[0.8rem] leading-snug text-mutedWarm backdrop-blur";

// On the tablet the shell's chrome row (rail, counter, clock) floats over the chart's top edge
// and the photo plate holds its top-left, so the note hangs centred just under the row.
export const offlineNote = `${offlineNoteBase} left-1/2 right-auto top-[clamp(4.4rem,8vh,5.2rem)] w-[min(28rem,40%)] -translate-x-1/2 text-center`;

// On a phone the controls own the top edge, so the note sits above the OSM credit instead.
export const offlineNotePhone = `${offlineNoteBase} bottom-6`;
