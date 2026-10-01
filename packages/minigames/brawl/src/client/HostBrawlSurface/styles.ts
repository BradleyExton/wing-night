import { briefingCard } from "@wingnight/surface";

// BRAWL is a `<TakeoverCanvas>` (docs/takeover-layout-api.md §3): the street is evenly spread
// scenery, so a chip in one corner costs a corner of Barrie rather than a word the host has to
// read. This is the placeholder body until the street is drawn; nothing here positions the
// takeover's chrome or reserves the corner dock — the layout owns both.

// Intro phase renders inside the host's own control deck, where a full-bleed street would be
// nonsense — it gets the plain briefing instead. Not a takeover: `rail` and `clock` are both
// null on this beat, so it draws neither.
export const introRoot = "flex flex-col gap-3";

export const introCard = briefingCard;

export const waitingNote = "flex h-full w-full items-center justify-center text-sm text-muted";
