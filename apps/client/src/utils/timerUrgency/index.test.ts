import assert from "node:assert/strict";
import test from "node:test";

import { isTimerTimeUp, isTimerUrgent } from "./index";

test("does turn the clock urgent at ten seconds and not at eleven", () => {
  // The boundary is the whole point of the module: the host chip, the TV chip
  // and both eating heroes have to cross it on the same tick or the room sees
  // the tablet and the TV disagree about how much trouble the team is in.
  assert.equal(isTimerUrgent(11), false);
  assert.equal(isTimerUrgent(10), true);
  assert.equal(isTimerUrgent(9), true);
});

test("does stay urgent once the clock has run out", () => {
  // `resolveRemainingTimerSeconds` clamps at zero, so zero is as low as this
  // gets in practice — but a time-up clock is still a hot clock, which is what
  // lets the TV's eating hero keep the number red while the label changes.
  assert.equal(isTimerUrgent(0), true);
});

test("does call time only once the clock reaches zero", () => {
  assert.equal(isTimerTimeUp(2), false);
  assert.equal(isTimerTimeUp(1), false);
  assert.equal(isTimerTimeUp(0), true);
});

test("does leave the threshold unexported so a fifth call site cannot hand-type it", async () => {
  // docs/takeover-layout-api.md §6 refuses to export the dock gutter for the
  // same reason: handing out the number is an invitation to compare against it
  // by hand somewhere else, which is the duplication this module removes.
  const timerUrgency = await import("./index");

  assert.deepEqual(Object.keys(timerUrgency).sort(), ["isTimerTimeUp", "isTimerUrgent"]);
});
