import assert from "node:assert/strict";
import test from "node:test";

import type {
  JoustContentFile,
  JoustMinigameDisplayView,
  JoustMinigameHostView
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { joustMinigameId, joustRuntimePlugin } from "./index.js";
import { parseJoustContentFile } from "./content/index.js";
import { isJoustRules, resolveJoustRules } from "./rules/index.js";
import {
  DEFAULT_JOUST_SHOTS_PER_TURN,
  JOUST_POINTS_BY_ZONE,
  type JoustRuntimeState
} from "./types/index.js";

const arenaFixture = (index: number): JoustContentFile["prompts"][number] => ({
  id: `arena-${index}`,
  name: `Arena ${index}`,
  targetX: 120 + index,
  obstacles: index % 2 === 0 ? [] : [{ x: 78, y: 54, width: 6, height: 24 }]
});

const contentFixture: JoustContentFile = {
  prompts: Array.from({ length: 3 }, (_unused, index) => arenaFixture(index + 1))
};

// Found by sweeping the aim space in the integrator's own tests: a lob at this
// pull comes down on the champ in an open arena.
const HITTING_AIM = { x: -0.85, y: 0.55 };
// Barely drawn: drops at the slingshot's feet.
const MISSING_AIM = { x: -0.2, y: 0 };

type InitializeOverrides = Partial<{
  teamIds: string[];
  activeRoundTeamId: string | null;
  pointsMax: number;
  pendingPointsByTeamId: Record<string, number>;
  rules: SerializableValue | null;
  content: SerializableValue | null;
}>;

const initialize = (overrides: InitializeOverrides = {}): SerializableValue | null => {
  return joustRuntimePlugin.initialize({
    teamIds: overrides.teamIds ?? ["team-1", "team-2"],
    activeRoundTeamId:
      overrides.activeRoundTeamId === undefined ? "team-1" : overrides.activeRoundTeamId,
    pointsMax: overrides.pointsMax ?? 15,
    pendingPointsByTeamId: overrides.pendingPointsByTeamId ?? {},
    rules: overrides.rules === undefined ? { shotsPerTurn: 3 } : overrides.rules,
    content: overrides.content === undefined ? contentFixture : overrides.content
  });
};

const initializeState = (overrides: InitializeOverrides = {}): JoustRuntimeState => {
  const state = initialize(overrides);

  assert.notEqual(state, null);
  return state as JoustRuntimeState;
};

const reduce = (
  state: SerializableValue,
  actionType: string,
  actionPayload: SerializableValue = {},
  options: Partial<{ pointsMax: number; content: SerializableValue | null }> = {}
): { state: SerializableValue; didMutate: boolean } => {
  return joustRuntimePlugin.reduceAction({
    state,
    envelope: { actionType, actionPayload },
    pointsMax: options.pointsMax ?? 15,
    rules: { shotsPerTurn: 3 },
    content: options.content === undefined ? contentFixture : options.content
  });
};

const asState = (state: SerializableValue): JoustRuntimeState => {
  return state as JoustRuntimeState;
};

const hostView = (state: SerializableValue): JoustMinigameHostView => {
  const view = joustRuntimePlugin.selectHostView({
    state,
    rules: null,
    content: contentFixture
  });

  assert.ok(view !== null && view.minigame === "JOUST");
  return view;
};

const displayView = (state: SerializableValue): JoustMinigameDisplayView => {
  const view = joustRuntimePlugin.selectDisplayView({
    state,
    rules: null,
    content: contentFixture
  });

  assert.ok(view !== null && view.minigame === "JOUST");
  return view;
};

test("registers under the JOUST id", () => {
  assert.equal(joustRuntimePlugin.id, "JOUST");
  assert.equal(joustMinigameId, "JOUST");
});

test("starts the active team aiming in the arena its turn order slot picks", () => {
  const first = initializeState({ activeRoundTeamId: "team-1" });
  const second = initializeState({ activeRoundTeamId: "team-2" });

  assert.equal(first.phase, "aiming");
  assert.equal(first.activeTurnTeamId, "team-1");
  assert.equal(first.arenaId, "arena-1");
  assert.equal(second.arenaId, "arena-2");
  assert.equal(first.shotsPerTurn, 3);
  assert.deepEqual(first.aim, { x: 0, y: 0 });
});

test("wraps around a pack smaller than the roster", () => {
  const state = initializeState({
    teamIds: ["a", "b", "c", "d"],
    activeRoundTeamId: "d"
  });

  assert.equal(state.arenaId, "arena-1");
});

test("returns no runtime when the pack is empty", () => {
  assert.equal(initialize({ content: { prompts: [] } }), null);
  assert.equal(initialize({ content: null }), null);
});

test("falls back to the default shot count when the rules are missing or malformed", () => {
  assert.equal(initializeState({ rules: null }).shotsPerTurn, DEFAULT_JOUST_SHOTS_PER_TURN);
  assert.equal(
    initializeState({ rules: { shotsPerTurn: 0 } }).shotsPerTurn,
    DEFAULT_JOUST_SHOTS_PER_TURN
  );
  assert.deepEqual(resolveJoustRules({ shotsPerTurn: 5 }), { shotsPerTurn: 5 });
});

test("validates the rules block the way the content loader expects", () => {
  assert.equal(isJoustRules({}), true);
  assert.equal(isJoustRules({ shotsPerTurn: 2 }), true);
  assert.equal(isJoustRules({ shotsPerTurn: -1 }), false);
  assert.equal(isJoustRules([]), false);
});

test("tracks the live pull while aiming and ignores an unchanged one", () => {
  const state = initializeState();
  const pulled = reduce(state, "setAim", { x: -0.6, y: 0.3 });

  assert.equal(pulled.didMutate, true);
  assert.deepEqual(asState(pulled.state).aim, { x: -0.6, y: 0.3 });

  const same = reduce(pulled.state, "setAim", { x: -0.6, y: 0.3 });

  assert.equal(same.didMutate, false);
});

test("clamps a pull past the band's radius", () => {
  const pulled = reduce(initializeState(), "setAim", { x: -4, y: 0 });
  const aim = asState(pulled.state).aim;

  assert.ok(Math.abs(aim.x + 1) < 1e-9);
});

test("ignores a malformed pull", () => {
  const state = initializeState();

  assert.equal(reduce(state, "setAim", { x: "left" }).didMutate, false);
  assert.equal(reduce(state, "setAim", null).didMutate, false);
  assert.equal(reduce(state, "launch", { y: 1 }).didMutate, false);
});

test("resolves a launch into a replayable track and banks the zone's points", () => {
  const launched = reduce(initializeState(), "launch", HITTING_AIM);
  const state = asState(launched.state);

  assert.equal(launched.didMutate, true);
  assert.equal(state.phase, "resolved");
  assert.equal(state.shots.length, 1);
  assert.ok(state.lastShot !== null);
  assert.ok(state.lastShot.run.keyframes.length > 1);
  assert.notEqual(state.lastShot.hitZone, null);
  assert.equal(
    state.pendingPointsByTeamId["team-1"],
    JOUST_POINTS_BY_ZONE[state.lastShot.hitZone ?? "shaft"]
  );
  assert.deepEqual(state.aim, { x: 0, y: 0 });
});

test("scores nothing for a shot that never reaches the champ", () => {
  const state = asState(reduce(initializeState(), "launch", MISSING_AIM).state);

  assert.equal(state.phase, "resolved");
  assert.equal(state.lastShot?.hitZone, null);
  assert.equal(state.shots[0]?.points, 0);
  assert.equal(state.pendingPointsByTeamId["team-1"], 0);
});

test("refuses to spend a shot on a barely drawn band", () => {
  const twitch = reduce(initializeState(), "launch", { x: -0.05, y: 0.02 });

  assert.equal(twitch.didMutate, false);
});

test("produces the same track for the same shot on a replayed reducer", () => {
  const first = asState(reduce(initializeState(), "launch", HITTING_AIM).state);
  const second = asState(reduce(initializeState(), "launch", HITTING_AIM).state);

  assert.equal(JSON.stringify(first.lastShot), JSON.stringify(second.lastShot));
});

test("only launches while aiming", () => {
  const resolved = reduce(initializeState(), "launch", HITTING_AIM).state;

  assert.equal(reduce(resolved, "launch", HITTING_AIM).didMutate, false);
  assert.equal(reduce(resolved, "setAim", { x: -0.5, y: 0 }).didMutate, false);
});

test("moves to the next shot and drops the replayed track on the way", () => {
  const resolved = reduce(initializeState(), "launch", HITTING_AIM).state;
  const next = asState(reduce(resolved, "nextShot").state);

  assert.equal(next.phase, "aiming");
  assert.equal(next.shotIndex, 1);
  assert.equal(next.lastShot, null);
  assert.equal(next.shots.length, 1);
});

test("ends the turn after the last shot and keeps that shot on screen", () => {
  let state: SerializableValue = initializeState();

  for (let shot = 0; shot < 3; shot += 1) {
    state = reduce(state, "launch", MISSING_AIM).state;
    state = reduce(state, "nextShot").state;
  }

  const done = asState(state);

  assert.equal(done.phase, "done");
  assert.equal(done.shotIndex, 2);
  assert.notEqual(done.lastShot, null);
  assert.equal(reduce(state, "launch", HITTING_AIM).didMutate, false);
  assert.equal(reduce(state, "nextShot").didMutate, false);
});

test("caps the turn at pointsMax", () => {
  let state: SerializableValue = initializeState({
    pointsMax: 4,
    pendingPointsByTeamId: { "team-1": 3 }
  });

  state = reduce(state, "launch", HITTING_AIM, { pointsMax: 4 }).state;

  assert.equal(asState(state).pendingPointsByTeamId["team-1"], 4);
});

test("forfeits a shot through the skip escape hatch", () => {
  const skipped = asState(reduce(initializeState(), "skipShot").state);

  assert.equal(skipped.phase, "aiming");
  assert.equal(skipped.shotIndex, 1);
  assert.deepEqual(skipped.shots, [{ shotNumber: 1, hitZone: null, points: 0 }]);
  assert.equal(reduce(reduce(initializeState(), "launch", HITTING_AIM).state, "skipShot").didMutate, false);
});

test("hands back exactly this turn's points on a reset", () => {
  let state: SerializableValue = initializeState({
    pendingPointsByTeamId: { "team-1": 2, "team-2": 6 }
  });

  state = reduce(state, "launch", HITTING_AIM).state;
  assert.ok((asState(state).pendingPointsByTeamId["team-1"] ?? 0) > 2);

  const reset = asState(reduce(state, "resetTurn").state);

  assert.equal(reset.phase, "aiming");
  assert.equal(reset.shotIndex, 0);
  assert.deepEqual(reset.shots, []);
  assert.equal(reset.lastShot, null);
  assert.deepEqual(reset.pendingPointsByTeamId, { "team-1": 2, "team-2": 6 });
});

test("ignores unknown actions and foreign state", () => {
  const state = initializeState();

  assert.equal(reduce(state, "explode").didMutate, false);
  assert.equal(reduce({ some: "thing" }, "launch", HITTING_AIM).didMutate, false);
});

test("projects the arena and the live pull to both surfaces", () => {
  const state = reduce(initializeState(), "setAim", { x: -0.5, y: 0.2 }).state;
  const host = hostView(state);
  const display = displayView(state);

  assert.equal(host.arena?.id, "arena-1");
  assert.deepEqual(host.aim, { x: -0.5, y: 0.2 });
  assert.deepEqual(display, host);
});

// The whole point of the projection tests elsewhere is answer-safety; a joust
// has no answers, so what gets pinned instead is that the display carries
// exactly the fields the host does — no more — and nothing from runtime state
// that isn't a view field.
test("keeps the display view to the declared fields", () => {
  const state = reduce(initializeState(), "launch", HITTING_AIM).state;
  const display = displayView(state);

  assert.deepEqual(
    Object.keys(display).sort(),
    [
      "activeTurnTeamId",
      "aim",
      "arena",
      "lastShot",
      "minigame",
      "pendingPointsByTeamId",
      "phase",
      "shotIndex",
      "shots",
      "shotsPerTurn"
    ]
  );
  assert.equal("turnStartPoints" in display, false);
});

test("projects a missing arena as null once content drops it", () => {
  const state = initializeState();
  const synced = joustRuntimePlugin.syncContent?.({
    state,
    rules: null,
    content: { prompts: [arenaFixture(9)] }
  });

  assert.ok(synced !== undefined);
  assert.equal(asState(synced).arenaId, null);
  assert.equal(hostView(synced).arena, null);
});

test("adopts pending points pushed in from the room", () => {
  const synced = joustRuntimePlugin.syncPendingPoints?.({
    state: initializeState(),
    pendingPointsByTeamId: { "team-1": 9 }
  });

  assert.ok(synced !== undefined);
  assert.deepEqual(asState(synced).pendingPointsByTeamId, { "team-1": 9 });
});

test("parses a content file strictly and names a bad arena", () => {
  const parsed = parseJoustContentFile(JSON.stringify(contentFixture), "joust.json");

  assert.equal(parsed.prompts.length, 3);
  assert.throws(
    () =>
      parseJoustContentFile(
        JSON.stringify({ prompts: [{ id: "x", name: "X", targetX: 10, obstacles: [] }] }),
        "joust.json"
      ),
    /Invalid joust content/
  );
});
