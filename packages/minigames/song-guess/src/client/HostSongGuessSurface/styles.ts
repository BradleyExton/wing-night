// SONG_GUESS is a `<TakeoverStage>` with no deck (docs/takeover-layout-api.md
// §3, §4). It is a console, not an arena: the body is the answer the host
// reads out and the round so far they check it against, so there is no corner
// a floating chip could take that is not a word — and the turn needs nine tap
// targets plus a totals panel, which a Canvas has nowhere to put, because its
// two floating slots share the bottom edge and would collide.
//
// The 330px deck went with the layout. Its four cards are now the foot row,
// full width, where both thumbs are on a tablet lying on a table; the body
// keeps the two read-only panes. Gone with it: the `rail` strip and its
// `pr-[clamp(9rem,15vw,12rem)]` reserve for a clock this game has never had
// (`timerKey: null`), and the `railTeam` / `railTeamDot` chip that said a
// second time what the shell's mini-rail says once.
//
// Nothing here positions the takeover's chrome and nothing here reserves the
// corner dock. The rail, the clock, the counter's place in the row and the
// 4.5rem bottom-right gutter are all the layout's.

// Intro renders inside the host's own control deck, where `rail` and `clock`
// are both null, so it draws neither and keeps its own content height.
export const introRoot = "flex flex-col gap-3";

export const introCard =
  "rounded-xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-5 py-4 text-base text-text/90 shadow-[inset_0_0_24px_rgba(251,191,36,0.16)]";

// The rail row's read-only counts (§4, `counter`). "Song 3 of 6" was buried in
// the answer card and the pending chip was on the strip this file no longer
// draws; both are glanced at rather than pressed, so both belong here.
const chip =
  "inline-flex shrink-0 items-center rounded-full border border-text/10 bg-surface px-3.5 py-1.5 text-[0.78rem] font-semibold text-muted";

export const counter = chip;

export const counterPending = `${chip} font-mono text-gold`;

// The body slot: the two things the host reads. The answer takes the width and
// the round so far keeps a narrow column beside it — a read pane, not the deck
// that used to live there, which held every control in the game.
export const body = "flex h-full min-h-0 gap-3";

export const answerPane = "flex min-h-0 min-w-0 flex-1 flex-col";

export const totalsPane = "w-[clamp(200px,17vw,240px)] shrink-0 overflow-y-auto";

// Filling the body rather than sitting at its content height, which is the
// point of the migration: the card was 190px tall in an 887x717 column and
// left the rest of the console black. Centred, so a one-line title and a
// hinted three-line answer both sit where the host's eye lands.
export const answerCard =
  "flex h-full min-h-0 flex-col justify-center gap-1 rounded-xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-[clamp(1.5rem,3vw,3rem)] py-[clamp(1rem,2vh,2rem)] shadow-[inset_0_0_24px_rgba(251,191,36,0.16)]";

export const answerLabel =
  "block text-[0.62rem] font-extrabold uppercase tracking-[0.28em] text-mutedWarmDim";

// Read from across a table on a tablet that is lying flat, at the size the
// card now has rather than the size a content-height card used to leave it.
export const answerTitle =
  "m-0 text-balance font-serif text-[clamp(2rem,4.4vw,4rem)] font-bold italic leading-tight text-text";

export const answerArtist =
  "m-0 mt-1 text-[clamp(1.1rem,2vw,1.9rem)] text-mutedWarm";

export const answerArtistPrefix = "pr-1 italic";

export const badgeRow = "mt-4 flex flex-wrap items-center gap-3";

export const difficultyBadge =
  "rounded-full border border-gold/60 px-3 py-1 text-[0.6rem] font-extrabold uppercase tracking-[0.2em] text-gold";

export const hintText = "m-0 text-[clamp(0.9rem,1.2vw,1.1rem)] italic text-mutedWarm";

// An empty bank stands in for the card, so it fills the same pane rather than
// leaving the console half black on the one beat that is already a fault.
export const waitingNote =
  "flex h-full min-h-0 items-center justify-center rounded-xl border border-text/10 bg-surface px-4 py-3 text-center text-sm text-text/85";

// The foot row (§4, `actions`). One height on every beat, so the card above
// never jumps when the reveal swaps the scoring pad in for one button.
export const actions =
  "flex min-h-[clamp(88px,12.5vh,100px)] items-stretch gap-3";

// Transport absorbs the slack and the ruling group never squeezes: at reveal
// the pad and "Next song" keep their size and the four transport buttons —
// all but one of them disabled by then — give up the width.
export const transport = "flex min-w-0 flex-1 items-stretch gap-2";

export const transportPrimary =
  "flex flex-[1.4] items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 border-[#5fe093] bg-[radial-gradient(ellipse_at_top,#2fb86c_0%,#0e6a36_100%)] px-2 text-[clamp(0.85rem,1.2vw,1.15rem)] font-extrabold uppercase tracking-[0.08em] text-[#061a0c] shadow-[0_4px_0_rgba(0,0,0,0.45)] transition disabled:cursor-not-allowed disabled:opacity-40";

export const transportSecondary =
  "flex-1 rounded-xl border border-[#3a200d] bg-surface px-2 text-[clamp(0.75rem,1vw,0.95rem)] font-extrabold uppercase tracking-[0.1em] text-text transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40";

export const ruling = "flex shrink-0 items-stretch gap-3";

// One skin, two widths, declared as separate exports rather than one export
// plus an override: two `w-[…]` classes on one element are decided by the
// stylesheet's order, not the attribute's, so an override would be a coin toss.
const beatEnder =
  "shrink-0 rounded-xl border-2 border-gold bg-[radial-gradient(ellipse_at_top,#f9a51a_0%,#8a4b06_100%)] text-[clamp(1rem,1.5vw,1.35rem)] font-extrabold uppercase tracking-[0.12em] text-[#1c0d02] shadow-[0_4px_0_rgba(0,0,0,0.45)] transition disabled:cursor-not-allowed disabled:opacity-40";

export const revealButton = `${beatEnder} w-[clamp(14rem,22vw,20rem)]`;

export const nextButton = `${beatEnder} w-[clamp(10rem,15vw,14rem)]`;

export const doneNote =
  "flex items-center rounded-xl border border-gold/40 bg-surface px-6 text-center text-sm text-gold";
