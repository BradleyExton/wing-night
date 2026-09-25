import { takeoverSecondary } from "@wingnight/surface";

// FAPPY is a `<TakeoverCanvas>` (docs/takeover-layout-api.md §3): the corridor
// is evenly spread scenery — dusk sky, sand and a row of champs — so a chip in
// one corner costs a corner of desert rather than a word the host has to read.
//
// Nothing here positions the takeover's chrome and nothing here reserves the
// corner dock. The rail, the clock, the counter's place in the row, the
// bottom-left actions and the bottom-right readout are all the layout's — and
// so is the z-index budget. Gone with the deck: the 330px `deck` column and
// its four cards, the `rail` strip with its `pr-[clamp(9rem,15vw,12rem)]`
// reserve for a shell clock this game has never had (`timerKey: null` — its
// own relay clock is a count, and rides in the `counter` slot), the
// `railTeam` / `railTeamDot` chip that said a second time what the shell's
// mini-rail says once, and the `arenaHint` row that cost the corridor 28px of
// height to say what a floating line says for nothing.

// Intro phase renders inside the host's own control deck, where a full-bleed
// corridor would be nonsense — it gets the plain briefing instead. Not a
// takeover: `rail` and `clock` are both null on this beat, so it draws neither.
export const introRoot = "flex flex-col gap-3";

export const introCard =
  "rounded-xl border-2 border-gold bg-gradient-to-b from-surface to-bg px-5 py-4 text-base text-text/90 shadow-[inset_0_0_24px_theme(colors.gold/16%)]";

// The chrome row's read-only counts (§5, `counter`). Glass rather than solid:
// on a Canvas these float over the corridor's sky instead of sitting on a
// panel. Matches JOUST's chip at the same values, because the host moving
// between the two arcade surfaces should not have to relearn a count.
const chip =
  "inline-flex min-h-9 items-center rounded-full border border-text/10 bg-bg/85 px-3.5 text-[0.78rem] font-semibold text-muted backdrop-blur";

export const counter = chip;

// Who is flying. The scene already draws that player's own hen, so this is the
// caption on it — but it cannot ride in the body the way JOUST's lane plate
// does, because the bird is pinned at 20% of the scene's width and a plate
// over the top-left sky would sit in its flight path. On the chrome row it
// costs the corridor nothing and is never flown through.
export const counterName = `${chip} text-text`;

export const waitingNote =
  "flex h-full w-full items-center justify-center text-sm text-muted";

// The turn's escape hatches, plus the hint that explains the tap (§5,
// `actions`). The layout floats this bottom-left and bounds its width so it
// cannot run under the corner dock — neither the position nor the max-width is
// typed here. Glass, because they now sit over the corridor rather than in a
// panel, and `shrink-0` so the hint beside them wraps rather than squeezing a
// 44px target (DESIGN.md §2.0A).
export const secondaryButton = `${takeoverSecondary} h-12`;

// The hint, beside the buttons it explains — and a `<span>`, which is now the
// whole of what keeps it out of the way. It used to take a pointer it has no
// use for, because the layout handed `pointer-events-auto` to every child of
// the actions row: right for the map GEO drew that rule for, and 764x48 of
// 1229x749 — 4.0% of a corridor where a tap means flap — dead on this one. A
// `pointer-events-none` here could not have fixed it (equal specificity, and
// the layout's rule ordered later), so the fix is in `<TakeoverCanvas>`: the
// row grants the pointer to controls rather than to children, and a sentence
// is not a control. Nothing in this file asks for that, which is the point.
export const hint =
  "rounded-xl bg-bg/70 px-3 py-2 text-[0.82rem] italic text-text/75 backdrop-blur";

// The relay's result, in the `readout` above the corner dock with the running
// totals under it.
export const finishCard =
  "rounded-xl border border-ember/20 bg-gradient-to-b from-surface to-bg px-4 py-3 text-center";

export const finishTitle =
  "m-0 text-2xl font-black uppercase tracking-[0.08em] text-gold [text-shadow:0_0_14px_theme(colors.gold/35%)]";

export const finishTitleTimedOut = "text-heat";

export const finishTime = "mt-1 block font-mono text-lg text-text";

export const finishPoints = "mt-1 block font-mono text-3xl font-black text-gold";

// Why the finish card's clock reads later than the one the host watched run.
export const finishPenalty =
  "mt-1 block text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-heat";
