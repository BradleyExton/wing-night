import assert from "node:assert/strict";
import test from "node:test";

import type {
  JoustContentFile,
  JoustMinigameDisplayView,
  JoustMinigameHostView,
  Player,
  Team
} from "@wingnight/shared";
import { JOUST_STANDARD_SHOOTER_PROFILE } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { joustMinigameId, joustRuntimePlugin } from "./index.js";
import { parseJoustContentFile } from "./content/index.js";
import { isJoustRules, resolveJoustRules } from "./rules/index.js";
import {
  DEFAULT_JOUST_SHOTS_PER_PLAYER,
  JOUST_RACK_CLEARED_BONUS,
  type JoustRuntimeState
} from "./types/index.js";

// Nine spots on the sand and five on the shelf: fourteen, which is the floor
// `JOUST_MIN_LANE_CAPACITY` holds an authored lane to. A narrower shelf seats eleven, the content
// adapter drops the lane on the way in, and every test here loses its arena.
const PERCHES = [
  { x: 54, y: 78, width: 102 },
  { x: 105, y: 50, width: 49 }
];

const arenaFixture = (index: number): JoustContentFile["prompts"][number] => ({
  id: `arena-${index}`,
  name: `Arena ${index}`,
  perches: PERCHES.map((perch) => ({ ...perch })),
  obstacles: []
});

const contentFixture: JoustContentFile = {
  prompts: Array.from({ length: 3 }, (_unused, index) => arenaFixture(index + 1))
};

const PLAYERS: Player[] = [
  { id: "p1", name: "Alex" },
  { id: "p2", name: "Caitlin", avatarSrc: "avatars/caitlin.png" },
  { id: "p3", name: "Dan" },
  { id: "p4", name: "Rosie" },
  { id: "p5", name: "Darren" },
  { id: "p6", name: "Sarah" }
];

const TEAMS: Team[] = [
  { id: "team-1", name: "Team One", playerIds: ["p1", "p2", "p3"], totalScore: 0 },
  { id: "team-2", name: "Team Two", playerIds: ["p4", "p5", "p6"], totalScore: 0 }
];

// Found by sweeping the aim space against the fixture's three-player rack, which stands two on
// the sand and one up on the shelf: a flat shot ploughs the sand row and leaves the shelf alone,
// a shallow lob clips the one up top, a twitch never arrives — and a full-power shot just above
// flat drives the sand row into the tower's legs and brings the whole thing down, which is the
// ONLY way one shot takes both levels.
const SWEEPING_AIM = { x: -1, y: 0 };
const SINGLE_AIM = { x: -0.9, y: 0.6 };
const MISSING_AIM = { x: -0.2, y: 0 };
const TIMBER_AIM = { x: -0.95, y: 0.15 };

type InitializeOverrides = Partial<{
  teamIds: string[];
  players: Player[];
  teams: Team[];
  activeRoundTeamId: string | null;
  pointsMax: number;
  pendingPointsByTeamId: Record<string, number>;
  rules: SerializableValue | null;
  content: SerializableValue | null;
}>;

const initialize = (overrides: InitializeOverrides = {}): SerializableValue | null => {
  return joustRuntimePlugin.initialize({
    teamIds: overrides.teamIds ?? ["team-1", "team-2"],
    players: overrides.players ?? PLAYERS,
    teams: overrides.teams ?? TEAMS,
    activeRoundTeamId:
      overrides.activeRoundTeamId === undefined ? "team-1" : overrides.activeRoundTeamId,
    pointsMax: overrides.pointsMax ?? 15,
    pendingPointsByTeamId: overrides.pendingPointsByTeamId ?? {},
    rules: overrides.rules === undefined ? { shotsPerPlayer: 1 } : overrides.rules,
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
    rules: { shotsPerPlayer: 1 },
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

test("starts the active team aiming on the lane its turn order slot picks", () => {
  const first = initializeState({ activeRoundTeamId: "team-1" });
  const second = initializeState({ activeRoundTeamId: "team-2" });

  assert.equal(first.phase, "aiming");
  assert.equal(first.activeTurnTeamId, "team-1");
  assert.equal(first.arenaId, "arena-1");
  assert.equal(second.arenaId, "arena-2");
  assert.equal(first.shotsPerTurn, 3);
  assert.deepEqual(first.aim, { x: 0, y: 0 });
});

test("racks up everyone who is not on the shooting team and benches the rest", () => {
  const state = initializeState({ activeRoundTeamId: "team-1" });

  assert.deepEqual(
    state.lineup.map((figure) => figure.playerId),
    ["p4", "p5", "p6"]
  );
  assert.deepEqual(
    state.teammates.map((figure) => figure.playerId),
    ["p1", "p2", "p3"]
  );
  assert.deepEqual(state.downPlayerIds, []);
  assert.deepEqual(state.collapsedPerchIndices, []);
  assert.equal(state.previousShotGhost, null);
});

test("carries the roster's pack-relative head through to the figure", () => {
  const state = initializeState({ activeRoundTeamId: "team-2" });
  const caitlin = state.lineup.find((figure) => figure.playerId === "p2");

  assert.equal(caitlin?.avatarSrc, "avatars/caitlin.png");
  assert.equal(state.lineup.find((figure) => figure.playerId === "p1")?.avatarSrc, null);
});

test("racks up a player who is on no team at all", () => {
  const state = initializeState({
    players: [...PLAYERS, { id: "p7", name: "Stray" }],
    activeRoundTeamId: "team-1"
  });

  assert.ok(state.lineup.some((figure) => figure.playerId === "p7"));
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

// Everybody on the team shoots, so the turn is as long as the team is — not a number from config.
test("gives the shooting team one shot per player", () => {
  assert.equal(initializeState({ activeRoundTeamId: "team-1" }).shotsPerTurn, 3);
  assert.equal(
    initializeState({
      teams: [
        { id: "team-1", name: "Team One", playerIds: ["p1", "p2"], totalScore: 0 },
        { id: "team-2", name: "Team Two", playerIds: ["p3", "p4", "p5", "p6"], totalScore: 0 }
      ],
      activeRoundTeamId: "team-2"
    }).shotsPerTurn,
    4,
    "a bigger team gets more shots, and faces a smaller rack for it"
  );
});

test("falls back to one shot each when the rules are missing or malformed", () => {
  assert.equal(initializeState({ rules: null }).shotsPerTurn, 3 * DEFAULT_JOUST_SHOTS_PER_PLAYER);
  assert.equal(
    initializeState({ rules: { shotsPerPlayer: 0 } }).shotsPerTurn,
    3 * DEFAULT_JOUST_SHOTS_PER_PLAYER
  );
  assert.equal(initializeState({ rules: { shotsPerPlayer: 2 } }).shotsPerTurn, 6);
  assert.deepEqual(resolveJoustRules({ shotsPerPlayer: 5 }), { shotsPerPlayer: 5 });
});

test("validates the rules block the way the content loader expects", () => {
  assert.equal(isJoustRules({}), true);
  assert.equal(isJoustRules({ shotsPerPlayer: 2 }), true);
  assert.equal(isJoustRules({ shotsPerPlayer: -1 }), false);
  assert.equal(isJoustRules([]), false);
});

// Passing the tablet round the table IS the turn structure, so the projection has to say whose
// go it is, in roster order, and stop naming anybody once the turn is spent.
test("walks the band down the shooting team, one player at a time", () => {
  let state: SerializableValue = initializeState();

  assert.equal(hostView(state).activeShooterPlayerId, "p1");

  state = reduce(state, "launch", MISSING_AIM).state;
  state = reduce(state, "nextShot").state;
  assert.equal(hostView(state).activeShooterPlayerId, "p2");

  state = reduce(state, "launch", MISSING_AIM).state;
  state = reduce(state, "nextShot").state;
  assert.equal(hostView(state).activeShooterPlayerId, "p3");

  state = reduce(state, "launch", MISSING_AIM).state;
  state = reduce(state, "nextShot").state;
  assert.equal(asState(state).phase, "done");
  assert.equal(hostView(state).activeShooterPlayerId, null);
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

test("resolves a launch into a replayable track and banks what the felled were worth", () => {
  const launched = reduce(initializeState(), "launch", SINGLE_AIM);
  const state = asState(launched.state);

  assert.equal(launched.didMutate, true);
  assert.equal(state.phase, "resolved");
  assert.equal(state.shots.length, 1);
  assert.ok(state.lastShot !== null);
  assert.ok(state.lastShot.run.keyframes.length > 1);
  assert.equal(state.lastShot.toppledPlayerIds.length, 1);
  assert.equal(state.lastShot.isRackCleared, false);
  assert.equal(state.pendingPointsByTeamId["team-1"], 2, "the one felled was up on the shelf");
  assert.deepEqual(state.aim, { x: 0, y: 0 });
});

// The fixture's shelf is 28 units up: worth two a head, where the sand is worth one.
test("pays a felled player what their perch is worth", () => {
  const state = asState(reduce(initializeState(), "launch", SINGLE_AIM).state);
  const shelfPlayer = state.lastShot?.toppledPlayerIds[0];

  assert.ok(shelfPlayer !== undefined);
  assert.equal(state.lastShot?.points, 2, "one player on the shelf pays two");
  assert.equal(state.pendingPointsByTeamId["team-1"], 2);
});

test("brings a tower down, drops everyone on it and keeps it down for the rest of the turn", () => {
  const felled = asState(reduce(initializeState(), "launch", TIMBER_AIM).state);

  assert.deepEqual(felled.lastShot?.collapsedPerchIndices, [1]);
  assert.deepEqual(felled.collapsedPerchIndices, [1]);
  assert.deepEqual(felled.lastShot?.rubblePerchIndices, [], "it stood when the shot was fired");
  assert.ok((felled.lastShot?.run.collapses.length ?? 0) > 0);
  assert.equal(felled.lastShot?.isRackCleared, true, "two on the sand and one off the shelf");
  // Two sand players at one each, the shelf player at two, and the cleared-rack bonus.
  assert.equal(felled.lastShot?.points, 1 + 1 + 2 + JOUST_RACK_CLEARED_BONUS);

  // The next shot, were there one, is simulated against rubble.
  const next = asState(
    reduce(
      { ...felled, downPlayerIds: [felled.downPlayerIds[0] ?? ""], phase: "aiming", lastShot: null },
      "launch",
      MISSING_AIM
    ).state
  );

  assert.deepEqual(next.lastShot?.rubblePerchIndices, [1]);
  assert.deepEqual(next.lastShot?.collapsedPerchIndices, []);
});

test("keeps the last shot's arc as a ghost for the next teammate, and drops it with the turn", () => {
  const resolved = reduce(initializeState(), "launch", SINGLE_AIM).state;
  const next = asState(reduce(resolved, "nextShot").state);

  assert.equal(next.previousShotGhost?.shotNumber, 1);
  assert.deepEqual(next.previousShotGhost?.aim, asState(resolved).lastShot?.aim);
  assert.ok((next.previousShotGhost?.path.length ?? 0) > 2, "the arc has more than a start");
  assert.equal(next.lastShot, null);

  // A skipped shot flew nothing: the ghost of the last real one stays.
  const skipped = asState(reduce(next, "skipShot").state);

  assert.equal(skipped.previousShotGhost?.shotNumber, 1);

  const reset = asState(reduce(skipped, "resetTurn").state);

  assert.equal(reset.previousShotGhost, null);
  assert.deepEqual(reset.collapsedPerchIndices, []);
});

// The lane the rack is cleared on is the ordinary two-level fixture, because a perch-free lane is
// no longer authorable: bare sand seats eleven and `JOUST_MIN_LANE_CAPACITY` is fourteen, so the
// content adapter drops a shelf-less lane before the runtime ever sees it. Clearing a real lane
// therefore means bringing the tower down, which is what TIMBER_AIM does.
test("does pay the bonus onto the team's pending points when a shot leaves nobody standing", () => {
  const state = asState(reduce(initializeState(), "launch", TIMBER_AIM).state);

  assert.equal(state.lastShot?.isRackCleared, true);
  assert.equal(state.downPlayerIds.length, 3);
  assert.equal(state.pendingPointsByTeamId["team-1"], 1 + 1 + 2 + JOUST_RACK_CLEARED_BONUS);
});

test("names the track's rack so a topple can be read back to a player", () => {
  const state = asState(reduce(initializeState(), "launch", TIMBER_AIM).state);
  const shot = state.lastShot;

  assert.ok(shot !== null);
  assert.deepEqual(shot.pinPlayerIds, ["p4", "p5", "p6"]);
  for (const playerId of shot.toppledPlayerIds) {
    assert.ok(shot.pinPlayerIds.includes(playerId));
  }
});

// What the shelf is FOR, and what the old bare-sand fixture existed to work around: the ball
// itself only ever reaches one level. Everybody the sand row loses is worth one; the bird up top
// is untouched and the tower is still standing, so the rack is not cleared.
test("does leave the shelf standing when a shot only ploughs the sand", () => {
  const state = asState(reduce(initializeState(), "launch", SWEEPING_AIM).state);
  const shot = state.lastShot;

  assert.ok(shot !== null);
  assert.deepEqual(shot.toppledPlayerIds, ["p4", "p5"], "both on the sand, neither on the shelf");
  assert.deepEqual(shot.collapsedPerchIndices, [], "the tower took no part in it");
  assert.equal(shot.isRackCleared, false);
  assert.equal(shot.points, 2, "two off the sand at one each");
  assert.equal(state.downPlayerIds.includes("p6"), false, "the bird up on the shelf is still up");
});

test("leaves a felled player out of the next shot's rack", () => {
  const first = reduce(initializeState(), "launch", SINGLE_AIM).state;
  const downAfterFirst = asState(first).downPlayerIds;
  const second = asState(reduce(reduce(first, "nextShot").state, "launch", SWEEPING_AIM).state);

  assert.equal(downAfterFirst.length, 1);
  assert.ok(second.lastShot !== null);
  assert.equal(second.lastShot.pinPlayerIds.length, 2);
  assert.equal(second.lastShot.pinPlayerIds.includes(downAfterFirst[0] ?? ""), false);
});

test("scores nothing for a shot that never reaches the rack", () => {
  const state = asState(reduce(initializeState(), "launch", MISSING_AIM).state);

  assert.equal(state.phase, "resolved");
  assert.deepEqual(state.lastShot?.toppledPlayerIds, []);
  assert.equal(state.shots[0]?.points, 0);
  assert.equal(state.pendingPointsByTeamId["team-1"], 0);
});

test("refuses to spend a shot on a barely drawn band", () => {
  const twitch = reduce(initializeState(), "launch", { x: -0.05, y: 0.02 });

  assert.equal(twitch.didMutate, false);
});

test("produces the same track for the same shot on a replayed reducer", () => {
  const first = asState(reduce(initializeState(), "launch", SINGLE_AIM).state);
  const second = asState(reduce(initializeState(), "launch", SINGLE_AIM).state);

  assert.equal(JSON.stringify(first.lastShot), JSON.stringify(second.lastShot));
});

test("only launches while aiming", () => {
  const resolved = reduce(initializeState(), "launch", SINGLE_AIM).state;

  assert.equal(reduce(resolved, "launch", SINGLE_AIM).didMutate, false);
  assert.equal(reduce(resolved, "setAim", { x: -0.5, y: 0 }).didMutate, false);
});

test("moves to the next shot and drops the replayed track on the way", () => {
  const resolved = reduce(initializeState(), "launch", SINGLE_AIM).state;
  const next = asState(reduce(resolved, "nextShot").state);

  assert.equal(next.phase, "aiming");
  assert.equal(next.shotIndex, 1);
  assert.equal(next.lastShot, null);
  assert.equal(next.shots.length, 1);
});

test("ends the turn early once the rack is empty", () => {
  const swept = reduce(initializeState(), "launch", TIMBER_AIM).state;
  const done = asState(reduce(swept, "nextShot").state);

  assert.equal(done.phase, "done");
  assert.equal(done.shotIndex, 0);
  assert.notEqual(done.lastShot, null);
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
  assert.equal(reduce(state, "launch", SINGLE_AIM).didMutate, false);
  assert.equal(reduce(state, "nextShot").didMutate, false);
});

test("caps the turn at pointsMax", () => {
  let state: SerializableValue = initializeState({
    pointsMax: 4,
    pendingPointsByTeamId: { "team-1": 3 }
  });

  state = reduce(state, "launch", SWEEPING_AIM, { pointsMax: 4 }).state;

  assert.equal(asState(state).pendingPointsByTeamId["team-1"], 4);
});

test("forfeits a shot through the skip escape hatch", () => {
  const skipped = asState(reduce(initializeState(), "skipShot").state);

  assert.equal(skipped.phase, "aiming");
  assert.equal(skipped.shotIndex, 1);
  assert.deepEqual(skipped.shots, [
    {
      shotNumber: 1,
      toppledPlayerIds: [],
      collapsedPerchIndices: [],
      isRackCleared: false,
      points: 0
    }
  ]);
  assert.equal(
    reduce(reduce(initializeState(), "launch", SINGLE_AIM).state, "skipShot").didMutate,
    false
  );
});

test("puts the whole rack back on its feet on a reset", () => {
  let state: SerializableValue = initializeState({
    pendingPointsByTeamId: { "team-1": 2, "team-2": 6 }
  });

  state = reduce(state, "launch", SWEEPING_AIM).state;
  assert.ok((asState(state).pendingPointsByTeamId["team-1"] ?? 0) > 2);

  const reset = asState(reduce(state, "resetTurn").state);

  assert.equal(reset.phase, "aiming");
  assert.equal(reset.shotIndex, 0);
  assert.deepEqual(reset.shots, []);
  assert.deepEqual(reset.downPlayerIds, []);
  assert.equal(reset.lastShot, null);
  assert.deepEqual(reset.pendingPointsByTeamId, { "team-1": 2, "team-2": 6 });
});

test("ignores unknown actions and foreign state", () => {
  const state = initializeState();

  assert.equal(reduce(state, "explode").didMutate, false);
  assert.equal(reduce({ some: "thing" }, "launch", SINGLE_AIM).didMutate, false);
});

test("projects the lane, the rack and the live pull to both surfaces", () => {
  const state = reduce(initializeState(), "setAim", { x: -0.5, y: 0.2 }).state;
  const host = hostView(state);
  const display = displayView(state);

  assert.equal(host.arena?.id, "arena-1");
  assert.deepEqual(host.arena?.perches, PERCHES);
  assert.deepEqual(host.aim, { x: -0.5, y: 0.2 });
  assert.deepEqual(
    host.lineup.map((figure) => figure.name),
    ["Rosie", "Darren", "Sarah"]
  );
  assert.deepEqual(
    host.teammates.map((figure) => figure.name),
    ["Alex", "Caitlin", "Dan"]
  );
  assert.deepEqual(display, host);
});

// The whole point of the projection tests elsewhere is answer-safety; a joust
// has no answers, so what gets pinned instead is that the display carries
// exactly the fields the host does — no more — and nothing from runtime state
// that isn't a view field.
test("keeps the display view to the declared fields", () => {
  const state = reduce(initializeState(), "launch", SINGLE_AIM).state;
  const display = displayView(state);

  assert.deepEqual(
    Object.keys(display).sort(),
    [
      "activeShooterPlayerId",
      "activeTurnTeamId",
      "aim",
      "arena",
      "collapsedPerchIndices",
      "downPlayerIds",
      "lastShot",
      "lineup",
      "minigame",
      "pendingPointsByTeamId",
      "phase",
      "previousShotGhost",
      "selectedShooterId",
      "shooters",
      "shotIndex",
      "shots",
      "shotsPerTurn",
      "teammates"
    ]
  );
  assert.equal("turnStartPoints" in display, false);
  assert.equal("usedShooterIds" in display, false, "the count-down is projected as usesLeft");
});

// ---- The loadout -------------------------------------------------------------------------------

const LOG_PROFILE = { shaftRadius: 3.4, headRadius: 4.8, launchSpeedScale: 0.65, legShare: 0.06 };

const loadoutFixture: JoustContentFile = {
  ...contentFixture,
  shooters: [
    {
      id: "standard",
      name: "The Standard",
      blurb: "House shot.",
      color: { fill: "#f97316", dark: "#b8410a", light: "#fdba74" }
    },
    {
      id: "log",
      name: "The Log",
      blurb: "Heavy.",
      color: { fill: "#8b5a2b", dark: "#4a2c12", light: "#c48b55" },
      usesPerTurn: 1,
      profile: LOG_PROFILE
    }
  ]
};

const loadoutOptions = { content: loadoutFixture };

test("does load the Standard kind alone and name it selected when the pack authors no shooters", () => {
  const state = initializeState();
  const view = hostView(state);

  assert.equal(state.selectedShooterId, "standard");
  assert.deepEqual(state.usedShooterIds, []);
  assert.equal(view.shooters.length, 1);
  assert.equal(view.shooters[0]?.id, "standard");
  assert.equal(view.shooters[0]?.usesLeft, null);
  assert.deepEqual(view.shooters[0]?.profile, JOUST_STANDARD_SHOOTER_PROFILE);
});

test("does project every authored kind with its uses left and its resolved profile", () => {
  const view = joustRuntimePlugin.selectDisplayView({
    state: initializeState({ content: loadoutFixture }),
    rules: null,
    content: loadoutFixture
  });

  assert.ok(view !== null && view.minigame === "JOUST");
  assert.deepEqual(
    view.shooters.map((kind) => [kind.id, kind.usesLeft]),
    [
      ["standard", null],
      ["log", 1]
    ]
  );
  assert.equal(view.shooters[1]?.profile.shaftRadius, 3.4);
  assert.equal(
    view.shooters[1]?.profile.massShare,
    JOUST_STANDARD_SHOOTER_PROFILE.massShare,
    "a lever the kind leaves out is the Standard's"
  );
  assert.equal(view.selectedShooterId, "standard");
});

test("does put a picked kind on the band while aiming", () => {
  const state = initializeState({ content: loadoutFixture });
  const picked = reduce(state, "pickShooter", { shooterId: "log" }, loadoutOptions);

  assert.equal(picked.didMutate, true);
  assert.equal(asState(picked.state).selectedShooterId, "log");
});

test("does ignore a pick for a kind the pack does not carry, a malformed one, or the kind already loaded", () => {
  const state = initializeState({ content: loadoutFixture });

  assert.equal(reduce(state, "pickShooter", { shooterId: "anvil" }, loadoutOptions).didMutate, false);
  assert.equal(reduce(state, "pickShooter", { shooter: "log" }, loadoutOptions).didMutate, false);
  assert.equal(reduce(state, "pickShooter", null, loadoutOptions).didMutate, false);
  assert.equal(
    reduce(state, "pickShooter", { shooterId: "standard" }, loadoutOptions).didMutate,
    false
  );
});

test("does refuse a pick once the shot has flown", () => {
  const resolved = reduce(
    initializeState({ content: loadoutFixture }),
    "launch",
    SINGLE_AIM,
    loadoutOptions
  ).state;

  assert.equal(reduce(resolved, "pickShooter", { shooterId: "log" }, loadoutOptions).didMutate, false);
});

test("does fly the picked kind, record the use and name it on the track", () => {
  const picked = reduce(
    initializeState({ content: loadoutFixture }),
    "pickShooter",
    { shooterId: "log" },
    loadoutOptions
  ).state;
  const launched = asState(reduce(picked, "launch", SINGLE_AIM, loadoutOptions).state);
  const standard = asState(
    reduce(initializeState({ content: loadoutFixture }), "launch", SINGLE_AIM, loadoutOptions).state
  );

  assert.equal(launched.phase, "resolved");
  assert.equal(launched.lastShot?.shooterId, "log");
  assert.deepEqual(launched.usedShooterIds, ["log"]);
  assert.notEqual(
    JSON.stringify(launched.lastShot?.run.keyframes[1]),
    JSON.stringify(standard.lastShot?.run.keyframes[1]),
    "a different kind flies a different track from the same pull"
  );
  assert.equal(standard.lastShot?.shooterId, "standard");
});

test("does count a rationed kind down and refuse it once it is spent", () => {
  let state: SerializableValue = initializeState({ content: loadoutFixture });

  state = reduce(state, "pickShooter", { shooterId: "log" }, loadoutOptions).state;
  state = reduce(state, "launch", MISSING_AIM, loadoutOptions).state;
  state = reduce(state, "nextShot", {}, loadoutOptions).state;

  const view = joustRuntimePlugin.selectHostView({ state, rules: null, content: loadoutFixture });

  assert.ok(view !== null && view.minigame === "JOUST");
  assert.equal(view.shooters.find((kind) => kind.id === "log")?.usesLeft, 0);
  assert.equal(view.selectedShooterId, "standard", "the band reloads with the default kind");
  assert.equal(reduce(state, "pickShooter", { shooterId: "log" }, loadoutOptions).didMutate, false);
});

test("does reset the selection to the standard kind on the next shot", () => {
  let state: SerializableValue = initializeState({ content: loadoutFixture });

  state = reduce(state, "pickShooter", { shooterId: "log" }, loadoutOptions).state;
  state = reduce(state, "launch", MISSING_AIM, loadoutOptions).state;
  state = reduce(state, "nextShot", {}, loadoutOptions).state;

  assert.equal(asState(state).selectedShooterId, "standard");
});

test("does spend nothing on a skipped shot and reload the default kind", () => {
  const picked = reduce(
    initializeState({ content: loadoutFixture }),
    "pickShooter",
    { shooterId: "log" },
    loadoutOptions
  ).state;
  const skipped = asState(reduce(picked, "skipShot", {}, loadoutOptions).state);

  assert.deepEqual(skipped.usedShooterIds, []);
  assert.equal(skipped.selectedShooterId, "standard");
});

test("does hand every kind back on a reset", () => {
  let state: SerializableValue = initializeState({ content: loadoutFixture });

  state = reduce(state, "pickShooter", { shooterId: "log" }, loadoutOptions).state;
  state = reduce(state, "launch", MISSING_AIM, loadoutOptions).state;
  state = reduce(state, "nextShot", {}, loadoutOptions).state;
  state = reduce(state, "pickShooter", { shooterId: "standard" }, loadoutOptions).state;

  const reset = asState(reduce(state, "resetTurn", {}, loadoutOptions).state);

  assert.deepEqual(reset.usedShooterIds, []);
  assert.equal(reset.selectedShooterId, "standard");
});

test("does carry the kind onto the ghost the next teammate aims off", () => {
  let state: SerializableValue = initializeState({ content: loadoutFixture });

  state = reduce(state, "pickShooter", { shooterId: "log" }, loadoutOptions).state;
  state = reduce(state, "launch", SINGLE_AIM, loadoutOptions).state;
  state = reduce(state, "nextShot", {}, loadoutOptions).state;

  assert.equal(asState(state).previousShotGhost?.shooterId, "log");
});

test("does fall back to the default kind when a content reload drops the one on the band", () => {
  const picked = reduce(
    initializeState({ content: loadoutFixture }),
    "pickShooter",
    { shooterId: "log" },
    loadoutOptions
  ).state;
  const synced = joustRuntimePlugin.syncContent?.({
    state: picked,
    rules: null,
    content: contentFixture
  });

  assert.ok(synced !== undefined);
  assert.equal(asState(synced).selectedShooterId, "standard");
  assert.equal(asState(synced).arenaId, "arena-1", "the lane it was on is untouched");
});

test("does default to the first listed kind when nothing in the loadout is unlimited", () => {
  const rationed: JoustContentFile = {
    ...contentFixture,
    shooters: [
      {
        id: "log",
        name: "The Log",
        blurb: "Heavy.",
        color: { fill: "#8b5a2b", dark: "#4a2c12", light: "#c48b55" },
        usesPerTurn: 1
      },
      {
        id: "standard",
        name: "The Standard",
        blurb: "House shot.",
        color: { fill: "#f97316", dark: "#b8410a", light: "#fdba74" },
        usesPerTurn: 2
      }
    ]
  };
  let state: SerializableValue = initializeState({ content: rationed });

  assert.equal(asState(state).selectedShooterId, "log");

  state = reduce(state, "launch", MISSING_AIM, { content: rationed }).state;
  state = reduce(state, "nextShot", {}, { content: rationed }).state;

  assert.equal(asState(state).selectedShooterId, "standard", "the spent first kind is skipped");
});

test("does parse the loadout strictly alongside the lanes", () => {
  const parsed = parseJoustContentFile(JSON.stringify(loadoutFixture), "joust.json");

  assert.deepEqual(
    parsed.shooters.map((kind) => [kind.id, kind.usesPerTurn]),
    [
      ["standard", null],
      ["log", 1]
    ]
  );
  assert.equal(parsed.shooters[1]?.profile.headRadius, 4.8);
  assert.throws(
    () =>
      parseJoustContentFile(
        JSON.stringify({
          ...loadoutFixture,
          shooters: [{ ...loadoutFixture.shooters?.[1], profile: { launchSpeedScale: 9 } }]
        }),
        "joust.json"
      ),
    /Invalid joust content/
  );
  assert.equal(
    parseJoustContentFile(JSON.stringify(contentFixture), "joust.json").shooters[0]?.id,
    "standard",
    "a file with no loadout parses to the Standard kind alone"
  );
});

test("projects a missing lane as null once content drops it", () => {
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

test("parses a content file strictly and names a bad lane", () => {
  const parsed = parseJoustContentFile(JSON.stringify(contentFixture), "joust.json");

  assert.equal(parsed.prompts.length, 3);
  assert.throws(
    () =>
      parseJoustContentFile(
        JSON.stringify({ prompts: [{ id: "x", name: "X", perches: [], obstacles: [] }] }),
        "joust.json"
      ),
    /Invalid joust content/
  );
});
