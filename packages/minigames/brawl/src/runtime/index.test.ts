import assert from "node:assert/strict";
import test from "node:test";
import type { BrawlBestTurn, BrawlCrewFrame, BrawlMinigameBlock, BrawlMinigameHostView, Player, Team } from "@wingnight/shared";
import {
  BRAWL_CREW_WORLD,
  advanceBrawlCrew,
  brawlCrewBrawler,
  resolveBrawlCrewBlock,
  resolveBrawlCrewBotInputs,
  resolveBrawlCrewCourseTotal,
  type BrawlCrewBot
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { isBrawlRuntimeState } from "./guards/index.js";
import { isBrawlRules, resolveBrawlRules } from "./rules/index.js";
import { resolveBrawlPoints } from "./scoring/index.js";
import { BRAWL_PULSE_TICKS, BRAWL_READY_HOLD_MS, DEFAULT_BRAWL_RULES } from "./types/index.js";
import { brawlRuntimePlugin } from "./index.js";

const PLAYERS: Player[] = [
  { id: "p1", name: "Alex" },
  { id: "p2", name: "Caitlin" },
  { id: "p3", name: "Dan" },
  { id: "p9", name: "Rival" }
];

const TEAMS: Team[] = [
  { id: "team-a", name: "Team A", playerIds: ["p1", "p2", "p3"], totalScore: 0 },
  { id: "team-b", name: "Team B", playerIds: ["p9"], totalScore: 0 }
];

const RULES = { blocksPerTurn: 2, courseSeed: 20261001 };
const POINTS_MAX = 15;
// The server clock when the test's first block starts.
const T0 = 1_800_000_000_000;
/** The server clock at a tick of a block that started at `startedAtMs`: the first millisecond of it. */
const atTick = (startedAtMs: number, tick: number): number => startedAtMs + Math.ceil((tick * 1000) / 60);

const initialize = (
  options: { roundMemory?: SerializableValue | null; pendingPointsByTeamId?: Record<string, number>; teams?: Team[] } = {}
): SerializableValue => {
  const state = brawlRuntimePlugin.initialize({
    teamIds: ["team-a", "team-b"],
    players: PLAYERS,
    teams: options.teams ?? TEAMS,
    activeRoundTeamId: "team-a",
    pointsMax: POINTS_MAX,
    pendingPointsByTeamId: options.pendingPointsByTeamId ?? { "team-a": 0, "team-b": 0 },
    rules: RULES,
    content: null,
    roundMemory: options.roundMemory ?? null
  });

  assert.ok(state !== null);

  return state;
};

type Send = { at?: number; actor?: string; payload?: SerializableValue };

const reduce = (state: SerializableValue, actionType: string, { at = T0, actor, payload = {} }: Send = {}) => {
  return brawlRuntimePlugin.reduceAction({
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

const hostView = (state: SerializableValue): BrawlMinigameHostView => {
  const view = brawlRuntimePlugin.selectHostView({ state, rules: RULES, content: null });

  assert.ok(view !== null && view.minigame === "BRAWL");

  return view;
};

const blockOf = (state: SerializableValue, index?: number): BrawlMinigameBlock => {
  const view = hostView(state);
  const block = view.blocks[index ?? view.blockIndex];

  assert.ok(block !== undefined);

  return block;
};

const frameOf = (state: SerializableValue, index?: number): BrawlCrewFrame => {
  const { frame } = blockOf(state, index);

  assert.ok(frame !== null, "the block has no frame");

  return frame;
};

const crewOf = (state: SerializableValue) => brawlRuntimePlugin.selectCrew?.({ state, rules: RULES, content: null }) ?? null;

const deadlineOf = (state: SerializableValue) => {
  return brawlRuntimePlugin.selectDeadlineAction?.({ state, rules: RULES, content: null }) ?? null;
};

const memoryBestTurn = (state: SerializableValue): BrawlBestTurn | null => {
  const memory = brawlRuntimePlugin.selectRoundMemory?.({ state, rules: RULES, content: null }) ?? null;

  assert.ok(memory !== null && typeof memory === "object" && !Array.isArray(memory));

  return (memory as { bestTurn: BrawlBestTurn | null }).bestTurn;
};

/** Steps everybody out who is named, in that order, then has the host start the block. */
const startWith = (state: SerializableValue, crew: string[], at = T0): SerializableValue => {
  const out = crew.reduce((next, actor) => send(next, "stepOut", { at, actor }), state);

  return send(out, "startBlock", { at });
};

/**
 * Fights the block in hand to its end through the reducer alone, a bot per hen: every tick each
 * bot's changed thumbs go in as that player's phone would send them (or the tablet's, for a
 * tablet block), and a tick with no thumb is the server's pulse.
 */
const fight = (state: SerializableValue, bot: BrawlCrewBot): { state: SerializableValue; endedAt: number } => {
  let next = state;
  let at = 0;
  const index = hostView(state).blockIndex;

  for (;;) {
    const block = blockOf(next, index);

    if (block.status === "done") {
      return { state: next, endedAt: at };
    }

    assert.ok(block.frame !== null && block.crewSize !== null && block.startedAtMs !== null);

    const layout = resolveBrawlCrewBlock({ ...{ seed: RULES.courseSeed, blocks: RULES.blocksPerTurn }, block: index, crew: block.crewSize });
    const thumbs = resolveBrawlCrewBotInputs(block.frame, layout, Array.from({ length: block.crewSize }, () => bot));

    at = atTick(block.startedAtMs, block.frame.tick + 1);

    if (thumbs.length === 0) {
      const pulsed = reduce(next, "pulse", { at });

      assert.ok(pulsed.didMutate, `the fight did not move at tick ${block.frame.tick}`);
      next = pulsed.state;
      continue;
    }

    for (const thumb of thumbs) {
      const actor = block.tablet ? undefined : (block.crew[thumb.hen]?.player?.playerId ?? undefined);
      const options = { at, ...(actor === undefined ? {} : { actor }) };

      next =
        thumb.kind === "walk"
          ? send(next, "walk", { ...options, payload: { dir: thumb.dir } })
          : send(next, "peck", { ...options, payload: { held: thumb.held } });
    }
  }
};

test("does put every block on the line with nobody out and the street dealt for one hen when a turn starts", () => {
  const view = hostView(initialize());

  assert.equal(view.phase, "ready");
  assert.equal(view.blockIndex, 0);
  assert.deepEqual(view.roster.map((figure) => figure.playerId), ["p1", "p2", "p3"]);
  assert.ok(view.blocks.every((block) => block.status === "ready" && block.crew.length === 0 && block.frame === null));
  assert.equal(view.banked, 0);
  assert.equal(view.total, resolveBrawlCrewCourseTotal({ seed: RULES.courseSeed, blocks: 2, crew: 1 }));
  assert.equal(view.points, null);
});

test("does give each player who steps out the next slot, and deal the street for the crew as it grows", () => {
  const one = send(initialize(), "stepOut", { actor: "p2" });
  const two = send(one, "stepOut", { actor: "p1" });

  assert.deepEqual(
    blockOf(two).crew.map((member) => [member.player?.playerId, member.slot]),
    [
      ["p2", 0],
      ["p1", 1]
    ]
  );
  assert.equal(hostView(two).total, resolveBrawlCrewCourseTotal({ seed: RULES.courseSeed, blocks: 2, crew: 2 }));
});

test("does refuse a step out from a rival, from nobody, a second time and once the fight has started", () => {
  const ready = initialize();

  assert.equal(reduce(ready, "stepOut", { actor: "p9" }).didMutate, false);
  assert.equal(reduce(ready, "stepOut").didMutate, false);

  const out = send(ready, "stepOut", { actor: "p1" });

  assert.equal(reduce(out, "stepOut", { actor: "p1" }).didMutate, false);
  assert.equal(reduce(send(out, "startBlock"), "stepOut", { actor: "p2" }).didMutate, false);
});

test("does start block one on the host's Start with the crew that stepped out, and on nobody's thumb", () => {
  const out = [..."12"].reduce((next, id) => send(next, "stepOut", { actor: `p${id}` }), initialize());

  // Block one is the host's to start: a crew thumb on the line does nothing, and neither does a
  // phone asking.
  assert.equal(reduce(out, "walk", { actor: "p1", payload: { dir: 1 }, at: T0 + 60_000 }).didMutate, false);
  assert.equal(reduce(out, "startBlock", { actor: "p1" }).didMutate, false);

  const block = blockOf(send(out, "startBlock", { at: T0 + 5 }));

  assert.equal(block.status, "running");
  assert.equal(block.tablet, false);
  assert.equal(block.crewSize, 2);
  assert.equal(block.startedAtMs, T0 + 5);
  assert.equal(block.frame?.tick, 0);
  assert.equal(block.frame?.hens.length, 2);
  assert.equal(block.total, resolveBrawlCrewBlock({ seed: RULES.courseSeed, blocks: 2, block: 0, crew: 2 }).total);
});

test("does make the block the tablet's own, with the roster's player for it, when nobody stepped out", () => {
  const started = send(initialize(), "startBlock");
  const block = blockOf(started);

  assert.equal(block.tablet, true);
  assert.deepEqual(block.crew.map((member) => [member.player?.playerId, member.slot]), [["p1", 0]]);
  assert.equal(block.crewSize, 1);

  // No phone is a pad for it; the tablet's thumbs, which carry no face, are its hen's.
  assert.equal(reduce(started, "walk", { actor: "p1", payload: { dir: 1 }, at: T0 + 100 }).didMutate, false);
  assert.equal(frameOf(send(started, "walk", { payload: { dir: 1 }, at: T0 + 100 })).hens[0]?.walk, 1);
});

test("does play the house hen on the tablet when the team has no roster", () => {
  const empty = TEAMS.map((team) => (team.id === "team-a" ? { ...team, playerIds: [] } : team));
  const block = blockOf(send(initialize({ teams: empty }), "startBlock"));

  assert.deepEqual(block.crew, [{ player: null, slot: 0 }]);
});

test("does stamp a thumb at the tick the server's clock reads and hand back a frame that already has it", () => {
  const started = startWith(initialize(), ["p1", "p2"]);
  const moved = send(started, "walk", { actor: "p2", payload: { dir: 1, tick: 9999 }, at: atTick(T0, 60) });
  const frame = frameOf(moved);

  // A second in: sixty ticks, and the step that read the thumb. Nothing a pad says about time counts.
  assert.equal(frame.tick, 61);
  assert.equal(frame.hens[1]?.walk, 1);
  assert.equal(frame.hens[0]?.walk, 0, "the thumb is its sender's hen's and nobody else's");
  assert.ok((frame.hens[1]?.x ?? 0) > (frameOf(started).hens[1]?.x ?? 0));
});

test("does count a quarter of a second as fifteen ticks exactly when the clock lands on a tick's first millisecond", () => {
  const started = startWith(initialize(), ["p1"]);

  // 250 ms is tick 15 on the nose; dividing by a tick's length instead floors it to 14.
  assert.equal(frameOf(send(started, "pulse", { at: T0 + 250 })).tick, 15);
  assert.equal(frameOf(send(started, "pulse", { at: T0 + 249 })).tick, 14);
  assert.equal(frameOf(send(started, "pulse", { at: T0 + 1000 })).tick, 60);
});

test("does refuse a thumb that is malformed, a repeat, a rival's, or without the server's clock", () => {
  const started = startWith(initialize(), ["p1"]);
  const walking = send(started, "walk", { actor: "p1", payload: { dir: 3 }, at: T0 + 200 });

  assert.equal(reduce(started, "walk", { actor: "p1", payload: { dir: 9 } }).didMutate, false);
  assert.equal(reduce(started, "walk", { actor: "p1", payload: {} }).didMutate, false);
  assert.equal(reduce(started, "peck", { actor: "p1", payload: { held: "yes" } }).didMutate, false);
  assert.equal(reduce(walking, "walk", { actor: "p1", payload: { dir: 3 }, at: T0 + 400 }).didMutate, false);
  assert.equal(reduce(started, "walk", { actor: "p9", payload: { dir: 1 } }).didMutate, false);
  assert.equal(reduce(started, "walk", { actor: "p2", payload: { dir: 1 } }).didMutate, false, "a teammate who did not step out has no hen");
  assert.equal(
    brawlRuntimePlugin.reduceAction({
      state: started,
      envelope: { actionType: "walk", actionPayload: { dir: 1 }, actorPlayerId: "p1" },
      pointsMax: POINTS_MAX,
      rules: RULES,
      content: null
    }).didMutate,
    false
  );
});

test("does step the fight to the server's clock on a pulse, exactly as a screen stepping the same frame would", () => {
  const started = startWith(initialize(), ["p1", "p2"]);
  const walking = send(started, "walk", { actor: "p1", payload: { dir: 1 }, at: atTick(T0, 10) });
  const pulsed = send(walking, "pulse", { at: atTick(T0, 200) });
  const layout = resolveBrawlCrewBlock({ seed: RULES.courseSeed, blocks: 2, block: 0, crew: 2 });

  assert.equal(frameOf(pulsed).tick, 200);
  assert.deepEqual(frameOf(pulsed), advanceBrawlCrew(frameOf(walking), layout, [], 200));
  assert.equal(reduce(pulsed, "pulse", { at: atTick(T0, 200) }).didMutate, false, "no time has passed");
  assert.equal(reduce(initialize(), "pulse").didMutate, false, "nothing is running");
});

test("does ask the server for a pulse half a second past the frame it holds, only while a block runs", () => {
  const started = startWith(initialize(), ["p1"], T0);

  assert.equal(deadlineOf(initialize()), null);
  assert.deepEqual(deadlineOf(started), { actionType: "pulse", atMs: atTick(T0, BRAWL_PULSE_TICKS) });

  const later = send(started, "pulse", { at: atTick(T0, 90) });

  assert.deepEqual(deadlineOf(later), { actionType: "pulse", atMs: atTick(T0, 90 + BRAWL_PULSE_TICKS) });
});

test("does bank a cleared block, keep its last frame for the beat and put the next on the line with the same crew", () => {
  const { state, endedAt } = fight(startWith(initialize(), ["p1", "p2"]), brawlCrewBrawler);
  const view = hostView(state);
  const done = blockOf(state, 0);
  const next = blockOf(state, 1);

  assert.equal(done.status, "done");
  assert.equal(done.outcome, "cleared");
  assert.equal(done.frame?.outcome, "cleared");
  assert.equal(done.banked, done.frame?.banked);
  assert.ok(done.banked > 0 && done.banked <= done.total);
  assert.equal(view.blockIndex, 1);
  assert.equal(view.phase, "ready");
  assert.equal(view.points, null, "the turn is not over");
  assert.equal(view.pendingPointsByTeamId["team-a"], resolveBrawlPoints(view.banked, view.total, POINTS_MAX));
  assert.deepEqual(next.crew.map((member) => member.player?.playerId), ["p1", "p2"]);
  assert.equal(next.readyAtMs, endedAt + BRAWL_READY_HOLD_MS);
  assert.equal(next.frame, null);
});

test("does start a later block on the first crew thumb once the beat has been held, and not before", () => {
  const { state, endedAt } = fight(startWith(initialize(), ["p1", "p2"]), brawlCrewBrawler);
  const early = { actor: "p1", payload: { dir: 1 }, at: endedAt + BRAWL_READY_HOLD_MS - 1 };
  const onTime = { actor: "p1", payload: { dir: 1 }, at: endedAt + BRAWL_READY_HOLD_MS };

  assert.equal(reduce(state, "walk", early).didMutate, false);
  assert.equal(reduce(state, "walk", { ...onTime, actor: "p3" }).didMutate, false, "a teammate who is not out cannot start it");

  const block = blockOf(send(state, "walk", onTime));

  assert.equal(block.status, "running");
  assert.equal(block.startedAtMs, onTime.at);
  assert.equal(block.crewSize, 2);
  assert.equal(block.frame?.hens[0]?.walk, 1, "the thumb that started it is already in the fight");
  assert.ok(block.frame?.hens.every((hen) => hen.hearts === BRAWL_CREW_WORLD.heartsMax && hen.state === "up"));
});

test("does let a late phone step out before the next block and deal that block for the bigger crew", () => {
  const { state } = fight(startWith(initialize(), ["p1", "p2"]), brawlCrewBrawler);
  const joined = send(state, "stepOut", { actor: "p3" });
  const block = blockOf(joined);

  assert.deepEqual(block.crew.map((member) => [member.player?.playerId, member.slot]), [["p1", 0], ["p2", 1], ["p3", 2]]);
  assert.equal(block.total, resolveBrawlCrewBlock({ seed: RULES.courseSeed, blocks: 2, block: 1, crew: 3 }).total);
  assert.equal(blockOf(joined, 0).total, resolveBrawlCrewBlock({ seed: RULES.courseSeed, blocks: 2, block: 0, crew: 2 }).total);
});

test("does lose the block and keep what it banked when the whole crew goes down, and stand everyone up for the next", () => {
  // One hen who walks into the wall and never pecks: the geese take her three hearts.
  const walker: BrawlCrewBot = () => ({ dir: 5, held: false });
  const { state, endedAt } = fight(startWith(initialize(), ["p1"]), walker);
  const lost = blockOf(state, 0);

  assert.equal(lost.outcome, "wipe");
  assert.equal(lost.banked, 0);
  assert.equal(hostView(state).blockIndex, 1);

  const next = blockOf(send(state, "peck", { actor: "p1", payload: { held: true }, at: endedAt + BRAWL_READY_HOLD_MS }));

  assert.equal(next.frame?.hens[0]?.hearts, BRAWL_CREW_WORLD.heartsMax);
  assert.equal(next.frame?.hens[0]?.state, "up");
});

test("does finish the turn on the last block with the points, each player's numbers and a turn to beat", () => {
  const first = fight(startWith(initialize(), ["p1", "p2"]), brawlCrewBrawler);
  const second = fight(send(first.state, "walk", { actor: "p2", payload: { dir: 1 }, at: first.endedAt + BRAWL_READY_HOLD_MS }), brawlCrewBrawler);
  const view = hostView(second.state);

  assert.equal(view.phase, "finished");
  assert.equal(view.points, resolveBrawlPoints(view.banked, view.total, POINTS_MAX));
  assert.ok(view.points !== null && view.points >= 13, `two brawlers banked ${view.banked} of ${view.total}`);
  assert.deepEqual(Object.keys(view.turnStats ?? {}).sort(), ["p1", "p2"]);
  assert.ok(Object.values(view.turnStats ?? {}).reduce((total, stats) => total + stats.worth, 0) > 0);
  assert.deepEqual(memoryBestTurn(second.state), { teamId: "team-a", teamName: "Team A", banked: view.banked, total: view.total });
  assert.equal(crewOf(second.state), null);
  assert.equal(deadlineOf(second.state), null);
  // Only the last block's frame is still the room's to draw.
  assert.equal(view.blocks[0]?.frame, null);
  assert.ok(view.blocks[1]?.frame !== null);
});

test("does keep the turn to beat by the bigger share of its own street, not the bigger sum", () => {
  const standing: BrawlBestTurn = { teamId: "team-b", teamName: "Team B", banked: 30, total: 32 };
  const beaten = fight(startWith(initialize({ roundMemory: { bestTurn: standing } }), ["p1"]), () => ({ dir: 5, held: false }));
  const afterSkip = send(beaten.state, "skipBlock", { at: beaten.endedAt });

  assert.deepEqual(hostView(afterSkip).bestTurn, standing);
  assert.deepEqual(memoryBestTurn(afterSkip), standing, "a turn that banked nothing is nobody's number to beat");

  const small: BrawlBestTurn = { teamId: "team-b", teamName: "Team B", banked: 1, total: 200 };
  const first = fight(startWith(initialize({ roundMemory: { bestTurn: small } }), ["p1"]), brawlCrewBrawler);
  const through = send(first.state, "skipBlock", { at: first.endedAt });

  assert.equal(memoryBestTurn(through)?.teamId, "team-a");
});

test("does bank nothing for a skipped block and put the next on the line with no beat to hold", () => {
  const started = startWith(initialize(), ["p1", "p2"]);
  const skipped = send(send(started, "pulse", { at: atTick(T0, 300) }), "skipBlock", { at: T0 + 6000 });

  assert.equal(blockOf(skipped, 0).skipped, true);
  assert.equal(blockOf(skipped, 0).banked, 0);
  assert.equal(blockOf(skipped, 0).frame, null);
  assert.equal(blockOf(skipped).readyAtMs, T0 + 6000);
  assert.equal(blockOf(send(skipped, "peck", { actor: "p2", payload: { held: true }, at: T0 + 6001 })).status, "running");
  // The skipped block is still part of what the course held.
  assert.equal(hostView(skipped).total, resolveBrawlCrewCourseTotal({ seed: RULES.courseSeed, blocks: 2, crew: 2 }));
});

test("does put the whole team back on block one and hand back exactly the turn's points on a reset", () => {
  const { state } = fight(startWith(initialize({ pendingPointsByTeamId: { "team-a": 4, "team-b": 9 } }), ["p1", "p2"]), brawlCrewBrawler);

  assert.ok((hostView(state).pendingPointsByTeamId["team-a"] ?? 0) > 4);

  const reset = hostView(send(state, "resetTurn"));

  assert.equal(reset.blockIndex, 0);
  assert.ok(reset.blocks.every((block) => block.status === "ready" && block.crew.length === 0 && block.frame === null));
  assert.deepEqual(reset.pendingPointsByTeamId, { "team-a": 4, "team-b": 9 });
});

test("does tell every team phone its pad: out, or its slot and hearts as the fight has them", () => {
  const out = send(initialize(), "stepOut", { actor: "p2" });

  assert.deepEqual(crewOf(out), {
    status: "ready",
    playerIds: ["p1", "p2", "p3"],
    pads: {
      p1: { state: "out", slot: null, hearts: 0 },
      p2: { state: "up", slot: 0, hearts: 3 },
      p3: { state: "out", slot: null, hearts: 0 }
    }
  });

  const walker: BrawlCrewBot = () => ({ dir: 5, held: false });
  let state = send(out, "startBlock");

  // Until her first heart goes.
  while ((frameOf(state).hens[0]?.hearts ?? 0) === 3) {
    const frame = frameOf(state);
    const thumbs = walker(frame, resolveBrawlCrewBlock({ seed: RULES.courseSeed, blocks: 2, block: 0, crew: 1 }), 0);

    state =
      frame.hens[0]?.walk === thumbs.dir
        ? send(state, "pulse", { at: atTick(T0, frame.tick + 30) })
        : send(state, "walk", { actor: "p2", payload: { dir: thumbs.dir }, at: atTick(T0, frame.tick + 1) });
  }

  assert.equal(crewOf(state)?.status, "running");
  assert.deepEqual(crewOf(state)?.pads.p2, { state: "up", slot: 0, hearts: 2 });
});

test("does give no phone a pad for a block the tablet is playing", () => {
  const crew = crewOf(send(initialize(), "startBlock"));

  assert.ok(crew !== null);
  assert.ok(Object.values(crew.pads).every((pad) => pad.state === "out" && pad.slot === null));
});

test("does show the display exactly what it shows the host", () => {
  const { state } = fight(startWith(initialize(), ["p1", "p2"]), brawlCrewBrawler);

  for (const candidate of [initialize(), startWith(initialize(), ["p1"]), state]) {
    assert.deepEqual(
      brawlRuntimePlugin.selectDisplayView({ state: candidate, rules: RULES, content: null }),
      brawlRuntimePlugin.selectHostView({ state: candidate, rules: RULES, content: null })
    );
  }
});

test("does keep a turn's state its own game's and serialisable through a whole block", () => {
  const { state } = fight(startWith(initialize(), ["p1", "p2", "p3"]), brawlCrewBrawler);

  assert.ok(isBrawlRuntimeState(state));
  assert.deepEqual(JSON.parse(JSON.stringify(state)), state);
  assert.equal(isBrawlRuntimeState({ minigame: "FAPPY" }), false);
  assert.equal(isBrawlRuntimeState(null), false);
});

test("does read the block count and the seed from the rules, and load a pack still carrying the relay's heart price", () => {
  assert.deepEqual(resolveBrawlRules(null), DEFAULT_BRAWL_RULES);
  assert.deepEqual(resolveBrawlRules({ blocksPerTurn: 5, courseSeed: -7 }), { blocksPerTurn: 5, courseSeed: -7 });
  assert.deepEqual(resolveBrawlRules({ blocksPerTurn: 0, courseSeed: 1.5 }), DEFAULT_BRAWL_RULES);
  assert.equal(isBrawlRules({ blocksPerTurn: 3, courseSeed: 20261001, heartPrice: 3 }), true);
  assert.equal(isBrawlRules({ blocksPerTurn: 0 }), false);
  assert.equal(isBrawlRules({ courseSeed: "abc" }), false);
  assert.equal(isBrawlRules([]), false);
});

test("does score the share of the street the team banked, to the point", () => {
  assert.equal(resolveBrawlPoints(0, 100, 15), 0);
  assert.equal(resolveBrawlPoints(100, 100, 15), 15);
  assert.equal(resolveBrawlPoints(87, 100, 15), 13);
  assert.equal(resolveBrawlPoints(5, 0, 15), 15);
  assert.equal(resolveBrawlPoints(120, 100, 15), 15);
});
