// A pill, and nothing else. It used to pin itself to the stage's top-right
// corner with `absolute right-… top-… z-10`, which is what made eight display
// surfaces hand-type `pr-[clamp(8rem,14vw,18rem)]` against it — six of them
// for a chip that never draws, because only GEO, DRAWING and EMOJI_CHARADES
// have a `timerKey` (docs/takeover-layout-api.md §6, applied to the TV at
// T5.3). It is the last item of the marquee's meta cell now: an absent clock
// takes no width, a present one sits where the mockups always drew it.
//
// The clamps and the keyframe stay the TV's own, deliberately: T5.1 refused to
// merge this chip with the host's because a 48px rail pill at arm's length and
// an overlay read across a room cannot share one `vw` clamp.
const timerChipBase =
  "rounded-full border border-text/10 bg-surface/90 px-[clamp(0.9rem,1.4vw,1.4rem)] py-[clamp(0.35rem,0.7vw,0.7rem)] font-mono text-[clamp(1.2rem,2vw,2.2rem)] font-black tabular-nums tracking-[-0.02em]";

export const timerChip = `${timerChipBase} text-primary`;

export const timerChipUrgent = `${timerChipBase} text-heat motion-safe:animate-[heatpulse_0.65s_ease-in-out_infinite]`;

export const timerChipTimeUp = `${timerChipBase} uppercase tracking-[0.12em] text-heat motion-safe:animate-[heatpulse_1.2s_ease-in-out_infinite]`;
