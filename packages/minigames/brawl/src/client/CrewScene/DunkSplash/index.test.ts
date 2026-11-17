import assert from "node:assert/strict";
import test from "node:test";
import type { BrawlCrewEvent, BrawlCrewGoon } from "@wingnight/shared";

import { DUNK_SPLASH_TICKS, resolveDunkSplash } from "./index.js";

const fallen: BrawlCrewGoon = {
  spawnIndex: 3,
  kind: "raccoon",
  x: 204,
  z: 18,
  y: 0,
  vx: 0,
  vy: 0,
  facing: -1,
  hp: 0,
  state: "ko",
  stateUntilTick: 145,
  koTick: 100,
  target: null
};
const dunk: BrawlCrewEvent = { tick: 100, kind: "dunk", hen: 1, spawnIndex: 3 };

test("does spread a splash under the dunked goon, on its own line, for its ticks and no longer", () => {
  assert.deepEqual(resolveDunkSplash({ tick: 100, events: [dunk], goons: [fallen] }, "bay"), { x: 204, z: 18, age: 0, kind: "bay" });
  assert.deepEqual(resolveDunkSplash({ tick: 110, events: [dunk], goons: [fallen] }, "railing"), { x: 204, z: 18, age: 10, kind: "railing" });
  assert.equal(resolveDunkSplash({ tick: 100 + DUNK_SPLASH_TICKS, events: [dunk], goons: [fallen] }, "bay"), null);
});

test("does read the newest dunk past everything else that happened since", () => {
  const events: BrawlCrewEvent[] = [dunk, { tick: 104, kind: "landed", hen: 0, spawnIndex: 7 }, { tick: 105, kind: "ko", hen: 0, spawnIndex: 7 }];

  assert.equal(resolveDunkSplash({ tick: 106, events, goons: [fallen] }, "plinth")?.age, 6);
});

test("does show nothing with no dunk, no hazard or no goon to stand it under", () => {
  assert.equal(resolveDunkSplash({ tick: 100, events: [], goons: [fallen] }, "bay"), null);
  assert.equal(resolveDunkSplash({ tick: 100, events: [dunk], goons: [fallen] }, null), null);
  assert.equal(resolveDunkSplash({ tick: 100, events: [dunk], goons: [] }, "bay"), null);
});
