export const container = "min-h-[100dvh] bg-bg px-4 py-5 text-text md:px-6 md:py-6 2xl:px-8";

export const headingBlock = "mx-auto w-full max-w-[2200px]";

export const headingRow = "flex flex-wrap items-baseline justify-between gap-3";

export const heading = "m-0 text-3xl font-bold text-text md:text-4xl";

export const devIndexLink =
  "text-xs font-semibold uppercase tracking-[0.12em] text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const description = "mt-2 text-sm text-muted md:text-base";

export const controlsCard =
  "mx-auto mt-4 w-full max-w-[2200px] rounded-xl border border-text/10 bg-surface p-4 shadow-lg";

export const controlsGrid = "grid gap-3 md:grid-cols-2 xl:grid-cols-4";

export const controlBlock = "space-y-2";

export const controlLabel = "text-xs font-semibold uppercase tracking-[0.12em] text-muted";

export const input =
  "h-10 w-full rounded-md border border-text/15 bg-surfaceAlt px-3 text-sm text-text outline-none focus:border-primary/60";

// Both previews are fixed-aspect frames, so the column split is what makes
// them the same height side by side: a 4:3 tablet next to a 16:9 TV needs
// widths in the ratio (4/3):(16/9) = 3:4. Below xl they stack full width.
export const previewGrid =
  "mx-auto mt-5 grid w-full max-w-[2200px] items-start gap-4 xl:grid-cols-[3fr_4fr] 2xl:gap-5";

export const previewCard =
  "w-full overflow-hidden rounded-xl border border-text/10 bg-surfaceAlt shadow-xl";

export const previewHeader =
  "flex items-center justify-between border-b border-text/10 bg-surface px-4 py-3";

export const previewHeaderLabel = "text-xs font-semibold uppercase tracking-[0.14em] text-muted";

export const previewHeaderMeta = "text-xs text-muted";

// Each preview frame reserves its device's aspect ratio; SandboxDeviceFrame lays
// the device out at full size inside and scales it down to the frame's width.
export const hostViewport = "relative aspect-[4/3] w-full overflow-hidden bg-bg";

export const displayViewport = "relative aspect-video w-full overflow-hidden bg-bg";

// The tablet's own layout: canvas row plus the pinned CTA row, as the real
// controller composes them (HostControlPanel `container`). Relative so the
// play phase's corner dock anchors here, exactly as it does on the device.
export const hostShell =
  "relative grid h-full grid-rows-[minmax(0,1fr)_auto] overflow-hidden bg-bg text-text";

// Same gutter the shell's MinigamePlayTakeover wraps a minigame in.
export const hostCanvas =
  "relative flex h-full min-h-0 flex-col p-[clamp(1rem,2vw,1.75rem)]";

export const displayShell = "h-full w-full overflow-hidden bg-surfaceAlt";
