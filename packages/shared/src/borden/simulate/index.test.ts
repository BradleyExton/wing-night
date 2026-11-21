import assert from "node:assert/strict";
import test from "node:test";

import { bordenMasher, bordenRunner, resolveBordenBotInputs, type BordenBot } from "../bots/index.js";
import type {
  BordenBottle,
  BordenFoe,
  BordenFrame,
  BordenHen,
  BordenInput,
  BordenShot,
  BordenSpawn,
  BordenStretch
} from "../types.js";
import {
  BORDEN_WORLD,
  resolveBordenCourseTotal,
  resolveBordenFoeHp,
  resolveBordenPairs,
  resolveBordenStretch
} from "../world/index.js";
import {
  advanceBorden,
  createBordenStart,
  resolveBordenHandoffBottles,
  stepBorden
} from "./index.js";

const WORLD = BORDEN_WORLD;
const SEED = 20261120;
const NEVER = 1_000_000;

// A hand-built stretch, so a test says what it is testing instead of hunting a seed for it. The
// bottle lies far past the gate unless a test puts it somewhere.
const handStretch = (pair: number, spawns: Omit<BordenSpawn, "id">[] = []): BordenStretch => ({
  index: 0,
  name: "fences",
  pair,
  length: WORLD.width * 4,
  gateX: WORLD.width * 4 - 10,
  spawns: spawns.map((spawn, id) => ({ id, ...spawn })),
  bottle: { x: WORLD.width * 10, bottle: "spread" },
  restTicks: 54,
  total: 0
});

const withHen = (frame: BordenFrame, slot: number, patch: Partial<BordenHen>): BordenFrame => ({
  ...frame,
  hens: frame.hens.map((hen) => (hen.slot === slot ? { ...hen, ...patch } : hen))
});

// A shot put straight into the air, coming at the hens from the right.
const withShot = (frame: BordenFrame, patch: Partial<BordenShot> & { x: number; y: number }): BordenFrame => ({
  ...frame,
  shots: [...frame.shots, { id: 900, vx: -WORLD.shotSpeed, radius: WORLD.shotRadius, settled: [], ...patch }]
});

// A foe put straight onto the ground, for a test about one moment rather than a whole approach.
const withFoe = (frame: BordenFrame, patch: Partial<BordenFoe> & Pick<BordenFoe, "kind" | "x">): BordenFrame => ({
  ...frame,
  foes: [
    ...frame.foes,
    {
      id: 800,
      homeX: patch.x,
      vx: 0,
      hp: resolveBordenFoeHp(patch.kind, frame.hens.length),
      level: "low",
      parked: true,
      koTick: null,
      koBy: null,
      touched: [],
      ...patch
    }
  ]
});

const run = (frame: BordenFrame, stretch: BordenStretch, ticks: number, inputs: BordenInput[] = []): BordenFrame => {
  return advanceBorden(frame, stretch, inputs, frame.tick + ticks);
};

const henOf = (frame: BordenFrame, slot = 0): BordenHen => {
  const hen = frame.hens[slot];

  assert.ok(hen !== undefined, `no hen in slot ${slot}`);

  return hen;
};

// Every input at its tick, so a test can write "jump at 18" and not count from the frame's tick.
const jumpAt = (tick: number, hen = 0): BordenInput => ({ tick, hen, kind: "jump" });

/** Plays a stretch with one bot per hen, keeping the log the pads would have sent. */
const play = (stretch: BordenStretch, bot: BordenBot, bottles: readonly BordenBottle[] = []) => {
  const log: BordenInput[] = [];
  let frame = createBordenStart(stretch, { bottles });

  while (frame.outcome === null) {
    const inputs = resolveBordenBotInputs(frame, stretch, frame.hens.map(() => bot));

    log.push(...inputs);
    frame = stepBorden(frame, stretch, inputs);
  }

  return { frame, log };
};

/** Plays the whole game the way the room deals it: three stretches, pairs round-robin, bottles handed on. */
const playCourse = (seed: number, players: number, bot: BordenBot) => {
  let bottles: BordenBottle[] = [];

  return resolveBordenPairs(players).map((pair, index) => {
    const stretch = resolveBordenStretch({ seed, stretch: index, pair: pair.length });
    const { frame } = play(stretch, bot, bottles);

    bottles = resolveBordenHandoffBottles(frame);

    return frame;
  });
};

test("jumps on a press up to six ticks before she can, and not seven", () => {
  const stretch = handStretch(1);
  let frame = run(createBordenStart(stretch), stretch, 1, [jumpAt(0)]);

  while (henOf(frame).y > 0) {
    frame = stepBorden(frame, stretch, []);
  }

  // The tick she lands on is the last she is in the air for: the first she can jump again is the next.
  const canJump = frame.tick + 1;
  // A press stamped at tick t is heard by the step to t + 1, and keeps for `jumpBufferTicks` steps.
  const jumps = (pressAt: number): number => {
    const after = run(createBordenStart(stretch), stretch, canJump + 4, [jumpAt(0), jumpAt(pressAt)]);

    return after.events.filter((event) => event.kind === "jump").length;
  };

  assert.equal(jumps(canJump - WORLD.jumpBufferTicks), 2);
  assert.equal(jumps(canJump - WORLD.jumpBufferTicks - 1), 1);
});

test("costs a standing hen a heart for a low shot and counts it a dodge when she jumps it", () => {
  const stretch = handStretch(1);
  const start = withShot(createBordenStart(stretch), { x: 54, y: WORLD.lowShotHeight });

  const stood = run(start, stretch, 60);

  assert.equal(henOf(stood).hearts, WORLD.heartsMax - 1);
  assert.equal(henOf(stood).stats.hits, 1);

  const jumped = run(start, stretch, 60, [jumpAt(18)]);

  assert.equal(henOf(jumped).hearts, WORLD.heartsMax);
  assert.equal(henOf(jumped).stats.dodged, 1);
});

test("lets a high shot over a ducking hen and hits her standing", () => {
  const stretch = handStretch(1);
  const start = withShot(createBordenStart(stretch), { x: 54, y: WORLD.highShotHeight });
  const ducked = run(start, stretch, 60, [{ tick: 0, hen: 0, kind: "stick", dir: 3 }]);

  assert.equal(henOf(ducked).hearts, WORLD.heartsMax);
  assert.equal(henOf(ducked).stats.dodged, 1);
  assert.equal(henOf(run(start, stretch, 60)).hearts, WORLD.heartsMax - 1);
});

test("takes the hot bottle off her before it takes a heart", () => {
  const stretch = handStretch(1);
  const start = withShot(withHen(createBordenStart(stretch), 0, { bottle: "long" }), { x: 54, y: WORLD.lowShotHeight });
  const hit = run(start, stretch, 60);

  assert.equal(henOf(hit).bottle, "mild");
  assert.equal(henOf(hit).hearts, WORLD.heartsMax);
  assert.ok(hit.events.some((event) => event.kind === "bottle-lost"));
});

test("puts her down at no hearts until her partner stands over her for a second and a half", () => {
  const stretch = handStretch(2);
  // The partner stands right behind her, so the shot is already past the partner.
  const start = withShot(withHen(withHen(createBordenStart(stretch), 0, { hearts: 1 }), 1, { x: 18 }), {
    x: 54,
    y: WORLD.lowShotHeight,
    settled: [1]
  });
  const downed = run(start, stretch, 40);

  assert.equal(henOf(downed).state, "down");
  assert.equal(henOf(downed).stats.downs, 1);
  assert.equal(downed.outcome, null);

  const fellAt = downed.events.find((event) => event.kind === "down")?.tick ?? 0;
  const almost = advanceBorden(downed, stretch, [], fellAt + WORLD.reviveTicks - 1);

  assert.equal(henOf(almost).state, "down");

  const revived = run(almost, stretch, 2);

  assert.equal(henOf(revived).state, "up");
  assert.equal(henOf(revived).hearts, WORLD.reviveHearts);
  assert.equal(henOf(revived, 1).stats.revives, 1);
});

test("starts the revive over when her partner moves off her", () => {
  const stretch = handStretch(2);
  const start = withHen(withHen(createBordenStart(stretch), 0, { state: "down", hearts: 0 }), 1, { x: 18 });
  const moved = run(start, stretch, WORLD.reviveTicks + 30, [
    { tick: 30, hen: 1, kind: "stick", dir: 5 },
    { tick: 31, hen: 1, kind: "stick", dir: 0 }
  ]);

  assert.equal(henOf(moved).state, "down");
  assert.equal(henOf(run(moved, stretch, 30)).state, "up");
});

test("ends the stretch as a wipe when both are down, keeping what they banked", () => {
  const stretch = handStretch(2);
  const both = { ...createBordenStart(stretch), banked: 5 };
  const wiped = stepBorden(
    withHen(withHen(both, 0, { state: "down", hearts: 0 }), 1, { state: "down", hearts: 0 }),
    stretch,
    []
  );

  assert.equal(wiped.outcome, "wipe");
  assert.equal(wiped.banked, 5);
  assert.deepEqual(resolveBordenHandoffBottles(wiped), []);
});

test("clears at the gate, banking the hearts carried through and handing on a hot bottle", () => {
  const stretch = handStretch(2);
  const start = withHen(
    withHen({ ...createBordenStart(stretch), cameraX: stretch.length - WORLD.width }, 0, {
      x: stretch.gateX - 2,
      hearts: 2,
      bottle: "puddle"
    }),
    1,
    { x: stretch.gateX - 40, state: "down", hearts: 0 }
  );
  const cleared = run(start, stretch, 10, [{ tick: 0, hen: 0, kind: "stick", dir: 1 }]);

  assert.equal(cleared.outcome, "cleared");
  assert.equal(cleared.banked, 2 * WORLD.heartWorth);
  assert.deepEqual(resolveBordenHandoffBottles(cleared), ["puddle"]);
  assert.deepEqual(
    createBordenStart(stretch, { bottles: resolveBordenHandoffBottles(cleared) }).hens.map((hen) => hen.bottle),
    ["puddle", "mild"]
  );
});

test("holds the hens off the gate while the sergeant stands", () => {
  const sergeantX = WORLD.width * 4 - 34;
  const stretch = handStretch(2, [{ kind: "sergeant", x: sergeantX, level: "low" }]);
  const end = stretch.length - WORLD.width;
  // He is already up, with more hp than two hoses can take, and nothing can hurt the hens.
  const start = withFoe(
    withHen(
      withHen({ ...createBordenStart(stretch), cameraX: end, woken: 1 }, 0, { x: end + 60, invulnerableUntilTick: NEVER }),
      1,
      { x: end + 50, invulnerableUntilTick: NEVER }
    ),
    { kind: "sergeant", x: sergeantX, hp: NEVER }
  );
  const right: BordenInput[] = [0, 1].map((hen) => ({ tick: 0, hen, kind: "stick", dir: 1 }));
  const held = run(start, stretch, 300, right);
  const sergeant = held.foes.find((foe) => foe.kind === "sergeant");

  assert.ok(sergeant !== undefined && sergeant.koTick === null);
  assert.ok(henOf(held).x < sergeantX - WORLD.foes.sergeant.halfWidth - WORLD.henHalfWidth, "she got past him");
  assert.equal(held.outcome, null);

  const weak = { ...held, foes: held.foes.map((foe) => (foe.kind === "sergeant" ? { ...foe, hp: 3 } : foe)) };
  const through = run(weak, stretch, 300);

  assert.equal(through.outcome, "cleared");
  assert.ok(through.banked >= WORLD.foes.sergeant.worth);
});

test("flashes one shooter before it fires, with the stretch's first shot the slowest", () => {
  const stretch = handStretch(1, [{ kind: "turret", x: 100, level: "high" }]);
  // She faces away from the turret, so her sauce never touches it, and nothing can hurt her.
  const start = withHen(createBordenStart(stretch), 0, { facing: -1, invulnerableUntilTick: NEVER });
  const flashing = run(start, stretch, WORLD.firstTelegraphTick);

  assert.deepEqual(flashing.telegraph, { foeId: 0, fireTick: WORLD.firstTelegraphTick + WORLD.telegraphTicks });
  assert.equal(flashing.shots.length, 0);

  const first = run(flashing, stretch, WORLD.telegraphTicks);

  assert.equal(first.shots.length, 1);
  assert.equal(first.shots[0]?.vx, -WORLD.shotSpeed * WORLD.firstShotSpeedShare);
  assert.equal(first.shots[0]?.y, WORLD.highShotHeight);

  const second = run(first, stretch, stretch.restTicks + WORLD.telegraphTicks);

  assert.equal(second.volley, 2);
  assert.equal(second.shots.at(-1)?.vx, -WORLD.shotSpeed);
});

test("banks a turret sprayed down and credits the hen whose sauce it was", () => {
  const stretch = handStretch(1, [{ kind: "turret", x: 70, level: "high" }]);
  const start = withHen(createBordenStart(stretch), 0, { invulnerableUntilTick: NEVER });
  let sprayed = start;

  while (sprayed.banked === 0 && sprayed.tick < 300) {
    sprayed = stepBorden(sprayed, stretch, []);
  }

  assert.equal(sprayed.banked, WORLD.foes.turret.worth);
  assert.equal(henOf(sprayed).stats.downed, 1);
  assert.equal(henOf(sprayed).stats.worth, WORLD.foes.turret.worth);
  assert.equal(sprayed.foes.find((foe) => foe.kind === "turret")?.koBy, 0);
  // It lingers to be felled on screen, then leaves the frame.
  assert.equal(run(sprayed, stretch, WORLD.koLingerTicks - 1).foes.length, 1);
  assert.equal(run(sprayed, stretch, WORLD.koLingerTicks).foes.length, 0);
});

test("needs her ducked to spray a low turret: standing, her sauce goes over it", () => {
  const stretch = handStretch(1, [{ kind: "turret", x: 70, level: "low" }]);
  const start = withHen(createBordenStart(stretch), 0, { invulnerableUntilTick: NEVER });

  assert.equal(run(start, stretch, 120).banked, 0);
  assert.equal(run(start, stretch, 120, [{ tick: 0, hen: 0, kind: "stick", dir: 3 }]).banked, WORLD.foes.turret.worth);
});

test("sprays three streams from the spread and reaches further with the long bottle", () => {
  const stretch = handStretch(1);
  const spread = stepBorden(withHen(createBordenStart(stretch), 0, { bottle: "spread" }), stretch, []);
  const long = stepBorden(withHen(createBordenStart(stretch), 0, { bottle: "long" }), stretch, []);
  const mild = stepBorden(createBordenStart(stretch), stretch, []);

  assert.equal(spread.sauce.length, 3);
  assert.equal(mild.sauce.length, 1);
  assert.ok((long.sauce[0]?.vx ?? 0) > (mild.sauce[0]?.vx ?? 0));
  assert.deepEqual(
    spread.sauce.map((drop) => Math.sign(drop.vy)),
    [-1, 0, 1]
  );
});

test("aims the sauce the eight ways the stick points, a diagonal at the fixed 0.7071", () => {
  const stretch = handStretch(1);
  const aimed = (dir: 1 | 7 | 8, airborne: boolean) => {
    const start = withHen(createBordenStart(stretch), 0, airborne ? { y: 10, vy: 0.5 } : {});
    const drop = stepBorden(start, stretch, [{ tick: 0, hen: 0, kind: "stick", dir }]).sauce[0];

    return { vx: drop?.vx, vy: drop?.vy };
  };
  const speed = WORLD.bottles.mild.speed;

  assert.deepEqual(aimed(1, false), { vx: speed, vy: 0 });
  assert.deepEqual(aimed(7, false), { vx: 0, vy: speed });
  assert.deepEqual(aimed(8, true), { vx: WORLD.diagonal * speed, vy: WORLD.diagonal * speed });
});

test("leaves a puddle where puddle sauce lands, and the puddle burns what stands in it", () => {
  const stretch = handStretch(1);
  const splashed = run(withHen(createBordenStart(stretch), 0, { bottle: "puddle" }), stretch, 40);

  assert.ok(splashed.puddles.length > 0);
  assert.ok(splashed.events.some((event) => event.kind === "splash"));

  const standing = withFoe({ ...createBordenStart(stretch), puddles: [{ id: 700, hen: 0, x: 120, untilTick: NEVER }] }, {
    kind: "tank",
    x: 120,
    hp: 2
  });
  // She faces away, so only the puddle can be what takes the tank down.
  const burnt = run(withHen(standing, 0, { facing: -1, invulnerableUntilTick: NEVER }), stretch, WORLD.burnEveryTicks * 2);

  assert.equal(burnt.foes[0]?.koTick === null, false);
  assert.equal(henOf(burnt).stats.downed, 1);
});

test("hurts her once as a goose runs through her, and lets her jump it", () => {
  const stretch = handStretch(1);
  const goose = withFoe(createBordenStart(stretch), { kind: "goose", x: 70, vx: -WORLD.foes.goose.speed });
  // Facing away, so the goose reaches her unsprayed.
  const start = withHen(goose, 0, { facing: -1 });
  const through = run(start, stretch, 90);

  assert.equal(henOf(through).hearts, WORLD.heartsMax - 1);
  assert.equal(henOf(through).stats.hits, 1);

  const jumped = run(start, stretch, 90, [jumpAt(26)]);

  assert.equal(henOf(jumped).hearts, WORLD.heartsMax);
});

test("takes the bottle lying in the stretch when she runs over it", () => {
  const stretch = { ...handStretch(1), bottle: { x: 40, bottle: "spread" as const } };
  const taken = run(createBordenStart(stretch), stretch, 40, [{ tick: 0, hen: 0, kind: "stick", dir: 1 }]);

  assert.equal(henOf(taken).bottle, "spread");
  assert.equal(taken.bottle, null);
});

test("sits a hen left alone for ten seconds away, out of harm, and stands her up on any input", () => {
  const stretch = handStretch(1);
  const away = run(createBordenStart(stretch), stretch, WORLD.awayTicks + 1);

  assert.equal(henOf(away).state, "away");

  const shot = run(withShot(away, { x: henOf(away).x + 20, y: WORLD.lowShotHeight }), stretch, 40);

  assert.equal(henOf(shot).hearts, WORLD.heartsMax);
  assert.equal(shot.outcome, null);

  const back = stepBorden(away, stretch, [{ tick: away.tick, hen: 0, kind: "stick", dir: 0 }]);

  assert.equal(henOf(back).state, "up");
});

test("follows the lead hen rightward only, walking the one behind along the left edge", () => {
  const stretch = handStretch(2);
  let frame = createBordenStart(stretch);
  let cameraX = frame.cameraX;

  frame = stepBorden(frame, stretch, [{ tick: 0, hen: 0, kind: "stick", dir: 1 }]);

  for (let tick = 0; tick < 300; tick += 1) {
    frame = stepBorden(frame, stretch, []);
    assert.ok(frame.cameraX >= cameraX, "the camera went back");
    cameraX = frame.cameraX;
  }

  assert.ok(cameraX > 0);
  assert.equal(henOf(frame, 1).x, frame.cameraX + WORLD.henMargin);
});

test("lands on the same frame stepped one tick at a time, advanced over the log, or sent as JSON", () => {
  const stretch = resolveBordenStretch({ seed: SEED, stretch: 2 });
  const { frame, log } = play(stretch, bordenRunner);
  const advanced = advanceBorden(createBordenStart(stretch), stretch, log, frame.tick);
  const halfway = advanceBorden(createBordenStart(stretch), stretch, log, Math.floor(frame.tick / 2));
  const sent = JSON.parse(JSON.stringify(halfway)) as BordenFrame;
  const resumed = advanceBorden(sent, stretch, log, frame.tick);

  assert.deepEqual(advanced, frame);
  assert.deepEqual(JSON.parse(JSON.stringify(resumed)), JSON.parse(JSON.stringify(frame)));
});

test("never touches the frame it was handed", () => {
  const stretch = resolveBordenStretch({ seed: SEED, stretch: 1 });
  const midway = advanceBorden(createBordenStart(stretch), stretch, [{ tick: 0, hen: 0, kind: "stick", dir: 1 }], 600);
  const before = JSON.stringify(midway);

  stepBorden(midway, stretch, [{ tick: midway.tick, hen: 1, kind: "jump" }]);

  assert.equal(JSON.stringify(midway), before);
});

test("lets the runner clear every stretch for a room of two, three and four, beating the masher", () => {
  for (const seed of [1, 2, 3, SEED]) {
    for (const players of [2, 3, 4]) {
      const runner = playCourse(seed, players, bordenRunner);
      const masher = playCourse(seed, players, bordenMasher);
      const banked = (frames: BordenFrame[]) => frames.reduce((total, frame) => total + frame.banked, 0);

      assert.deepEqual(
        runner.map((frame) => frame.outcome),
        ["cleared", "cleared", "cleared"],
        `seed ${seed}, ${players} players`
      );
      assert.ok(banked(runner) <= resolveBordenCourseTotal({ seed, players }));
      assert.ok(banked(runner) > banked(masher), `seed ${seed}: the masher banked as much`);
    }
  }
});
