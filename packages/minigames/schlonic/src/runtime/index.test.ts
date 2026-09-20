import assert from "node:assert/strict";
import test from "node:test";
import type { Player, SchlonicMinigameHostView, Team } from "@wingnight/shared";
import { runSchlonicRun } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { isSchlonicRules, resolveSchlonicRules } from "./rules/index.js";
import { resolveSchlonicPoints, resolveRingsBanked, resolveRingsPar } from "./scoring/index.js";
import { DEFAULT_SCHLONIC_RULES } from "./types/index.js";
import { schlonicRuntimePlugin } from "./index.js";

const PLAYERS: Player[] = [
  { id: "p1", name: "Alex" },
  { id: "p2", name: "Caitlin" },
  { id: "p3", name: "Dan" }
];

const TEAMS: Team[] = [
  { id: "team-a", name: "Team A", playerIds: ["p1", "p2", "p3"], totalScore: 0 },
  { id: "team-b", name: "Team B", playerIds: [], totalScore: 0 }
];

const RULES = { runsPerTurn: 2, zoneSeed: 4, zoneChunks: 14, parRingsPerRun: 20 };
const POINTS_MAX = 15;

const initialize = (rules: SerializableValue = RULES): SerializableValue => {
  const state = schlonicRuntimePlugin.initialize({
    teamIds: ["team-a", "team-b"],
    players: PLAYERS,
    teams: TEAMS,
    activeRoundTeamId: "team-a",
    pointsMax: POINTS_MAX,
    pendingPointsByTeamId: { "team-a": 0, "team-b": 0 },
    rules,
    content: null
  });

  assert.ok(state !== null);

  return state;
};

const reduce = (
  state: SerializableValue,
  actionType: string,
  actionPayload: SerializableValue = {}
): { state: SerializableValue; didMutate: boolean } => {
  return schlonicRuntimePlugin.reduceAction({
    state,
    envelope: { actionType, actionPayload, receivedAtMs: 1000 },
    pointsMax: POINTS_MAX,
    rules: RULES,
    content: null
  });
};

const hostView = (state: SerializableValue): SchlonicMinigameHostView => {
  const view = schlonicRuntimePlugin.selectHostView({ state, rules: RULES, content: null });

  assert.ok(view !== null && view.minigame === "SCHLONIC");

  return view;
};

test("deals one run to each seated player, in seating order", () => {
  const view = hostView(initialize({ ...RULES, runsPerTurn: 3 }));

  assert.deepEqual(
    view.runs.map((run) => run.player?.name),
    ["Alex", "Caitlin", "Dan"]
  );
  assert.equal(view.phase, "ready");
  assert.equal(view.runIndex, 0);
  assert.equal(view.points, null);
});

test("cycles a short roster rather than giving the team fewer runs at the zone", () => {
  const view = hostView(initialize({ ...RULES, runsPerTurn: 5 }));

  assert.deepEqual(
    view.runs.map((run) => run.player?.name),
    ["Alex", "Caitlin", "Dan", "Alex", "Caitlin"]
  );
});

test("runs the house schlong for a team with nobody seated", () => {
  const state = schlonicRuntimePlugin.initialize({
    teamIds: ["team-b"],
    players: PLAYERS,
    teams: TEAMS,
    activeRoundTeamId: "team-b",
    pointsMax: POINTS_MAX,
    pendingPointsByTeamId: { "team-b": 0 },
    rules: RULES,
    content: null
  });

  assert.ok(state !== null);
  assert.deepEqual(
    hostView(state).runs.map((run) => run.player),
    [null, null]
  );
});

test("gives every team in the round the same zone, because a race is not a lottery", () => {
  const first = hostView(initialize());
  const second = hostView(initialize());

  assert.equal(first.zoneSeed, second.zoneSeed);
  assert.equal(first.zoneChunks, second.zoneChunks);
});

test("logs the button and starts the run on the first press", () => {
  const pressed = reduce(initialize(), "press", { tick: 0 });
  const view = hostView(pressed.state);

  assert.equal(pressed.didMutate, true);
  assert.equal(view.phase, "running");
  assert.deepEqual(view.runs[0]?.inputs, [{ tick: 0, down: true }]);
});

test("logs the release that ends the climb, so a tap is a hop and a hold is a jump", () => {
  const pressed = reduce(initialize(), "press", { tick: 4 });
  const released = reduce(pressed.state, "release", { tick: 22 });

  assert.deepEqual(hostView(released.state).runs[0]?.inputs, [
    { tick: 4, down: true },
    { tick: 22, down: false }
  ]);
});

test("ignores a repeated or out-of-order tick, which is a stale tablet and not a finger", () => {
  const pressed = reduce(initialize(), "press", { tick: 10 });

  assert.equal(reduce(pressed.state, "release", { tick: 10 }).didMutate, false);
  assert.equal(reduce(pressed.state, "press", { tick: 4 }).didMutate, false);
});

test("ignores a press with no tick on it", () => {
  assert.equal(reduce(initialize(), "press", { tick: -1 }).didMutate, false);
  assert.equal(reduce(initialize(), "press", {}).didMutate, false);
});

test("refuses to end a run nobody has started", () => {
  assert.equal(reduce(initialize(), "endRun").didMutate, false);
});

test("referees the run itself and hands the tablet on", () => {
  const pressed = reduce(initialize(), "press", { tick: 0 });
  const ended = reduce(pressed.state, "endRun");
  const view = hostView(ended.state);
  const finished = view.runs[0];

  assert.equal(ended.didMutate, true);
  assert.equal(view.runIndex, 1);
  assert.equal(view.phase, "ready");
  assert.equal(finished?.status, "done");
  assert.ok(finished?.result !== null && finished?.result !== undefined);
  assert.ok(["cleared", "wiped", "fell"].includes(finished.result.outcome));
});

test("scores from its own re-run of the log, never from anything the tablet claimed", () => {
  const pressed = reduce(initialize(), "press", { tick: 0 });
  const ended = reduce(pressed.state, "endRun");
  const recorded = hostView(ended.state).runs[0]?.result;
  const refereed = runSchlonicRun({ seed: RULES.zoneSeed, chunks: RULES.zoneChunks }, [
    { tick: 0, down: true }
  ]);

  assert.deepEqual(recorded, {
    outcome: refereed.outcome,
    endTick: refereed.endTick,
    rings: refereed.rings,
    distance: refereed.distance
  });
});

test("brings nothing home from a run that never reached the post", () => {
  // Nothing but the one press to get going: the zone's pit takes it a third of the way in.
  const pressed = reduce(initialize({ ...RULES, zoneSeed: 4, zoneChunks: 14 }), "press", { tick: 0 });
  const ended = reduce(pressed.state, "endRun");
  const view = hostView(ended.state);

  assert.equal(view.runs[0]?.result?.outcome, "fell");
  assert.equal(view.runs[0]?.result?.rings, 0);
  assert.equal(view.ringsBanked, 0);
});

test("scores the turn out of the rings the team carried over the post", () => {
  assert.equal(resolveSchlonicPoints(0, 40, 15), 0);
  assert.equal(resolveSchlonicPoints(20, 40, 15), 8);
  assert.equal(resolveSchlonicPoints(40, 40, 15), 15);
  // Par is the ceiling: a team that has maxed the zone should hand the tablet on.
  assert.equal(resolveSchlonicPoints(400, 40, 15), 15);
});

test("counts par across the whole team's runs, not one of them", () => {
  assert.equal(resolveRingsPar(20, 3), 60);
  assert.equal(
    resolveRingsBanked([
      { runIndex: 0, player: null, status: "done", inputs: [], skipped: false, result: { outcome: "cleared", endTick: 10, rings: 7, distance: 100 } },
      { runIndex: 1, player: null, status: "done", inputs: [], skipped: true, result: null }
    ]),
    7
  );
});

test("skips a run the tablet cannot take, banking nothing and moving on", () => {
  const skipped = reduce(initialize(), "skipRun");
  const view = hostView(skipped.state);

  assert.equal(view.runIndex, 1);
  assert.equal(view.runs[0]?.skipped, true);
  assert.equal(view.runs[0]?.result, null);
  assert.equal(view.ringsBanked, 0);
});

test("finishes the turn once every run is behind the team", () => {
  const first = reduce(initialize(), "skipRun");
  const second = reduce(first.state, "skipRun");
  const view = hostView(second.state);

  assert.equal(view.phase, "finished");
  assert.equal(view.points, 0);
  assert.equal(reduce(second.state, "press", { tick: 0 }).didMutate, false);
  assert.equal(reduce(second.state, "skipRun").didMutate, false);
});

test("hands back exactly what the turn banked on a reset", () => {
  const withPoints = schlonicRuntimePlugin.initialize({
    teamIds: ["team-a"],
    players: PLAYERS,
    teams: TEAMS,
    activeRoundTeamId: "team-a",
    pointsMax: POINTS_MAX,
    pendingPointsByTeamId: { "team-a": 4 },
    rules: RULES,
    content: null
  });

  assert.ok(withPoints !== null);

  const played = reduce(reduce(withPoints, "press", { tick: 0 }).state, "endRun");
  const reset = reduce(played.state, "resetTurn");
  const view = hostView(reset.state);

  assert.equal(view.runIndex, 0);
  assert.equal(view.phase, "ready");
  assert.equal(view.ringsBanked, 0);
  assert.equal(view.pendingPointsByTeamId["team-a"], 4);
  assert.deepEqual(
    view.runs.map((run) => run.inputs),
    [[], []]
  );
  // A reset keeps the seating it was dealt.
  assert.deepEqual(
    view.runs.map((run) => run.player?.name),
    ["Alex", "Caitlin"]
  );
});

test("keeps the display view free of anything the host view does not also carry", () => {
  const state = reduce(initialize(), "press", { tick: 0 }).state;
  const host = schlonicRuntimePlugin.selectHostView({ state, rules: RULES, content: null });
  const display = schlonicRuntimePlugin.selectDisplayView({ state, rules: RULES, content: null });

  assert.deepEqual(display, host);
});

test("ignores state that is not its own", () => {
  assert.equal(schlonicRuntimePlugin.selectHostView({ state: { nope: true }, rules: null, content: null }), null);
  assert.equal(schlonicRuntimePlugin.selectDisplayView({ state: null, rules: null, content: null }), null);
  assert.equal(reduce({ nope: true }, "press", { tick: 0 }).didMutate, false);
});

test("takes the round's rules and falls back to the defaults for anything missing", () => {
  assert.deepEqual(resolveSchlonicRules(null), DEFAULT_SCHLONIC_RULES);
  assert.deepEqual(resolveSchlonicRules({ runsPerTurn: 4 }), {
    ...DEFAULT_SCHLONIC_RULES,
    runsPerTurn: 4
  });
  // A zone with no room in it is lifted to the shortest one that can be run.
  assert.ok(resolveSchlonicRules({ zoneChunks: 1 }).zoneChunks >= 6);
  // A seed is a hash input, not a count: negative is fine.
  assert.equal(resolveSchlonicRules({ zoneSeed: -12 }).zoneSeed, -12);
});

test("refuses a rules block the pack got wrong, at config-load time", () => {
  assert.equal(isSchlonicRules({}), true);
  assert.equal(isSchlonicRules({ runsPerTurn: 3, zoneChunks: 20 }), true);
  assert.equal(isSchlonicRules({ zoneSeed: -5 }), true);
  assert.equal(isSchlonicRules({ runsPerTurn: 0 }), false);
  assert.equal(isSchlonicRules({ runsPerTurn: 2.5 }), false);
  assert.equal(isSchlonicRules({ zoneChunks: 3 }), false);
  assert.equal(isSchlonicRules({ zoneSeed: 1.5 }), false);
  assert.equal(isSchlonicRules([]), false);
  assert.equal(isSchlonicRules(null), false);
});

test("re-reads the round's running totals without touching the runs", () => {
  const state = reduce(initialize(), "press", { tick: 0 }).state;
  const synced = schlonicRuntimePlugin.syncPendingPoints?.({
    state,
    pendingPointsByTeamId: { "team-a": 9, "team-b": 3 }
  });

  assert.ok(synced !== undefined);
  assert.deepEqual(hostView(synced).pendingPointsByTeamId, { "team-a": 9, "team-b": 3 });
  assert.equal(hostView(synced).phase, "running");
});
