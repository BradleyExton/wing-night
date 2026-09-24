import assert from "node:assert/strict";
import test from "node:test";

import { timerChip, timerChipTimeUp, timerChipUrgent } from "./styles";

// The display twin of the host guard at
// `HostControlPanel/HostPhaseBody/MinigamePlayTakeover/TakeoverTimerChip/styles.test.ts`,
// and the same mechanism (docs/takeover-layout-api.md §6). This chip pinned
// itself to the stage's top-right corner, and that one `absolute right-… top-…`
// is what eight display surfaces reserved `pr-[clamp(8rem,14vw,18rem)]` of
// marquee width against — six of them for a chip that never draws, because
// only GEO, DRAWING and EMOJI_CHARADES have a `timerKey`. The reserve is
// abolished by the chip becoming an ordinary item in the marquee's meta cell,
// which only works while the chip positions itself nowhere. Put the
// positioning back and the whole mechanism goes quietly inert.
test("does leave the clock's placement to the marquee's meta cell", () => {
  const variants = { timerChip, timerChipUrgent, timerChipTimeUp };

  for (const [name, className] of Object.entries(variants)) {
    assert.doesNotMatch(className, /\b(absolute|fixed|sticky)\b/, name);
    assert.doesNotMatch(className, /\b(top|right|bottom|left|z)-/, name);
  }
});

// T5.1 refused to merge this chip with the host's — the TV's clamps are read
// across a room, the tablet's at arm's length — so the pill and its three
// states are this file's to keep. Since the Neon Heat Line marquee (ADR-0006)
// the colour is in the tube, not the digits: `primary` and `heat` are the
// border and the glow, and the digits are white light in all three states.
test("does keep the pill and its three states", () => {
  assert.match(timerChip, /rounded-full/);
  assert.match(timerChip, /border-primary/);
  assert.match(timerChipUrgent, /border-heat/);
  assert.match(timerChipTimeUp, /uppercase/);
  for (const className of [timerChip, timerChipUrgent, timerChipTimeUp]) {
    assert.match(className, /text-text/);
  }
});

// Two variants each carry a font size, and the time's-up one is smaller. They
// must come from different bases rather than one overriding the other,
// because which of two `text-[…]` utilities wins is decided by the order
// Tailwind emits them, not the order the string lists them.
test("does give each state exactly one font size", () => {
  for (const className of [timerChip, timerChipUrgent, timerChipTimeUp]) {
    assert.equal((className.match(/\btext-\[clamp/g) ?? []).length, 1, className);
  }
});

// DESIGN.md §5 MINIGAME_PLAY: the last ten seconds are the largest thing on
// the TV. "At least twice the chip's size" is held term by term on the clamp,
// because a clamp that doubles at 1080p and not at 720p is not doubled.
const readClampTermsRem = (className: string): [number, number, number] => {
  const match = className.match(/text-\[clamp\(([\d.]+)rem,([\d.]+)vw,([\d.]+)rem\)\]/);

  assert.ok(match, className);

  return [Number(match[1]), Number(match[2]), Number(match[3])];
};

test("does draw the last ten seconds at least twice the calm pill's size", () => {
  const calm = readClampTermsRem(timerChip);
  const urgent = readClampTermsRem(timerChipUrgent);

  for (let term = 0; term < 3; term += 1) {
    assert.ok(
      urgent[term] >= calm[term] * 2,
      `clamp term ${term}: ${urgent[term]} is under twice ${calm[term]}`
    );
  }
});

// One beat per tick, and only for a room that has not asked for less motion:
// the chip is keyed on the second so the animation replays from the top on
// every digit, which is what "once per second" means here — not a
// free-running pulse the digits drift against. The sound is not gated on
// motion; that is `useMinigameClockSound`'s rule, held there.
test("does beat once per tick under motion-safe rather than pulse freely", () => {
  assert.match(timerChipUrgent, /motion-safe:animate-\[lasttenbeat_[^\]]*_1\]/);
  assert.doesNotMatch(timerChipUrgent, /infinite/);
});

// The end is a landing, not a shrink back to a footnote: time's up keeps the
// grown heat tube, a size down from the digit because it is a word.
test("does keep time's up in the grown heat tube", () => {
  assert.match(timerChipTimeUp, /border-4/);
  assert.match(timerChipTimeUp, /border-heat/);

  const timeUp = readClampTermsRem(timerChipTimeUp);
  const calm = readClampTermsRem(timerChip);

  assert.ok(timeUp[2] > calm[2]);
});
