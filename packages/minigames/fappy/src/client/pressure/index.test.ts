import assert from "node:assert/strict";
import test from "node:test";
import type { FappyMinigameHostView, FappyMinigameLeg } from "@wingnight/shared";

import { resolveFinishClock, resolveLivePoints, resolveRelayChase } from "./index.js";

const T0 = 1_700_000_000_000;

const createLeg = (overrides: Partial<FappyMinigameLeg> = {}): FappyMinigameLeg => {
  return {
    legIndex: 0,
    player: null,
    seed: 11,
    status: "ready",
    attempt: 0,
    checkpointGate: 0,
    flapTicks: [],
    crashes: 0,
    skipped: false,
    knockedEagles: [],
    lastRun: null,
    ...overrides
  };
};

const createView = (overrides: Partial<FappyMinigameHostView> = {}): FappyMinigameHostView => {
  return {
    minigame: "FAPPY",
    activeTurnTeamId: "team-alpha",
    pendingPointsByTeamId: { "team-alpha": 0, "team-beta": 0 },
    phase: "flying",
    legIndex: 0,
    legsPerTurn: 4,
    gatesPerLeg: 6,
    parSeconds: 50,
    limitSeconds: 100,
    legs: [0, 1, 2, 3].map((legIndex) => createLeg({ legIndex })),
    totalGatesCleared: 0,
    startedAtMs: T0,
    finishedAtMs: null,
    timedOutAtMs: null,
    elapsedMs: null,
    points: null,
    pointsMax: 20,
    ...overrides
  };
};

test("does show the wall clock while the relay is still in the air", () => {
  const clock = resolveFinishClock(createView(), 21_000);

  assert.equal(clock.elapsedMs, 21_000);
  assert.equal(clock.penaltyMs, 0);
});

test("does show the scored time rather than the wall clock once the relay is over", () => {
  const view = createView({
    phase: "finished",
    finishedAtMs: T0 + 38_000,
    elapsedMs: 50_500,
    points: 20,
    legs: [
      createLeg({ legIndex: 0, status: "cleared" }),
      createLeg({ legIndex: 1, status: "cleared", skipped: true }),
      createLeg({ legIndex: 2, status: "cleared" }),
      createLeg({ legIndex: 3, status: "cleared" })
    ]
  });
  const clock = resolveFinishClock(view, 38_000);

  assert.equal(clock.elapsedMs, 50_500);
  assert.equal(clock.penaltyMs, 12_500);
  assert.equal(clock.skippedLegs, 1);
});

// Sub-second gaps are the host tablet's clock drifting from the server's, not
// a leg anybody forgave, and a line about them would be noise.
test("does call no penalty when the scored time only drifts from the wall clock", () => {
  const view = createView({ phase: "finished", finishedAtMs: T0 + 38_000, elapsedMs: 38_400, points: 20 });

  assert.equal(resolveFinishClock(view, 38_000).penaltyMs, 0);
});

test("does pay the full round while the relay is still under par", () => {
  assert.equal(resolveLivePoints(createView(), 20_000), 20);
});

test("does drain the live points once the relay is past par", () => {
  assert.equal(resolveLivePoints(createView(), 75_000), 11);
});

// A forgiven leg is charged the moment it is forgiven, so the readout drops
// the instant the host takes the escape hatch rather than at the finish.
test("does charge an already-skipped leg against the live points", () => {
  const view = createView({
    legIndex: 1,
    legs: [
      createLeg({ legIndex: 0, status: "cleared", skipped: true }),
      createLeg({ legIndex: 1 }),
      createLeg({ legIndex: 2 }),
      createLeg({ legIndex: 3 })
    ]
  });

  assert.equal(resolveLivePoints(view, 50_000), resolveLivePoints(createView(), 62_500));
});

test("does show no live points before the first flap or after the relay is over", () => {
  assert.equal(resolveLivePoints(createView({ startedAtMs: null }), null), null);
  assert.equal(resolveLivePoints(createView({ phase: "finished" }), 40_000), null);
});

test("does find the best rival to chase and the time that tops them", () => {
  const view = createView({
    pendingPointsByTeamId: { "team-alpha": 0, "team-beta": 6, "team-gamma": 11 }
  });
  const chase = resolveRelayChase(view);

  assert.equal(chase?.teamId, "team-gamma");
  assert.equal(chase?.points, 11);
  assert.equal(chase?.timeToBeatMs, 73_611);
});

test("does name no time to beat when topping the rival needs better than par", () => {
  const view = createView({ pendingPointsByTeamId: { "team-alpha": 0, "team-beta": 20 } });

  assert.equal(resolveRelayChase(view)?.timeToBeatMs, null);
});

test("does chase nobody when no rival has banked a point this round", () => {
  assert.equal(resolveRelayChase(createView()), null);
  assert.equal(resolveRelayChase(createView({ pendingPointsByTeamId: { "team-alpha": 14 } })), null);
});
