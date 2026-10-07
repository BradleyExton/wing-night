// The guest portal's room (apps/client/public/mockups/guest-portal): the teaser landing's Hearth
// without its flame. The page is `bg` with the fire's heat pooling at the foot, one column a
// phone wide, and every section a warm-glass card cut from the landing's game rows
// (TeaserGameCard): an `ember` hairline along the top, `hearthGlass` over `shade`. One accent,
// `primary`. The heat is a fixed layer so a long scrolling page never drags it along.
export const root =
  "relative isolate min-h-[100dvh] text-text before:pointer-events-none before:fixed before:inset-0 before:-z-10 before:bg-[radial-gradient(ellipse_at_50%_115%,theme(colors.hearthGlass)_0%,theme(colors.bg)_58%)] before:content-['']";

export const column =
  "mx-auto flex w-full max-w-[30rem] flex-col gap-4 px-4 pb-14 pt-[calc(env(safe-area-inset-top)+1.1rem)]";

export const topBar = "flex items-center justify-between gap-3";

export const wordmark =
  "text-[1.35rem] font-black uppercase leading-none tracking-[-0.01em] text-text no-underline [text-shadow:0_0_18px_theme(colors.primary/35%)]";

export const topLinks = "flex items-center gap-4";

// A quiet text link: the top bar's way to another page, and to sign out.
export const navLink =
  "cursor-pointer border-0 bg-transparent p-0 text-[0.85rem] font-semibold text-mutedWarm underline decoration-mutedWarmDim underline-offset-4";

export const heading = "flex flex-col gap-1 pt-1";

export const title = "m-0 font-voice text-[clamp(1.7rem,7.5vw,2.2rem)] italic leading-tight text-text";

// --- The shared kit: every portal page draws its sections from these. ---

// The section: the landing's game row grown into a card.
export const card =
  "relative isolate flex flex-col gap-3 overflow-hidden rounded-2xl border border-primary/25 bg-[linear-gradient(180deg,theme(colors.hearthGlass/84%)_0%,theme(colors.shade/93%)_100%)] p-4 [box-shadow:inset_0_1px_0_theme(colors.glow/14%),0_18px_40px_-20px_theme(colors.shade/80%)] before:absolute before:inset-x-[12%] before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-ember before:to-transparent before:content-['']";

export const eyebrow = "m-0 text-[0.68rem] font-extrabold uppercase tracking-[0.36em] text-mutedWarm";

export const cardTitle =
  "m-0 text-[1.3rem] font-black uppercase leading-none tracking-[-0.005em] [text-shadow:0_0_18px_theme(colors.primary/45%),0_2px_0_theme(colors.shade/40%)]";

// The show's voice: the one sentence a section needs.
export const voice = "m-0 font-voice text-[1rem] italic leading-snug text-mutedWarm";

export const fine = "m-0 text-[0.8rem] leading-snug text-mutedWarmDim";

// The house button: flat primary with a pressed edge for the one thing to do next, glass for the rest.
const buttonBase =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-3 text-center text-[0.85rem] font-extrabold uppercase leading-tight tracking-[0.08em] no-underline transition-transform active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow";

export const buttonPrimary = `${buttonBase} border-0 bg-primary text-bg [box-shadow:inset_0_-3px_0_theme(colors.shade/28%),0_10px_24px_-14px_theme(colors.primary/70%)]`;

export const buttonGhost = `${buttonBase} border border-ember/35 bg-surface/60 text-text`;

// A small square control (a list's up and down).
export const iconButton =
  "inline-flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-ember/30 bg-surface/60 text-text disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow";

export const buttonRow = "grid grid-cols-2 gap-2";

export const field = "flex flex-col gap-1.5";

export const fieldLabel = "text-[0.68rem] font-extrabold uppercase tracking-[0.3em] text-mutedWarm";

export const input =
  "min-h-[48px] w-full rounded-xl border border-ember/20 bg-bg/80 px-3.5 text-base text-text placeholder:text-mutedWarmDim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

// What just happened, read aloud: a save, a send, a failure. Empty, it takes no height.
export const status = "m-0 text-[0.85rem] leading-snug text-mutedWarm";

export const statusError = "m-0 text-[0.85rem] leading-snug text-danger";

const pillBase =
  "inline-flex flex-none items-center gap-[0.5em] rounded-full px-[0.8em] py-[0.4em] text-[0.64rem] font-bold uppercase tracking-[0.18em]";

export const pill = `${pillBase} border border-primary/50 bg-primary/15 text-text`;

export const pillDim = `${pillBase} border border-text/10 bg-text/[0.05] text-mutedWarmDim`;

export const pillDot = "h-[0.5em] w-[0.5em] rounded-full bg-primary [box-shadow:0_0_8px_theme(colors.primary/70%)]";

// A whole page that is one message: loading, signed out, not allowed.
export const notice = "flex flex-col items-start gap-3 pt-6";
