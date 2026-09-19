// Mirrors the RouteNotFound atmosphere — same sheet, same glow, heat instead of
// primary because this is the one screen in the app that is genuinely a fault
// (DESIGN.md §0.1: heat is reserved for urgency).
const containerBase =
  "relative isolate grid min-h-[100dvh] place-items-center overflow-hidden bg-bg text-center text-text";

export const displayContainer = `${containerBase} p-12`;

export const controlContainer = `${containerBase} p-6`;

export const atmosphere =
  "pointer-events-none absolute inset-0 -z-20 bg-gradient-to-br from-bg via-surface to-bg";

export const atmosphereGlowHeat =
  "pointer-events-none absolute left-[8%] top-[14%] -z-10 h-[18rem] w-[18rem] rounded-full bg-heat/15 blur-3xl";

export const kicker =
  "text-xs font-semibold uppercase tracking-[0.24em] text-heat/90";

const headingBase = "m-0 mt-3 font-black leading-[1.02]";

// The TV is read from a sofa, the tablet from arm's length.
export const displayHeading = `${headingBase} text-[clamp(3rem,6vw,5.5rem)]`;

export const controlHeading = `${headingBase} text-[clamp(2.1rem,4.5vw,3.6rem)]`;

const subtextBase = "mx-auto mt-4 leading-relaxed text-text/85";

export const displaySubtext = `${subtextBase} max-w-3xl text-[clamp(1.4rem,2.2vw,2rem)]`;

export const controlSubtext = `${subtextBase} max-w-xl text-[clamp(1rem,1.5vw,1.2rem)]`;

export const reloadButton =
  "mt-8 inline-flex min-h-11 items-center justify-center rounded-xl border border-heat/50 bg-heat/15 px-6 text-sm font-bold uppercase tracking-[0.14em] text-text transition hover:bg-heat/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-heat";
