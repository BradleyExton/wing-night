import assert from "node:assert/strict";
import test from "node:test";

import { timerChip, timerChipTimeUp, timerChipUrgent } from "./styles";

// docs/takeover-layout-api.md §6. The chip pinned itself to the takeover's
// padding box, and that one `absolute right-… top-…` is what five games were
// reserving `pr-[clamp(9rem,15vw,12rem)]` of rail width against for a chip
// that never draws — while the two games whose chip does draw reserved
// nothing and wore it on top of their own rail. The reserve is abolished by
// the chip becoming the last item of a flex row, which only works while the
// chip positions itself nowhere. Put the positioning back and the whole
// mechanism goes quietly inert.
test("does leave the clock's placement to the layout's rail row", () => {
  const variants = { timerChip, timerChipUrgent, timerChipTimeUp };

  for (const [name, className] of Object.entries(variants)) {
    assert.doesNotMatch(className, /\b(absolute|fixed|sticky)\b/, name);
    assert.doesNotMatch(className, /\b(top|right|bottom|left|z)-/, name);
  }
});

test("does keep the pill and its three states", () => {
  assert.match(timerChip, /rounded-full/);
  assert.match(timerChip, /text-primary/);
  assert.match(timerChipUrgent, /text-heat/);
  assert.match(timerChipTimeUp, /uppercase/);
});
