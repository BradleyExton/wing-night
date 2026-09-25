import { takeoverSecondary } from "@wingnight/surface";

// SCHLONIC is a `<TakeoverCanvas>` (docs/takeover-layout-api.md §3): the zone
// is evenly spread scenery — bay, shoreline and skyline — so a chip in one
// corner costs a corner of Barrie rather than a word the host has to read.
//
// Nothing here positions the takeover's chrome and nothing here reserves the
// corner dock. The rail, the clock, the counter's place in the row, the
// bottom-left actions and the bottom-right readout are all the layout's — and
// so is the z-index budget.
//
// The chrome is kept to what a run needs. While the bird is on the hill the
// slots hold two chips, two buttons and nothing else: the run list and the
// round's totals come out only while a run's ending is being shown and once the
// team is through, because the bottom-right corner is where the zone's ground
// band scrolls in and a card there hid the next hazard until it was under the
// hen (DESIGN.md §2.11).

// Intro phase renders inside the host's own control deck, where a full-bleed
// zone would be nonsense — it gets the plain briefing instead. Not a takeover:
// `rail` and `clock` are both null on this beat, so it draws neither.
export const introRoot = "flex flex-col gap-3";

export const introCard =
  "rounded-xl border-2 border-gold bg-gradient-to-b from-surface to-bg px-5 py-4 text-base text-text/90 shadow-[inset_0_0_24px_theme(colors.gold/16%)]";

// The chrome row's read-only counts (§5, `counter`). Glass rather than solid:
// on a Canvas these float over a bright summer sky instead of sitting on a
// panel. Matches JOUST's and FAPPY's chip at the same values, because the host
// moving between the three arcade surfaces should not have to relearn a count.
const chip =
  "inline-flex min-h-9 items-center rounded-full border border-text/10 bg-bg/85 px-3.5 text-[0.78rem] font-semibold text-muted backdrop-blur";

// The run count and, beside it in the same chip, who is running it. The scene
// already draws that player's own hen, so this is the caption on it — and it
// cannot ride in the body the way JOUST's lane plate does: the runner is pinned
// at 46 of the world's 160 units and climbs most of the world's height off a
// springboard, so a plate over the top-left sky would sit in its path.
export const counter = `${chip} gap-2`;

export const counterName = "text-text";

// Wings are the score and the health bar at once (DESIGN.md §2.11), so this is
// the one chip in the chrome that is gold and mono rather than a grey count.
// The big number is what the bird is holding right now, written by the paint
// loop; the smaller pair beside it is what the team has already put on the
// board against par.
export const counterWings = `${chip} gap-2 font-mono text-[0.95rem] tracking-normal text-gold`;

export const counterInHand = "text-[1.15rem] font-extrabold [font-variant-numeric:tabular-nums]";

export const counterBanked = "text-[0.85rem] text-gold/80 [font-variant-numeric:tabular-nums]";

export const counterWingsLabel =
  "text-[0.6rem] font-extrabold uppercase tracking-[0.22em] text-mutedWarmDim";

export const waitingNote =
  "flex h-full w-full items-center justify-center text-sm text-muted";

// The turn's escape hatches and the one-line hint (§5, `actions`). The layout
// floats this bottom-left and bounds its width so it cannot run under the
// corner dock — neither the position nor the max-width is typed here. Glass,
// because they sit over the shoreline rather than in a panel, and `shrink-0`
// so the hint beside them wraps rather than squeezing a 44px target
// (DESIGN.md §2.0A).
export const secondaryButton = `${takeoverSecondary} h-12`;

export const hint = "rounded-xl bg-bg/70 px-3 py-2 text-[0.82rem] italic text-text/75 backdrop-blur";

// The turn's result, in the `readout` above the corner dock with the run list
// and the running totals beside it.
export const finishCard =
  "rounded-xl border-2 border-gold bg-gradient-to-b from-surface to-bg px-4 py-3 text-center";

export const finishTitle = "m-0 text-base font-black uppercase tracking-[0.2em] text-gold";

export const finishPoints = "font-mono text-2xl font-extrabold text-text";
