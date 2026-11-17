import { takeoverLabelAccent } from "@wingnight/surface";

// The same beat as FAPPY's handoff callout (DESIGN.md §2.9): the name drops in over the scene with
// a bounce and holds while the line steps up behind it. `pointer-events-none` everywhere: on the
// tablet the whole lane under it is the drag surface that fires the next shot.
const callIn = "motion-safe:animate-[scene-callout_520ms_cubic-bezier(0.2,1.4,0.4,1)_both]";

// The TV: a card high over the lane, clear of the rack the room is about to watch.
export const displayOverlay = `pointer-events-none absolute inset-x-0 top-[7%] z-20 flex justify-center px-[8%] ${callIn}`;

export const displayCard =
  "flex flex-col items-center gap-1 rounded-2xl border-[3px] border-primary/70 bg-gradient-to-b from-surface to-bg px-[clamp(2rem,4vw,4rem)] py-[clamp(0.8rem,1.4vh,1.4rem)] shadow-[0_0_60px_theme(colors.primary/30%),0_14px_32px_theme(colors.shade/60%)]";

export const displayName =
  "font-voice text-[clamp(2.4rem,5vw,5.2rem)] font-bold italic leading-none text-text [text-shadow:0_0_28px_theme(colors.primary/45%)]";

export const displayLine =
  "text-[clamp(0.8rem,1.3vw,1.4rem)] font-extrabold uppercase tracking-[0.3em] text-primary";

// Scene art, licensed by DESIGN.md §2.9: the lane's dusk sky pooled behind the name so it reads
// over the scene. Its colour is the lane's own sky, not a token.
const sceneDuskVeil =
  "bg-[radial-gradient(ellipse_at_center,rgba(22,12,42,0.7)_0%,rgba(22,12,42,0)_68%)]";

// The tablet (and a contestant's phone): a dim pool in the sky and the name, nothing else.
export const hostOverlay = `pointer-events-none absolute inset-x-0 top-0 z-10 flex h-[55%] flex-col items-center justify-center gap-1 ${sceneDuskVeil} ${callIn}`;

export const hostLead = takeoverLabelAccent;

export const hostName =
  "font-voice text-[clamp(2rem,5vw,3.4rem)] font-bold italic leading-none text-text [text-shadow:0_0_24px_theme(colors.primary/45%)]";
