// Mirrors the RootRouteLanding atmosphere so a dead link still feels like
// Wing Night instead of a bare error page.
export const container =
  "relative isolate grid min-h-[100dvh] place-items-center overflow-hidden bg-bg p-6 text-center text-text";

export const atmosphere =
  "pointer-events-none absolute inset-0 -z-20 bg-gradient-to-br from-bg via-surface to-bg";

export const atmosphereGlowPrimary =
  "pointer-events-none absolute left-[8%] top-[14%] -z-10 h-[18rem] w-[18rem] rounded-full bg-primary/15 blur-3xl";

export const kicker =
  "text-xs font-semibold uppercase tracking-[0.24em] text-primary/90";

export const heading =
  "m-0 mt-3 text-[clamp(2.1rem,4.5vw,3.6rem)] font-black leading-[1.02]";

export const subtext =
  "mx-auto mt-4 max-w-xl text-[clamp(1rem,1.5vw,1.2rem)] leading-relaxed text-text/85";

export const homeLink =
  "mt-8 inline-flex min-h-11 items-center justify-center rounded-xl border border-primary/50 bg-primary/15 px-6 text-sm font-bold uppercase tracking-[0.14em] text-text transition hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
