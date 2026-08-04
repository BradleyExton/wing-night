export { fallbackText } from "../styles";

export const minigameShell = "relative h-full";

const timerChipBase =
  "absolute right-[clamp(1rem,2vw,2rem)] top-[clamp(1rem,2vw,2rem)] z-10 rounded-full border border-text/10 bg-surface/90 px-[clamp(0.9rem,1.4vw,1.4rem)] py-[clamp(0.35rem,0.7vw,0.7rem)] font-mono text-[clamp(1.2rem,2vw,2.2rem)] font-black tabular-nums tracking-[-0.02em]";

export const timerChip = `${timerChipBase} text-primary`;

export const timerChipUrgent = `${timerChipBase} text-heat motion-safe:animate-[heatpulse_0.65s_ease-in-out_infinite]`;

export const timerChipTimeUp = `${timerChipBase} uppercase tracking-[0.12em] text-heat motion-safe:animate-[heatpulse_1.2s_ease-in-out_infinite]`;
