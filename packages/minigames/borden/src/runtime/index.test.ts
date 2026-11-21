import assert from "node:assert/strict";
import test from "node:test";
import type { BordenFrame, BordenMinigameHostView, BordenMinigameStretch, Player, Team } from "@wingnight/shared";
import {
  BORDEN_WORLD,
  advanceBorden,
  bordenMasher,
  bordenRunner,
  resolveBordenBotInputs,
  resolveBordenCourseTotal,
  resolveBordenHandoffBottles,
  resolveBordenStretch,
  type BordenBot
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { isBordenRuntimeState } from "./guards/index.js";
import { isBordenRules, resolveBordenRules } from "./rules/index.js";
import { resolveBordenPoints } from "./scoring/index.js";
import { BORDEN_PULSE_TICKS, BORDEN_READY_HOLD_MS, DEFAULT_BORDEN_RULES } from "./types/index.js";
import { bordenRuntimePlugin } from "./index.js";

const PLAYERS: Player[] = [
  { id: "p1", name: "Alex" },
  { id: "p2", name: "Caitlin" },
  { id: "p3", name: "Dan" },
  { id: "p4", name: "Erin" },
  { id: "p5", name: "Fin" },
  { id: "p9", name: "Rival" }
];

const TEAMS: Team[] = [
  { id: "team-a", name: "Team A", playerIds: ["p1", "p2", "p3", "p4", "p5"], totalScore: 0 },
  { id: "team-b", name: "Team B", playerIds: ["p9"], totalScore: 0 }
];

const RULES = { stretchesPerTurn: 3, courseSeed: 20261120 };
const POINTS_MAX = 15;
// The room clock when the test's first stretch starts.
const T0 = 1_800_000_000_000;
/** The room clock at a tick of a stretch that started at `startedAtMs`: the first millisecond of it. */
const atTick = (startedAtMs: number, tick: number): number => startedAtMs + Math.ceil((tick * 1000) / 60);

const initialize = (options: { pendingPointsByTeamId?: Record<string, number>; teams?: Team[] } = {}): SerializableValue => {
  const state = bordenRuntimePlugin.initialize({
    teamIds: ["team-a", "team-b"],
    players: PLAYERS,
    teams: options.teams ?? TEAMS,
    activeRoundTeamId: "team-a",
    pointsMax: POINTS_MAX,
    pendingPointsByTeamId: options.pendingPointsByTeamId ?? { "team-a": 0, "team-b": 0 },
    rules: RULES,
    content: null,
    roundMemory: null
  });

  assert.ok(state !== null);

  return state;
};

type Send = { at?: number; actor?: string; payload?: SerializableValue };

const reduce = (state: SerializableValue, actionType: string, { at = T0, actor, payload = {} }: Send = {}) => {
  return bordenRuntimePlugin.reduceAction({
    state,
    envelope:
      actor === undefined
        ? { actionType, actionPayload: payload, receivedAtMs: at }
        : { actionType, actionPayload: payload, receivedAtMs: at, actorPlayerId: actor },
    pointsMax: POINTS_MAX,
    rules: RULES,
    content: null
  });
};

const send = (state: SerializableValue, actionType: string, options: Send = {}): SerializableValue => {
  return reduce(state, actionType, options).state;
};

const hostView = (state: SerializableValue): BordenMinigameHostView => {
  const view = bordenRuntimePlugin.selectHostView({ state, rules: RULES, content: null });

  assert.ok(view !== null && view.minigame === "BORDEN");

  return view;
};

const stretchOf = (state: SerializableValue, index?: number): BordenMinigameStretch => {
  const view = hostView(state);
  const stretch = view.stretches[index ?? view.stretchIndex];

  assert.ok(stretch !== undefined);

  return stretch;
};

const frameOf = (state: SerializableValue, index?: number): BordenFrame => {
  const { frame } = stretchOf(state, index);

  assert.ok(frame !== null, "the stretch has no frame");

  return frame;
};

const crewOf = (state: SerializableValue) => bordenRuntimePlugin.selectCrew?.({ state, rules: RULES, content: null }) ?? null;

const deadlineOf = (state: SerializableValue) => {
  return bordenRuntimePlugin.selectDeadlineAction?.({ state, rules: RULES, content: null }) ?? null;
};

/** Steps everybody out who is named, in that order, then has the host start the first stretch. */
const startWith = (state: SerializableValue, crew: string[], at = T0): SerializableValue => {
  const out = crew.reduce((next, actor) => send(next, "stepOut", { at, actor }), state);

  return send(out, "startStretch", { at });
};

/** The player id behind a hen of the stretch in hand, or undefined on the tablet. */
const actorOf = (state: SerializableValue, slot: number): string | undefined => {
  const view = hostView(state);
  const seat = stretchOf(state).pair[slot];

  return view.tablet || seat === undefined ? undefined : (view.crew[seat]?.player?.playerId ?? undefined);
};

/**
 * Runs the stretch in hand to its end through the reducer alone, a bot per hen: every tick each
 * bot's changed thumbs go in as that player's phone would send them (or the host's, on the
 * tablet), and a tick with no thumb is the room's pulse.
 */
const run = (state: SerializableValue, bot: BordenBot): { state: SerializableValue; endedAt: number } => {
  let next = state;
  let at = 0;
  const index = hostView(state).stretchIndex;

  for (;;) {
    const stretch = stretchOf(next, index);

    if (stretch.status === "done") {
      return { state: next, endedAt: at };
    }

    assert.ok(stretch.frame !== null && stretch.startedAtMs !== null);

    const layout = resolveBordenStretch({ seed: RULES.courseSeed, stretch: index, pair: stretch.pair.length });
    const thumbs = resolveBordenBotInputs(stretch.frame, layout, stretch.pair.map(() => bot));

    at = atTick(stretch.startedAtMs, stretch.frame.tick + 1);

    if (thumbs.length === 0) {
      const pulsed = reduce(next, "pulse", { at });

      assert.ok(pulsed.didMutate, `the stretch did not move at tick ${stretch.frame.tick}`);
      next = pulsed.state;
      continue;
    }

    for (const thumb of thumbs) {
      const actor = actorOf(next, thumb.hen);
      const options = { at, ...(actor === undefined ? {} : { actor }) };

      next = thumb.kind === "stick" ? send(next, "stick", { ...options, payload: { dir: thumb.dir } }) : send(next, "jump", options);
    }
  }
};

/** Starts the stretch in hand on the first thumb of its pair once its beat has been held. */
const startNext = (state: SerializableValue): SerializableValue => {
  const { readyAtMs } = stretchOf(state);

  assert.ok(readyAtMs !== null);

  const actor = actorOf(state, 0);
  const started = reduce(state, "stick", { at: readyAtMs, ...(actor === undefined ? {} : { actor }), payload: { dir: 1 } });

  assert.ok(started.didMutate);

  return started.state;
};

/** A whole game: the first stretch started by the host, the rest on the next pair's first thumb. */
const runGame = (crew: string[], bot: BordenBot): SerializableValue => {
  let state = startWith(initialize(), crew);

  for (let stretch = 0; stretch < RULES.stretchesPerTurn; stretch += 1) {
    if (stretch > 0) {
      state = startNext(state);
    }

    state = run(state, bot).state;
  }

  return state;
};

test("does put every stretch on the line with nobody out and the base dealt for one hen when a game starts", () => {
  const view = hostView(initialize());

  assert.equal(view.phase, "ready");
  assert.equal(view.stretchIndex, 0);
  assert.deepEqual(view.crew, []);
  assert.equal(view.tablet, false);
  assert.deepEqual(
    view.stretches.map((stretch) => [stretch.status, stretch.pair, stretch.frame]),
    [
      ["ready", [0], null],
      ["ready", [0], null],
      ["ready", [0], null]
    ]
  );
  assert.equal(view.total, resolveBordenCourseTotal({ seed: RULES.courseSeed, players: 1 }));
});

test("does give each player who steps out the next seat, and deal the pairs round-robin for the crew as it grows", () => {
  const two = ["p1", "p2"].reduce((state, actor) => send(state, "stepOut", { actor }), initialize());
  const three = send(two, "stepOut", { actor: "p3" });
  const four = send(three, "stepOut", { actor: "p4" });

  assert.deepEqual(
    hostView(three).crew.map((member) => [member.seat, member.player?.playerId]),
    [
      [0, "p1"],
      [1, "p2"],
      [2, "p3"]
    ]
  );
  assert.deepEqual(hostView(two).stretches.map((stretch) => stretch.pair), [[0, 1], [0, 1], [0, 1]]);
  assert.deepEqual(hostView(three).stretches.map((stretch) => stretch.pair), [[0, 1], [2, 0], [1, 2]]);
  assert.deepEqual(hostView(four).stretches.map((stretch) => stretch.pair), [[0, 1], [2, 3], [0, 2]]);
  assert.equal(hostView(two).total, resolveBordenCourseTotal({ seed: RULES.courseSeed, players: 2 }));
});

test("does refuse a step out from a rival, from nobody, a second time, a fifth hen and once the base has started", () => {
  const out = ["p1", "p2", "p3", "p4"].reduce((state, actor) => send(state, "stepOut", { actor }), initialize());

  assert.equal(reduce(initialize(), "stepOut", { actor: "p9" }).didMutate, false);
  assert.equal(reduce(initialize(), "stepOut").didMutate, false);
  assert.equal(reduce(send(initialize(), "stepOut", { actor: "p1" }), "stepOut", { actor: "p1" }).didMutate, false);
  assert.equal(reduce(out, "stepOut", { actor: "p5" }).didMutate, false);
  assert.equal(reduce(startWith(initialize(), ["p1"]), "stepOut", { actor: "p2" }).didMutate, false);
});

test("does start the first stretch on the host's Start with its pair, and on nobody's thumb", () => {
  const out = ["p1", "p2"].reduce((state, actor) => send(state, "stepOut", { actor }), initialize());

  assert.equal(reduce(out, "startStretch", { actor: "p1" }).didMutate, false);
  assert.equal(reduce(out, "stick", { actor: "p1", payload: { dir: 1 } }).didMutate, false);

  const started = send(out, "startStretch", { at: T0 });
  const stretch = stretchOf(started);

  assert.equal(stretch.status, "running");
  assert.equal(stretch.startedAtMs, T0);
  assert.equal(frameOf(started).hens.length, 2);
  assert.equal(stretch.total, resolveBordenStretch({ seed: RULES.courseSeed, stretch: 0, pair: 2 }).total);
  assert.equal(hostView(started).phase, "running");
  assert.equal(reduce(started, "startStretch", { at: T0 + 10 }).didMutate, false);
});

test("does make the game the tablet's, one hen a stretch and the roster in turn, when nobody stepped out", () => {
  const started = send(initialize(), "startStretch");
  const view = hostView(started);

  assert.equal(view.tablet, true);
  assert.deepEqual(view.crew.map((member) => member.player?.playerId), ["p1", "p2", "p3", "p4", "p5"]);
  assert.deepEqual(view.stretches.map((stretch) => stretch.pair), [[0], [1], [2]]);
  assert.equal(frameOf(started).hens.length, 1);

  // The host's own thumbs steer the one hen; a phone's do not.
  assert.equal(reduce(started, "stick", { at: T0 + 100, payload: { dir: 1 } }).didMutate, true);
  assert.equal(reduce(started, "stick", { at: T0 + 100, actor: "p1", payload: { dir: 1 } }).didMutate, false);
});

test("does run the house hen on the tablet when the team has no roster", () => {
  const started = send(initialize({ teams: [{ id: "team-a", name: "Team A", playerIds: [], totalScore: 0 }] }), "startStretch");

  assert.deepEqual(hostView(started).crew, [{ player: null, seat: 0 }]);
  assert.equal(frameOf(started).hens.length, 1);
});

test("does stamp a thumb at the tick the room's clock reads and hand back a frame that already has it", () => {
  const started = startWith(initialize(), ["p1", "p2"]);
  const moved = send(started, "stick", { at: atTick(T0, 30), actor: "p2", payload: { dir: 1 } });
  const frame = frameOf(moved);

  assert.equal(frame.tick, 31);
  assert.equal(frame.hens[1]?.stick, 1);
  assert.equal(frame.hens[0]?.stick, 0);
});

test("does count a quarter of a second as fifteen ticks exactly when the clock lands on a tick's first millisecond", () => {
  const started = startWith(initialize(), ["p1"]);

  assert.equal(frameOf(send(started, "pulse", { at: T0 + 250 })).tick, 15);
});

test("does refuse a thumb that is malformed, a repeat, from a player sitting the stretch out, a rival's, or without the room's clock", () => {
  const started = startWith(initialize(), ["p1", "p2", "p3"]);
  const running = send(started, "stick", { at: T0 + 100, actor: "p1", payload: { dir: 1 } });

  assert.equal(reduce(running, "stick", { at: T0 + 200, actor: "p1", payload: { dir: 9 } }).didMutate, false);
  assert.equal(reduce(running, "stick", { at: T0 + 200, actor: "p1", payload: { dir: "1" } }).didMutate, false);
  assert.equal(reduce(running, "jump", { at: T0 + 200, actor: "p1", payload: [] }).didMutate, false);
  assert.equal(reduce(running, "stick", { at: T0 + 200, actor: "p1", payload: { dir: 1 } }).didMutate, false);
  // Dan is in the crew but runs the motor pool, not the fences.
  assert.equal(reduce(running, "stick", { at: T0 + 200, actor: "p3", payload: { dir: 1 } }).didMutate, false);
  assert.equal(reduce(running, "jump", { at: T0 + 200, actor: "p9" }).didMutate, false);
  assert.equal(
    bordenRuntimePlugin.reduceAction({
      state: running,
      envelope: { actionType: "stick", actionPayload: { dir: 5 }, actorPlayerId: "p1" },
      pointsMax: POINTS_MAX,
      rules: RULES,
      content: null
    }).didMutate,
    false
  );
});

test("does take every jump press, since a press is never a repeat", () => {
  const started = startWith(initialize(), ["p1"]);
  const once = reduce(started, "jump", { at: atTick(T0, 10), actor: "p1" });
  const twice = reduce(once.state, "jump", { at: atTick(T0, 10), actor: "p1" });

  assert.equal(once.didMutate, true);
  assert.equal(twice.didMutate, true);
  assert.ok((frameOf(once.state).hens[0]?.vy ?? 0) > 0, "she is in the air");
});

test("does step the stretch to the room's clock on a pulse, exactly as a phone stepping the same frame would", () => {
  const started = startWith(initialize(), ["p1", "p2"]);
  const layout = resolveBordenStretch({ seed: RULES.courseSeed, stretch: 0, pair: 2 });
  const pulsed = send(started, "pulse", { at: atTick(T0, 200) });

  assert.deepEqual(frameOf(pulsed), advanceBorden(frameOf(started), layout, [], 200));
  assert.equal(reduce(pulsed, "pulse", { at: atTick(T0, 200) }).didMutate, false);
});

test("does ask the room for a pulse half a second past the frame it holds, only while a stretch runs", () => {
  assert.equal(deadlineOf(initialize()), null);

  const started = startWith(initialize(), ["p1"]);

  assert.deepEqual(deadlineOf(started), { actionType: "pulse", atMs: atTick(T0, BORDEN_PULSE_TICKS) });

  const pulsed = send(started, "pulse", { at: atTick(T0, 45) });

  assert.deepEqual(deadlineOf(pulsed), { actionType: "pulse", atMs: atTick(T0, 45 + BORDEN_PULSE_TICKS) });
});

test("does bank a cleared stretch, keep its last frame for the beat and put the next pair on the line with the bottles handed on", () => {
  const { state, endedAt } = run(startWith(initialize(), ["p1", "p2"]), bordenRunner);
  const done = stretchOf(state, 0);
  const next = stretchOf(state, 1);

  assert.equal(done.status, "done");
  assert.equal(done.outcome, "cleared");
  assert.ok(done.banked > 0);
  assert.ok(done.frame !== null, "the last frame stays for the handoff beat");
  assert.equal(hostView(state).stretchIndex, 1);
  assert.equal(next.status, "ready");
  assert.equal(next.readyAtMs, endedAt + BORDEN_READY_HOLD_MS);
  assert.deepEqual(next.bottles, resolveBordenHandoffBottles(done.frame));
  assert.equal(hostView(state).banked, done.banked);
});

test("does start a later stretch on the first thumb of its pair once the beat has been held, and not before or from anyone else", () => {
  const { state } = run(startWith(initialize(), ["p1", "p2", "p3"]), bordenRunner);
  const { readyAtMs } = stretchOf(state);

  assert.ok(readyAtMs !== null);
  // The motor pool is Dan and Alex's.
  assert.deepEqual(stretchOf(state).pair, [2, 0]);
  assert.equal(reduce(state, "stick", { at: readyAtMs - 1, actor: "p3", payload: { dir: 1 } }).didMutate, false);
  assert.equal(reduce(state, "stick", { at: readyAtMs, actor: "p2", payload: { dir: 1 } }).didMutate, false);

  const started = send(state, "stick", { at: readyAtMs, actor: "p3", payload: { dir: 1 } });

  assert.equal(stretchOf(started).status, "running");
  assert.equal(stretchOf(started).startedAtMs, readyAtMs);
  assert.equal(frameOf(started).hens[0]?.stick, 1);
  assert.deepEqual(
    frameOf(started).hens.map((hen) => hen.bottle),
    [0, 1].map((slot) => stretchOf(state).bottles[slot] ?? "mild")
  );
  // Only the stretch in hand and the one before it carry a frame.
  assert.equal(stretchOf(started, 0).frame !== null, true);
});

test("does end a stretch on a wipe with what it banked kept, and start the next pair on mild", () => {
  // The masher holds right and never jumps: it gets through the fences, and the motor pool's geese
  // and tank take both hens down.
  const fences = run(startWith(initialize(), ["p1", "p2"]), bordenMasher).state;
  const { state } = run(startNext(fences), bordenMasher);
  const done = stretchOf(state, 1);

  assert.equal(done.outcome, "wipe");
  assert.ok(done.banked > 0);
  assert.equal(done.banked, frameOf(state, 1).banked);
  assert.equal(hostView(state).banked, stretchOf(state, 0).banked + done.banked);
  assert.deepEqual(stretchOf(state, 2).bottles, []);
});

test("does finish the game with the points, each player's numbers, and no more pads", () => {
  const state = runGame(["p1", "p2", "p3"], bordenRunner);
  const view = hostView(state);

  assert.equal(view.phase, "finished");
  assert.equal(view.stretchIndex, 3);
  assert.equal(view.points, resolveBordenPoints(view.banked, view.total, POINTS_MAX));
  assert.equal(view.pendingPointsByTeamId["team-a"], view.points);
  assert.equal(crewOf(state), null);
  assert.equal(deadlineOf(state), null);
  assert.deepEqual(Object.keys(view.turnStats ?? {}).sort(), ["p1", "p2", "p3"]);
  // Every player ran two of the three stretches: the round-robin is fair.
  assert.deepEqual(
    [0, 1, 2].map((seat) => view.stretches.filter((stretch) => stretch.pair.includes(seat)).length),
    [2, 2, 2]
  );
  // What they sprayed down is the stretches' worth less the hearts carried through the gates.
  assert.ok(Object.values(view.turnStats ?? {}).reduce((total, stats) => total + stats.worth, 0) > 0);
  // Only the last stretch's frame is kept once the game is over.
  assert.deepEqual(
    view.stretches.map((stretch) => stretch.frame !== null),
    [false, false, true]
  );
});

test("does clear the whole base with the runner for a room of two, three and four", () => {
  for (const crew of [["p1", "p2"], ["p1", "p2", "p3"], ["p1", "p2", "p3", "p4"]]) {
    const view = hostView(runGame(crew, bordenRunner));

    assert.deepEqual(
      view.stretches.map((stretch) => stretch.outcome),
      ["cleared", "cleared", "cleared"],
      `${crew.length} players`
    );
    assert.equal(view.total, resolveBordenCourseTotal({ seed: RULES.courseSeed, players: crew.length }));
    assert.ok((view.points ?? 0) >= 13, `${crew.length} players scored ${view.points}`);
  }
});

test("does bank nothing for a skipped stretch and put the next on the line with no beat to hold and nothing handed on", () => {
  const started = startWith(initialize(), ["p1", "p2"]);
  const halfway = send(started, "pulse", { at: atTick(T0, 300) });
  const skipped = send(halfway, "skipStretch", { at: T0 + 6000 });

  assert.equal(stretchOf(skipped, 0).skipped, true);
  assert.equal(stretchOf(skipped, 0).banked, 0);
  assert.equal(stretchOf(skipped, 0).frame, null);
  assert.equal(stretchOf(skipped).readyAtMs, T0 + 6000);
  assert.deepEqual(stretchOf(skipped).bottles, []);
  assert.equal(hostView(skipped).banked, 0);
});

test("does put the whole base back on the fences and hand back exactly the game's points on a reset", () => {
  const finished = runGame(["p1", "p2"], bordenRunner);
  const reset = send(finished, "resetTurn");
  const view = hostView(reset);

  assert.ok((hostView(finished).pendingPointsByTeamId["team-a"] ?? 0) > 0);
  assert.equal(view.phase, "ready");
  assert.deepEqual(view.crew, []);
  assert.equal(view.tablet, false);
  assert.equal(view.pendingPointsByTeamId["team-a"], 0);

  const carried = send(startWith(initialize({ pendingPointsByTeamId: { "team-a": 4, "team-b": 0 } }), ["p1"]), "resetTurn");

  assert.equal(hostView(carried).pendingPointsByTeamId["team-a"], 4);
});

test("does tell every team phone its pad: in the pair with its seat and hearts, otherwise out", () => {
  const out = ["p1", "p2", "p3"].reduce((state, actor) => send(state, "stepOut", { actor }), initialize());
  const assembling = crewOf(out);

  assert.equal(assembling?.status, "ready");
  assert.deepEqual(assembling?.playerIds, ["p1", "p2", "p3", "p4", "p5"]);
  assert.deepEqual(assembling?.pads.p1, { state: "up", slot: 0, hearts: BORDEN_WORLD.heartsMax });
  assert.deepEqual(assembling?.pads.p3, { state: "out", slot: null, hearts: 0 });
  assert.deepEqual(assembling?.pads.p4, { state: "out", slot: null, hearts: 0 });

  const { state } = run(send(out, "startStretch"), bordenRunner);
  const next = crewOf(state);

  // The motor pool: Dan in front, Alex behind, Caitlin waiting.
  assert.deepEqual(next?.pads.p3, { state: "up", slot: 2, hearts: BORDEN_WORLD.heartsMax });
  assert.deepEqual(next?.pads.p1, { state: "up", slot: 0, hearts: BORDEN_WORLD.heartsMax });
  assert.deepEqual(next?.pads.p2, { state: "out", slot: null, hearts: 0 });
});

test("does give no phone a pad for a game the tablet is playing", () => {
  const crew = crewOf(send(initialize(), "startStretch"));

  assert.ok(crew !== null);
  assert.ok(Object.values(crew.pads).every((pad) => pad.state === "out"));
});

test("does show the display exactly what it shows the host", () => {
  const running = send(startWith(initialize(), ["p1", "p2"]), "pulse", { at: atTick(T0, 120) });

  assert.deepEqual(bordenRuntimePlugin.selectDisplayView({ state: running, rules: RULES, content: null }), hostView(running));
});

test("does keep a game's state its own and serialisable through a whole stretch", () => {
  const started = startWith(initialize(), ["p1", "p2"]);
  const halfway = send(started, "pulse", { at: atTick(T0, 240) });
  const thawed = JSON.parse(JSON.stringify(halfway)) as SerializableValue;

  assert.equal(isBordenRuntimeState(thawed), true);
  assert.equal(isBordenRuntimeState({ blocks: [] }), false);
  assert.deepEqual(send(thawed, "pulse", { at: atTick(T0, 480) }), send(halfway, "pulse", { at: atTick(T0, 480) }));
});

test("does read the stretch count and the seed from the rules, and refuse a base longer than three", () => {
  assert.deepEqual(resolveBordenRules(null), DEFAULT_BORDEN_RULES);
  assert.deepEqual(resolveBordenRules({ stretchesPerTurn: 1, courseSeed: -7 }), { stretchesPerTurn: 1, courseSeed: -7 });
  assert.deepEqual(resolveBordenRules({ stretchesPerTurn: 4 }), DEFAULT_BORDEN_RULES);
  assert.equal(isBordenRules({}), true);
  assert.equal(isBordenRules({ stretchesPerTurn: 2, courseSeed: 3 }), true);
  assert.equal(isBordenRules({ stretchesPerTurn: 4 }), false);
  assert.equal(isBordenRules({ stretchesPerTurn: 0 }), false);
  assert.equal(isBordenRules({ courseSeed: 1.5 }), false);
  assert.equal(isBordenRules([]), false);
});

test("does score the share of the base the crew banked, to the point", () => {
  assert.equal(resolveBordenPoints(74, 74, 15), 15);
  assert.equal(resolveBordenPoints(37, 74, 15), 8);
  assert.equal(resolveBordenPoints(0, 74, 15), 0);
  assert.equal(resolveBordenPoints(5, 0, 15), 15);
});
