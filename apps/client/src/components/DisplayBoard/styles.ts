export const container =
  "relative isolate flex h-[100dvh] min-h-[100dvh] w-full flex-col overflow-hidden bg-bg text-text";

export const displayAtmosphere =
  "pointer-events-none fixed inset-0 z-0 h-[100dvh] w-full bg-gradient-to-br from-primary/20 via-transparent to-primary/10 opacity-50 blur-3xl [animation:spin_90s_linear_infinite] motion-reduce:[animation:none]";

// No inset here: the stage decides its own frame (StageSurface/styles). The
// lobby is full-bleed, and the padding the other phases want lives on their
// canvas — an inset on this row used to leave a `bg` gutter around the
// hearth on three sides and clip the cast's feet at the bottom edge.
export const main = "relative z-10 flex min-h-0 flex-1 items-stretch";

export const content = "h-full w-full";

export const stageShell = "relative h-full w-full overflow-hidden";
