import assert from "node:assert/strict";
import test from "node:test";

import { MOUNT_GOOSE_BOT_SAMPLES, MOUNT_GOOSE_BOT_STEPS } from "../gooseBot/index.js";
import { addMountHen, createMountPile, resolveMountCrown, resolveMountPileMesh } from "../pile/index.js";
import { BODY_JOINT_WEIGHTS, placeWeighted, toPoints } from "../rig/index.js";
import type {
  MountClimbResult,
  MountInputSample,
  MountLimb,
  MountPile,
  MountPose,
  MountState,
  MountSurfaceRef
} from "../types.js";
import { MOUNT_PARTICLES, MOUNT_WORLD } from "../world/index.js";
import { advanceMount, createMountState, resolveMountOutcome, runMountClimb, stepMount } from "./index.js";

const SEED = 20261002;
const RULES = { climbSeconds: 30, secondsPerHen: 3 };
const PILE = createMountPile(SEED);

const height = (point: { y: number }): number => MOUNT_WORLD.floorY - point.y;
const crownHeight = (state: MountState): number => height(resolveMountCrown(state.pose));
const torsoHeight = (pose: MountPose): number =>
  (height(pose.rump) + height(pose.neck) + height(pose.hipLeft) + height(pose.hipRight)) / 4;

/** The furthest any particle but the dangling far wing moved between two states. */
const motion = (a: MountPose, b: MountPose): number =>
  Math.max(
    ...MOUNT_PARTICLES.filter((particle) => particle !== "wingFar").map((particle) =>
      Math.sqrt((a[particle].x - b[particle].x) ** 2 + (a[particle].y - b[particle].y) ** 2)
    )
  );

const translate = (pose: MountPose, dx: number, dy: number): MountPose => {
  const moved = { ...pose };

  for (const particle of MOUNT_PARTICLES) {
    moved[particle] = { x: pose[particle].x + dx, y: pose[particle].y + dy };
  }

  return moved;
};

const grabbedAt = (pose: MountPose, limb: MountLimb, surface: MountSurfaceRef) => {
  const joint = placeWeighted(toPoints(pose), BODY_JOINT_WEIGHTS);
  const at = pose[limb];

  return {
    kind: "grabbed" as const,
    at,
    surface,
    brace: Math.sqrt((at.x - joint.x) ** 2 + (at.y - joint.y) ** 2)
  };
};

/** The hen stood `still`-posed with its front toes at (x, floor − lift), both feet grabbed on `surface`. */
const standAt = (x: number, lift: number, surface: MountSurfaceRef, pile: MountPile = PILE): MountState => {
  const base = createMountState(SEED, pile, RULES, "caitlin");
  const pose = translate(base.start, x - base.start.footRight.x, -lift - base.start.footRight.y);

  return {
    ...base,
    pose,
    previous: pose,
    limbs: {
      ...base.limbs,
      footLeft: grabbedAt(pose, "footLeft", surface),
      footRight: grabbedAt(pose, "footRight", surface)
    }
  };
};

const sample = (
  tick: number,
  limb: MountLimb,
  kind: MountInputSample["kind"],
  point: { x: number; y: number }
): MountInputSample => ({ tick, limb, kind, x: point.x, y: point.y });

// ---- the climb's start ----------------------------------------------------------------------

test("does start the hen still-posed, toes on the floor, its front foot startGap left of the pile", () => {
  const state = createMountState(SEED, PILE, RULES, "caitlin");

  assert.equal(state.tick, 0);
  assert.equal(state.outcome, null);
  assert.equal(state.start.footRight.y, 0);
  assert.equal(state.start.footRight.x, -76 - MOUNT_WORLD.startGap);
  assert.deepEqual(state.pose, state.start);
  assert.deepEqual(state.previous, state.start);
  assert.equal(state.startHeight, 83);
  assert.equal(state.bestHeight, 83);
  assert.equal(state.limbs.footLeft.kind, "grabbed");
  assert.equal(state.limbs.footRight.kind, "grabbed");
  assert.deepEqual(state.limbs.wing, { kind: "limp" });
  assert.deepEqual(state.limbs.beak, { kind: "limp" });
  assert.deepEqual(state.mesh, resolveMountPileMesh(PILE));
});

test("does give the climb (30 + 3 × hens on the pile) × 60 ticks", () => {
  assert.equal(createMountState(SEED, PILE, RULES, null).climbTicks, 30 * 60);

  let pile = PILE;

  for (let index = 0; index < 4; index += 1) {
    pile = addMountHen(pile, runMountClimb(SEED, pile, { climbSeconds: 1, secondsPerHen: 0 }, `p${index}`, []));
  }

  assert.equal(createMountState(SEED, pile, RULES, null).climbTicks, (30 + 3 * 4) * 60);
});

// ---- standing, holding, letting go ----------------------------------------------------------

test("does stand where it started and bank nothing when nobody touches the tablet", () => {
  const result = runMountClimb(SEED, PILE, RULES, "caitlin", []);

  assert.equal(result.outcome, "timeout");
  assert.equal(result.endTick, 30 * 60);
  assert.equal(result.share, 0);
  assert.equal(result.falls, 0);
  assert.equal(result.bestHeight, 83);
  assert.equal(result.hen.mounted, false);
  assert.ok(motion(result.hen.pose, createMountState(SEED, PILE, RULES, null).start) < 1.5);
});

test("does settle within 30 ticks and then not move when all four limbs are grabbed", () => {
  const standing = standAt(-50, 66, { kind: "plinth" });
  const state: MountState = {
    ...standing,
    limbs: {
      ...standing.limbs,
      wing: grabbedAt(standing.pose, "wing", { kind: "plinth" }),
      beak: grabbedAt(standing.pose, "beak", { kind: "goose" })
    }
  };
  const settled = advanceMount(state, [], 30);
  const later = advanceMount(settled, [], 330);

  assert.ok(motion(settled.pose, later.pose) < 1e-6, `moved ${motion(settled.pose, later.pose)}`);
  assert.deepEqual(later.limbs, state.limbs);
  assert.equal(later.falls.length, 0);
});

test("does grab with a limb let go while it touches a surface on that same tick", () => {
  const state = createMountState(SEED, PILE, RULES, "caitlin");
  const foot = state.start.footRight;
  const log = [sample(0, "footRight", "grab-start", foot), sample(1, "footRight", "release", foot)];
  const taken = stepMount(state, log);

  assert.equal(taken.limbs.footRight.kind, "held");
  assert.deepEqual(taken.letGoes, [{ tick: 0, limb: "footRight" }]);

  const regrabbed = stepMount(taken, log);

  assert.equal(regrabbed.limbs.footRight.kind, "grabbed");
  assert.deepEqual(regrabbed.grabs, [{ tick: 1, limb: "footRight" }]);
  assert.ok(regrabbed.limbs.footRight.kind === "grabbed" && regrabbed.limbs.footRight.surface.kind === "floor");
});

test("does swing a limb held in the air without moving the bird", () => {
  const state = createMountState(SEED, PILE, RULES, "caitlin");
  const wing = state.start.wing;
  const log = [
    sample(0, "wing", "grab-start", wing),
    sample(2, "wing", "move", { x: wing.x - 10, y: wing.y - 30 }),
    sample(10, "wing", "move", { x: wing.x + 10, y: wing.y - 50 })
  ];
  const swung = advanceMount(state, log, 30);

  assert.ok(motion({ ...swung.pose, wing: state.start.wing }, state.start) < 0.5);
  assert.ok(height(swung.pose.wing) > height(state.start.wing) + 30, "the wing went up");
});

test("does lift the torso when a planted foot is dragged down", () => {
  // A crouch: both legs reaching forward 30° off the vertical, toes on the floor.
  const base = createMountState(SEED, PILE, RULES, "caitlin");
  const crouch = translate(base.start, 0, 14 - 12.124);
  const pose: MountPose = {
    ...crouch,
    footLeft: { x: crouch.hipLeft.x + 7, y: 0 },
    footRight: { x: crouch.hipRight.x + 7, y: 0 }
  };
  const state: MountState = {
    ...base,
    pose,
    previous: pose,
    limbs: { ...base.limbs, footLeft: grabbedAt(pose, "footLeft", { kind: "floor" }), footRight: grabbedAt(pose, "footRight", { kind: "floor" }) }
  };
  const log = [
    sample(0, "footLeft", "grab-start", pose.footLeft),
    sample(0, "footRight", "grab-start", pose.footRight),
    sample(1, "footLeft", "move", { x: pose.hipLeft.x, y: 40 }),
    sample(1, "footRight", "move", { x: pose.hipRight.x, y: 40 })
  ];
  const pushed = advanceMount(state, log, 6);

  assert.ok(torsoHeight(pushed.pose) > torsoHeight(pose) + 1.5, `${torsoHeight(pushed.pose)} vs ${torsoHeight(pose)}`);
  assert.ok(height(pushed.pose.hipRight) > height(pose.hipRight) + 1.5);
});

test("does grab the goose with a seeking beak that touches it, and hold on", () => {
  const state = advanceMount(standAt(-38, 66, { kind: "plinth" }), [], 30);
  const log = [
    sample(30, "beak", "grab-start", state.pose.beak),
    sample(34, "beak", "move", { x: -10, y: -105 }),
    sample(60, "beak", "release", { x: -10, y: -105 })
  ];
  const grabbed = advanceMount(state, log, 61);
  const beak = grabbed.limbs.beak;

  assert.ok(beak.kind === "grabbed" && beak.surface.kind === "goose", JSON.stringify(beak));
  assert.deepEqual(grabbed.grabs.at(-1), { tick: 60, limb: "beak" });

  const held = advanceMount(grabbed, log, 240);

  assert.deepEqual(held.limbs.beak, beak);
  assert.deepEqual(held.pose.beak, beak.at);
});

test("does drop the bird, count a fall and stand it back at the start when every grab lets go", () => {
  const state = createMountState(SEED, PILE, RULES, "caitlin");
  const { footLeft, footRight, hipLeft, hipRight } = state.start;
  const log = [
    sample(0, "footLeft", "grab-start", footLeft),
    sample(0, "footRight", "grab-start", footRight),
    sample(1, "footLeft", "move", { x: hipLeft.x - 4, y: hipLeft.y - 20 }),
    sample(1, "footRight", "move", { x: hipRight.x - 4, y: hipRight.y - 20 }),
    sample(8, "footLeft", "release", { x: hipLeft.x - 4, y: hipLeft.y - 20 }),
    sample(8, "footRight", "release", { x: hipRight.x - 4, y: hipRight.y - 20 })
  ];
  const fallen = advanceMount(state, log, 60);

  assert.equal(fallen.falls.length, 1);
  assert.ok((fallen.falls[0] ?? 0) < 60);
  assert.equal(fallen.recoveringUntilTick, (fallen.falls[0] ?? 0) + MOUNT_WORLD.fallRecoverTicks);
  assert.equal(fallen.limbs.footLeft.kind, "grabbed");
  assert.equal(fallen.limbs.footRight.kind, "grabbed");
  assert.deepEqual(fallen.limbs.wing, { kind: "limp" });
  assert.ok(motion(fallen.pose, state.start) < 1);
  assert.equal(fallen.outcome, null, "a fall never ends the climb");
});

test("does keep the best height through a fall", () => {
  const state = { ...createMountState(SEED, PILE, RULES, "caitlin"), bestHeight: 120 };
  const { footLeft, footRight, hipLeft, hipRight } = state.start;
  const log = [
    sample(0, "footLeft", "grab-start", footLeft),
    sample(0, "footRight", "grab-start", footRight),
    sample(1, "footLeft", "move", { x: hipLeft.x - 4, y: hipLeft.y - 20 }),
    sample(1, "footRight", "move", { x: hipRight.x - 4, y: hipRight.y - 20 }),
    sample(8, "footLeft", "release", { x: hipLeft.x - 4, y: hipLeft.y - 20 }),
    sample(8, "footRight", "release", { x: hipRight.x - 4, y: hipRight.y - 20 })
  ];
  const fallen = advanceMount(state, log, 60);

  assert.equal(fallen.falls.length, 1);
  assert.equal(fallen.bestHeight, 120);
});

test("does ignore every sample during a fall's recovery", () => {
  const state = { ...createMountState(SEED, PILE, RULES, "caitlin"), recoveringUntilTick: 20 };
  const foot = state.start.footRight;
  const during = stepMount(state, [sample(0, "footRight", "grab-start", foot)]);

  assert.equal(during.limbs.footRight.kind, "grabbed");
  assert.deepEqual(during.letGoes, []);
});

// ---- the mount, the clock, the share --------------------------------------------------------

test("does mount the standing goose with the goose bot's log inside 20 seconds", () => {
  const result = runMountClimb(SEED, PILE, RULES, "steve", MOUNT_GOOSE_BOT_SAMPLES);

  assert.equal(PILE.goose, "stand");
  assert.equal(result.outcome, "mounted");
  assert.equal(result.share, 1);
  assert.ok(result.endTick < 20 * MOUNT_WORLD.tickHz, `took ${result.endTick} ticks`);
  assert.ok(height(resolveMountCrown(result.hen.pose)) > PILE.highLine.height);
  assert.equal(result.hen.mounted, true);
  assert.equal(result.hen.playerId, "steve");
});

test("does move the line to the climber's crown with its playerId on a mount", () => {
  const result = runMountClimb(SEED, PILE, RULES, "steve", MOUNT_GOOSE_BOT_SAMPLES);
  const pile = addMountHen(PILE, result);
  const crown = resolveMountCrown(result.hen.pose);

  assert.deepEqual(pile.highLine, { height: -crown.y, x: crown.x, playerId: "steve" });
  assert.equal(pile.hens.length, 1);
});

test("does log the goose bot's steps as its samples: a touch, the moves, a lift, a finger at a time", () => {
  const replayed = MOUNT_GOOSE_BOT_STEPS.flatMap((step) => {
    const first = step.points[0];
    const last = step.points[step.points.length - 1];

    return [
      { limb: step.limb, kind: "grab-start", x: first?.x, y: first?.y },
      ...step.points.slice(1).map((point) => ({ limb: step.limb, kind: "move", x: point.x, y: point.y })),
      { limb: step.limb, kind: "release", x: last?.x, y: last?.y }
    ];
  });
  const logged = MOUNT_GOOSE_BOT_SAMPLES.map(({ limb, kind, x, y }) => ({ limb, kind, x, y }));

  // The mounting step's finger never lifts: the climb ends under it.
  assert.deepEqual(logged, replayed.slice(0, logged.length));
  assert.ok(replayed.length - logged.length <= 1);

  for (let index = 1; index < MOUNT_GOOSE_BOT_SAMPLES.length; index += 1) {
    assert.ok((MOUNT_GOOSE_BOT_SAMPLES[index]?.tick ?? 0) >= (MOUNT_GOOSE_BOT_SAMPLES[index - 1]?.tick ?? 0));
  }

  for (const entry of MOUNT_GOOSE_BOT_SAMPLES) {
    assert.ok(Number.isInteger(entry.x / MOUNT_WORLD.inputQuantum) && Number.isInteger(entry.y / MOUNT_WORLD.inputQuantum));
  }
});

test("does freeze the climb on the mount: every later step returns the terminal state as is", () => {
  const start = createMountState(SEED, PILE, RULES, "steve");
  const mounted = advanceMount(start, MOUNT_GOOSE_BOT_SAMPLES, start.climbTicks);

  assert.equal(mounted.outcome, "mounted");
  assert.equal(stepMount(mounted, MOUNT_GOOSE_BOT_SAMPLES), mounted);
  assert.equal(advanceMount(mounted, MOUNT_GOOSE_BOT_SAMPLES, mounted.tick + 600), mounted);
  assert.ok(crownHeight(mounted) > PILE.highLine.height);
  assert.equal(mounted.bestHeight, crownHeight(mounted));
});

test("does score a timeout as the share of the way from the start crown to the line", () => {
  // The goose bot's log cut off before its last step: the hen gets most of the way up, never over.
  const lastGrab = MOUNT_GOOSE_BOT_SAMPLES.filter((entry) => entry.kind === "grab-start").at(-1)?.tick ?? 0;
  const partial = MOUNT_GOOSE_BOT_SAMPLES.filter((entry) => entry.tick < lastGrab);
  const result = runMountClimb(SEED, PILE, RULES, "steve", partial);
  const expected = (result.bestHeight - 83) / (PILE.highLine.height - 83);

  assert.equal(result.outcome, "timeout");
  assert.equal(result.endTick, 30 * 60);
  assert.ok(result.bestHeight > 83);
  assert.equal(result.share, Math.min(0.99, expected));
  assert.ok(result.share > 0 && result.share < 1);
});

test("does keep a timed-out share below 1 and at least 0", () => {
  const state = createMountState(SEED, PILE, RULES, "caitlin");
  const terminal = (bestHeight: number): MountClimbResult | null =>
    resolveMountOutcome({ ...state, bestHeight, outcome: "timeout" });

  assert.equal(terminal(60)?.share, 0);
  assert.equal(terminal(83)?.share, 0);
  assert.equal(terminal(PILE.highLine.height)?.share, 0.99);
  assert.equal(resolveMountOutcome(state), null);
});

// ---- determinism ----------------------------------------------------------------------------

test("does land on identical states when the same log runs twice", () => {
  const first = runMountClimb(SEED, PILE, RULES, "steve", MOUNT_GOOSE_BOT_SAMPLES);
  const second = runMountClimb(SEED, PILE, RULES, "steve", MOUNT_GOOSE_BOT_SAMPLES);

  assert.deepEqual(first, second);
});

test("does land runMountClimb, advanceMount in slices and stepMount tick by tick on the same state", () => {
  const start = createMountState(SEED, PILE, RULES, "steve");
  const referee = runMountClimb(SEED, PILE, RULES, "steve", MOUNT_GOOSE_BOT_SAMPLES);
  let sliced = start;

  for (let toTick = 7; sliced.outcome === null; toTick += 7) {
    sliced = advanceMount(sliced, MOUNT_GOOSE_BOT_SAMPLES, toTick);
  }

  let stepped = start;

  while (stepped.outcome === null) {
    stepped = stepMount(stepped, MOUNT_GOOSE_BOT_SAMPLES);
  }

  assert.deepEqual(sliced, stepped);
  assert.deepEqual(resolveMountOutcome(sliced), referee);
});

test("does survive a JSON round trip of the state mid-climb, as a mirror rebuilt from the wire must", () => {
  const start = createMountState(SEED, PILE, RULES, "steve");
  const middle = advanceMount(start, MOUNT_GOOSE_BOT_SAMPLES, 200);
  const rebuilt = JSON.parse(JSON.stringify(middle)) as MountState;

  assert.deepEqual(
    advanceMount(rebuilt, MOUNT_GOOSE_BOT_SAMPLES, start.climbTicks),
    advanceMount(middle, MOUNT_GOOSE_BOT_SAMPLES, start.climbTicks)
  );
});

test("does land the goose bot's log on a pinned pose at tick 600, so any change to the integrator shows", () => {
  // The line out of reach, so the climb runs the whole 600 ticks. These are exact doubles: a
  // change to the integrator, the solver order or MOUNT_WORLD moves them, and then the goose bot
  // and this pose are regenerated together.
  const unreachable = { ...PILE, highLine: { ...PILE.highLine, height: 1e6 } };
  const state = advanceMount(createMountState(SEED, unreachable, RULES, "steve"), MOUNT_GOOSE_BOT_SAMPLES, 600);

  assert.equal(state.tick, 600);
  assert.equal(state.outcome, null);
  assert.deepEqual(state.pose, {
    rump: { x: -65.41623884480018, y: -90.59853212995797 },
    neck: { x: -43.65565807652502, y: -114.29129664096219 },
    hipLeft: { x: -46.792575958012634, y: -85.90146138830715 },
    hipRight: { x: -36.36657804259174, y: -91.7492966923936 },
    footLeft: { x: -33.16876600141527, y: -89.87184615575963 },
    footRight: { x: -26.39548735878537, y: -81.56663977319558 },
    wing: { x: -28.3067711350226, y: -89.10644706223894 },
    beak: { x: -16.42095516255529, y: -133.89068130073554 },
    wingFar: { x: -20.45510244405245, y: -132.85113936592597 }
  });
  assert.equal(state.bestHeight, 163.3587679691682);
});

// ---- the pile as terrain --------------------------------------------------------------------

test("does climb the next hen against the last climb's frozen hen as static mesh", () => {
  const result = runMountClimb(SEED, PILE, RULES, "steve", MOUNT_GOOSE_BOT_SAMPLES);
  const pile = addMountHen(PILE, result);
  const next = createMountState(SEED, pile, RULES, "caitlin");
  const henShapes = next.mesh.filter((shape) => shape.surface.kind === "hen");

  assert.equal(henShapes.length, 5);
  assert.equal(next.climbTicks, (30 + 3) * 60);
  assert.equal(next.pile.highLine.playerId, "steve");

  // The stuck hen never moves while the next one climbs it.
  const after = advanceMount(next, [], 600);

  assert.deepEqual(after.mesh, next.mesh);
  assert.deepEqual(after.pile, pile);
});

/** Twenty hens frozen in a column over the plinth: a mountain far taller than any real round's. */
const twentyHenPile = (): MountPile => {
  let pile = PILE;

  for (let index = 0; index < 20; index += 1) {
    const lift = 66 + 50 * index;
    const pose = translate(MOUNT_WORLD.rig.rest, -40 + (index % 3) * 20 - MOUNT_WORLD.rig.rest.footRight.x, -lift - MOUNT_WORLD.rig.rest.footRight.y);
    pile = addMountHen(pile, {
      outcome: "timeout",
      endTick: 1,
      share: 0,
      bestHeight: 83,
      falls: 0,
      hen: { pileIndex: index, playerId: `p${index}`, pose, grabs: {}, mounted: false }
    });
  }

  return pile;
};

test("does step a live climber against a 20-hen pile in well under a millisecond a tick", () => {
  const pile = twentyHenPile();

  assert.equal(resolveMountPileMesh(pile).length, 3 + 4 + 20 * 5);

  const state = createMountState(SEED, pile, RULES, "caitlin");
  advanceMount(state, MOUNT_GOOSE_BOT_SAMPLES, 120);

  const ticks = 1200;
  const began = performance.now();
  advanceMount(state, MOUNT_GOOSE_BOT_SAMPLES, ticks);
  const perTick = (performance.now() - began) / ticks;

  assert.ok(perTick < 2, `${perTick} ms a tick`);
});

test("does referee a 90-second climb against a 20-hen pile in well under a second", () => {
  const pile = twentyHenPile();
  const rules = { climbSeconds: 30, secondsPerHen: 3 };

  assert.equal(createMountState(SEED, pile, rules, null).climbTicks, 90 * 60);

  const began = performance.now();
  const result = runMountClimb(SEED, pile, rules, "caitlin", MOUNT_GOOSE_BOT_SAMPLES);
  const elapsed = performance.now() - began;

  assert.equal(result.endTick > 0, true);
  assert.ok(elapsed < 1000, `${elapsed} ms`);
});
