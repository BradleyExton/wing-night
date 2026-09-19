import assert from "node:assert/strict";
import test from "node:test";

import { fromVolumePercent, toVolumePercent } from "./index";

// The slider shows percent; the room keeps the element's 0–1 scale. The two
// have to round-trip on the slider's own 5% steps or a host's drag would
// creep on every snapshot.
test("round-trips every slider step between percent and the element scale", () => {
  for (let percent = 0; percent <= 100; percent += 5) {
    assert.equal(toVolumePercent(fromVolumePercent(percent)), percent);
  }
});

test("clamps a percent outside the slider to the element's scale", () => {
  assert.equal(fromVolumePercent(140), 1);
  assert.equal(fromVolumePercent(-20), 0);
});
