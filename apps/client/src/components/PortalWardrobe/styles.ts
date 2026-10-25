// /me/wardrobe (mockups/cast/wardrobe-picker.html, in the portal's Hearth): the stage on top,
// the rail under it, the team at the foot, each a portal card. `group/beat` as on the TV's root
// (DisplayBoard/styles): the page's beat clock flips `data-beat` here and the dancing team
// answers it.
export const cards = "group/beat flex flex-col gap-4";

// The rail's card is the portal card without its clip, because the slot tabs inside it stick to
// the top of the screen as the grid scrolls, and a clipping box would hold them in the card.
export const railCard =
  "relative isolate flex flex-col gap-3 rounded-2xl border border-primary/25 bg-[linear-gradient(180deg,theme(colors.hearthGlass/84%)_0%,theme(colors.shade/93%)_100%)] p-4 [box-shadow:inset_0_1px_0_theme(colors.glow/14%),0_18px_40px_-20px_theme(colors.shade/80%)]";

// The Looks row: the dice first, then the team's named outfits, scrolling sideways on a narrow
// phone rather than wrapping under the stage.
export const looks = "-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]";

const lookBase =
  "inline-flex min-h-[44px] flex-none items-center justify-center gap-1.5 rounded-xl px-3.5 text-[0.8rem] font-extrabold uppercase tracking-[0.08em] transition-transform active:translate-y-px disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow";

export const look = `${lookBase} border border-ember/35 bg-surface/60 text-text`;

export const lookOn = `${lookBase} border border-primary bg-primary/15 text-text ring-1 ring-primary`;

export const dressMe = `${lookBase} border-0 bg-primary text-bg [box-shadow:inset_0_-3px_0_theme(colors.shade/28%)]`;

export const statusLine = "min-h-[2.6em]";

// What reaches the TV, in one line under the team.
export const fine = "m-0 text-[0.8rem] leading-snug text-mutedWarmDim";

// A whole page that is one message (no team yet): the message, then the way back.
export const notice = "flex flex-col items-start gap-3";
