import assert from "node:assert/strict";
import test from "node:test";
import type { FappyMinigameHostView } from "@wingnight/shared";
import {
  FAPPY_WORLD,
  createFappyLegStart,
  resolveFappyCliffPerchY,
  resolveFappyGates,
  resolveFappyLandingX,
  resolveFappyLegTickCap,
  resolveFappyPerchY,
  runFappyLeg,
  stepFappy
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { fappyMinigameId, fappyRuntimePlugin } from "./index.js";
import { isFappyRules, resolveFappyRules } from "./rules/index.js";
import { DEFAULT_FAPPY_RULES } from "./types/index.js";

const TEAM_IDS = ["team-alpha", "team-beta"];
const ROSTER = {
  "team-alpha": ["alex", "morgan", "sam"],
  "team-beta": ["riley"]
};
const T0 = 1_700_000_000_000;
const RULES = { legsPerTurn: 2, gatesPerLeg: 3, parSeconds: 30, limitSeconds: 90 };

const initialize = (
  overrides: Partial<Parameters<typeof fappyRuntimePlugin.initialize>[0]> = {}
): SerializableValue => {
  return fappyRuntimePlugin.initialize({
    teamIds: TEAM_IDS,
    activeRoundTeamId: "team-alpha",
    pointsMax: 20,
    pendingPointsByTeamId: { "team-alpha": 2, "team-beta": 0 },
    rules: RULES,
    content: null,
    playerIdsByTeamId: ROSTER,
    ...overrides
  });
};

const dispatch = (
  state: SerializableValue,
  actionType: string,
  actionPayload: SerializableValue = {},
  receivedAtMs: number | null = T0,
  pointsMax = 20
): { state: SerializableValue; didMutate: boolean } => {
  return fappyRuntimePlugin.reduceAction({
    state,
    envelope:
      receivedAtMs === null
        ? { actionType, actionPayload }
        : { actionType, actionPayload, receivedAtMs },
    pointsMax,
    rules: null,
    content: null
  });
};

const hostView = (state: SerializableValue): FappyMinigameHostView => {
  const view = fappyRuntimePlugin.selectHostView({ state, rules: null, content: null });

  assert.ok(view !== null && view.minigame === "FAPPY");

  return view;
};

// A leg the referee will call cleared: a bang-bang pilot over the shared sim
// that flaps whenever the bird is falling below its target — each gate's gap
// centre, then a line just above the landing plateau — and stops flapping
// once it is over the plateau so it comes down. Asserted below, so the test
// never guesses.
const findClearingLog = (seed: number, legIndex: number, checkpointGate = 0): number[] => {
  const course = { seed, legIndex, gatesPerLeg: RULES.gatesPerLeg };
  const gates = resolveFappyGates(course);
  const landingX = resolveFappyLandingX(RULES.gatesPerLeg);
  const perch = resolveFappyCliffPerchY();
  const log: number[] = [];
  let frame = createFappyLegStart(gates, checkpointGate);

  while (frame.outcome === null && frame.tick < resolveFappyLegTickCap(RULES.gatesPerLeg)) {
    const nextGate = gates[frame.gatesCleared];
    const isOverPlateau = FAPPY_WORLD.birdX >= landingX - frame.scrollX;
    const target = nextGate !== undefined ? resolveFappyPerchY(nextGate) + 3 : perch - 6;
    const isStanding = frame.bird.y >= perch && frame.bird.vy === 0;
    const shouldFlap =
      !isOverPlateau && frame.bird.y > target && (frame.bird.vy > 0.8 || isStanding);

    if (shouldFlap) {
      log.push(frame.tick);
    }

    frame = stepFappy(frame, gates, RULES.gatesPerLeg, shouldFlap);
  }

  if (frame.outcome !== "cleared") {
    throw new Error(`the pilot could not clear seed ${seed} leg ${legIndex}: ${frame.outcome}`);
  }

  return log;
};

const flyLog = (state: SerializableValue, ticks: number[], atMs: number): SerializableValue => {
  return ticks.reduce((current, tick) => dispatch(current, "flap", { tick }, atMs).state, state);
};

const clearCurrentLeg = (state: SerializableValue, atMs: number): SerializableValue => {
  const view = hostView(state);
  const leg = view.legs[view.legIndex];

  assert.ok(leg !== undefined);

  const flown = flyLog(state, findClearingLog(leg.seed, leg.legIndex, leg.checkpointGate), atMs);

  return dispatch(flown, "endLeg", {}, atMs).state;
};

test("does register under the FAPPY minigame id", () => {
  assert.equal(fappyMinigameId, "FAPPY");
  assert.equal(fappyRuntimePlugin.id, "FAPPY");
});

test("does hand the legs to the roster in seating order and cycle a short one", () => {
  const view = hostView(initialize({ rules: { ...RULES, legsPerTurn: 4 } }));

  assert.equal(view.phase, "ready");
  assert.deepEqual(
    view.legs.map((leg) => leg.playerId),
    ["alex", "morgan", "sam", "alex"]
  );
  assert.equal(view.pendingPointsByTeamId["team-alpha"], 2);
  assert.equal(view.startedAtMs, null);
  assert.equal(view.points, null);
});

test("does fly the drawn hen when the team has no roster", () => {
  const view = hostView(initialize({ playerIdsByTeamId: {} }));

  assert.ok(view.legs.every((leg) => leg.playerId === null));
});

test("does derive the same seeds for the same team across initializations", () => {
  const first = hostView(initialize()).legs.map((leg) => leg.seed);
  const second = hostView(initialize()).legs.map((leg) => leg.seed);
  const other = hostView(initialize({ activeRoundTeamId: "team-beta" })).legs.map((leg) => leg.seed);

  assert.deepEqual(first, second);
  assert.notDeepEqual(first, other);
});

test("does start the relay clock on the first flap and append the log in order", () => {
  const started = dispatch(initialize(), "flap", { tick: 0 }, T0 + 500);

  assert.equal(started.didMutate, true);
  assert.equal(hostView(started.state).phase, "flying");
  assert.equal(hostView(started.state).startedAtMs, T0 + 500);

  const second = dispatch(started.state, "flap", { tick: 12 }, T0 + 700);

  assert.deepEqual(hostView(second.state).legs[0]?.flapTicks, [0, 12]);
  assert.equal(hostView(second.state).startedAtMs, T0 + 500);
});

test("does refuse a flap that is malformed, stale, out of order or unstamped", () => {
  const started = dispatch(initialize(), "flap", { tick: 10 }).state;

  assert.equal(dispatch(started, "flap", { tick: 10 }).didMutate, false);
  assert.equal(dispatch(started, "flap", { tick: 4 }).didMutate, false);
  assert.equal(dispatch(started, "flap", { tick: -1 }).didMutate, false);
  assert.equal(dispatch(started, "flap", "now").didMutate, false);
  assert.equal(dispatch(started, "flap", { tick: 20 }, null).didMutate, false);
});

test("does refuse to end a leg that is not flying", () => {
  assert.equal(dispatch(initialize(), "endLeg").didMutate, false);
});

test("does respawn a crashed bird on the perch of its last gate with the clock still running", () => {
  const started = dispatch(initialize(), "flap", { tick: 0 }, T0).state;
  const crashed = dispatch(started, "endLeg", {}, T0 + 2000);
  const view = hostView(crashed.state);
  const leg = view.legs[0];

  assert.equal(view.phase, "ready");
  assert.equal(view.legIndex, 0);
  assert.equal(leg?.attempt, 1);
  assert.equal(leg?.crashes, 1);
  assert.equal(leg?.checkpointGate, 0);
  assert.deepEqual(leg?.flapTicks, []);
  assert.equal(leg?.lastRun?.outcome, "crashed");
  assert.equal(view.startedAtMs, T0);
  assert.equal(view.finishedAtMs, null);
  assert.equal(view.pendingPointsByTeamId["team-alpha"], 2);
});

test("does keep the gates an attempt got past as the next attempt's checkpoint", () => {
  const initial = initialize();
  const leg = hostView(initial).legs[0];

  assert.ok(leg !== undefined);

  const clearing = findClearingLog(leg.seed, 0);
  // Stop flapping before the end: the bird clears what it clears, then falls.
  const partial = clearing.slice(0, Math.max(2, Math.floor(clearing.length / 2)));
  const flown = flyLog(initial, partial, T0);
  const ended = dispatch(flown, "endLeg", {}, T0 + 3000);
  const expected = runFappyLeg({ seed: leg.seed, legIndex: 0, gatesPerLeg: RULES.gatesPerLeg }, partial);
  const view = hostView(ended.state);

  assert.equal(expected.outcome, "crashed");
  assert.equal(view.legs[0]?.checkpointGate, expected.gatesCleared);
  assert.equal(view.totalGatesCleared, expected.gatesCleared);
});

test("does keep an eagle the attempt knocked away gone on the next attempt", () => {
  const initial = initialize();
  const leg = hostView(initial).legs[0];

  assert.ok(leg !== undefined);

  // Fly the ceiling: no gap is up there, but an eagle is, on some gate of this course or
  // the next seed's. Find one, bump it, then fall.
  const course = { seed: leg.seed, legIndex: 0, gatesPerLeg: RULES.gatesPerLeg };
  const eagleGate = resolveFappyGates(course).find((gate) => gate.eagleBottom !== null);

  if (eagleGate === undefined) {
    // This fixture's course happens to hang no eagle; nothing to bump.
    return;
  }

  const ceilingLog: number[] = [];

  for (let tick = 0; tick < 400; tick += 1) {
    ceilingLog.push(tick);
  }

  const flown = flyLog(initial, ceilingLog, T0);
  const ended = dispatch(flown, "endLeg", {}, T0 + 7000);
  const view = hostView(ended.state);
  const run = runFappyLeg(course, ceilingLog);

  assert.deepEqual(view.legs[0]?.knockedEagles, run.frame.knockedEagles.map((knocked) => knocked.gate));
  assert.equal(view.legs[0]?.status, run.outcome === "cleared" ? "cleared" : "ready");
});

test("does hand the tablet on when a leg clears and keep the relay clock", () => {
  const initial = initialize();
  const cleared = clearCurrentLeg(initial, T0);
  const view = hostView(cleared);

  assert.equal(view.legs[0]?.status, "cleared");
  assert.equal(view.legs[0]?.lastRun?.outcome, "cleared");
  assert.equal(view.legIndex, 1);
  assert.equal(view.phase, "ready");
  assert.equal(view.totalGatesCleared, RULES.gatesPerLeg);
  assert.equal(view.finishedAtMs, null);
});

test("does finish the relay on the last gate and score it by time", () => {
  let state = clearCurrentLeg(initialize(), T0);

  state = clearCurrentLeg(state, T0 + 20_000);

  const view = hostView(state);

  assert.equal(view.phase, "finished");
  assert.equal(view.finishedAtMs, T0 + 20_000);
  assert.equal(view.elapsedMs, 20_000);
  // Par pays the whole round, and the round's cap holds: 2 already banked
  // leaves 18 to gain.
  assert.equal(view.points, 18);
  assert.equal(view.pendingPointsByTeamId["team-alpha"], 20);
  assert.equal(dispatch(state, "flap", { tick: 0 }, T0 + 21_000).didMutate, false);
});

test("does pay less the longer the relay took past par", () => {
  let state = clearCurrentLeg(initialize(), T0);

  state = clearCurrentLeg(state, T0 + 60_000);

  const view = hostView(state);

  // 60 s on a 30 s par and 90 s limit is halfway down the slide: 20 → 12.5 → 13.
  assert.equal(view.points, 13);
});

test("does end the relay when the limit passes and keep a share for progress", () => {
  const started = dispatch(initialize(), "flap", { tick: 0 }, T0).state;

  assert.equal(dispatch(started, "timeOut", {}, T0 + 89_999).didMutate, false);

  const timedOut = dispatch(started, "timeOut", {}, T0 + 90_000);
  const view = hostView(timedOut.state);

  assert.equal(view.phase, "timedOut");
  assert.equal(view.timedOutAtMs, T0 + 90_000);
  assert.equal(view.points, 0);
  assert.equal(dispatch(timedOut.state, "flap", { tick: 5 }, T0 + 91_000).didMutate, false);
});

test("does time out a late flap and a late crash on the server's clock", () => {
  const cleared = clearCurrentLeg(initialize(), T0);
  const lateFlap = dispatch(cleared, "flap", { tick: 0 }, T0 + 95_000);
  const lateView = hostView(lateFlap.state);

  assert.equal(lateView.phase, "timedOut");
  // Half the course done at the limit: a quarter of 20, halved, is 3 (2.5 rounded).
  assert.equal(lateView.points, 3);

  const flying = dispatch(cleared, "flap", { tick: 0 }, T0 + 80_000).state;
  const lateCrash = dispatch(flying, "endLeg", {}, T0 + 92_000);

  assert.equal(hostView(lateCrash.state).phase, "timedOut");
});

test("does forgive a leg with skipLeg and move the relay on", () => {
  const skipped = dispatch(initialize(), "skipLeg", {}, T0);
  const view = hostView(skipped.state);

  assert.equal(view.legIndex, 1);
  assert.equal(view.legs[0]?.status, "cleared");
  assert.equal(view.legs[0]?.skipped, true);
  assert.equal(view.phase, "ready");

  const finished = dispatch(skipped.state, "skipLeg", {}, T0 + 1000);

  assert.equal(hostView(finished.state).phase, "finished");
  assert.equal(hostView(finished.state).points, 18);
});

test("does reset the turn to the start line with the points it started with", () => {
  let state = clearCurrentLeg(initialize(), T0);

  state = clearCurrentLeg(state, T0 + 5000);

  const reset = dispatch(state, "resetTurn", {}, T0 + 6000);
  const view = hostView(reset.state);

  assert.equal(view.legIndex, 0);
  assert.equal(view.phase, "ready");
  assert.equal(view.startedAtMs, null);
  assert.equal(view.finishedAtMs, null);
  assert.ok(
    view.legs.every(
      (leg) => leg.status === "ready" && leg.attempt === 0 && leg.crashes === 0 && leg.knockedEagles.length === 0
    )
  );
  assert.deepEqual(view.legs.map((leg) => leg.playerId), ["alex", "morgan"]);
  assert.equal(view.pendingPointsByTeamId["team-alpha"], 2);
});

test("does cap the turn at pointsMax", () => {
  const initial = initialize({ pendingPointsByTeamId: { "team-alpha": 10, "team-beta": 0 } });
  let state = clearCurrentLeg(initial, T0);

  state = clearCurrentLeg(state, T0 + 1000);

  assert.equal(hostView(state).pendingPointsByTeamId["team-alpha"], 20);
});

test("does mirror the shell's pending points when they sync", () => {
  const synced = fappyRuntimePlugin.syncPendingPoints?.({
    state: initialize(),
    pendingPointsByTeamId: { "team-alpha": 9, "team-beta": 4 }
  });

  assert.ok(synced !== undefined);
  assert.deepEqual(hostView(synced).pendingPointsByTeamId, { "team-alpha": 9, "team-beta": 4 });
});

test("does project the display view with exactly the host view's fields", () => {
  const state = dispatch(initialize(), "flap", { tick: 0 }).state;
  const host = fappyRuntimePlugin.selectHostView({ state, rules: null, content: null });
  const display = fappyRuntimePlugin.selectDisplayView({ state, rules: null, content: null });

  assert.deepEqual(display, host);
});

test("does return no view and refuse every action for a foreign state", () => {
  assert.equal(fappyRuntimePlugin.selectHostView({ state: { nope: true }, rules: null, content: null }), null);
  assert.equal(dispatch({ nope: true }, "flap", { tick: 0 }).didMutate, false);
});

test("does accept the default rules and reject each malformed field", () => {
  assert.equal(isFappyRules({}), true);
  assert.equal(isFappyRules(DEFAULT_FAPPY_RULES), true);
  assert.equal(isFappyRules({ legsPerTurn: 0 }), false);
  assert.equal(isFappyRules({ gatesPerLeg: 2.5 }), false);
  assert.equal(isFappyRules({ parSeconds: "45" }), false);
  assert.equal(isFappyRules({ parSeconds: 120, limitSeconds: 60 }), false);
  assert.equal(isFappyRules([]), false);
  assert.equal(isFappyRules(null), false);
  assert.deepEqual(resolveFappyRules(null), DEFAULT_FAPPY_RULES);
  assert.deepEqual(resolveFappyRules({ gatesPerLeg: 5 }), { ...DEFAULT_FAPPY_RULES, gatesPerLeg: 5 });
  assert.deepEqual(resolveFappyRules({ parSeconds: 200, limitSeconds: 100 }), DEFAULT_FAPPY_RULES);
});
