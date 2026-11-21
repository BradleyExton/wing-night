import assert from "node:assert/strict";
import test from "node:test";

import {
  BORDEN_STRETCHES,
  BORDEN_WORLD,
  resolveBordenCourseTotal,
  resolveBordenFoeHp,
  resolveBordenPairs,
  resolveBordenStretch,
  resolveBordenWakeX
} from "./index.js";

const SEED = 20261120;

const shootersOf = (stretch: number): number => {
  return resolveBordenStretch({ seed: SEED, stretch }).spawns.filter((spawn) => spawn.kind !== "goose").length;
};

test("deals the same stretch from the same seed", () => {
  for (let stretch = 0; stretch < BORDEN_STRETCHES; stretch += 1) {
    assert.deepEqual(resolveBordenStretch({ seed: SEED, stretch }), resolveBordenStretch({ seed: SEED, stretch }));
  }
});

test("deals a different layout from a different seed", () => {
  const xs = (seed: number): number[] => resolveBordenStretch({ seed, stretch: 1 }).spawns.map((spawn) => spawn.x);

  assert.notDeepEqual(xs(SEED), xs(SEED + 1));
});

test("makes each stretch harder than the last when they run in order", () => {
  const stretches = Array.from({ length: BORDEN_STRETCHES }, (_, stretch) => resolveBordenStretch({ seed: SEED, stretch }));

  assert.deepEqual(
    stretches.map((stretch) => stretch.name),
    ["fences", "motor-pool", "parade-square"]
  );

  for (let stretch = 1; stretch < BORDEN_STRETCHES; stretch += 1) {
    assert.ok(shootersOf(stretch) >= shootersOf(stretch - 1), `stretch ${stretch} has fewer shooters`);
    assert.ok((stretches[stretch]?.restTicks ?? 0) < (stretches[stretch - 1]?.restTicks ?? 0), `stretch ${stretch} rests as long`);
  }

  assert.ok(stretches[2]?.spawns.some((spawn) => spawn.kind === "sergeant"), "the parade square has no sergeant");
  assert.ok(!stretches[0]?.spawns.some((spawn) => spawn.kind === "tank" || spawn.kind === "sergeant"));
});

test("deals spawns in the order the window reaches them, numbered from nought", () => {
  for (let stretch = 0; stretch < BORDEN_STRETCHES; stretch += 1) {
    const { spawns, gateX } = resolveBordenStretch({ seed: SEED, stretch });

    spawns.forEach((spawn, index) => {
      assert.equal(spawn.id, index);
      assert.ok(spawn.x < gateX, `${spawn.kind} ${spawn.id} is past the gate`);

      if (index > 0) {
        const previous = spawns[index - 1];

        assert.ok(previous !== undefined && resolveBordenWakeX(previous) <= resolveBordenWakeX(spawn));
      }
    });
  }
});

test("lays a different hot bottle in each stretch of one game", () => {
  for (const seed of [1, 2, 3, SEED]) {
    const bottles = new Set(
      Array.from({ length: BORDEN_STRETCHES }, (_, stretch) => resolveBordenStretch({ seed, stretch }).bottle.bottle)
    );

    assert.equal(bottles.size, BORDEN_STRETCHES);
  }
});

test("deals the pairs round-robin from the room when three or four play", () => {
  assert.deepEqual(resolveBordenPairs(1), [[0], [0], [0]]);
  assert.deepEqual(resolveBordenPairs(2), [
    [0, 1],
    [0, 1],
    [0, 1]
  ]);
  assert.deepEqual(resolveBordenPairs(3), [
    [0, 1],
    [2, 0],
    [1, 2]
  ]);
  assert.deepEqual(resolveBordenPairs(4), [
    [0, 1],
    [2, 3],
    [0, 2]
  ]);
  assert.deepEqual(resolveBordenPairs(9), resolveBordenPairs(4));
});

test("gives the sergeant more hp for a pair than for a hen alone", () => {
  assert.equal(resolveBordenFoeHp("sergeant", 1), BORDEN_WORLD.sergeantHpPerHen);
  assert.equal(resolveBordenFoeHp("sergeant", 2), BORDEN_WORLD.sergeantHpPerHen * 2);
  assert.equal(resolveBordenFoeHp("turret", 2), BORDEN_WORLD.foes.turret.hp);
});

test("puts a course over every foe's worth and three hearts a hen at each gate", () => {
  for (const players of [1, 2, 3, 4]) {
    const pairs = resolveBordenPairs(players);
    const expected = pairs.reduce((total, pair, stretch) => {
      const { spawns } = resolveBordenStretch({ seed: SEED, stretch, pair: pair.length });
      const worth = spawns.reduce((sum, spawn) => sum + BORDEN_WORLD.foes[spawn.kind].worth, 0);

      return total + worth + BORDEN_WORLD.heartsMax * BORDEN_WORLD.heartWorth * pair.length;
    }, 0);

    assert.equal(resolveBordenCourseTotal({ seed: SEED, players }), expected);
  }
});
