// The control rail's own look. It used to re-export these from the sandbox
// parent, which was the only other user; the parent is now just the chrome
// around the lazy stage boundary, so the styles live with the controls.
export const controlsCard =
  "mx-auto mt-4 w-full max-w-[2200px] rounded-xl border border-text/10 bg-surface p-4 shadow-lg";

export const controlsGrid = "grid gap-3 md:grid-cols-2 xl:grid-cols-4";

export const controlBlock = "space-y-2";

export const controlLabel = "text-xs font-semibold uppercase tracking-[0.12em] text-muted";

export const input =
  "h-10 w-full rounded-md border border-text/15 bg-surfaceAlt px-3 text-sm text-text outline-none focus:border-primary/60";

export const resetButton =
  "h-10 w-full rounded-md border border-primary/40 bg-primary/10 px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20";
