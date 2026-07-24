export const container = "relative h-full";

const timerChipBase =
  "absolute right-[clamp(0.75rem,1.5vw,1.5rem)] top-[clamp(0.75rem,1.5vw,1.5rem)] z-10 rounded-full border border-text/10 bg-surface/90 px-[clamp(0.8rem,1.2vw,1.2rem)] py-[clamp(0.3rem,0.6vw,0.6rem)] font-mono text-[clamp(1rem,1.6vw,1.6rem)] font-black tabular-nums tracking-[-0.02em]";

export const timerChip = `${timerChipBase} text-primary`;

export const timerChipUrgent = `${timerChipBase} text-heat motion-safe:[animation:pulse_0.7s_ease-in-out_infinite]`;

export const timerChipTimeUp = `${timerChipBase} uppercase tracking-[0.12em] text-heat motion-safe:[animation:pulse_1.2s_ease-in-out_infinite]`;
