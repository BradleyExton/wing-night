// The launcher is a standalone tablet page like the config wizard: it
// composes the host deck's vocabulary (group heads, rows, chips, the CTA
// button) rather than inventing one, so Quick Play feels like the same app.
export { stageEyebrow as eyebrow, stageMeta as meta } from "@wingnight/surface";

export const root =
  "min-h-[100dvh] bg-bg px-[clamp(1.25rem,4vw,3rem)] pb-[clamp(6rem,14vh,9rem)] pt-[clamp(1.5rem,4vh,3rem)] text-text";

export const inner = "mx-auto flex w-full max-w-5xl flex-col gap-8";

export const headerRow = "flex flex-wrap items-start justify-between gap-4";

export const brandRow = "inline-flex items-center gap-3";

export const brandMark = "h-8 w-8 rounded-md bg-bg/70 p-1 ring-1 ring-primary/40";

export const brandLabel = "text-sm font-semibold uppercase tracking-[0.14em] text-text/92";

export const headline =
  "m-0 text-[clamp(2.2rem,4vw,3.4rem)] font-black leading-[0.95] tracking-[-0.03em] text-text";

export const navLinks = "flex flex-wrap gap-4";

export const navLink =
  "text-xs font-semibold uppercase tracking-[0.12em] text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const sections = "grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]";

export const sectionWide = "lg:col-span-2";

export const notice =
  "rounded-xl border border-heat/50 bg-heat/10 px-5 py-4 text-[clamp(0.95rem,1.1vw,1.05rem)] text-text/90";

export const noticeTitle = "m-0 text-xl font-bold text-text";

export const status = "text-sm text-muted";
