// The takeover dock replaces the full-bleed CTA bar while the tablet is in the
// players' hands (DESIGN.md §2.0A). It is deliberately quiet: one small circle
// in the bottom-right corner, and the labelled host actions only appear after
// a tap — a stray thumb on the map can't end the turn.
// Absolute, not fixed: the dev sandbox renders the host shell inside a
// CSS-scaled device frame, and a transformed ancestor would capture a fixed
// element anyway. The takeover container carries the positioning context.
//
// The layer sits above anything a minigame canvas can raise — Leaflet's map
// controls alone reach z-1000 — because the host must always be able to reach
// these two buttons, whatever the game has drawn underneath.
export const root = "pointer-events-none absolute inset-0 z-[1100]";

export const scrim = "pointer-events-auto absolute inset-0 bg-bg/40";

export const cluster =
  "pointer-events-none absolute bottom-[clamp(0.75rem,1.6vw,1.25rem)] right-[clamp(0.75rem,1.6vw,1.25rem)] flex flex-col items-end gap-2";

export const toggle =
  "pointer-events-auto relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-text/10 bg-surface/75 text-xl font-black leading-none text-muted/70 shadow-lg backdrop-blur transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const toggleOpen = "border-text/25 bg-surface text-text";

export const toggleBadge =
  "absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-heat text-heat shadow-[0_0_8px_currentColor]";

// No entrance animation: these two buttons are the only way off this phase,
// and an animation caught at its opening frame leaves the host tapping a
// control it cannot see.
const actionBase =
  "pointer-events-auto inline-flex min-h-[48px] items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-[0.85rem] font-extrabold uppercase tracking-[0.18em] shadow-lg backdrop-blur transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50";

export const primaryAction = `${actionBase} bg-primary text-bg hover:bg-primary/90 disabled:hover:bg-primary`;

export const overridesAction = `${actionBase} border border-text/10 bg-surface/90 text-muted hover:text-text`;

export const overridesBadge =
  "inline-flex items-center rounded-full border border-heat/40 bg-heat/15 px-2 py-0.5 text-[0.65rem] font-extrabold tracking-[0.16em] text-heat";
