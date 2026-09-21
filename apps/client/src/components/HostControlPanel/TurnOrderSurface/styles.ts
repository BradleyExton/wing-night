import {
  cardBase,
  deckRow,
  deckRowMeta,
  deckRowName,
  sectionDescriptionDefault as sectionDescriptionDefaultToken,
  sectionHeading as sectionHeadingToken
} from "@wingnight/surface";

export const card = cardBase;

export const sectionHeading = sectionHeadingToken;

export const sectionDescription = sectionDescriptionDefaultToken;

export const lockedLabel =
  "mt-2 px-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.28em] text-gold";

export const emptyLabel = "mt-3 px-1.5 text-sm text-muted";

export const list = "mt-3 flex list-none flex-col p-0";

// Rows read like deck rows: name + position meta on the left, the move
// controls as a compact chip pair on the right.
export const listRow = `${deckRow} cursor-default`;

export const teamMeta = "flex min-w-0 flex-col gap-0.5";

export const teamName = deckRowName;

export const positionLabel = deckRowMeta;

export const actions = "ml-auto inline-flex gap-1.5";

export const actionButton =
  "inline-flex min-h-[44px] items-center justify-center rounded-md border border-text/10 bg-text/[0.03] px-3 text-[0.72rem] font-extrabold uppercase tracking-[0.14em] text-muted transition hover:border-text/25 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40";
