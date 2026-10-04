// The RouteNotFound atmosphere (apps/client/public/mockups/host-seat-locked):
// nothing is broken, the way in is on the laptop's screen, so it reads as
// Wing Night rather than as an error page.
export const container =
  "relative isolate grid min-h-[100dvh] place-items-center overflow-hidden bg-bg p-6 text-center text-text";

export const atmosphere =
  "pointer-events-none absolute inset-0 -z-20 bg-gradient-to-br from-bg via-surface to-bg";

export const atmosphereGlowPrimary =
  "pointer-events-none absolute left-[8%] top-[14%] -z-10 h-[18rem] w-[18rem] rounded-full bg-primary/15 blur-3xl";

export const kicker = "text-xs font-semibold uppercase tracking-[0.24em] text-primary/90";

export const heading = "m-0 mt-3 text-[clamp(2.1rem,4.5vw,3.6rem)] font-black leading-[1.02]";

export const subtext =
  "mx-auto mt-4 max-w-xl text-[clamp(1rem,1.5vw,1.2rem)] leading-relaxed text-text/85";

export const hint = "mx-auto mt-8 max-w-xl text-sm text-muted";
