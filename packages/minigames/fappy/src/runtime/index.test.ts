import assert from "node:assert/strict";
import test from "node:test";
import type { FappyMinigameHostView } from "@wingnight/shared";
import { runFappyLeg } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { fappyMinigameId, fappyRuntimePlugin } from "./index.js";
import { isFappyRules, resolveFappyRules } from "./rules/index.js";
import { DEFAULT_FAPPY_RULES } from "./types/index.js";

const TEAM_IDS = ["team-alpha", "team-beta"];
const ROSTER = {
  "team-alpha": ["alex", "morgan", "sam"],
  "team-beta": ["riley"]
};

const initialize = (
  overrides: Partial<Parameters<typeof fappyRuntimePlugin.initialize>[0]> = {}
): SerializableValue => {
  return fappyRuntimePlugin.initialize({
    teamIds: TEAM_IDS,
    activeRoundTeamId: "team-alpha",
    pointsMax: 15,
    pendingPointsByTeamId: { "team-alpha": 2, "team-beta": 0 },
    rules: { legsPerTurn: 4, gatesPerLeg: 3, pointsPerGate: 2 },
    content: null,
    playerIdsByTeamId: ROSTER,
    ...overrides
  });
};

const dispatch = (
  state: SerializableValue,
  actionType: string,
  actionPayload: SerializableValue = {},
  pointsMax = 15
): { state: SerializableValue; didMutate: boolean } => {
  return fappyRuntimePlugin.reduceAction({
    state,
    envelope: { actionType, actionPayload },
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

// A tap every 17 ticks holds the bird near its rest line; how far that gets
// through the sample course is whatever the shared sim says it is.
const steadyFlaps = (untilTick: number): number[] => {
  const ticks: number[] = [];

  for (let tick = 0; tick < untilTick; tick += 17) {
    ticks.push(tick);
  }

  return ticks;
};

const flyLog = (state: SerializableValue, ticks: number[]): SerializableValue => {
  return ticks.reduce((current, tick) => dispatch(current, "flap", { tick }).state, state);
};

test("does register under the FAPPY minigame id", () => {
  assert.equal(fappyMinigameId, "FAPPY");
  assert.equal(fappyRuntimePlugin.id, "FAPPY");
});

test("does hand the legs to the roster in seating order and cycle a short one", () => {
  const view = hostView(initialize());

  assert.equal(view.phase, "ready");
  assert.equal(view.legsPerTurn, 4);
  assert.deepEqual(
    view.legs.map((leg) => leg.playerId),
    ["alex", "morgan", "sam", "alex"]
  );
  assert.equal(view.pendingPointsByTeamId["team-alpha"], 2);
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
  assert.equal(new Set(first).size, first.length);
});

test("does start the leg on the first flap and append the log in order", () => {
  const started = dispatch(initialize(), "flap", { tick: 0 });

  assert.equal(started.didMutate, true);
  assert.equal(hostView(started.state).phase, "flying");

  const second = dispatch(started.state, "flap", { tick: 12 });

  assert.deepEqual(hostView(second.state).legs[0]?.flapTicks, [0, 12]);
});

test("does refuse a flap that is malformed, stale or out of order", () => {
  const started = dispatch(initialize(), "flap", { tick: 10 }).state;

  assert.equal(dispatch(started, "flap", { tick: 10 }).didMutate, false);
  assert.equal(dispatch(started, "flap", { tick: 4 }).didMutate, false);
  assert.equal(dispatch(started, "flap", { tick: -1 }).didMutate, false);
  assert.equal(dispatch(started, "flap", { tick: 1.5 }).didMutate, false);
  assert.equal(dispatch(started, "flap", "now").didMutate, false);
});

test("does refuse to end a leg that is not flying", () => {
  assert.equal(dispatch(initialize(), "endLeg").didMutate, false);
});

test("does score a leg from its own re-run of the log when it ends", () => {
  const initial = initialize();
  const legView = hostView(initial).legs[0];

  assert.ok(legView !== undefined);

  const flown = flyLog(initial, steadyFlaps(300));
  const landed = dispatch(flown, "endLeg");
  const view = hostView(landed.state);
  const expected = runFappyLeg(
    { seed: legView.seed, legIndex: 0, gatesPerLeg: 3 },
    steadyFlaps(300)
  );

  assert.equal(view.phase, "landed");
  assert.equal(view.legs[0]?.gatesCleared, expected.gatesCleared);
  assert.equal(view.legs[0]?.endTick, expected.endTick);
  assert.equal(view.legs[0]?.outcome, expected.outcome);
  assert.equal(view.totalGatesCleared, expected.gatesCleared);
  assert.equal(view.pendingPointsByTeamId["team-alpha"], 2 + 2 * expected.gatesCleared);
});

test("does crash a leg with no flaps after the start and bank nothing", () => {
  const landed = dispatch(dispatch(initialize(), "flap", { tick: 0 }).state, "endLeg");
  const view = hostView(landed.state);

  assert.equal(view.legs[0]?.outcome, "crashed");
  assert.equal(view.legs[0]?.gatesCleared, 0);
  assert.equal(view.pendingPointsByTeamId["team-alpha"], 2);
});

test("does ignore a flap once the leg has landed", () => {
  const landed = dispatch(dispatch(initialize(), "flap", { tick: 0 }).state, "endLeg").state;

  assert.equal(dispatch(landed, "flap", { tick: 900 }).didMutate, false);
});

test("does pass the tablet with nextLeg and finish the relay after the last leg", () => {
  let state = initialize({ rules: { legsPerTurn: 2, gatesPerLeg: 3 } });

  assert.equal(dispatch(state, "nextLeg").didMutate, false);

  state = dispatch(dispatch(state, "flap", { tick: 0 }).state, "endLeg").state;
  state = dispatch(state, "nextLeg").state;

  assert.equal(hostView(state).legIndex, 1);
  assert.equal(hostView(state).phase, "ready");

  state = dispatch(dispatch(state, "flap", { tick: 0 }).state, "endLeg").state;
  state = dispatch(state, "nextLeg").state;

  assert.equal(hostView(state).phase, "done");
  assert.equal(dispatch(state, "flap", { tick: 0 }).didMutate, false);
});

test("does consume a leg with skipLeg and move the relay on at once", () => {
  const skipped = dispatch(initialize(), "skipLeg");
  const view = hostView(skipped.state);

  assert.equal(view.legIndex, 1);
  assert.equal(view.legs[0]?.status, "landed");
  assert.equal(view.legs[0]?.outcome, "skipped");
  assert.equal(view.pendingPointsByTeamId["team-alpha"], 2);

  const midFlight = dispatch(dispatch(skipped.state, "flap", { tick: 3 }).state, "skipLeg");

  assert.equal(hostView(midFlight.state).legIndex, 2);
});

test("does redo the last flown leg and hand back what it banked", () => {
  const initial = initialize();
  const landed = dispatch(flyLog(initial, steadyFlaps(300)), "endLeg").state;
  const passed = dispatch(landed, "nextLeg").state;
  const redone = dispatch(passed, "redoLeg");
  const view = hostView(redone.state);

  assert.equal(redone.didMutate, true);
  assert.equal(view.legIndex, 0);
  assert.equal(view.phase, "ready");
  assert.deepEqual(view.legs[0]?.flapTicks, []);
  assert.equal(view.legs[0]?.playerId, "alex");
  assert.equal(view.pendingPointsByTeamId["team-alpha"], 2);
});

test("does cancel a leg in flight with redoLeg and refuse one before the first flight", () => {
  const initial = initialize();

  assert.equal(dispatch(initial, "redoLeg").didMutate, false);

  const cancelled = dispatch(dispatch(initial, "flap", { tick: 0 }).state, "redoLeg");

  assert.equal(hostView(cancelled.state).phase, "ready");
});

test("does reset the turn to the first leg with the points it started with", () => {
  let state = initialize();

  state = dispatch(dispatch(state, "flap", { tick: 0 }).state, "endLeg").state;
  state = dispatch(state, "nextLeg").state;
  state = dispatch(state, "skipLeg").state;

  const reset = dispatch(state, "resetTurn");
  const view = hostView(reset.state);

  assert.equal(view.legIndex, 0);
  assert.ok(view.legs.every((leg) => leg.status === "ready" && leg.flapTicks.length === 0));
  assert.equal(view.pendingPointsByTeamId["team-alpha"], 2);
});

test("does cap the turn at pointsMax", () => {
  const initial = initialize({ rules: { legsPerTurn: 1, gatesPerLeg: 3, pointsPerGate: 100 } });
  const flown = flyLog(initial, steadyFlaps(300));
  const landed = dispatch(flown, "endLeg", {}, 15);
  const view = hostView(landed.state);

  if (view.totalGatesCleared > 0) {
    assert.equal(view.pendingPointsByTeamId["team-alpha"], 15);
  } else {
    assert.equal(view.pendingPointsByTeamId["team-alpha"], 2);
  }
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
  assert.equal(isFappyRules({ pointsPerGate: "1" }), false);
  assert.equal(isFappyRules([]), false);
  assert.equal(isFappyRules(null), false);
  assert.deepEqual(resolveFappyRules(null), DEFAULT_FAPPY_RULES);
  assert.deepEqual(resolveFappyRules({ gatesPerLeg: 5 }), { ...DEFAULT_FAPPY_RULES, gatesPerLeg: 5 });
});
