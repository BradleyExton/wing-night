import * as nowPlayingStyles from "../../DisplayBoard/NowPlayingSurface/styles";

// The TV's now-playing pill (NowPlayingSurface), in the same top-right corner, as the button
// that starts the song: a phone has no host to press play, so the pill is the control. Off, it
// shows a muted speaker; on, it lights and its bars move. On a phone it is only its disc — the
// full pill would sit on the eyebrow — and the title joins it where there is width to spare.
const containerBase =
  "absolute right-3 top-[calc(env(safe-area-inset-top)+0.6rem)] z-[3] flex max-w-[16rem] cursor-pointer items-center gap-2 rounded-full p-[0.3rem] text-left transition-transform [animation:reveal_500ms_cubic-bezier(0.2,0.7,0.2,1)_both] active:scale-[0.97] motion-reduce:[animation:none] sm:right-6 sm:top-[calc(env(safe-area-inset-top)+1rem)] sm:pr-[0.9rem]";

export const container = `${containerBase} border border-primary/30 bg-[linear-gradient(120deg,theme(colors.hearthGlass/88%)_0%,theme(colors.bg/86%)_72%)] [box-shadow:0_14px_34px_-18px_theme(colors.shade/95%),0_0_22px_-8px_theme(colors.primary/35%),inset_0_1px_0_theme(colors.glow/14%)]`;

export const containerPaused = `${containerBase} border border-text/15 bg-[linear-gradient(120deg,theme(colors.surface/88%)_0%,theme(colors.bg/86%)_72%)] [box-shadow:0_14px_34px_-18px_theme(colors.shade/95%)]`;

const equalizerBase =
  "flex h-9 w-9 flex-none items-end justify-center gap-[3px] rounded-full pb-[0.6rem] pt-[0.5rem]";

export const equalizer = `${equalizerBase} border border-primary/35 bg-primary/12 [box-shadow:0_0_16px_theme(colors.primary/28%),inset_0_1px_0_theme(colors.glow/14%)]`;

export const speaker =
  "flex h-9 w-9 flex-none items-center justify-center rounded-full border border-text/10 bg-text/[0.04] text-mutedWarm";

export const speakerIcon = "h-[1.1rem] w-[1.1rem]";

export const bars = nowPlayingStyles.bars;

export const textColumn = "hidden min-w-0 flex-col gap-[0.12em] sm:flex";

export const label =
  "inline-flex items-center gap-[0.5em] truncate text-[0.6rem] font-extrabold uppercase leading-none tracking-[0.24em] text-mutedWarm";

export const labelDot = nowPlayingStyles.labelDot;

export const labelDotPaused = nowPlayingStyles.labelDotPaused;

export const title = "truncate text-[0.85rem] font-bold leading-tight tracking-[0.01em] text-text";

export const titlePaused = "truncate text-[0.85rem] font-bold leading-tight tracking-[0.01em] text-mutedWarm";
