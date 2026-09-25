// Three bands, top to bottom: the wordmark, the lineup, and a floor the cast
// owns. The floor is padding rather than a flex child so the birds
// (CastParade, absolutely positioned) get a strip nothing else can grow into,
// and its height is the cast container's — change them together.
export const container =
  "relative isolate flex h-full flex-col items-center justify-center gap-[clamp(1.25rem,3.5vh,3.5rem)] overflow-hidden px-[clamp(2rem,4vw,4rem)] pb-[clamp(6rem,14vh,17rem)] pt-[clamp(1.5rem,3vw,3rem)] text-center";

// Stacking, back to front: ambient floor glow → heat bloom → flame → embers → vignette
// and grain → cast (CastParade, above the vignette so team colours stay bright at the
// foot of the stage) → content. The vignette sits ABOVE the flame so its tips dim into the frame
// rather than ending in a hard edge behind the wordmark.
export const ambient =
  "pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_100%,theme(colors.primary/30%)_0%,transparent_60%),radial-gradient(ellipse_45%_35%_at_50%_100%,theme(colors.heat/30%)_0%,transparent_55%),radial-gradient(ellipse_90%_50%_at_50%_0%,theme(colors.shade/55%)_0%,transparent_65%)]";

export const heatBloom =
  "pointer-events-none absolute bottom-[-12%] left-1/2 z-0 h-[62%] w-[72%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,theme(colors.gold/30%),theme(colors.primary/16%)_45%,transparent_100%)] blur-3xl [animation:breathe_5s_ease-in-out_infinite] motion-reduce:[animation:none]";

export const vignette =
  "pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,theme(colors.bg/60%)_0%,transparent_30%),radial-gradient(ellipse_75%_72%_at_50%_45%,transparent_48%,theme(colors.shade/62%)_100%)]";

export const grain = "display-grain pointer-events-none absolute inset-0 z-[1]";

// The lobby floor: the plane the cast walks on, meeting the standings deck's
// tread at the bottom edge of the stage (DESIGN.md §2.2C). It has to be drawn
// HERE rather than by the deck, because the footer paints above the stage and
// anything it reached up with would cover the birds.
//
// Dark where the floor recedes, warming into a lit sill at the deck line —
// which is the whole reason it exists: a black pool of shade under a bird on
// black is no shade at all, and the cast reads as stickers again. Above the
// vignette with the parade, so the sill is not dimmed back out.
export const floor =
  "pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[clamp(2.2rem,5vh,5.2rem)] bg-[linear-gradient(180deg,transparent_0%,theme(colors.glow/4%)_44%,theme(colors.glow/10%)_72%,theme(colors.glow/19%)_92%,theme(colors.glow/26%)_100%)]";

// The light the deck's lit lip throws back up into the air over the floor.
export const floorBloom =
  "pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[clamp(0.5rem,1vh,1.1rem)] bg-[linear-gradient(0deg,theme(colors.ember/22%)_0%,transparent_100%)] blur-[2px]";

// Entrance choreography. Everything mounts hidden and reveals top-down: eyebrow, wordmark,
// then the round cards in reading order, then the corner status pill last. Delays live inside
// the shorthand (see Embers/styles.ts for why) and `both` keeps the hidden start state.

export const header =
  "relative z-[2] flex flex-col items-center gap-[clamp(0.6rem,1vw,1.1rem)]";

export const eyebrowRow = `flex items-center gap-[clamp(0.8rem,1.2vw,1.5rem)] [animation:reveal_700ms_cubic-bezier(0.2,0.7,0.2,1)_0ms_both] motion-reduce:[animation:none]`;

export const eyebrowRuleLeft =
  "h-px w-[clamp(3rem,6vw,8rem)] bg-gradient-to-r from-transparent to-mutedWarm/70";

export const eyebrowRuleRight =
  "h-px w-[clamp(3rem,6vw,8rem)] bg-gradient-to-l from-transparent to-mutedWarm/70";

export const eyebrow =
  "text-[clamp(0.85rem,1.1vw,1.2rem)] font-extrabold uppercase tracking-[0.42em] text-mutedWarm [text-shadow:0_0_20px_theme(colors.shade/70%)]";

// The glow is a drop-shadow on the wrapper rather than a text-shadow on the wordmark:
// text-shadow paints behind the glyphs and shows straight through background-clip text.
export const headingGlow =
  "[filter:drop-shadow(0_0_28px_theme(colors.gold/32%))_drop-shadow(0_0_90px_theme(colors.primary/28%))]";

export const heading = `setup-wordmark m-0 text-[clamp(3.5rem,9vw,12rem)] font-black uppercase leading-[0.9] tracking-[-0.02em] [animation:heroReveal_900ms_cubic-bezier(0.2,0.7,0.2,1)_120ms_both,shine_9s_ease-in-out_2.4s_infinite] motion-reduce:[animation:none]`;

export const rounds =
  "relative z-[2] grid w-full max-w-[1640px] grid-cols-4 gap-y-[clamp(0.6rem,1.1vw,1.4rem)] gap-x-[clamp(0.7rem,1.3vw,1.6rem)]";

const roundBase = `relative isolate flex flex-col items-center overflow-hidden rounded-[clamp(0.6rem,0.9vw,1.1rem)] px-[clamp(0.8rem,1.1vw,1.2rem)] py-[clamp(0.9rem,1.4vw,1.5rem)] text-center [animation:reveal_700ms_cubic-bezier(0.2,0.7,0.2,1)_var(--reveal-delay,0s)_both] motion-reduce:[animation:none]`;

// A lit card: warm glass with a hairline ember rule along the top edge that fades into the
// corners, and a faint glow pooling under that rule.
export const round = `${roundBase} border border-primary/20 bg-[linear-gradient(180deg,theme(colors.hearthGlass/84%)_0%,theme(colors.shade/93%)_100%)] backdrop-blur-[3px] [box-shadow:inset_0_1px_0_theme(colors.glow/14%),0_18px_40px_-20px_theme(colors.shade/80%)] before:absolute before:inset-x-[12%] before:top-0 before:z-[1] before:h-px before:bg-gradient-to-r before:from-transparent before:via-ember before:to-transparent before:content-[''] after:pointer-events-none after:absolute after:inset-0 after:z-0 after:bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,theme(colors.primary/16%),transparent_70%)] after:content-['']`;

// An open slot: same footprint, dashed and dim, so the lineup reads as "eight seats, six
// filled" rather than two broken cards.
export const roundPlaceholder = `${roundBase} border border-dashed border-mutedWarmDim/50 bg-bg/80 opacity-90 backdrop-blur-[2px]`;

// Staggered in reading order. Slots past the eighth share the last delay.
export const roundRevealDelays: readonly string[] = [
  "[--reveal-delay:360ms]",
  "[--reveal-delay:420ms]",
  "[--reveal-delay:480ms]",
  "[--reveal-delay:540ms]",
  "[--reveal-delay:600ms]",
  "[--reveal-delay:660ms]",
  "[--reveal-delay:720ms]",
  "[--reveal-delay:780ms]"
];

export const roundWatermark =
  "pointer-events-none absolute -right-[0.06em] -top-[0.18em] z-0 select-none font-score tabular-nums text-[clamp(3.2rem,5.5vw,7rem)] font-black leading-none tracking-[-0.06em] text-text/[0.06]";

// A lit card has three tiers, not four: one eyebrow line (round number, then
// its label), the sauce as the headline, the mini-game as a pill. The number
// and the label used to be two stacked lines of near-equal weight that fought
// the sauce for the eye; on one line the number is a small primary tag and
// the label reads as its caption.
export const roundMeta =
  "relative z-[1] m-0 flex flex-wrap items-baseline justify-center gap-x-[0.7em] gap-y-[0.2em] text-[clamp(0.72rem,0.95vw,1.1rem)] font-bold uppercase leading-none tracking-[0.18em]";

export const roundNum = "font-score tabular-nums font-extrabold tracking-[0.2em] text-primary";

export const roundMetaDot = "h-[0.3em] w-[0.3em] self-center rounded-full bg-primary/60";

export const roundLabel = "text-mutedWarm";

// An open slot's eyebrow: same line, but the "Round 07: Open Slot" tag has no
// primary — the seat is empty, so nothing about it should glow.
export const roundNumMuted =
  "relative z-[1] font-score tabular-nums text-[clamp(0.7rem,0.9vw,1.25rem)] font-extrabold uppercase leading-none tracking-[0.28em] text-mutedWarm/80";

// The instruction is a footnote, not a headline: sentence case, no tracking,
// dim, and well under the sauce size so six lit sauces stay the loud thing.
export const roundPlaceholderSummary =
  "relative z-[1] mx-auto mb-0 mt-[0.5em] max-w-[16em] text-[clamp(0.78rem,1vw,1.15rem)] font-medium leading-snug text-mutedWarmDim";

// Sized so the longest sample sauce ("Classic Buffalo") holds one line in a
// four-up card at 1080p; the two-word habaneros may still break, on purpose.
export const sauce =
  "relative z-[1] mb-0 mt-[0.45em] text-[clamp(1.2rem,1.85vw,2.6rem)] font-black uppercase leading-[0.95] tracking-[-0.005em] text-text [text-shadow:0_0_18px_theme(colors.primary/45%),0_2px_0_theme(colors.shade/40%)]";

export const sauceMuted =
  "relative z-[1] mb-0 mt-[0.35em] text-[clamp(1.2rem,1.85vw,2.6rem)] font-black uppercase leading-[0.95] tracking-[-0.005em] text-mutedWarmDim/60";

export const minigame =
  "relative z-[1] mt-[0.8em] inline-flex items-center gap-[0.55em] rounded-full border border-text/10 bg-text/[0.05] px-[0.95em] py-[0.38em] text-[clamp(0.68rem,0.9vw,1rem)] font-bold uppercase tracking-[0.2em] text-mutedWarm";

export const minigameDot =
  "h-[0.5em] w-[0.5em] rounded-full bg-primary/85 [box-shadow:0_0_8px_theme(colors.primary/70%)]";

export const additionalRounds =
  "relative z-[2] -mt-2 text-[clamp(0.85rem,1.1vw,1.2rem)] font-bold uppercase tracking-[0.28em] text-mutedWarmDim";

// The room's status lives in the top-left corner as the twin of the
// now-playing pill in the top-right (NowPlayingSurface/styles): same insets,
// same glass, same badge size, so the two read as one top line and the
// centre of the screen belongs to the wordmark and the lineup alone. It used
// to sit in the flow under the cards, where a status line competed with the
// content it was reporting on.
export const waiting = `pointer-events-none absolute left-4 top-2 z-[3] inline-flex items-center gap-[clamp(0.5rem,0.85vw,0.95rem)] rounded-full border border-primary/30 bg-[linear-gradient(120deg,theme(colors.hearthGlass/88%)_0%,theme(colors.bg/86%)_72%)] py-[clamp(0.3rem,0.55vh,0.5rem)] pl-[clamp(0.4rem,0.55vw,0.6rem)] pr-[clamp(0.9rem,1.3vw,1.4rem)] text-[clamp(0.7rem,0.8vw,1.05rem)] font-extrabold uppercase leading-none tracking-[0.26em] text-mutedWarm backdrop-blur-[6px] [box-shadow:0_14px_34px_-18px_theme(colors.shade/95%),0_0_22px_-8px_theme(colors.primary/35%),inset_0_1px_0_theme(colors.glow/14%)] [animation:reveal_700ms_cubic-bezier(0.2,0.7,0.2,1)_900ms_both] motion-reduce:[animation:none] md:left-8 md:top-4 2xl:left-12`;

// The beacon sits in the same lit badge as the equalizer across the screen.
export const waitingBeacon =
  "relative flex h-[clamp(1.5rem,1.7vw,2.3rem)] w-[clamp(1.5rem,1.7vw,2.3rem)] flex-none items-center justify-center rounded-full border border-primary/35 bg-primary/12 [box-shadow:0_0_16px_theme(colors.primary/28%),inset_0_1px_0_theme(colors.glow/14%)]";

export const waitingRing =
  "absolute left-1/2 top-1/2 h-[38%] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/60 [animation:radar_2.2s_cubic-bezier(0,0,0.2,1)_infinite] motion-reduce:hidden";

export const waitingDot =
  "relative h-[34%] w-[34%] rounded-full bg-primary [box-shadow:0_0_12px_theme(colors.primary),0_0_24px_theme(colors.primary/60%)]";
