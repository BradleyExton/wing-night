// JOUST is a `<TakeoverCanvas>` (docs/takeover-layout-api.md §3): the lane is
// evenly spread scenery, so a chip in one corner costs a corner of desert
// rather than a word the host has to read.
//
// Nothing here positions the takeover's chrome and nothing here reserves the
// corner dock. The rail, the clock, the counter's place in the row, the
// bottom-left actions and the bottom-right readout are all the layout's — and
// so is the z-index budget. Gone with the deck: the 330px `deck` column and
// its four cards, the `rail` strip with its `pr-[clamp(9rem,15vw,12rem)]`
// reserve for a clock this game has never had (`timerKey: null`), and the
// `railTeam` / `railTeamDot` chip that said a second time what the shell's
// mini-rail says once.

// Intro phase renders inside the deck, where a full-bleed lane would be
// nonsense — it gets the plain briefing instead. Not a takeover: `rail` and
// `clock` are both null on this beat, so it draws neither.
export const introRoot = "flex flex-col gap-3";

export const introCard =
  "rounded-xl border-2 border-gold bg-gradient-to-b from-surface to-bg px-5 py-4 text-base text-text/90 shadow-[inset_0_0_24px_theme(colors.gold/16%)]";

// Scene art, licensed by DESIGN.md §2.7: the lane's dusk sky and sand. Not chrome, so no token.
const sceneDusk =
  "bg-[linear-gradient(180deg,#160c2a_0%,#4a1f3f_54%,#c2582c_86.6%,#d6ac63_86.7%,#b58a45_100%)]";

// The lane, filling the layout's body slot edge to edge. It keeps the marquee
// frame (DESIGN.md §2.7) and the dusk gradient the backdrop bleeds over, and
// it is `relative` so the plate can sit in its sky — but it no longer sets
// `min-h-0 flex-1`, because it is no longer a column's child: the body slot
// has a definite height and the frame fills it.
export const arenaFrame = `relative h-full w-full overflow-hidden rounded-xl border-2 border-ember/20 ${sceneDusk} shadow-[inset_0_0_30px_theme(colors.shade/50%)]`;

// Which lane and whose go, over the sky at top-left. `top` clears the shell's
// chrome row, which carries the mini-rail and the play clock and is taller
// than a chip. `pointer-events-none` because the whole frame under it is the
// drag surface that fires the shot.
export const plate =
  "pointer-events-none absolute left-[clamp(0.6rem,1.2vw,1rem)] top-[clamp(4.4rem,8vh,5.2rem)] max-w-[clamp(12rem,24vw,18rem)] rounded-xl border border-gold/35 bg-bg/70 px-4 py-2.5 backdrop-blur";

export const plateTitle =
  "m-0 font-serif text-xl font-bold italic leading-tight text-text";

export const plateShooter = "m-0 mt-0.5 text-sm text-mutedWarm";

// The rail row's read-only counts (§5, `counter`). Glass rather than solid: on
// a Canvas these float over the lane instead of sitting on a panel.
const chip =
  "inline-flex min-h-9 items-center rounded-full border border-text/10 bg-bg/85 px-3.5 text-[0.78rem] font-semibold text-muted backdrop-blur";

export const counter = chip;

export const counterPending = `${chip} font-mono text-gold`;

// The plaque names everyone the shot felled, and a cleared rack is every
// standing player on one line — 963px of it on the sandbox's roster, which in
// a 330px deck column wrapped for free and on a full-bleed canvas does not.
// The layout bounds the readout row it sits in, but only against the opposite
// corner; how wide a game's own card should be is the game's to say.
export const resultCard =
  "max-w-[clamp(16rem,26vw,22rem)] rounded-xl border border-ember/20 bg-gradient-to-b from-surface to-bg px-4 py-3 text-center";

export const resultTitle =
  "m-0 text-2xl font-black uppercase tracking-[0.08em] text-text [text-shadow:0_0_14px_theme(colors.gold/35%)]";

export const resultTitleHit = "text-gold";

export const resultBlurb = "m-0 mt-1 text-sm italic text-mutedWarm";

export const resultPoints = "mt-2 block font-mono text-3xl font-black text-gold";

export const waitingNote =
  "flex h-full w-full items-center justify-center text-sm text-muted";

// The turn's controls, plus the hint that explains them (§5, `actions`). The
// layout floats this bottom-left and constrains its width so it cannot run
// under the corner dock — neither the position nor the max-width is typed
// here. The buttons only have to be their own size now that they are a row
// rather than a 330px column, so the `w-full` and `flex-1` are gone.
export const primaryButton =
  "min-h-14 shrink-0 rounded-xl border-2 border-primary bg-primary px-[clamp(1.2rem,3vw,2.2rem)] text-lg font-extrabold uppercase tracking-[0.12em] text-bg shadow-[0_4px_0_theme(colors.shade/45%)] transition disabled:cursor-not-allowed disabled:opacity-40";

export const secondaryButton =
  "min-h-12 shrink-0 rounded-lg border border-ember/20 bg-bg/85 px-4 text-xs font-extrabold uppercase tracking-[0.14em] text-text backdrop-blur transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40";

export const hint = "rounded-xl bg-bg/70 px-3 py-2 text-[0.82rem] italic text-text/75 backdrop-blur";

export const doneNote =
  "m-0 rounded-xl border border-gold/40 bg-bg/85 px-4 py-3 text-center text-sm text-gold backdrop-blur";
