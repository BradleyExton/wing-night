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
