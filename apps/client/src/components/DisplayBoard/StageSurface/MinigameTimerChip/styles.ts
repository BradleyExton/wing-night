// The digits of the TV's turn clock: a neon pill at the end of the marquee's
// meta row (DESIGN.md §2.2D). White light in a tube of `primary` for most of
// the turn — the footnote to the burning line — and then, for the last ten
// seconds, the biggest thing on the sign: the tube turns to `heat`, the
// leading "00:" goes, and the one or two digits left grow past the team's name
// and beat once on every tick. At zero it reads TIME! in the same tube, still
// big, so the end is a landing and not a shrink back to a footnote
// (DESIGN.md §5 MINIGAME_PLAY; mockup minigame-marquee/09-last-ten-seconds).
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
  "rounded-full font-mono font-extrabold leading-none tabular-nums text-text";

export const timerChip = `${timerChipFrame} border-[3px] border-primary px-[clamp(0.9rem,1.4vw,1.4rem)] py-[clamp(0.2rem,0.4vw,0.4rem)] text-[clamp(1.4rem,2.2vw,2.5rem)] tracking-[-0.02em] [text-shadow:0_0_6px_theme(colors.text),0_0_16px_theme(colors.primary),0_0_36px_theme(colors.primary)] shadow-[0_0_10px_theme(colors.primary),inset_0_0_10px_theme(colors.primary/60%)]`;

// The grown tube the last ten seconds and time's up share: a thicker ring, a
// wider glow. Every term of the urgent font clamp is more than twice the calm
// pill's (`styles.test.ts` holds that ratio), and the vertical padding is zero
// on purpose: with `leading-none` the digit's own em box is the pill's height,
// which is what keeps the marquee row from reflowing — the lead column is
// ~101px at 1080p and this is 90px of digit plus 8px of tube, measured on the
// mockup. Nothing under the marquee moves in the last ten seconds.
const heatTube =
  "border-4 border-heat [text-shadow:0_0_6px_theme(colors.text),0_0_18px_theme(colors.heat),0_0_44px_theme(colors.heat),0_0_80px_theme(colors.heat/60%)] shadow-[0_0_18px_theme(colors.heat),0_0_44px_theme(colors.heat/45%),inset_0_0_14px_theme(colors.heat/70%)]";

// One beat per tick, not a free-running pulse: the chip is keyed on the
// second, so the element remounts and `lasttenbeat` (index.css) plays once
// from the top on every digit — the hit lands with the number, and with the
// tick the TV's speaker makes. `motion-safe:` so a reduced-motion room gets
// the size and the colour without the hit (DESIGN.md §8).
export const timerChipUrgent = `${timerChipFrame} ${heatTube} px-[0.42em] py-0 text-[clamp(3rem,5vw,5.6rem)] tracking-normal motion-safe:animate-[lasttenbeat_0.9s_cubic-bezier(0.2,0.9,0.3,1)_1]`;

// A word rather than a digit, so a size down, with the slow pulse time's up
// always had. Still the grown tube: the turn ends on the biggest thing on the
// sign, not on a footnote.
export const timerChipTimeUp = `${timerChipFrame} ${heatTube} py-[0.2em] pl-[0.62em] pr-[0.5em] text-[clamp(2rem,3.4vw,3.8rem)] uppercase tracking-[0.12em] motion-safe:animate-[heatpulse_1.2s_ease-in-out_infinite]`;
