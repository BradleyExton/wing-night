import assert from "node:assert/strict";
import test from "node:test";
import type { MountInputSample, MountMinigameHostView, MountPile, Player, Team } from "@wingnight/shared";
import { MOUNT_GOOSE_BOT_SAMPLES, MOUNT_WORLD, createMountPile } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { isMountRoundMemory, isMountRuntimeState } from "./guards/index.js";
import { isMountRules, resolveMountRules } from "./rules/index.js";
import { resolveMountPoints } from "./scoring/index.js";
import { DEFAULT_MOUNT_RULES, type MountRuntimeState } from "./types/index.js";
import { mountRuntimePlugin } from "./index.js";

const PLAYERS: Player[] = [
  { id: "p1", name: "Alex" },
  { id: "p2", name: "Caitlin" },
  { id: "p3", name: "Dan" },
  { id: "p4", name: "Rosie" },
  { id: "p5", name: "Darren" }
];

const TEAMS: Team[] = [
  { id: "team-a", name: "Team A", playerIds: ["p1", "p2", "p3"], totalScore: 0, genre: "metal" },
  { id: "team-b", name: "Team B", playerIds: ["p4", "p5"], totalScore: 0 }
];

const RULES = { climbSeconds: 30, secondsPerHen: 3, pileSeed: 20261002 };
const POINTS_MAX = 15;
const BATCH_MS = 70;

const initialize = (
  options: {
    activeRoundTeamId?: string;
    roundMemory?: SerializableValue | null;
    pendingPointsByTeamId?: Record<string, number>;
    rules?: SerializableValue | null;
  } = {}
): SerializableValue => {
  const state = mountRuntimePlugin.initialize({
    teamIds: ["team-a", "team-b"],
    players: PLAYERS,
    teams: TEAMS,
    activeRoundTeamId: options.activeRoundTeamId ?? "team-a",
    pointsMax: POINTS_MAX,
    pendingPointsByTeamId: options.pendingPointsByTeamId ?? { "team-a": 0, "team-b": 0 },
    rules: options.rules === undefined ? RULES : options.rules,
    content: null,
    roundMemory: options.roundMemory ?? null
  });

  assert.ok(state !== null);

  return state;
};

const reduce = (
  state: SerializableValue,
  actionType: string,
  actionPayload: SerializableValue = {}
): { state: SerializableValue; didMutate: boolean } => {
  return mountRuntimePlugin.reduceAction({
    state,
    envelope: { actionType, actionPayload, receivedAtMs: 1000 },
    pointsMax: POINTS_MAX,
    rules: RULES,
    content: null
  });
};

const runtimeState = (state: SerializableValue): MountRuntimeState => {
  assert.ok(isMountRuntimeState(state));

  return state;
};

const hostView = (state: SerializableValue): MountMinigameHostView => {
  const view = mountRuntimePlugin.selectHostView({ state, rules: RULES, content: null });

  assert.ok(view !== null && view.minigame === "MOUNT");

  return view;
};

const roundMemoryOf = (state: SerializableValue): SerializableValue | null => {
  return mountRuntimePlugin.selectRoundMemory?.({ state, rules: RULES, content: null }) ?? null;
};

const memoryPile = (state: SerializableValue): MountPile => {
  const memory = roundMemoryOf(state);

  assert.ok(isMountRoundMemory(memory));

  return memory.pile;
};

// The tablet's flush: every sample logged inside one 70 ms window goes in one `limb` action
// (spec §0.5), so the wire carries a handful of actions a second, not sixty.
const toBatches = (samples: readonly MountInputSample[]): MountInputSample[][] => {
  const batches = new Map<number, MountInputSample[]>();

  for (const sample of samples) {
    const window = Math.floor((sample.tick * 1000) / MOUNT_WORLD.tickHz / BATCH_MS);
    batches.set(window, [...(batches.get(window) ?? []), { ...sample }]);
  }

  return [...batches.values()];
};

const sendSamples = (state: SerializableValue, samples: readonly MountInputSample[]): SerializableValue => {
  return toBatches(samples).reduce((next, batch) => {
    const result = reduce(next, "limb", { samples: batch });

    assert.equal(result.didMutate, true);

    return result.state;
  }, state);
};

const climbGooseBot = (state: SerializableValue): SerializableValue => {
  return reduce(sendSamples(state, MOUNT_GOOSE_BOT_SAMPLES), "endClimb").state;
};

// A hen nobody touches: the tablet never logged a sample, so the end has to name the climb.
const standStill = (state: SerializableValue): SerializableValue => {
  const result = reduce(state, "endClimb", { climbIndex: runtimeState(state).climbIndex });

  assert.equal(result.didMutate, true);

  return result.state;
};

const ticksFor = (seconds: number): number => seconds * MOUNT_WORLD.tickHz;

test("does deal one climb per seated player in roster order when the turn opens on a bare pile", () => {
  const state = runtimeState(initialize());

  assert.deepEqual(
    state.climbs.map((climb) => climb.player?.name),
    ["Alex", "Caitlin", "Dan"]
  );
  assert.equal(state.climbsPerTurn, 3);
  assert.equal(state.climbIndex, 0);
  assert.deepEqual(state.pile, createMountPile(RULES.pileSeed));
  assert.equal(state.climbs[0]?.climbTicks, ticksFor(RULES.climbSeconds));
  assert.deepEqual(
    state.climbs.slice(1).map((climb) => climb.climbTicks),
    [null, null]
  );
  assert.equal(state.climbs[0]?.player?.genre, "metal");
});

test("does give a team with nobody seated one climb with the house hen when its roster is empty", () => {
  const state = runtimeState(
    mountRuntimePlugin.initialize({
      teamIds: ["team-x"],
      players: PLAYERS,
      teams: [{ id: "team-x", name: "Team X", playerIds: [], totalScore: 0 }],
      activeRoundTeamId: "team-x",
      pointsMax: POINTS_MAX,
      pendingPointsByTeamId: { "team-x": 0 },
      rules: RULES,
      content: null
    }) ?? null
  );

  assert.equal(state.climbsPerTurn, 1);
  assert.equal(state.climbs[0]?.player, null);
});

test("does mount and bank a full share when the goose bot's samples arrive in 70 ms batches", () => {
  const climbed = climbGooseBot(initialize());
  const state = runtimeState(climbed);
  const first = state.climbs[0];

  assert.equal(first?.status, "done");
  assert.equal(first?.result?.outcome, "mounted");
  assert.equal(first?.result?.share, 1);
  assert.deepEqual(first?.inputs, []);
  assert.equal(state.pile.hens.length, 1);
  assert.equal(state.pile.hens[0]?.playerId, "p1");
  assert.equal(state.pile.hens[0]?.mounted, true);
  assert.equal(state.pile.highLine.playerId, "p1");
  assert.ok(state.pile.highLine.height > createMountPile(RULES.pileSeed).highLine.height);
  // One of three climbs mounted: a third of 15.
  assert.equal(state.pendingPointsByTeamId["team-a"], 5);
  assert.equal(state.climbIndex, 1);
  assert.equal(state.climbs[1]?.climbTicks, ticksFor(RULES.climbSeconds + RULES.secondsPerHen));
  assert.equal(hostView(climbed).pointsSoFar, 5);
  assert.equal(hostView(climbed).shareBanked, 1);
});

test("does mark the climb running when its first batch of samples lands", () => {
  const first = MOUNT_GOOSE_BOT_SAMPLES.slice(0, 2).map((sample) => ({ ...sample }));
  const result = reduce(initialize(), "limb", { samples: first });

  assert.equal(result.didMutate, true);
  assert.equal(runtimeState(result.state).climbs[0]?.status, "running");
  assert.deepEqual(runtimeState(result.state).climbs[0]?.inputs, first);
  assert.equal(hostView(result.state).phase, "running");
});

test("does time out with share 0 and still join the pile when nobody touches the hen", () => {
  const state = runtimeState(standStill(initialize()));
  const first = state.climbs[0];
  const barePile = createMountPile(RULES.pileSeed);

  assert.equal(first?.result?.outcome, "timeout");
  assert.equal(first?.result?.share, 0);
  assert.equal(first?.result?.endTick, ticksFor(RULES.climbSeconds));
  assert.equal(state.pile.hens.length, 1);
  assert.equal(state.pile.hens[0]?.mounted, false);
  assert.equal(state.pile.hens[0]?.playerId, "p1");
  assert.deepEqual(state.pile.highLine, barePile.highLine);
  assert.equal(state.pendingPointsByTeamId["team-a"], 0);
});

test("does bank nothing and add no hen when the climb is skipped", () => {
  const result = reduce(initialize(), "skipClimb");
  const state = runtimeState(result.state);

  assert.equal(result.didMutate, true);
  assert.equal(state.climbs[0]?.skipped, true);
  assert.equal(state.climbs[0]?.status, "done");
  assert.equal(state.climbs[0]?.result, null);
  assert.equal(state.pile.hens.length, 0);
  assert.equal(state.climbIndex, 1);
  // No hen joined, so the next climb's clock is the bare pile's.
  assert.equal(state.climbs[1]?.climbTicks, ticksFor(RULES.climbSeconds));
  assert.equal(state.pendingPointsByTeamId["team-a"], 0);
});

test("does restore the pile and hand back exactly the turn's points when the turn is reset", () => {
  const opened = initialize({ pendingPointsByTeamId: { "team-a": 7, "team-b": 4 } });
  const played = standStill(climbGooseBot(opened));

  assert.equal(runtimeState(played).pile.hens.length, 2);
  assert.equal(runtimeState(played).pendingPointsByTeamId["team-a"], 12);

  const result = reduce(played, "resetTurn");
  const state = runtimeState(result.state);

  assert.equal(result.didMutate, true);
  assert.deepEqual(state.pile, runtimeState(opened).pile);
  assert.deepEqual(state.pendingPointsByTeamId, { "team-a": 7, "team-b": 4 });
  assert.equal(state.climbIndex, 0);
  assert.deepEqual(
    state.climbs.map((climb) => [climb.player?.playerId, climb.status, climb.result, climb.climbTicks]),
    [
      ["p1", "ready", null, ticksFor(RULES.climbSeconds)],
      ["p2", "ready", null, null],
      ["p3", "ready", null, null]
    ]
  );
  assert.deepEqual(memoryPile(result.state), runtimeState(opened).pile);
});

test("does start team B on the pile team A left when the round memory is handed on", () => {
  const turnA = reduce(standStill(climbGooseBot(initialize())), "skipClimb").state;
  const pileA = memoryPile(turnA);

  assert.equal(pileA.hens.length, 2);

  const turnB = runtimeState(initialize({ activeRoundTeamId: "team-b", roundMemory: roundMemoryOf(turnA) }));

  assert.deepEqual(turnB.pile, pileA);
  assert.deepEqual(turnB.pileAtTurnStart, pileA);
  assert.equal(turnB.pile.highLine.playerId, "p1");
  assert.deepEqual(
    turnB.climbs.map((climb) => climb.player?.name),
    ["Rosie", "Darren"]
  );
  // Team A's climbers are on the pile, so team B's views can still draw their heads.
  assert.deepEqual(Object.keys(turnB.figures).sort(), ["p1", "p2", "p4", "p5"]);
  assert.equal(turnB.figures.p1?.teamId, "team-a");
});

test("does give team B a clock longer by secondsPerHen for every hen team A added", () => {
  const turnAOpened = runtimeState(initialize());
  const turnA = standStill(climbGooseBot(initialize()));
  const hensAdded = memoryPile(turnA).hens.length;
  const turnB = runtimeState(initialize({ activeRoundTeamId: "team-b", roundMemory: roundMemoryOf(turnA) }));

  assert.equal(hensAdded, 2);
  assert.equal(
    (turnB.climbs[0]?.climbTicks ?? 0) - (turnAOpened.climbs[0]?.climbTicks ?? 0),
    ticksFor(RULES.secondsPerHen * hensAdded)
  );
  assert.equal(hostView(turnB).climbs[0]?.climbTicks, ticksFor(RULES.climbSeconds + RULES.secondsPerHen * 2));
});

test("does start on the bare goose when the round memory is another game's or malformed", () => {
  const bare = createMountPile(RULES.pileSeed);

  const memories: SerializableValue[] = [{ bestTurn: null }, { pile: { seed: 1 } }, 5, null];

  for (const roundMemory of memories) {
    assert.deepEqual(runtimeState(initialize({ roundMemory })).pile, bare);
  }
});

test("does finish the turn with its points when every climb is behind it", () => {
  const finished = reduce(standStill(climbGooseBot(initialize())), "skipClimb").state;
  const view = hostView(finished);

  assert.equal(view.phase, "finished");
  assert.equal(view.points, 5);
  assert.equal(view.climbIndex, 3);
  assert.equal(reduce(finished, "skipClimb").didMutate, false);
  assert.equal(reduce(finished, "endClimb", { climbIndex: 3 }).didMutate, false);
  assert.equal(
    reduce(finished, "limb", { samples: [{ tick: 0, limb: "beak", kind: "grab-start", x: 0, y: 0 }] }).didMutate,
    false
  );
});

test("does carry no field on the display view that the host view keeps to itself", () => {
  const state = sendSamples(climbGooseBot(initialize()), MOUNT_GOOSE_BOT_SAMPLES.slice(0, 3));
  const host = mountRuntimePlugin.selectHostView({ state, rules: RULES, content: null });
  const display = mountRuntimePlugin.selectDisplayView({ state, rules: RULES, content: null });

  assert.ok(host !== null && display !== null);
  // Nothing about a climb is secret (spec §0.5): the two views are the same projection, so the
  // display has every field the host has and nothing more.
  assert.deepEqual(Object.keys(display).sort(), Object.keys(host).sort());
  assert.deepEqual(display, host);
});

test("does refuse an action stamped for a team whose turn it is not", () => {
  const state = initialize();
  const samples = [{ tick: 0, limb: "beak", kind: "grab-start", x: -79, y: -51 }];

  assert.equal(reduce(state, "limb", { samples, teamId: "team-b" }).didMutate, false);
  assert.equal(reduce(state, "endClimb", { teamId: "team-b", climbIndex: 0 }).didMutate, false);
  assert.equal(reduce(state, "skipClimb", { teamId: "team-b" }).didMutate, false);
  assert.equal(reduce(state, "limb", { samples, teamId: "team-a", climbIndex: 0 }).didMutate, true);
});

test("does refuse a straggler when it names a climb that has already been refereed", () => {
  const afterFirst = standStill(initialize());
  const samples = [{ tick: 0, limb: "beak", kind: "grab-start", x: -79, y: -51 }];

  assert.equal(reduce(afterFirst, "limb", { samples, climbIndex: 0 }).didMutate, false);
  assert.equal(reduce(afterFirst, "endClimb", { climbIndex: 0 }).didMutate, false);
});

test("does refuse an unstamped end when the climb in hand has no log", () => {
  // The previous climb's end delivered twice must not referee the next player's untouched climb.
  const afterFirst = reduce(sendSamples(initialize(), MOUNT_GOOSE_BOT_SAMPLES), "endClimb").state;

  assert.equal(reduce(afterFirst, "endClimb").didMutate, false);
  assert.equal(runtimeState(afterFirst).pile.hens.length, 1);
});

test("does refuse a whole batch when any sample in it is malformed", () => {
  const state = initialize();
  const good = { tick: 0, limb: "beak", kind: "grab-start", x: -79, y: -51 };
  const malformed: SerializableValue[] = [
    { samples: [] },
    { samples: [good, { ...good, tick: 1, limb: "tail" }] },
    { samples: [good, { ...good, tick: 1, kind: "poke" }] },
    { samples: [good, { ...good, tick: 1, x: 0.1 }] },
    { samples: [good, { ...good, tick: 1, y: Number.NaN }] },
    { samples: [good, { ...good, tick: -1 }] },
    { samples: [good, { ...good, tick: 1.5 }] },
    { samples: [{ ...good, tick: 4 }, { ...good, tick: 3 }] },
    { samples: [good], climbIndex: "0" },
    { samples: [good], teamId: 7 },
    { sample: good },
    null
  ];

  for (const payload of malformed) {
    assert.equal(reduce(state, "limb", payload).didMutate, false, JSON.stringify(payload));
  }
});

test("does refuse a batch when it starts before the last tick already logged", () => {
  const logged = reduce(initialize(), "limb", {
    samples: [{ tick: 10, limb: "beak", kind: "grab-start", x: -79, y: -51 }]
  }).state;

  assert.equal(
    reduce(logged, "limb", { samples: [{ tick: 9, limb: "beak", kind: "release", x: -79, y: -51 }] }).didMutate,
    false
  );
  // Two fingers can share a tick, so the same tick is a follow-on, not a step back.
  assert.equal(
    reduce(logged, "limb", { samples: [{ tick: 10, limb: "wing", kind: "grab-start", x: -80, y: -40 }] }).didMutate,
    true
  );
});

test("does leave the state alone when the action is unknown or the state is not a climb", () => {
  assert.equal(reduce(initialize(), "flap").didMutate, false);
  assert.equal(reduce({ some: "other game" }, "skipClimb").didMutate, false);
  assert.equal(mountRuntimePlugin.selectHostView({ state: { some: 1 }, rules: RULES, content: null }), null);
});

test("does not write through to the state it was handed when it reduces", () => {
  const state = initialize();
  const before = JSON.stringify(state);

  climbGooseBot(state);
  reduce(state, "skipClimb");
  reduce(state, "resetTurn");

  assert.equal(JSON.stringify(state), before);
});

test("does round the turn's points once over the shares when climbs bank parts of a share", () => {
  assert.equal(resolveMountPoints(1, 3, 15), 5);
  assert.equal(resolveMountPoints(1.4, 3, 15), 7);
  assert.equal(resolveMountPoints(0.1, 3, 15), 1);
  assert.equal(resolveMountPoints(5, 3, 15), 15);
  assert.equal(resolveMountPoints(0, 0, 15), 0);
});

test("does accept positive-integer rules and default the rest when the rules are read", () => {
  assert.equal(isMountRules({}), true);
  assert.equal(isMountRules(RULES), true);
  assert.equal(isMountRules({ climbSeconds: 0 }), false);
  assert.equal(isMountRules({ secondsPerHen: 1.5 }), false);
  assert.equal(isMountRules({ pileSeed: -3 }), false);
  assert.equal(isMountRules(null), false);
  assert.deepEqual(resolveMountRules(null), DEFAULT_MOUNT_RULES);
  assert.deepEqual(resolveMountRules({ climbSeconds: 45, secondsPerHen: "x" }), {
    climbSeconds: 45,
    secondsPerHen: DEFAULT_MOUNT_RULES.secondsPerHen,
    pileSeed: DEFAULT_MOUNT_RULES.pileSeed
  });
  assert.equal(runtimeState(initialize({ rules: { climbSeconds: 45 } })).climbs[0]?.climbTicks, ticksFor(45));
});

test("does keep the points in step when the room syncs pending points", () => {
  const state = mountRuntimePlugin.syncPendingPoints?.({
    state: initialize(),
    pendingPointsByTeamId: { "team-a": 3, "team-b": 9 }
  });

  assert.deepEqual(runtimeState(state ?? null).pendingPointsByTeamId, { "team-a": 3, "team-b": 9 });
});
