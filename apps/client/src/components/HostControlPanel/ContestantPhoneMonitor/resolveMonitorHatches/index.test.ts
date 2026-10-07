import assert from "node:assert/strict";
import test from "node:test";
import type { MinigameDisplayView } from "@wingnight/shared";

import { resolveMonitorHatches } from "./index";

const viewOf = (minigame: string, phase: string): MinigameDisplayView =>
  ({ minigame, phase }) as unknown as MinigameDisplayView;

test("does offer skip leg and reset when the game is FAPPY, and skip only while the leg is live", () => {
  assert.deepEqual(resolveMonitorHatches(viewOf("FAPPY", "flying")), [
    { actionType: "skipLeg", label: "Skip leg", isEnabled: true, isLegScoped: true },
    { actionType: "resetTurn", label: "Reset turn", isEnabled: true, isLegScoped: false }
  ]);
  assert.equal(resolveMonitorHatches(viewOf("FAPPY", "finished"))[0]?.isEnabled, false);
});

test("does offer each arcade game its own skip when the game is SCHLONIC or BRAWL", () => {
  assert.equal(resolveMonitorHatches(viewOf("SCHLONIC", "running"))[0]?.actionType, "skipRun");
  assert.equal(resolveMonitorHatches(viewOf("BRAWL", "ready"))[0]?.actionType, "skipBlock");
});

test("does let the host call JOUST's next shot only when the shot has landed", () => {
  const aiming = resolveMonitorHatches(viewOf("JOUST", "aiming"));
  const resolved = resolveMonitorHatches(viewOf("JOUST", "resolved"));

  assert.deepEqual(
    aiming.map((hatch) => [hatch.actionType, hatch.isEnabled]),
    [
      ["nextShot", false],
      ["skipShot", true],
      ["resetTurn", true]
    ]
  );
  assert.equal(resolved[0]?.isEnabled, true);
  assert.equal(resolved[1]?.isEnabled, false);
});

test("does offer nothing when there is no view or the game has no phone turns", () => {
  assert.deepEqual(resolveMonitorHatches(null), []);
  assert.deepEqual(resolveMonitorHatches(viewOf("TRIVIA", "play")), []);
});
