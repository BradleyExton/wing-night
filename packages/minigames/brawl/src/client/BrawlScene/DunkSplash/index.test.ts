import assert from "node:assert/strict";
import test from "node:test";
import type { BrawlGoon } from "@wingnight/shared";

import { DUNK_SPLASH_TICKS, resolveDunkSplash } from "./index.js";

const fallen: BrawlGoon = {
  spawnIndex: 3,
  kind: "raccoon",
  x: 204,
  y: 0,
  vx: 0,
  vy: 0,
  facing: -1,
  hp: 0,
  state: "ko",
  stateUntilTick: 145,
  koTick: 100
};

test("does spread a splash under the dunked goon from the tick it went in, for its ticks and no longer", () => {
  const dunks = [{ tick: 100, spawnIndex: 3 }];

  assert.deepEqual(resolveDunkSplash({ tick: 100, dunks, goons: [fallen] }, "bay"), { x: 204, age: 0, kind: "bay" });
  assert.deepEqual(resolveDunkSplash({ tick: 110, dunks, goons: [fallen] }, "railing"), { x: 204, age: 10, kind: "railing" });
  assert.equal(resolveDunkSplash({ tick: 100 + DUNK_SPLASH_TICKS, dunks, goons: [fallen] }, "bay"), null);
});

test("does show nothing with no dunk, no hazard or no goon to stand it under", () => {
  assert.equal(resolveDunkSplash({ tick: 100, dunks: [], goons: [fallen] }, "bay"), null);
  assert.equal(resolveDunkSplash({ tick: 100, dunks: [{ tick: 100, spawnIndex: 3 }], goons: [fallen] }, null), null);
  assert.equal(resolveDunkSplash({ tick: 100, dunks: [{ tick: 100, spawnIndex: 3 }], goons: [] }, "bay"), null);
});
