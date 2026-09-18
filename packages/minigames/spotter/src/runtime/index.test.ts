import assert from "node:assert/strict";
import test from "node:test";

import type {
  SpotterCell,
  SpotterDirection,
  SpotterMinigameDisplayView,
  SpotterMinigameHostView
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { chebyshevDistance, generateSpotterTargets, resolveStartCell } from "./field/index.js";
import { spotterRuntimePlugin } from "./index.js";
import { isSpotterRules, resolveSpotterRules } from "./rules/index.js";
import type { SpotterRuntimeState } from "./types/index.js";

const TEAM_IDS = ["team-1", "team-2"];
const POINTS_MAX = 15;
const SEEDED_RULES = { targetsPerTurn: 5, gridCols: 13, gridRows: 7, seed: 20260916 };

const initializeState = (
  rules: SerializableValue | null = SEEDED_RULES
): SpotterRuntimeState => {
  const state = spotterRuntimePlugin.initialize({
    teamIds: TEAM_IDS,
    activeRoundTeamId: "team-1",
    pointsMax: POINTS_MAX,
    pendingPointsByTeamId: { "team-1": 0, "team-2": 0 },
    rules,
    content: null
  });

  assert.notEqual(state, null);
  return state as SpotterRuntimeState;
};

const reduce = (
  state: SerializableValue,
  actionType: string,
  actionPayload: SerializableValue = {}
): { state: SerializableValue; didMutate: boolean } => {
  return spotterRuntimePlugin.reduceAction({
    state,
    envelope: { actionType, actionPayload },
    pointsMax: POINTS_MAX,
    rules: SEEDED_RULES,
    content: null
  });
};

const nudge = (state: SerializableValue, direction: SpotterDirection): SpotterRuntimeState => {
  return reduce(state, "nudge", { direction }).state as SpotterRuntimeState;
};

// Walks the crosshair onto a cell one nudge at a time, the way a room would.
const walkTo = (state: SpotterRuntimeState, target: SpotterCell): SpotterRuntimeState => {
  let next = state;

  while (next.cursor.col !== target.col) {
    next = nudge(next, next.cursor.col < target.col ? "R" : "L");
  }

  while (next.cursor.row !== target.row) {
    next = nudge(next, next.cursor.row < target.row ? "D" : "U");
  }

  return next;
};

const selectViews = (
  state: SerializableValue
): { hostView: SpotterMinigameHostView; displayView: SpotterMinigameDisplayView } => {
  const input = { state, rules: SEEDED_RULES, content: null };
  return {
    hostView: spotterRuntimePlugin.selectHostView(input) as SpotterMinigameHostView,
    displayView: spotterRuntimePlugin.selectDisplayView(input) as SpotterMinigameDisplayView
  };
};

test("spotter runtime plugin declares its minigame id and no content file", () => {
  assert.equal(spotterRuntimePlugin.id, "SPOTTER");
  assert.equal(spotterRuntimePlugin.content, undefined);
});

test("isSpotterRules accepts well-formed optional fields and rejects malformed ones", () => {
  assert.equal(isSpotterRules({}), true);
  assert.equal(isSpotterRules(SEEDED_RULES), true);
  assert.equal(
    isSpotterRules({ scoreBandsCells: [{ maxCells: 0, points: 3 }] }),
    true
  );
  assert.equal(isSpotterRules(null), false);
  assert.equal(isSpotterRules([]), false);
  assert.equal(isSpotterRules({ targetsPerTurn: 0 }), false);
  assert.equal(isSpotterRules({ gridCols: 2 }), false);
  assert.equal(isSpotterRules({ gridRows: 99 }), false);
  assert.equal(isSpotterRules({ scoreBandsCells: [] }), false);
  assert.equal(isSpotterRules({ scoreBandsCells: [{ maxCells: -1, points: 1 }] }), false);
  assert.equal(isSpotterRules({ seed: 1.5 }), false);
});

test("resolveSpotterRules falls back to defaults and sorts score bands", () => {
  const defaults = resolveSpotterRules(null);

  assert.equal(defaults.targetsPerTurn, 5);
  assert.equal(defaults.gridCols, 13);
  assert.equal(defaults.gridRows, 7);
  assert.equal(defaults.seed, null);
  assert.deepEqual(defaults.scoreBandsCells, [
    { maxCells: 0, points: 3 },
    { maxCells: 1, points: 1 }
  ]);

  const custom = resolveSpotterRules({
    targetsPerTurn: 3,
    scoreBandsCells: [
      { maxCells: 2, points: 1 },
      { maxCells: 0, points: 5 }
    ]
  });

  assert.equal(custom.targetsPerTurn, 3);
  assert.deepEqual(custom.scoreBandsCells, [
    { maxCells: 0, points: 5 },
    { maxCells: 2, points: 1 }
  ]);
});

test("generateSpotterTargets is deterministic for a seed and keeps clearance", () => {
  const input = { seed: 42, gridCols: 13, gridRows: 7, targetCount: 5 };
  const first = generateSpotterTargets(input);
  const second = generateSpotterTargets(input);
  const startCell = resolveStartCell(13, 7);

  assert.deepEqual(first, second);
  assert.equal(first.length, 5);

  for (const [index, target] of first.entries()) {
    assert.ok(target.col >= 0 && target.col < 13);
    assert.ok(target.row >= 0 && target.row < 7);
    assert.ok(chebyshevDistance(target, startCell) >= 2, "target too close to start");

    for (const other of first.slice(index + 1)) {
      assert.ok(chebyshevDistance(target, other) >= 2, "targets too close together");
    }
  }

  assert.notDeepEqual(generateSpotterTargets({ ...input, seed: 43 }), first);
});

test("generateSpotterTargets fills a grid too small for full clearance instead of looping", () => {
  const targets = generateSpotterTargets({ seed: 7, gridCols: 5, gridRows: 3, targetCount: 14 });
  const keys = new Set(targets.map((target) => `${target.col},${target.row}`));

  assert.equal(targets.length, 14);
  assert.equal(keys.size, 14);
  assert.equal(keys.has("2,1"), false);
});

test("initialize seeds a field from the rules with the crosshair at centre", () => {
  const state = initializeState();

  assert.equal(state.activeTurnTeamId, "team-1");
  assert.equal(state.seed, SEEDED_RULES.seed);
  assert.equal(state.targets.length, 5);
  assert.deepEqual(state.cursor, { col: 6, row: 3 });
  assert.equal(state.targetIndex, 0);
  assert.deepEqual(state.path, []);
  assert.deepEqual(state.results, []);
  assert.deepEqual(initializeState().targets, state.targets);
});

test("initialize rolls a fresh seed when the rules pin none", () => {
  const first = initializeState(null);
  const second = initializeState(null);

  assert.ok(Number.isInteger(first.seed));
  // Two random rolls agreeing is astronomically unlikely; a fixed seed here
  // would mean a team scheduled twice sees the same field twice.
  assert.notEqual(first.seed, second.seed);
});

test("initialize falls back to the first team when no round team is active", () => {
  const state = spotterRuntimePlugin.initialize({
    teamIds: TEAM_IDS,
    activeRoundTeamId: null,
    pointsMax: POINTS_MAX,
    pendingPointsByTeamId: {},
    rules: SEEDED_RULES,
    content: null
  }) as SpotterRuntimeState;

  assert.equal(state.activeTurnTeamId, "team-1");
});

test("nudge moves the crosshair one cell and records the step on the trail", () => {
  const state = initializeState();
  const moved = nudge(nudge(nudge(state, "U"), "L"), "L");

  assert.deepEqual(moved.cursor, { col: 4, row: 2 });
  assert.deepEqual(moved.path, ["U", "L", "L"]);
});

test("nudge into a wall is a no-op rather than a phantom trail step", () => {
  let state = initializeState();

  for (let step = 0; step < 10; step += 1) {
    state = nudge(state, "U");
  }

  assert.equal(state.cursor.row, 0);
  assert.equal(state.path.length, 3);

  const blocked = reduce(state, "nudge", { direction: "U" });
  assert.equal(blocked.didMutate, false);
});

test("nudge rejects malformed payloads", () => {
  const state = initializeState();

  assert.equal(reduce(state, "nudge", {}).didMutate, false);
  assert.equal(reduce(state, "nudge", { direction: "north" }).didMutate, false);
  assert.equal(reduce(state, "nudge", null).didMutate, false);
});

test("the trail is capped so a panicked holder cannot grow the snapshot", () => {
  let state = initializeState();

  for (let step = 0; step < 60; step += 1) {
    state = nudge(state, step % 2 === 0 ? "L" : "R");
  }

  assert.equal(state.path.length, 40);
});

test("fire on the target awards the hit band, advances, and clears the trail", () => {
  const state = initializeState();
  const aimed = walkTo(state, state.targets[0] as SpotterCell);

  assert.ok(aimed.path.length > 0);

  const fired = reduce(aimed, "fire");
  const next = fired.state as SpotterRuntimeState;

  assert.equal(fired.didMutate, true);
  assert.equal(next.targetIndex, 1);
  assert.deepEqual(next.path, []);
  assert.deepEqual(next.cursor, aimed.cursor);
  assert.equal(next.results.length, 1);
  assert.equal(next.results[0]?.band, "HIT");
  assert.equal(next.results[0]?.points, 3);
  assert.equal(next.results[0]?.distanceCells, 0);
  assert.equal(next.pendingPointsByTeamId["team-1"], 3);
});

test("fire one cell off scores the close band and further off scores nothing", () => {
  const state = initializeState();
  const target = state.targets[0] as SpotterCell;
  const adjacent: SpotterCell = {
    col: target.col > 0 ? target.col - 1 : target.col + 1,
    row: target.row
  };
  const closeShot = reduce(walkTo(state, adjacent), "fire").state as SpotterRuntimeState;

  assert.equal(closeShot.results[0]?.band, "CLOSE");
  assert.equal(closeShot.results[0]?.points, 1);
  assert.equal(closeShot.pendingPointsByTeamId["team-1"], 1);

  const farCell: SpotterCell = {
    col: target.col > 6 ? 0 : 12,
    row: target.row > 3 ? 0 : 6
  };
  const missShot = reduce(walkTo(state, farCell), "fire").state as SpotterRuntimeState;

  assert.equal(missShot.results[0]?.band, "MISS");
  assert.equal(missShot.results[0]?.points, 0);
  assert.equal(missShot.pendingPointsByTeamId["team-1"], 0);
});

test("fire clamps pending points at pointsMax", () => {
  const state: SpotterRuntimeState = {
    ...initializeState(),
    pendingPointsByTeamId: { "team-1": 14, "team-2": 0 }
  };
  const fired = reduce(walkTo(state, state.targets[0] as SpotterCell), "fire")
    .state as SpotterRuntimeState;

  assert.equal(fired.pendingPointsByTeamId["team-1"], POINTS_MAX);
});

test("the turn is done after the last target and further actions are ignored", () => {
  let state = initializeState();

  for (const target of state.targets) {
    state = reduce(walkTo(state, target), "fire").state as SpotterRuntimeState;
  }

  assert.equal(state.targetIndex, 5);
  assert.equal(state.pendingPointsByTeamId["team-1"], 15);
  assert.equal(selectViews(state).hostView.status, "done");
  assert.equal(reduce(state, "fire").didMutate, false);
  assert.equal(reduce(state, "nudge", { direction: "U" }).didMutate, false);
});

test("display view exposes the field while the host view stays field-free", () => {
  const state = nudge(nudge(initializeState(), "U"), "R");
  const { hostView, displayView } = selectViews(state);

  assert.equal(displayView.minigame, "SPOTTER");
  assert.deepEqual(displayView.targets, state.targets);
  assert.deepEqual(displayView.cursor, { col: 7, row: 2 });
  assert.deepEqual(displayView.path, ["U", "R"]);
  assert.equal(displayView.gridCols, 13);
  assert.equal(displayView.gridRows, 7);
  assert.equal(displayView.status, "aiming");

  assert.equal(hostView.minigame, "SPOTTER");
  assert.equal(hostView.activeTurnTeamId, "team-1");
  assert.equal(hostView.targetsPerTurn, 5);
  assert.equal(hostView.targetIndex, 0);
  assert.equal(hostView.nudgesThisTarget, 2);
  assert.equal(hostView.lastShot, null);
  assert.equal("cursor" in hostView, false);
  assert.equal("targets" in hostView, false);
  assert.equal("path" in hostView, false);
  assert.equal("seed" in hostView, false);
  assert.equal("gridCols" in hostView, false);

  // Nothing in the serialized host view can place the crosshair or a target.
  const serializedHostView = JSON.stringify(hostView);
  for (const target of state.targets) {
    assert.equal(serializedHostView.includes(`"col":${target.col}`), false);
  }
});

test("host view carries shot bands and points but never where the shot landed", () => {
  const state = initializeState();
  const fired = reduce(walkTo(state, state.targets[0] as SpotterCell), "fire")
    .state as SpotterRuntimeState;
  const { hostView, displayView } = selectViews(fired);

  assert.deepEqual(hostView.lastShot, { band: "HIT", points: 3 });
  assert.deepEqual(hostView.results, [{ band: "HIT", points: 3 }]);
  assert.equal(hostView.nudgesThisTarget, 0);
  assert.equal(hostView.targetIndex, 1);

  assert.equal(displayView.results[0]?.col, fired.cursor.col);
  assert.equal(displayView.results[0]?.row, fired.cursor.row);
  assert.equal("col" in (hostView.results[0] ?? {}), false);
});

test("syncPendingPoints adopts the authoritative score map", () => {
  const state = initializeState();
  const synced = spotterRuntimePlugin.syncPendingPoints?.({
    state,
    pendingPointsByTeamId: { "team-1": 9, "team-2": 4 }
  }) as SpotterRuntimeState;

  assert.deepEqual(synced.pendingPointsByTeamId, { "team-1": 9, "team-2": 4 });
  assert.deepEqual(synced.targets, state.targets);
});

test("reducer and selectors ignore foreign runtime state", () => {
  const foreign = { strokes: [], activeStrokeId: null };

  assert.equal(reduce(foreign, "fire").didMutate, false);
  assert.equal(
    spotterRuntimePlugin.selectHostView({ state: foreign, rules: null, content: null }),
    null
  );
  assert.equal(
    spotterRuntimePlugin.selectDisplayView({ state: foreign, rules: null, content: null }),
    null
  );
});
