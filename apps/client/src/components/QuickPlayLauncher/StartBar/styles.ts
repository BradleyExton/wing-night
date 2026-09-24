export { ctaButton as button } from "@wingnight/surface";

// Rides the bottom of the viewport so the host never scrolls to find Start
// while the queue grows.
export const bar =
  "fixed inset-x-0 bottom-0 z-20 flex flex-col border-t border-text/10 bg-bg/95 backdrop-blur";

export const hint =
  "px-[clamp(1.25rem,4vw,3rem)] py-2 text-center text-[clamp(0.78rem,0.95vw,0.9rem)] font-semibold uppercase tracking-[0.18em] text-muted";

export const hintBlocked = "text-heat";
