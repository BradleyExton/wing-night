// A pill, and nothing else. It used to pin itself to the takeover's padding box
// with `absolute right-… top-… z-10`, which is what made five games reserve
// `pr-[clamp(9rem,15vw,12rem)]` of rail width for a chip that never draws and
// let it land on top of DRAWING's pending-points number when it did
// (docs/takeover-layout-api.md §6). It is now the last item of the layout's
// rail row: an empty clock takes no width, a filled one pushes the counter
// left, and the top-right budget is abolished rather than corrected.
const timerChipBase =
  "rounded-full border border-text/10 bg-surface/90 px-[clamp(0.8rem,1.2vw,1.2rem)] py-[clamp(0.3rem,0.6vw,0.6rem)] font-mono text-[clamp(1rem,1.6vw,1.6rem)] font-black tabular-nums tracking-[-0.02em]";

export const timerChip = `${timerChipBase} text-primary`;

export const timerChipUrgent = `${timerChipBase} text-heat motion-safe:[animation:pulse_0.7s_ease-in-out_infinite]`;

export const timerChipTimeUp = `${timerChipBase} uppercase tracking-[0.12em] text-heat motion-safe:[animation:pulse_1.2s_ease-in-out_infinite]`;
