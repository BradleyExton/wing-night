// The digits of the TV's turn clock: a neon pill at the end of the marquee's
// meta row (DESIGN.md §2.2D). White light in a tube of `primary`, which turns
// to `heat` and pulses in the last ten seconds, and reads "TIME'S UP" small
// in the same tube at zero.
//
// It positions itself nowhere. It used to pin itself to the stage's top-right
// corner with `absolute right-… top-… z-10`, which is what made eight display
// surfaces hand-type `pr-[clamp(8rem,14vw,18rem)]` against it — six of them
// for a chip that never draws, because only GEO, DRAWING and EMOJI_CHARADES
// have a `timerKey` (docs/takeover-layout-api.md §6, applied to the TV at
// T5.3). It is the last item of the marquee's meta row: an absent clock takes
// no width, a present one sits where the mockup drew it.
//
// The clamps stay the TV's own, deliberately: T5.1 refused to merge this chip
// with the host's because a 48px rail pill at arm's length and a sign read
// across a room cannot share one `vw` clamp. The lit length under the row is
// `MinigameTimerLine`, next door — same seconds, the other half of the clock.
const timerChipFrame =
  "rounded-full border-[3px] px-[clamp(0.9rem,1.4vw,1.4rem)] font-mono font-extrabold leading-none tabular-nums text-text";

const timerChipDigits =
  `${timerChipFrame} py-[clamp(0.2rem,0.4vw,0.4rem)] text-[clamp(1.4rem,2.2vw,2.5rem)] tracking-[-0.02em]`;

export const timerChip = `${timerChipDigits} border-primary [text-shadow:0_0_6px_theme(colors.text),0_0_16px_theme(colors.primary),0_0_36px_theme(colors.primary)] shadow-[0_0_10px_theme(colors.primary),inset_0_0_10px_rgba(249,115,22,0.6)]`;

const heatTube =
  "border-heat [text-shadow:0_0_6px_theme(colors.text),0_0_16px_theme(colors.heat),0_0_36px_theme(colors.heat)] shadow-[0_0_14px_theme(colors.heat),inset_0_0_12px_rgba(239,68,68,0.7)]";

export const timerChipUrgent = `${timerChipDigits} ${heatTube} motion-safe:animate-[heatpulse_0.65s_ease-in-out_infinite]`;

export const timerChipTimeUp = `${timerChipFrame} ${heatTube} py-[0.6em] text-[clamp(0.8rem,1.2vw,1.3rem)] uppercase tracking-[0.16em] motion-safe:animate-[heatpulse_1.2s_ease-in-out_infinite]`;
