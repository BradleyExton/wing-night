export const container =
  "relative isolate min-h-[100dvh] overflow-hidden bg-bg text-text";

export const atmosphere =
  "pointer-events-none absolute inset-0 -z-20 bg-gradient-to-br from-bg via-surface to-bg";

export const atmosphereGlowPrimary =
  "pointer-events-none absolute left-[4%] top-[10%] -z-10 h-[20rem] w-[20rem] rounded-full bg-primary/20 blur-3xl";

export const atmosphereGlowHeat =
  "pointer-events-none absolute bottom-[8%] right-[8%] -z-10 h-[17rem] w-[17rem] rounded-full bg-heat/15 blur-3xl";

export const heroBackdrop =
  "pointer-events-none absolute inset-y-0 right-[-24rem] -z-10 hidden w-[min(88vw,62rem)] items-center justify-center opacity-45 lg:flex";

export const heroMedia = "h-auto w-full object-contain [filter:saturate(112%)]";

export const content =
  "relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col justify-center px-5 py-8 sm:px-8";

export const brandRow = "inline-flex items-center gap-3";

export const brandMark = "h-8 w-8 rounded-md bg-bg/70 p-1 ring-1 ring-primary/40";

export const brandLabel = "text-sm font-semibold uppercase tracking-[0.14em] text-text/92";

export const eyebrow = "mt-10 text-xs font-semibold uppercase tracking-[0.24em] text-primary/90";

export const title = "mt-3 text-[clamp(2.3rem,4.7vw,4rem)] font-black leading-[1.02]";

export const description =
  "mt-4 max-w-2xl text-[clamp(1rem,1.6vw,1.3rem)] leading-relaxed text-text/85";

export const selectionLabel =
  "mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-muted";

export const roleRail = "mt-3 grid gap-3";

export const roleActionBase =
  "group relative overflow-hidden rounded-xl border px-5 py-5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const roleActionPrimary =
  "border-primary/55 bg-primary/10 hover:border-primary hover:bg-primary/15";

export const roleActionSecondary =
  "border-text/15 bg-surface/70 hover:border-text/35 hover:bg-surfaceAlt/65";

export const roleActionHeaderRow = "flex items-baseline justify-between gap-4";

export const roleActionLabel = "text-2xl font-bold leading-tight";

export const roleActionRoute =
  "font-mono text-xs uppercase tracking-[0.12em] text-primary/90 group-hover:text-primary";

export const roleActionDetail =
  "mt-2 block max-w-[48ch] text-sm leading-relaxed text-text/86 md:text-base";

export const roleActionTarget =
  "mt-3 block text-xs font-semibold uppercase tracking-[0.08em] text-muted";
