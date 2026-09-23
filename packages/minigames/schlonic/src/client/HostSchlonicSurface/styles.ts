// SCHLONIC is a `<TakeoverCanvas>` (docs/takeover-layout-api.md §3): the zone
// is evenly spread scenery — bay, shoreline and skyline — so a chip in one
// corner costs a corner of Barrie rather than a word the host has to read.
//
// Nothing here positions the takeover's chrome and nothing here reserves the
// corner dock. The rail, the clock, the counter's place in the row, the
// bottom-left actions and the bottom-right readout are all the layout's — and
// so is the z-index budget. Gone with the deck: the 330px `deck` column and
// its cards, the `rail` strip with its `pr-[clamp(9rem,15vw,12rem)]` reserve
// for a shell clock this game has never had (`timerKey: null`, so the layout's
// clock slot draws nothing and takes no width), the `railTeam` / `railTeamDot`
// chip that said a second time what the shell's mini-rail says once, and the
// `arenaHint` row that cost the zone 28px of height to say what a floating
// line says for nothing.

// Intro phase renders inside the host's own control deck, where a full-bleed
// zone would be nonsense — it gets the plain briefing instead. Not a takeover:
// `rail` and `clock` are both null on this beat, so it draws neither.
export const introRoot = "flex flex-col gap-3";

export const introCard =
  "rounded-xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-5 py-4 text-base text-text/90 shadow-[inset_0_0_24px_rgba(251,191,36,0.16)]";

// The chrome row's read-only counts (§5, `counter`). Glass rather than solid:
// on a Canvas these float over a bright summer sky instead of sitting on a
// panel. Matches JOUST's and FAPPY's chip at the same values, because the host
// moving between the three arcade surfaces should not have to relearn a count.
const chip =
  "inline-flex min-h-9 items-center rounded-full border border-text/10 bg-bg/85 px-3.5 text-[0.78rem] font-semibold text-muted backdrop-blur";

export const counter = chip;

// Who is running. The scene already draws that player's own hen, so this is
// the caption on it — and it cannot ride in the body the way JOUST's lane
// plate does: the runner is pinned at 46 of the world's 160 units and climbs
// most of the world's height off a springboard, so a plate over the top-left
// sky would sit in its path. On the chrome row it costs the zone nothing.
export const counterName = `${chip} text-text`;

// Wings are the score and the health bar at once (DESIGN.md §2.11), so the
// tally is the one number in the chrome that is gold and mono rather than a
// grey count.
export const counterWings = `${chip} gap-2 font-mono text-[0.95rem] tracking-normal text-gold`;

export const counterWingsLabel =
  "text-[0.6rem] font-extrabold uppercase tracking-[0.22em] text-mutedWarmDim";

export const waitingNote =
  "flex h-full w-full items-center justify-center text-sm text-muted";

// The turn's escape hatches, the jump legend and the hint (§5, `actions`). The
// layout floats this bottom-left and bounds its width so it cannot run under
// the corner dock — neither the position nor the max-width is typed here.
// Glass, because they now sit over the shoreline rather than in a panel, and
// `shrink-0` so the hint beside them wraps rather than squeezing a 44px target
// (DESIGN.md §2.0A).
export const secondaryButton =
  "min-h-12 shrink-0 rounded-lg border-2 border-mutedWarmDim/60 bg-bg/85 px-4 text-xs font-extrabold uppercase tracking-[0.14em] text-text backdrop-blur transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-45";

// `JUMP / HOLD FOR HEIGHT`, which used to be drawn inside the zone at
// `bottom-3 left-3` — the actions row's own corner. Same corner, same words,
// placed by the layout now instead of by the arena.
export const jumpLegend =
  "flex shrink-0 flex-col gap-0.5 rounded-xl bg-bg/70 px-3 py-1.5 backdrop-blur";

export const jumpLegendLabel = "text-sm font-extrabold uppercase tracking-[0.28em] text-gold";

export const jumpLegendHint = "text-[0.65rem] uppercase tracking-[0.2em] text-mutedWarmDim";

export const hint = "rounded-xl bg-bg/70 px-3 py-2 text-[0.82rem] italic text-text/75 backdrop-blur";

// The turn's result, in the `readout` above the corner dock with the run list
// and the running totals beside it.
export const finishCard =
  "rounded-xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-4 py-3 text-center";

export const finishTitle = "m-0 text-base font-black uppercase tracking-[0.2em] text-gold";

export const finishPoints = "font-mono text-2xl font-extrabold text-text";
