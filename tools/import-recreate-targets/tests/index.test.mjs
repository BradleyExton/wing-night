import assert from "node:assert/strict";
import test from "node:test";

import { planTargets, TARGETS_PACK_PATH } from "../index.mjs";

const prompts = [
  { id: "done", targetImageSrc: `${TARGETS_PACK_PATH}/done.png` },
  { id: "placeholder", targetImageSrc: "/sample-assets/recreate/x.svg" },
  { id: "blank", targetImageSrc: "" }
];

test("generates blank and placeholder targets and skips generated ones", () => {
  assert.deepEqual(planTargets({ prompts }), [
    { id: "done", skipReason: "already generated (use --force)" },
    { id: "placeholder", skipReason: null },
    { id: "blank", skipReason: null }
  ]);
});

test("regenerates everything with --force and narrows with --only", () => {
  assert.equal(planTargets({ prompts, force: true })[0]?.skipReason, null);
  assert.deepEqual(
    planTargets({ prompts, only: ["blank"] }).map((row) => row.skipReason),
    ["not in --only", "not in --only", null]
  );
});
