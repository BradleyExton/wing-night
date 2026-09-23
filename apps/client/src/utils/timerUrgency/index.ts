// What the room clock's remaining seconds MEAN, as opposed to what they are.
//
// `resolveRemainingTimerSeconds` (next door) already decides what second it is,
// and `formatClockSeconds` already decides how to write it, so the host tablet
// and the TV can never disagree about the number on the clock. The threshold
// behind the colour was the part still copied: `const URGENT_THRESHOLD_SECONDS
// = 10` was typed out four times, in four files, across both component trees —
// the takeover chip and the eating hero on the host, the minigame chip and the
// eating hero on the TV. Retune one and the TV turns to heat at a different
// moment than the tablet is telling the host it will.
//
// Two predicates rather than one `"normal" | "urgent" | "timeUp"` verdict.
// Only the two chips read this as a three-way; the eating heroes read the two
// independently, because on the TV the big number goes urgent while the label
// underneath reads time's up. And the host's eating stage guards time's up
// with an `!isPaused` of its own — a paused clock resting on zero is not time
// up when the host is the one holding it — which stays visible at that call
// site instead of becoming a flag in here.
//
// URGENT_THRESHOLD_SECONDS is deliberately NOT exported. A module that hands
// out the number invites a fifth hand-typed `remainingSeconds <= 10`, which is
// the thing it exists to end — the same reasoning that keeps
// docs/takeover-layout-api.md §6's dock gutter out of `packages/surface`'s
// exports.
//
// FAPPY's relay clock is not one of these. Its `URGENT_REMAINING_MS = 15_000`
// is a different fact in different units about a limit the game owns, not the
// room's timer, and it correctly stays in the game.
const URGENT_THRESHOLD_SECONDS = 10;

export const isTimerUrgent = (remainingSeconds: number): boolean =>
  remainingSeconds <= URGENT_THRESHOLD_SECONDS;

export const isTimerTimeUp = (remainingSeconds: number): boolean =>
  remainingSeconds <= 0;
