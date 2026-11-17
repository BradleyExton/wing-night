import assert from "node:assert/strict";
import test from "node:test";

import type { BrawlGoonKind } from "../../types.js";
import type { BrawlCrewBlock } from "../types.js";
import {
  BRAWL_CREW_WALKS,
  BRAWL_CREW_WORLD,
  resolveBrawlCrewBlock,
  resolveBrawlCrewCourseTotal,
  resolveBrawlCrewHenStart,
  resolveBrawlCrewSize
} from "./index.js";

const SEED = 20261001;

const countKinds = (block: BrawlCrewBlock): Record<BrawlGoonKind, number> => {
  const counts: Record<BrawlGoonKind, number> = { goose: 0, gull: 0, raccoon: 0, swan: 0, helmet: 0, boss: 0 };

  for (const spawn of block.spawns) {
    counts[spawn.kind] += 1;
  }

  return counts;
};

test("does deal block 0's first wave as 3, 5, 7, 9 and 11 geese when the crew is one to five", () => {
  const sizes = [1, 2, 3, 4, 5].map((crew) => {
    const wave = resolveBrawlCrewBlock({ seed: SEED, blocks: 3, block: 0, crew }).waves[0];

    assert.ok(wave?.spawns.every((spawn) => spawn.kind === "goose"), "the first gate is geese only at every crew size");

    return wave?.spawns.length;
  });

  assert.deepEqual(sizes, [3, 5, 7, 9, 11]);
});

test("does deal a crew of one the relay's own kit when the block is laid out", () => {
  assert.deepEqual(countKinds(resolveBrawlCrewBlock({ seed: SEED, blocks: 3, block: 0, crew: 1 })), {
    goose: 6,
    gull: 1,
    raccoon: 0,
    swan: 0,
    helmet: 0,
    boss: 0
  });
  assert.deepEqual(countKinds(resolveBrawlCrewBlock({ seed: SEED, blocks: 3, block: 2, crew: 1 })), {
    goose: 2,
    gull: 4,
    raccoon: 2,
    swan: 1,
    helmet: 2,
    boss: 1
  });
});

test("does bring one more of each special goon for every two hens and still one boss when the crew grows", () => {
  const five = countKinds(resolveBrawlCrewBlock({ seed: SEED, blocks: 3, block: 2, crew: 5 }));

  assert.equal(five.gull, 4 * 3);
  assert.equal(five.raccoon, 2 * 3);
  assert.equal(five.swan, 1 * 3);
  assert.equal(five.helmet, 2 * 3);
  assert.equal(five.boss, 1);
});

test("does give the boss two more hp a hen and the street one more place a hen when the crew grows", () => {
  for (const crew of [1, 2, 3, 4, 5]) {
    const block = resolveBrawlCrewBlock({ seed: SEED, blocks: 3, block: 2, crew });

    assert.equal(block.bossHp, 4 + 2 * (crew - 1));
    assert.equal(block.standingCap, 2 + crew);
  }
});

test("does deal the same mix on every seed when only the seed changes", () => {
  for (const crew of [1, 3, 5]) {
    for (const block of [0, 1, 2]) {
      const expected = countKinds(resolveBrawlCrewBlock({ seed: SEED, blocks: 3, block, crew }));

      for (let seed = 1; seed <= 40; seed += 1) {
        assert.deepEqual(countKinds(resolveBrawlCrewBlock({ seed: seed * 7919, blocks: 3, block, crew })), expected);
      }
    }
  }
});

test("does lay out the same block twice when the course is the same", () => {
  const course = { seed: SEED, blocks: 3, block: 1, crew: 4 };

  assert.deepEqual(resolveBrawlCrewBlock(course), resolveBrawlCrewBlock(course));
});

test("does lay block 2 out the same when the course is three blocks long or five", () => {
  assert.deepEqual(
    resolveBrawlCrewBlock({ seed: SEED, blocks: 3, block: 2, crew: 3 }),
    resolveBrawlCrewBlock({ seed: SEED, blocks: 5, block: 2, crew: 3 })
  );
});

test("does total a block as its goons, a clean wave for every hen and three hearts for every hen when it is laid out", () => {
  for (const crew of [1, 2, 5]) {
    for (const index of [0, 1, 2]) {
      const block = resolveBrawlCrewBlock({ seed: SEED, blocks: 3, block: index, crew });
      const goons = block.spawns.reduce((total, spawn) => total + BRAWL_CREW_WORLD.goons[spawn.kind].worth, 0);

      assert.equal(block.total, goons + block.waves.length * 2 * crew + 3 * crew);
    }
  }

  // The relay's course is 61 for one hen (38 of goons, 14 of waves, 9 of hearts): a crew of one is dealt the same.
  assert.equal(resolveBrawlCrewCourseTotal({ seed: SEED, blocks: 3, crew: 1 }), 61);
});

test("does deal every goon a line inside the band and a side when a wave is laid out", () => {
  const block = resolveBrawlCrewBlock({ seed: SEED, blocks: 3, block: 2, crew: 5 });

  for (const spawn of block.spawns) {
    assert.ok(spawn.z >= 0 && spawn.z <= BRAWL_CREW_WORLD.depth, `spawn ${spawn.index} is off the band at z ${spawn.z}`);
    assert.ok(spawn.side === -1 || spawn.side === 1);
  }

  for (const wave of block.waves) {
    const sides = new Set(wave.spawns.map((spawn) => spawn.side));

    assert.equal(sides.size, 2, `wave ${wave.index} arrives from one side only`);
  }
});

test("does put the hazard in wave 1's window, clear of its edges, when a block is laid out", () => {
  for (let seed = 1; seed <= 60; seed += 1) {
    const block = resolveBrawlCrewBlock({ seed: seed * 104729, blocks: 3, block: 1, crew: 3 });
    const lockX = block.waves[1]?.lockX ?? 0;

    assert.ok(block.hazard !== null);
    assert.ok(block.hazard.x >= lockX + 14);
    assert.ok(block.hazard.x + block.hazard.width <= lockX + BRAWL_CREW_WORLD.width - 14);
  }
});

test("does stand every hen inside the band and the window when a block starts", () => {
  for (const crew of [1, 2, 3, 4, 5, 8]) {
    const spots = Array.from({ length: crew }, (_, slot) => resolveBrawlCrewHenStart(slot, crew));

    for (const spot of spots) {
      assert.ok(spot.z > 0 && spot.z < BRAWL_CREW_WORLD.depth);
      assert.ok(spot.x >= BRAWL_CREW_WORLD.henMargin && spot.x < BRAWL_CREW_WORLD.width / 2);
    }

    assert.equal(new Set(spots.map((spot) => `${spot.x},${spot.z}`)).size, crew, "two hens start on the same spot");
  }
});

test("does clamp a crew to a whole number from one to the most the night seats when it is dealt", () => {
  assert.equal(resolveBrawlCrewSize(undefined), 1);
  assert.equal(resolveBrawlCrewSize(0), 1);
  assert.equal(resolveBrawlCrewSize(3.9), 3);
  assert.equal(resolveBrawlCrewSize(40), BRAWL_CREW_WORLD.maxCrew);
});

test("does name eight directions and standing when the stick is read", () => {
  assert.deepEqual(BRAWL_CREW_WALKS[0], { x: 0, z: 0 });
  assert.deepEqual(BRAWL_CREW_WALKS[1], { x: 1, z: 0 });
  assert.deepEqual(BRAWL_CREW_WALKS[3], { x: 0, z: 1 });
  assert.deepEqual(BRAWL_CREW_WALKS[5], { x: -1, z: 0 });
  assert.deepEqual(BRAWL_CREW_WALKS[7], { x: 0, z: -1 });
  assert.equal(new Set(Object.values(BRAWL_CREW_WALKS).map((step) => `${step.x},${step.z}`)).size, 9);
});
