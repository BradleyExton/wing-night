import {
  phoneBigTitle,
  phoneCard,
  phoneCardHot,
  phoneEyebrow,
  phoneStampLost,
  phoneStampWon,
  phoneVoice
} from "@wingnight/surface";

// A playing-team phone's GEO card (mockups/phone-answers): the house phone answer card
// (`@wingnight/surface`) with the map as the one thing in it.
export const card = phoneCard;

export const cardHot = phoneCardHot;

export const eyebrow = phoneEyebrow;

export const title = "m-0 break-words text-[1.55rem] font-black leading-[1.05] text-text";

// The chart's ground, `mapGround` (DESIGN.md §0.1, §2.4): a phone that cannot reach the tiles
// still shows the chart's own dark under the graticule.
const sceneMapGround = "bg-mapGround";

// A definite height for Leaflet: most of a portrait phone, never so much the card's words fall off.
export const map = `relative isolate h-[min(52svh,28rem)] min-h-[15rem] w-full overflow-hidden rounded-xl border border-text/10 ${sceneMapGround}`;

export const mapFallback = "flex h-full w-full items-center justify-center text-sm text-mutedWarm";

export const pill =
  "inline-flex items-center gap-2 self-start rounded-full border border-primary/50 bg-primary/15 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-text";

export const pillDot = "h-2 w-2 rounded-full bg-primary [box-shadow:0_0_8px_theme(colors.primary/70%)]";

export const voice = phoneVoice;

export const bigTitle = phoneBigTitle;

export const stampWon = phoneStampWon;

export const stampLost = phoneStampLost;

export const stats = "grid grid-cols-2 gap-2.5";

export const stat = "flex flex-col gap-1 rounded-xl border border-text/10 bg-bg/40 px-3 py-2.5";

export const statLabel = "text-[0.62rem] font-extrabold uppercase tracking-[0.26em] text-mutedWarm";

export const statValue = "font-score text-[1.9rem] font-extrabold leading-none tabular-nums text-text";

export const statUnit = "ml-[0.3em] text-[0.45em] text-mutedWarm";
