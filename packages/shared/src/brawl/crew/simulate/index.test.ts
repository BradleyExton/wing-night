import assert from "node:assert/strict";
import test from "node:test";

import type { BrawlGoonKind, BrawlGoonState, BrawlSide } from "../../types.js";
import {
  brawlCrewBrawler,
  brawlCrewMasher,
  resolveBrawlCrewBotInputs,
  type BrawlCrewBot
} from "../bots/index.js";
import type { BrawlCrewBlock, BrawlCrewFrame, BrawlCrewGoon, BrawlCrewHen, BrawlCrewInput } from "../types.js";
import { BRAWL_CREW_WORLD, resolveBrawlCrewBlock } from "../world/index.js";
import { advanceBrawlCrew, createBrawlCrewStart, stepBrawlCrew } from "./index.js";

const WORLD = BRAWL_CREW_WORLD;
const SEED = 20261001;

type HandSpawn = { kind: BrawlGoonKind; side: BrawlSide; atTick: number; z: number };

// A hand-built block, so a test says what it is testing instead of hunting a seed for it.
const handBlock = (crew: number, goons: HandSpawn[] = []): BrawlCrewBlock => {
  const spawns = goons.map((goon, index) => ({ ...goon, index }));

  return {
    index: 0,
    crew,
    length: WORLD.width * 2,
    waves: [{ index: 0, lockX: 0, spawns }],
    exitX: WORLD.width * 2 - WORLD.henMargin * 3,
    spawns,
    hazard: null,
    standingCap: WORLD.standingBase + crew,
    bossHp: WORLD.goons.boss.hp,
    total:
      spawns.reduce((total, spawn) => total + WORLD.goons[spawn.kind].worth, 0) +
      WORLD.cleanWaveBonus * crew +
      WORLD.heartsMax * WORLD.heartWorth * crew
  };
};

// A goon put straight onto the street, for a test about one moment rather than a whole approach.
const placeGoon = (patch: Partial<BrawlCrewGoon> & { kind: BrawlGoonKind; x: number; z: number }): BrawlCrewGoon => ({
  spawnIndex: 0,
  y: 0,
  vx: 0,
  vy: 0,
  facing: -1,
  hp: WORLD.goons[patch.kind].hp,
  state: "stunned",
  stateUntilTick: 100_000,
  koTick: null,
  target: 0,
  ...patch
});

const withHen = (frame: BrawlCrewFrame, slot: number, patch: Partial<BrawlCrewHen>): BrawlCrewFrame => ({
  ...frame,
  hens: frame.hens.map((hen) => (hen.slot === slot ? { ...hen, ...patch } : hen))
});

const run = (frame: BrawlCrewFrame, block: BrawlCrewBlock, inputs: BrawlCrewInput[], ticks: number): BrawlCrewFrame => {
  return advanceBrawlCrew(frame, block, inputs, frame.tick + ticks);
};

const henOf = (frame: BrawlCrewFrame, slot = 0): BrawlCrewHen => {
  const hen = frame.hens[slot];

  assert.ok(hen !== undefined, `no hen in slot ${slot}`);

  return hen;
};

/**
 * Plays a block with one bot per hen, keeping the log the pads would have sent. `watch` sees every
 * frame on the way, for a test about the whole fight rather than its end.
 */
const play = (block: BrawlCrewBlock, bot: BrawlCrewBot, watch?: (frame: BrawlCrewFrame) => void) => {
  const bots = Array.from({ length: block.crew }, () => bot);
  const inputs: BrawlCrewInput[] = [];
  let frame = createBrawlCrewStart(block);

  while (frame.outcome === null) {
    const now = resolveBrawlCrewBotInputs(frame, block, bots);

    inputs.push(...now);
    frame = stepBrawlCrew(frame, block, now);
    watch?.(frame);
  }

  return { frame, inputs };
};

test("does stand the crew on the line with three hearts each and the camera locked on wave 0 when a block starts", () => {
  const block = resolveBrawlCrewBlock({ seed: SEED, blocks: 3, block: 0, crew: 4 });
  const frame = createBrawlCrewStart(block);

  assert.equal(frame.tick, 0);
  assert.equal(frame.hens.length, 4);
  assert.deepEqual(frame.hens.map((hen) => hen.slot), [0, 1, 2, 3]);
  assert.ok(frame.hens.every((hen) => hen.hearts === 3 && hen.state === "up" && hen.facing === 1));
  assert.equal(frame.cameraLocked, true);
  assert.equal(frame.banked, 0);
  assert.equal(frame.outcome, null);
});

test("does walk her along the street at full speed and across it at 70% when the stick points one way", () => {
  const block = handBlock(1, [{ kind: "goose", side: 1, atTick: 5000, z: 16 }]);
  const start = createBrawlCrewStart(block);
  const { x, z } = henOf(start);
  const east = henOf(run(start, block, [{ tick: 0, hen: 0, kind: "walk", dir: 1 }], 10));
  const south = henOf(run(start, block, [{ tick: 0, hen: 0, kind: "walk", dir: 3 }], 10));

  assert.ok(Math.abs(east.x - (x + 10 * 0.9)) < 1e-9);
  assert.equal(east.z, z);
  assert.equal(south.x, x);
  assert.ok(Math.abs(south.z - (z + 10 * 0.63)) < 1e-9);
});

test("does take both fixed diagonal components and turn to face the way she walks when the stick is on a diagonal", () => {
  const block = handBlock(1, [{ kind: "goose", side: 1, atTick: 5000, z: 16 }]);
  const start = withHen(createBrawlCrewStart(block), 0, { x: 90 });
  const northWest = henOf(run(start, block, [{ tick: 0, hen: 0, kind: "walk", dir: 6 }], 10));

  assert.ok(Math.abs(northWest.x - (90 - 10 * 0.64)) < 1e-9);
  assert.ok(Math.abs(northWest.z - (16 - 10 * 0.45)) < 1e-9);
  assert.equal(northWest.facing, -1);
});

test("does keep her facing when she only walks up or down the band", () => {
  const block = handBlock(1, [{ kind: "goose", side: 1, atTick: 5000, z: 16 }]);
  const start = withHen(createBrawlCrewStart(block), 0, { facing: -1 });

  assert.equal(henOf(run(start, block, [{ tick: 0, hen: 0, kind: "walk", dir: 7 }], 10)).facing, -1);
});

test("does keep her inside the band and the window when she walks at their edges", () => {
  const block = handBlock(1, [{ kind: "goose", side: 1, atTick: 5000, z: 16 }]);
  const start = createBrawlCrewStart(block);
  const corner = henOf(run(start, block, [{ tick: 0, hen: 0, kind: "walk", dir: 6 }], 300));
  const far = henOf(run(start, block, [{ tick: 0, hen: 0, kind: "walk", dir: 2 }], 400));

  assert.equal(corner.x, WORLD.henMargin);
  assert.equal(corner.z, 0);
  assert.equal(far.x, WORLD.width - WORLD.henMargin);
  assert.equal(far.z, WORLD.depth);
});

test("does open a peck on the press and again at the cooldown when the thumb presses in time", () => {
  const block = handBlock(1, [{ kind: "goose", side: 1, atTick: 5000, z: 16 }]);
  const start = createBrawlCrewStart(block);
  const pressed = henOf(run(start, block, [{ tick: 0, hen: 0, kind: "peck", held: true }], 1));

  assert.equal(pressed.peckUntilTick, 1 + WORLD.peckDelayTicks + WORLD.peckActiveTicks);
  assert.equal(pressed.peckCooldownUntilTick, 1 + WORLD.peckCooldownTicks);

  // Released, then pressed again inside the cooldown: the press is kept and opens the tick it may.
  const again = henOf(
    run(
      start,
      block,
      [
        { tick: 0, hen: 0, kind: "peck", held: true },
        { tick: 3, hen: 0, kind: "peck", held: false },
        { tick: 8, hen: 0, kind: "peck", held: true },
        { tick: 9, hen: 0, kind: "peck", held: false }
      ],
      16
    )
  );

  assert.equal(again.peckCooldownUntilTick, 15 + WORLD.peckCooldownTicks);
});

test("does repeat a held peck a rest later than a fresh press would when the thumb is left down", () => {
  const block = handBlock(1, [{ kind: "goose", side: 1, atTick: 5000, z: 16 }]);
  const start = createBrawlCrewStart(block);
  const held: BrawlCrewInput[] = [{ tick: 0, hen: 0, kind: "peck", held: true }];
  const cycle = WORLD.peckCooldownTicks + WORLD.peckHoldRestTicks;

  assert.equal(henOf(run(start, block, held, cycle)).peckCooldownUntilTick, 1 + WORLD.peckCooldownTicks);
  assert.equal(henOf(run(start, block, held, cycle + 1)).peckCooldownUntilTick, 1 + cycle + WORLD.peckCooldownTicks);
});

test("does land a peck on a goose within the depth band and slide her onto its line when it is off hers", () => {
  const block = handBlock(1, [{ kind: "goose", side: 1, atTick: 5000, z: 16 }]);
  const start: BrawlCrewFrame = {
    ...withHen(createBrawlCrewStart(block), 0, { x: 60, z: 16 }),
    goons: [placeGoon({ kind: "goose", x: 72, z: 16 + WORLD.peckDepthBand })]
  };
  const after = run(start, block, [{ tick: 0, hen: 0, kind: "peck", held: true }], WORLD.peckDelayTicks + 2);
  const hen = henOf(after);

  assert.equal(after.goons[0]?.state, "ko");
  assert.equal(after.banked, 1);
  assert.deepEqual(hen.stats, { goons: 1, worth: 1, hits: 0, downs: 0, revives: 0 });
  assert.ok(hen.z > 16, "she did not slide toward the goose's line");
  assert.ok(after.events.some((event) => event.kind === "landed" && event.hen === 0));
});

test("does miss a goose just past the depth band when she pecks along her own line", () => {
  const block = handBlock(1, [{ kind: "goose", side: 1, atTick: 5000, z: 16 }]);
  const start: BrawlCrewFrame = {
    ...withHen(createBrawlCrewStart(block), 0, { x: 60, z: 16 }),
    goons: [placeGoon({ kind: "goose", x: 72, z: 16 + WORLD.peckDepthBand + 1 })]
  };
  const after = run(start, block, [{ tick: 0, hen: 0, kind: "peck", held: true }, { tick: 1, hen: 0, kind: "peck", held: false }], 20);

  assert.equal(after.goons[0]?.state, "stunned");
  assert.equal(after.banked, 0);
  assert.equal(henOf(after).z, 16);
});

test("does get onto her line before it honks when a goose is dealt a line across the band from her", () => {
  const block = handBlock(1, [{ kind: "goose", side: 1, atTick: 0, z: 30 }]);
  let frame = withHen(createBrawlCrewStart(block), 0, { x: 60, z: 4 });
  let honkedAt: BrawlCrewGoon | null = null;

  while (honkedAt === null && frame.tick < 1200) {
    // A nudge now and then, so she is never taken for a pad that has gone quiet.
    frame = stepBrawlCrew(frame, block, frame.tick % 300 === 0 ? [{ tick: frame.tick, hen: 0, kind: "walk", dir: 0 }] : []);
    honkedAt = frame.goons.find((goon) => goon.state === "telegraph") ?? null;
  }

  assert.ok(honkedAt !== null, "the goose never honked");
  assert.ok(Math.abs(honkedAt.z - henOf(frame).z) <= WORLD.goonLineBand);
  assert.ok(Math.abs(honkedAt.x - henOf(frame).x) <= WORLD.goons.goose.reach);
});

test("does cost her a heart when she stands on the line of a lunge and nothing when she steps off it", () => {
  const block = handBlock(1, [{ kind: "goose", side: 1, atTick: 5000, z: 16 }]);
  const honking = (): BrawlCrewFrame => ({
    ...withHen(createBrawlCrewStart(block), 0, { x: 60, z: 16 }),
    goons: [placeGoon({ kind: "goose", x: 74, z: 16, state: "telegraph", stateUntilTick: 30 })]
  });
  const stood = run(honking(), block, [], 60);
  const stepped = run(honking(), block, [{ tick: 0, hen: 0, kind: "walk", dir: 3 }], 60);

  assert.equal(henOf(stood).hearts, 2);
  assert.equal(henOf(stood).stats.hits, 1);
  assert.ok(stood.events.some((event) => event.kind === "hit" && event.hen === 0));
  assert.equal(henOf(stepped).hearts, 3);
});

test("does take a heart off every hen standing in a row when one lunge goes through them", () => {
  const block = handBlock(2, [{ kind: "goose", side: 1, atTick: 5000, z: 16 }]);
  const start: BrawlCrewFrame = {
    ...withHen(withHen(createBrawlCrewStart(block), 0, { x: 60, z: 16 }), 1, { x: 50, z: 17 }),
    goons: [placeGoon({ kind: "goose", x: 74, z: 16, state: "telegraph", stateUntilTick: 30 })]
  };
  const after = run(start, block, [], 60);

  assert.equal(henOf(after, 0).hearts, 2);
  assert.equal(henOf(after, 1).hearts, 2);
});

test("does lay her down where she fell and send her geese to a teammate when she runs out of hearts", () => {
  const block = handBlock(2, [{ kind: "goose", side: 1, atTick: 5000, z: 16 }]);
  const start: BrawlCrewFrame = {
    ...withHen(withHen(createBrawlCrewStart(block), 0, { x: 60, z: 16, hearts: 1 }), 1, { x: 150, z: 28 }),
    goons: [placeGoon({ kind: "goose", x: 74, z: 16, state: "telegraph", stateUntilTick: 30, target: 0 })]
  };
  const after = run(start, block, [{ tick: 0, hen: 1, kind: "walk", dir: 0 }], 120);

  assert.equal(henOf(after, 0).state, "down");
  assert.equal(henOf(after, 0).hearts, 0);
  assert.equal(henOf(after, 0).stats.downs, 1);
  assert.equal(after.goons[0]?.target, 1);
  assert.equal(after.outcome, null);
});

test("does get a downed hen up on one heart when a teammate has stood over her for a second and a half", () => {
  const block = handBlock(2);
  const start = withHen(withHen(createBrawlCrewStart(block), 0, { x: 66, z: 16 }), 1, { x: 60, z: 18, state: "down", hearts: 0 });
  const almost = run(start, block, [], WORLD.reviveTicks);
  const done = run(start, block, [], WORLD.reviveTicks + 1);

  assert.equal(henOf(almost, 1).state, "down");
  assert.equal(henOf(almost, 1).reviveSinceTick, 1);
  assert.equal(henOf(done, 1).state, "up");
  assert.equal(henOf(done, 1).hearts, WORLD.reviveHearts);
  assert.ok(henOf(done, 1).invulnerableUntilTick > done.tick);
  assert.equal(henOf(done, 0).stats.revives, 1);
  assert.ok(done.events.some((event) => event.kind === "revive" && event.hen === 1));
});

test("does start the count again when the teammate standing over her walks off and comes back", () => {
  const block = handBlock(2);
  const start = withHen(withHen(createBrawlCrewStart(block), 0, { x: 66, z: 16 }), 1, { x: 60, z: 18, state: "down", hearts: 0 });
  const inputs: BrawlCrewInput[] = [
    { tick: 40, hen: 0, kind: "walk", dir: 1 },
    { tick: 41, hen: 0, kind: "walk", dir: 0 }
  ];
  const after = run(start, block, inputs, WORLD.reviveTicks + 20);

  assert.equal(henOf(after, 1).state, "down");
  assert.equal(henOf(after, 1).reviveSinceTick, 42);
  assert.equal(henOf(run(start, block, inputs, 42 + WORLD.reviveTicks), 1).state, "up");
});

test("does not count a teammate who is pecking or too far when she stands near a downed hen", () => {
  const block = handBlock(2);
  const fallen = { x: 60, z: 18, state: "down" as const, hearts: 0 };
  const pecking = withHen(withHen(createBrawlCrewStart(block), 0, { x: 66, z: 16 }), 1, fallen);
  const far = withHen(withHen(createBrawlCrewStart(block), 0, { x: 60 + WORLD.reviveReach + 2, z: 16 }), 1, fallen);

  assert.equal(henOf(run(pecking, block, [{ tick: 0, hen: 0, kind: "peck", held: true }], 200), 1).state, "down");
  assert.equal(henOf(run(far, block, [], 200), 1).state, "down");
});

test("does not get her up any sooner when two teammates stand over her", () => {
  const block = handBlock(3);
  const start = withHen(
    withHen(withHen(createBrawlCrewStart(block), 0, { x: 66, z: 16 }), 1, { x: 60, z: 18, state: "down", hearts: 0 }),
    2,
    { x: 54, z: 18 }
  );

  assert.equal(henOf(run(start, block, [], WORLD.reviveTicks), 1).state, "down");
  assert.equal(henOf(run(start, block, [], WORLD.reviveTicks + 1), 1).state, "up");
});

test("does end the block as a wipe when the last hen up goes down", () => {
  const block = handBlock(2, [{ kind: "goose", side: 1, atTick: 5000, z: 16 }]);
  const start: BrawlCrewFrame = {
    ...withHen(withHen(createBrawlCrewStart(block), 0, { x: 60, z: 16, hearts: 1 }), 1, { x: 120, z: 4, state: "down", hearts: 0 }),
    goons: [placeGoon({ kind: "goose", x: 74, z: 16, state: "telegraph", stateUntilTick: 30 })],
    banked: 7
  };
  const after = run(start, block, [], 120);

  assert.equal(after.outcome, "wipe");
  assert.equal(after.banked, 7, "what the block banked stays");
  assert.equal(stepBrawlCrew(after, block, []), after, "a terminal frame steps to itself");
});

test("does end a crew of one's block as a wipe when she goes down", () => {
  const block = handBlock(1, [{ kind: "goose", side: 1, atTick: 5000, z: 16 }]);
  const start: BrawlCrewFrame = {
    ...withHen(createBrawlCrewStart(block), 0, { x: 60, z: 16, hearts: 1 }),
    goons: [placeGoon({ kind: "goose", x: 74, z: 16, state: "telegraph", stateUntilTick: 30 })]
  };

  assert.equal(run(start, block, [], 120).outcome, "wipe");
});

test("does sit a hen down when her pad has been neutral and silent for ten seconds, and stand her up on any input", () => {
  const block = handBlock(2, [{ kind: "goose", side: 1, atTick: 5000, z: 16 }]);
  const start = createBrawlCrewStart(block);
  const busy: BrawlCrewInput[] = [{ tick: 0, hen: 1, kind: "walk", dir: 1 }];
  const before = run(start, block, busy, WORLD.awayTicks - 1);
  const sat = run(start, block, busy, WORLD.awayTicks);
  const back = run(start, block, [...busy, { tick: WORLD.awayTicks + 30, hen: 0, kind: "peck", held: true }], WORLD.awayTicks + 31);

  assert.equal(henOf(before, 0).state, "up");
  assert.equal(henOf(sat, 0).state, "away");
  assert.equal(henOf(sat, 1).state, "up", "a held stick is a player, however long it is held");
  assert.equal(henOf(back, 0).state, "up");
});

test("does leave a sitting hen alone and not call a crew of sitters a wipe when the geese arrive", () => {
  const block = handBlock(1, [{ kind: "goose", side: 1, atTick: WORLD.awayTicks + 60, z: 16 }]);
  const after = run(createBrawlCrewStart(block), block, [], WORLD.awayTicks + 900);

  assert.equal(henOf(after).state, "away");
  assert.equal(henOf(after).hearts, 3);
  assert.equal(after.goons[0]?.target, null);
  assert.equal(after.outcome, null);
});

test("does let a teammate peck a swan that is stalking the hen it is on", () => {
  const block = handBlock(2, [{ kind: "goose", side: 1, atTick: 5000, z: 16 }]);
  const start: BrawlCrewFrame = {
    ...withHen(withHen(createBrawlCrewStart(block), 0, { x: 60, z: 16, facing: 1 }), 1, { x: 96, z: 16, facing: -1 }),
    goons: [placeGoon({ kind: "swan", x: 76, z: 16, state: "stalk", stateUntilTick: 0, target: 0 })]
  };
  const waited = run(start, block, [{ tick: 0, hen: 0, kind: "walk", dir: 0 }], 60);
  const pecked = run(start, block, [{ tick: 0, hen: 1, kind: "peck", held: true }], WORLD.peckDelayTicks + 2);

  assert.equal(waited.goons[0]?.state, "stalk", "faced, it stands and waits");
  assert.equal(pecked.goons[0]?.state, "ko");
  assert.equal(henOf(pecked, 1).stats.worth, WORLD.goons.swan.worth);
});

test("does hiss the tick the hen it is on turns her back when a swan is stalking her", () => {
  const block = handBlock(1, [{ kind: "goose", side: 1, atTick: 5000, z: 16 }]);
  const start: BrawlCrewFrame = {
    ...withHen(createBrawlCrewStart(block), 0, { x: 60, z: 16, facing: 1 }),
    goons: [placeGoon({ kind: "swan", x: 76, z: 16, state: "stalk", stateUntilTick: 0, target: 0 })]
  };
  const turned = run(start, block, [{ tick: 0, hen: 0, kind: "walk", dir: 5 }], 2);

  assert.equal(turned.goons[0]?.state, "telegraph");
});

test("does bank the clean wave for each hen who was not hit and the hearts of each hen up at the clear", () => {
  const block = handBlock(2, [{ kind: "goose", side: 1, atTick: 0, z: 16 }]);
  const { frame } = play(block, brawlCrewBrawler);

  assert.equal(frame.outcome, "cleared");
  assert.equal(frame.banked, 1 + 2 * WORLD.cleanWaveBonus + 2 * 3 * WORLD.heartWorth);
  assert.equal(frame.banked, block.total);
});

test("does bank no clean wave for a hen who lost a heart in it", () => {
  const block = handBlock(2, [{ kind: "goose", side: 1, atTick: 5000, z: 16 }]);
  const start: BrawlCrewFrame = {
    ...withHen(withHen(createBrawlCrewStart(block), 0, { x: 60, z: 16, hitInWave: true }), 1, { x: 50, z: 4 }),
    spawned: 1,
    goons: [placeGoon({ kind: "goose", x: 72, z: 16 })]
  };
  const after = run(start, block, [{ tick: 0, hen: 0, kind: "peck", held: true }], WORLD.peckDelayTicks + 2);

  assert.equal(after.cameraLocked, false, "the wave went down with its last goose");
  assert.equal(after.banked, 1 + WORLD.cleanWaveBonus);
  assert.deepEqual(
    after.events.filter((event) => event.kind === "bonus").map((event) => event.hen),
    [1]
  );
});

test("does never stand more goons on the street than the crew's cap when a big wave is due at once", () => {
  for (const crew of [1, 3, 5]) {
    const block = resolveBrawlCrewBlock({ seed: SEED, blocks: 3, block: 2, crew });

    let mostStanding = 0;

    play(block, brawlCrewBrawler, (frame) => {
      mostStanding = Math.max(mostStanding, frame.goons.filter((goon) => goon.state !== "ko" && goon.state !== "gone").length);
    });

    assert.ok(mostStanding > 0 && mostStanding <= block.standingCap, `${mostStanding} stood at once`);
  }
});

test("does keep the frame a few kilobytes all block long when the events are a window", () => {
  const block = resolveBrawlCrewBlock({ seed: SEED, blocks: 3, block: 2, crew: 5 });
  let widest = 0;
  const { frame } = play(block, brawlCrewBrawler, (seen) => {
    widest = Math.max(widest, JSON.stringify(seen).length);
  });

  assert.ok(widest < 9000, `the frame grew to ${widest} characters`);
  assert.ok(frame.events.every((event) => event.tick >= frame.tick - WORLD.eventWindowTicks));
});

test("does land on the same frame when the same thumbs are replayed from the start", () => {
  for (const crew of [1, 3, 5]) {
    for (const index of [0, 1, 2]) {
      const block = resolveBrawlCrewBlock({ seed: SEED, blocks: 3, block: index, crew });
      const { frame, inputs } = play(block, crew === 3 ? brawlCrewMasher : brawlCrewBrawler);
      const replayed = advanceBrawlCrew(createBrawlCrewStart(block), block, inputs, frame.tick);

      assert.equal(JSON.stringify(replayed), JSON.stringify(frame));
    }
  }
});

test("does land on the same frame when a screen picks the fight up from a frame it was sent part-way", () => {
  // What every screen does (spec §0.5): adopt a frame as it came over the wire and step on from it.
  for (const crew of [2, 5]) {
    const block = resolveBrawlCrewBlock({ seed: SEED + 7, blocks: 3, block: 2, crew });
    const { frame, inputs } = play(block, brawlCrewBrawler);

    for (const at of [1, 137, 600, frame.tick - 1]) {
      const sent = JSON.parse(JSON.stringify(advanceBrawlCrew(createBrawlCrewStart(block), block, inputs, at))) as BrawlCrewFrame;

      assert.equal(JSON.stringify(advanceBrawlCrew(sent, block, inputs, frame.tick)), JSON.stringify(frame));
    }
  }
});

test("does ignore a thumb for a slot nobody is in when an input names one", () => {
  const block = handBlock(1, [{ kind: "goose", side: 1, atTick: 5000, z: 16 }]);
  const start = createBrawlCrewStart(block);
  const stray = run(start, block, [{ tick: 0, hen: 4, kind: "walk", dir: 1 }], 5);

  assert.deepEqual(stray.hens, run(start, block, [], 5).hens);
});

// Sixty streets a cell: enough that a rate is a rate, few enough that the gate does not wait on it.
const SEEDS = 60;

const rates = (crew: number, index: number, bot: BrawlCrewBot) => {
  let cleared = 0;
  let bells = 0;
  let share = 0;

  for (let seed = 0; seed < SEEDS; seed += 1) {
    const block = resolveBrawlCrewBlock({ seed: 1000 + seed * 7919, blocks: 3, block: index, crew });
    const { frame } = play(block, bot);

    cleared += frame.outcome === "cleared" ? 1 : 0;
    bells += frame.outcome === "timeout" ? 1 : 0;
    share += frame.banked / block.total;

    assert.ok(frame.banked <= block.total, "a block banked more than it is worth");
  }

  return { cleared: cleared / SEEDS, bells: bells / SEEDS, share: share / SEEDS };
};

const STATES_THAT_END: readonly BrawlGoonState[] = ["ko", "gone"];

test("does keep mashing the floor at every crew size: block 0 usually cleared, block 2 rarely", () => {
  for (const crew of [1, 2, 3, 4, 5]) {
    const first = rates(crew, 0, brawlCrewMasher);
    const last = rates(crew, 2, brawlCrewMasher);

    assert.ok(first.cleared >= 0.55, `a crew of ${crew} mashers cleared block 0 only ${first.cleared}`);
    assert.ok(last.cleared <= 0.35, `a crew of ${crew} mashers cleared block 2 ${last.cleared} of the time`);
    // Even a lost block banks something to talk about: the near miss is in the score, not just the outcome.
    assert.ok(last.share > 0.2 && last.share < 0.7, `a crew of ${crew} mashers banked ${last.share} of block 2`);
  }
});

test("does let a crew that plays it properly clear every block at every crew size, and never leave it waiting for the bell", () => {
  for (const crew of [1, 2, 3, 4, 5]) {
    for (const index of [0, 1, 2]) {
      const { cleared, bells } = rates(crew, index, brawlCrewBrawler);

      assert.ok(cleared >= 0.95, `a crew of ${crew} brawlers cleared block ${index} only ${cleared}`);
      assert.equal(bells, 0, `a crew of ${crew} brawlers ran block ${index} to the bell`);
    }
  }
});

test("does leave nothing standing when a block is cleared", () => {
  const block = resolveBrawlCrewBlock({ seed: SEED, blocks: 3, block: 1, crew: 3 });
  const { frame } = play(block, brawlCrewBrawler);

  assert.equal(frame.outcome, "cleared");
  assert.ok(frame.goons.every((goon) => STATES_THAT_END.includes(goon.state)));
  assert.equal(frame.spawned, block.spawns.length);
});
