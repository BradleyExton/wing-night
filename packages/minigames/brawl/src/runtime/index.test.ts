import assert from "node:assert/strict";
import test from "node:test";
import type { BrawlBestTurn, BrawlInput, BrawlMinigameHostView, Player, Team } from "@wingnight/shared";
import { BRAWL_WORLD, resolveBrawlBlockWorth, resolveBrawlCourseTotal, runBrawlRun } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { canBuyBrawlHeart, isBrawlRuntimeState } from "./guards/index.js";
import { isBrawlRules, resolveBrawlRules } from "./rules/index.js";
import { resolveBrawlPoints, resolveGoonsDown, resolveHeartsPaid } from "./scoring/index.js";
import { DEFAULT_BRAWL_RULES, type BrawlRuntimeState } from "./types/index.js";
import { brawlRuntimePlugin } from "./index.js";

const PLAYERS: Player[] = [
  { id: "p1", name: "Alex" },
  { id: "p2", name: "Caitlin" },
  { id: "p3", name: "Dan" }
];

const TEAMS: Team[] = [
  { id: "team-a", name: "Team A", playerIds: ["p1", "p2", "p3"], totalScore: 0 },
  { id: "team-b", name: "Team B", playerIds: [], totalScore: 0 }
];

const RULES = { blocksPerTurn: 2, courseSeed: 20261001 };
const POINTS_MAX = 15;

const initialize = (
  rules: SerializableValue = RULES,
  options: {
    activeRoundTeamId?: string;
    roundMemory?: SerializableValue | null;
    pendingPointsByTeamId?: Record<string, number>;
  } = {}
): SerializableValue => {
  const state = brawlRuntimePlugin.initialize({
    teamIds: ["team-a", "team-b"],
    players: PLAYERS,
    teams: TEAMS,
    activeRoundTeamId: options.activeRoundTeamId ?? "team-a",
    pointsMax: POINTS_MAX,
    pendingPointsByTeamId: options.pendingPointsByTeamId ?? { "team-a": 0, "team-b": 0 },
    rules,
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
  return brawlRuntimePlugin.reduceAction({
    state,
    envelope: { actionType, actionPayload, receivedAtMs: 1000 },
    pointsMax: POINTS_MAX,
    rules: RULES,
    content: null
  });
};

// The state itself, for the tests that need no view: a view reads the course's total off the
// sim, and these are about the reducer's own bookkeeping.
const runtimeState = (state: SerializableValue): BrawlRuntimeState => {
  assert.ok(isBrawlRuntimeState(state));

  return state;
};

const hostView = (state: SerializableValue): BrawlMinigameHostView => {
  const view = brawlRuntimePlugin.selectHostView({ state, rules: RULES, content: null });

  assert.ok(view !== null && view.minigame === "BRAWL");

  return view;
};

// A mashing log: hold right from the line and peck twice a second for the whole block. It is what
// everyone does first, so it is what the referee should be seen to score.
const MASH: BrawlInput[] = [
  { tick: 0, kind: "walk", dir: 1 },
  ...Array.from({ length: Math.floor(BRAWL_WORLD.blockTicks / 30) }, (_unused, index) => ({
    tick: index * 30,
    kind: "peck" as const
  }))
];

const sendInput = (state: SerializableValue, input: BrawlInput): SerializableValue => {
  return input.kind === "walk"
    ? reduce(state, "walk", { tick: input.tick, dir: input.dir }).state
    : reduce(state, "peck", { tick: input.tick }).state;
};

const playBlock = (state: SerializableValue, inputs: readonly BrawlInput[]): SerializableValue => {
  const logged = inputs.reduce(sendInput, state);

  return reduce(logged, "endBlock").state;
};

const roundMemory = (state: SerializableValue): SerializableValue | null => {
  return brawlRuntimePlugin.selectRoundMemory?.({ state, rules: RULES, content: null }) ?? null;
};

const memoryBestTurn = (state: SerializableValue): BrawlBestTurn | null => {
  const memory = roundMemory(state);

  assert.ok(memory !== null && typeof memory === "object" && !Array.isArray(memory) && "bestTurn" in memory);

  return memory.bestTurn as BrawlBestTurn | null;
};

test("does deal one block to each seated player, in seating order, when the turn opens", () => {
  const state = runtimeState(initialize({ ...RULES, blocksPerTurn: 3 }));

  assert.deepEqual(
    state.blocks.map((block) => block.player?.name),
    ["Alex", "Caitlin", "Dan"]
  );
  assert.deepEqual(
    state.blocks.map((block) => block.status),
    ["ready", "ready", "ready"]
  );
  assert.equal(state.blockIndex, 0);
  assert.equal(state.courseSeed, RULES.courseSeed);
  assert.equal(state.bestTurn, null);
});

test("does cycle a short roster when the course has more blocks than players", () => {
  const state = runtimeState(initialize({ ...RULES, blocksPerTurn: 5 }));

  assert.deepEqual(
    state.blocks.map((block) => block.player?.name),
    ["Alex", "Caitlin", "Dan", "Alex", "Caitlin"]
  );
});

test("does fight with the house hen when nobody on the team is seated", () => {
  const state = runtimeState(initialize(RULES, { activeRoundTeamId: "team-b" }));

  assert.deepEqual(
    state.blocks.map((block) => block.player),
    [null, null]
  );
});

test("does log a walk and start the block when the left thumb lands", () => {
  const walked = reduce(initialize(), "walk", { tick: 0, dir: 1 });
  const block = runtimeState(walked.state).blocks[0];

  assert.equal(walked.didMutate, true);
  assert.equal(block?.status, "running");
  assert.deepEqual(block?.inputs, [{ tick: 0, kind: "walk", dir: 1 }]);
});

test("does log a walk and a peck on the same tick when both thumbs land together", () => {
  const walked = reduce(initialize(), "walk", { tick: 12, dir: -1 });
  const pecked = reduce(walked.state, "peck", { tick: 12 });
  const lifted = reduce(pecked.state, "walk", { tick: 40, dir: 0 });

  assert.equal(pecked.didMutate, true);
  assert.deepEqual(runtimeState(lifted.state).blocks[0]?.inputs, [
    { tick: 12, kind: "walk", dir: -1 },
    { tick: 12, kind: "peck" },
    { tick: 40, kind: "walk", dir: 0 }
  ]);
});

test("does refuse an input when its tick is earlier than the log's last", () => {
  const pecked = reduce(initialize(), "peck", { tick: 10 });

  assert.equal(reduce(pecked.state, "peck", { tick: 9 }).didMutate, false);
  assert.equal(reduce(pecked.state, "walk", { tick: 4, dir: 1 }).didMutate, false);
});

test("does refuse a thumb when its payload is malformed", () => {
  const state = initialize();

  assert.equal(reduce(state, "peck", {}).didMutate, false);
  assert.equal(reduce(state, "peck", { tick: -1 }).didMutate, false);
  assert.equal(reduce(state, "peck", { tick: 1.5 }).didMutate, false);
  assert.equal(reduce(state, "walk", { tick: 0 }).didMutate, false);
  assert.equal(reduce(state, "walk", { tick: 0, dir: 2 }).didMutate, false);
  assert.equal(reduce(state, "walk", { tick: 0, dir: "right" }).didMutate, false);
  assert.equal(reduce(state, "walk", [] as SerializableValue).didMutate, false);
  assert.equal(reduce(state, "punch", { tick: 0 }).didMutate, false);
});

test("does refuse to end a block when nobody has started it", () => {
  assert.equal(reduce(initialize(), "endBlock").didMutate, false);
});

test("does ignore state when it is not its own", () => {
  assert.equal(brawlRuntimePlugin.selectHostView({ state: { nope: true }, rules: null, content: null }), null);
  assert.equal(brawlRuntimePlugin.selectDisplayView({ state: null, rules: null, content: null }), null);
  assert.equal(brawlRuntimePlugin.selectRoundMemory?.({ state: { nope: true }, rules: null, content: null }), null);
  assert.equal(reduce({ nope: true }, "peck", { tick: 0 }).didMutate, false);
});

test("does score the worth put down against the course's whole worth", () => {
  assert.equal(resolveBrawlPoints(0, 27, 15), 0);
  assert.equal(resolveBrawlPoints(24, 27, 15), 13);
  assert.equal(resolveBrawlPoints(27, 27, 15), 15);
  // The course is the ceiling.
  assert.equal(resolveBrawlPoints(40, 27, 15), 15);
  assert.equal(
    resolveGoonsDown(
      [
        { blockIndex: 0, player: null, status: "done", inputs: [], skipped: false, result: { outcome: "ko", endTick: 10, goons: 5, hearts: 0 }, heartBought: false },
        { blockIndex: 1, player: null, status: "done", inputs: [], skipped: true, result: null, heartBought: false }
      ],
      3
    ),
    5
  );
});

test("does bank each heart she walked off with when a block was cleared, and none from the bay or the bell", () => {
  const block = (result: { outcome: "cleared" | "ko" | "timeout"; goons: number; hearts: number }) => ({
    blockIndex: 0,
    player: null,
    status: "done" as const,
    inputs: [],
    skipped: false,
    result: { endTick: 10, ...result },
    heartBought: false
  });

  assert.equal(resolveGoonsDown([block({ outcome: "cleared", goons: 11, hearts: 2 })], 3), 11 + 2 * BRAWL_WORLD.heartWorth);
  assert.equal(resolveGoonsDown([block({ outcome: "ko", goons: 4, hearts: 0 })], 3), 4);
  assert.equal(resolveGoonsDown([block({ outcome: "timeout", goons: 4, hearts: 3 })], 3), 4);
  assert.equal(
    resolveGoonsDown([block({ outcome: "cleared", goons: 11, hearts: 3 }), block({ outcome: "ko", goons: 6, hearts: 0 })], 3),
    11 + 3 * BRAWL_WORLD.heartWorth + 6
  );
});

test("does take each bought heart's price off the bank and never bank a fourth heart back when it scores", () => {
  const block = (blockIndex: number, heartBought: boolean, result: { outcome: "cleared" | "ko"; goons: number; hearts: number } | null) => ({
    blockIndex,
    player: null,
    status: "done" as const,
    inputs: [],
    skipped: result === null,
    result: result === null ? null : { endTick: 10, ...result },
    heartBought
  });
  // Block 0 banks 11 and three hearts; block 1 buys a heart and walks off with all four of them.
  const turn = [block(0, false, { outcome: "cleared", goons: 11, hearts: 3 }), block(1, true, { outcome: "cleared", goons: 15, hearts: 4 })];

  assert.equal(resolveHeartsPaid(turn, 3), 3);
  assert.equal(resolveGoonsDown(turn, 3), 11 + 3 + (15 + 3) - 3);
  // A heart bought for a block that was then skipped stays paid.
  assert.equal(resolveGoonsDown([turn[0]!, block(1, true, null)], 3), 11 + 3 - 3);
  assert.equal(resolveGoonsDown([turn[0]!, block(1, true, null)], 5), 11 + 3 - 5);
});

test("does take the round's rules and fall back to the defaults when a field is missing", () => {
  assert.deepEqual(resolveBrawlRules(null), DEFAULT_BRAWL_RULES);
  assert.equal(DEFAULT_BRAWL_RULES.heartPrice, 3);
  assert.deepEqual(resolveBrawlRules({ blocksPerTurn: 4 }), { ...DEFAULT_BRAWL_RULES, blocksPerTurn: 4 });
  assert.equal(resolveBrawlRules({ heartPrice: 5 }).heartPrice, 5);
  assert.equal(resolveBrawlRules({ heartPrice: 0 }).heartPrice, DEFAULT_BRAWL_RULES.heartPrice);
  assert.equal(resolveBrawlRules({ heartPrice: "3" }).heartPrice, DEFAULT_BRAWL_RULES.heartPrice);
  // A seed is a hash input, not a count: negative is fine.
  assert.equal(resolveBrawlRules({ courseSeed: -12 }).courseSeed, -12);
  assert.equal(resolveBrawlRules({ blocksPerTurn: 0 }).blocksPerTurn, DEFAULT_BRAWL_RULES.blocksPerTurn);
});

test("does refuse a rules block at config-load time when the pack got it wrong", () => {
  assert.equal(isBrawlRules({}), true);
  assert.equal(isBrawlRules({ blocksPerTurn: 3, courseSeed: 20261001 }), true);
  assert.equal(isBrawlRules({ courseSeed: -5 }), true);
  assert.equal(isBrawlRules({ blocksPerTurn: 0 }), false);
  assert.equal(isBrawlRules({ blocksPerTurn: 2.5 }), false);
  assert.equal(isBrawlRules({ courseSeed: 1.5 }), false);
  assert.equal(isBrawlRules({ courseSeed: "seed" }), false);
  assert.equal(isBrawlRules({ heartPrice: 3 }), true);
  assert.equal(isBrawlRules({ heartPrice: 0 }), false);
  assert.equal(isBrawlRules({ heartPrice: 2.5 }), false);
  assert.equal(isBrawlRules({ heartPrice: "3" }), false);
  assert.equal(isBrawlRules([]), false);
  assert.equal(isBrawlRules(null), false);
});

test("does re-read the round's running totals without touching the blocks", () => {
  const state = reduce(initialize(), "peck", { tick: 0 }).state;
  const synced = brawlRuntimePlugin.syncPendingPoints?.({
    state,
    pendingPointsByTeamId: { "team-a": 9, "team-b": 3 }
  });

  assert.ok(synced !== undefined);
  assert.deepEqual(runtimeState(synced).pendingPointsByTeamId, { "team-a": 9, "team-b": 3 });
  assert.equal(runtimeState(synced).blocks[0]?.status, "running");
});

// Everything below reads a view or ends a block, so it runs the shared sim.

test("does carry the course's whole worth and nothing banked when the turn opens", () => {
  const view = hostView(initialize());

  assert.equal(view.phase, "ready");
  assert.equal(view.blockIndex, 0);
  assert.equal(view.blocksPerTurn, 2);
  assert.equal(view.goonsDown, 0);
  assert.equal(view.goonsTotal, resolveBrawlCourseTotal({ seed: RULES.courseSeed, blocks: RULES.blocksPerTurn }));
  assert.equal(view.points, null);
  assert.equal(view.bestTurn, null);
});

test("does referee the block from its own re-run of the log when the tablet ends it", () => {
  const ended = reduce(MASH.reduce(sendInput, initialize()), "endBlock");
  const view = hostView(ended.state);
  const refereed = runBrawlRun({ seed: RULES.courseSeed, blocks: RULES.blocksPerTurn, block: 0 }, MASH);

  assert.equal(ended.didMutate, true);
  assert.equal(view.blockIndex, 1);
  assert.equal(view.phase, "ready");
  assert.equal(view.blocks[0]?.status, "done");
  assert.deepEqual(view.blocks[0]?.result, {
    outcome: refereed.outcome,
    endTick: refereed.endTick,
    goons: refereed.goons,
    hearts: refereed.frame.hearts
  });
  // The view banks the referee's worth and, if she walked off, her hearts.
  assert.equal(
    view.goonsDown,
    resolveBrawlBlockWorth({ outcome: refereed.outcome === "running" ? "timeout" : refereed.outcome, goons: refereed.goons, hearts: refereed.frame.hearts })
  );
});

test("does referee each block on its own stretch of street when the tablet changes hands", () => {
  const played = playBlock(playBlock(initialize(), MASH), MASH);
  const view = hostView(played);
  const refereed = (block: number) => runBrawlRun({ seed: RULES.courseSeed, blocks: RULES.blocksPerTurn, block }, MASH);
  const worth = (block: number) => {
    const run = refereed(block);

    return resolveBrawlBlockWorth({ outcome: run.outcome === "running" ? "timeout" : run.outcome, goons: run.goons, hearts: run.frame.hearts });
  };

  assert.equal(view.phase, "finished");
  assert.equal(view.blocks[0]?.result?.goons, refereed(0).goons);
  assert.equal(view.blocks[1]?.result?.goons, refereed(1).goons);
  assert.equal(view.goonsDown, worth(0) + worth(1));
  assert.equal(view.points, resolveBrawlPoints(view.goonsDown, view.goonsTotal, POINTS_MAX));
  assert.equal(view.pendingPointsByTeamId["team-a"], view.points);
});

test("does bank nothing and move on when the host skips a block", () => {
  const skipped = reduce(initialize(), "skipBlock");
  const view = hostView(skipped.state);

  assert.equal(skipped.didMutate, true);
  assert.equal(view.blockIndex, 1);
  assert.equal(view.blocks[0]?.skipped, true);
  assert.equal(view.blocks[0]?.result, null);
  assert.equal(view.goonsDown, 0);
});

test("does finish the turn and refuse more input when every block is behind the team", () => {
  const finished = reduce(reduce(initialize(), "skipBlock").state, "skipBlock").state;
  const view = hostView(finished);

  assert.equal(view.phase, "finished");
  assert.equal(view.points, 0);
  assert.equal(reduce(finished, "peck", { tick: 0 }).didMutate, false);
  assert.equal(reduce(finished, "skipBlock").didMutate, false);
  assert.equal(reduce(finished, "endBlock").didMutate, false);
});

test("does hand back exactly what the turn banked when the host resets it", () => {
  const start = initialize(RULES, { pendingPointsByTeamId: { "team-a": 4, "team-b": 0 } });
  const played = playBlock(start, MASH);

  assert.ok(hostView(played).goonsDown > 0, "the mashing log must put a goon down");
  assert.ok((hostView(played).pendingPointsByTeamId["team-a"] ?? 0) > 4);

  const reset = reduce(played, "resetTurn");
  const view = hostView(reset.state);

  assert.equal(reset.didMutate, true);
  assert.equal(view.blockIndex, 0);
  assert.equal(view.phase, "ready");
  assert.equal(view.goonsDown, 0);
  assert.equal(view.pendingPointsByTeamId["team-a"], 4);
  assert.deepEqual(
    view.blocks.map((block) => block.inputs),
    [[], []]
  );
  // A reset keeps the seating it was dealt.
  assert.deepEqual(
    view.blocks.map((block) => block.player?.name),
    ["Alex", "Caitlin"]
  );
});

test("does keep the display view free of anything the host view does not also carry", () => {
  const state = reduce(initialize(), "peck", { tick: 0 }).state;
  const host = brawlRuntimePlugin.selectHostView({ state, rules: RULES, content: null });
  const display = brawlRuntimePlugin.selectDisplayView({ state, rules: RULES, content: null });

  assert.deepEqual(display, host);
});

const ONE_BLOCK = { blocksPerTurn: 1, courseSeed: RULES.courseSeed };
const MASH_GOONS = (): number => runBrawlRun({ seed: ONE_BLOCK.courseSeed, blocks: 1, block: 0 }, MASH).goons;
const inherited = (goons: number): SerializableValue => ({
  bestTurn: { teamId: "team-b", teamName: "Team B", goons }
});

test("does start a round with nothing to beat when no turn has finished", () => {
  assert.deepEqual(roundMemory(initialize()), { bestTurn: null });
});

test("does hand a finished turn on as the one to beat when it put something down", () => {
  const played = playBlock(initialize(ONE_BLOCK), MASH);

  assert.ok(MASH_GOONS() > 0, "the mashing log must put a goon down");
  // The turn in hand never sees itself as the one to beat.
  assert.equal(hostView(played).bestTurn, null);
  assert.deepEqual(memoryBestTurn(played), { teamId: "team-a", teamName: "Team A", goons: MASH_GOONS() });
});

test("does keep whichever of the inherited turn and its own put down more when the turn ends", () => {
  const goons = MASH_GOONS();
  const beaten = playBlock(initialize(ONE_BLOCK, { roundMemory: inherited(goons - 1) }), MASH);
  const standing = playBlock(initialize(ONE_BLOCK, { roundMemory: inherited(goons + 1) }), MASH);
  // A draw keeps the standing one: a target should not move for a tie.
  const tied = playBlock(initialize(ONE_BLOCK, { roundMemory: inherited(goons) }), MASH);

  assert.equal(memoryBestTurn(beaten)?.teamId, "team-a");
  assert.equal(memoryBestTurn(beaten)?.goons, goons);
  assert.equal(memoryBestTurn(standing)?.teamId, "team-b");
  assert.equal(memoryBestTurn(tied)?.teamId, "team-b");
});

test("does hand on nothing of its own when the turn is unfinished or put nothing down", () => {
  const halfway = playBlock(initialize(), MASH);
  const skippedAll = reduce(initialize(ONE_BLOCK), "skipBlock").state;

  assert.equal(hostView(halfway).phase, "ready");
  assert.equal(memoryBestTurn(halfway), null);
  assert.equal(hostView(skippedAll).phase, "finished");
  assert.equal(memoryBestTurn(skippedAll), null);
});

test("does show the next team the number to beat when the round's memory carries one", () => {
  const memory = roundMemory(playBlock(initialize(ONE_BLOCK), MASH));
  const view = hostView(initialize(ONE_BLOCK, { activeRoundTeamId: "team-b", roundMemory: memory }));

  assert.equal(view.activeTurnTeamId, "team-b");
  assert.deepEqual(view.bestTurn, { teamId: "team-a", teamName: "Team A", goons: MASH_GOONS() });
  assert.equal(view.blockIndex, 0);
  assert.equal(view.goonsDown, 0);
});

test("does ignore a memory when it is not its own", () => {
  assert.equal(runtimeState(initialize(RULES, { roundMemory: { towers: [1, 2] } })).bestTurn, null);
  assert.equal(runtimeState(initialize(RULES, { roundMemory: "yes" })).bestTurn, null);
  assert.equal(runtimeState(initialize(RULES, { roundMemory: { bestTurn: { wings: 3 } } })).bestTurn, null);
});

test("does leave the memory as it inherited it when the turn is put back on the street", () => {
  const played = playBlock(initialize(ONE_BLOCK, { roundMemory: inherited(0) }), MASH);

  assert.equal(memoryBestTurn(played)?.teamId, "team-a");

  const reset = reduce(played, "resetTurn").state;

  assert.equal(memoryBestTurn(reset)?.teamId, "team-b");
  assert.equal(memoryBestTurn(reset)?.goons, 0);
});

// The handoff pick (spec §0.3): a fourth heart for `heartPrice` of the bank, on a block after the
// first, before its first touch. The mashing log banks five on block 0, so block 1 can afford one.
const HEART_PRICE = DEFAULT_BRAWL_RULES.heartPrice;
const onBlockOne = (): SerializableValue => playBlock(initialize(), MASH);

test("does offer the heart only on a ready block after the first, once, and only to a team that can pay", () => {
  const ready = { blockIndex: 1, status: "ready" as const, heartBought: false };

  assert.equal(canBuyBrawlHeart({ block: ready, banked: HEART_PRICE, heartPrice: HEART_PRICE }), true);
  assert.equal(canBuyBrawlHeart({ block: { ...ready, blockIndex: 0 }, banked: 10, heartPrice: HEART_PRICE }), false);
  assert.equal(canBuyBrawlHeart({ block: { ...ready, status: "running" }, banked: 10, heartPrice: HEART_PRICE }), false);
  assert.equal(canBuyBrawlHeart({ block: { ...ready, status: "done" }, banked: 10, heartPrice: HEART_PRICE }), false);
  assert.equal(canBuyBrawlHeart({ block: { ...ready, heartBought: true }, banked: 10, heartPrice: HEART_PRICE }), false);
  assert.equal(canBuyBrawlHeart({ block: ready, banked: HEART_PRICE - 1, heartPrice: HEART_PRICE }), false);
  assert.equal(canBuyBrawlHeart({ block: null, banked: 10, heartPrice: HEART_PRICE }), false);
});

test("does start the block on four hearts and take the price off the bank when the teammate on the line buys a heart", () => {
  const before = hostView(onBlockOne());
  const bought = reduce(onBlockOne(), "buyHeart");
  const view = hostView(bought.state);

  assert.ok(before.goonsDown >= HEART_PRICE, "the mashing log must bank enough to buy with");
  assert.equal(bought.didMutate, true);
  assert.equal(view.heartPrice, HEART_PRICE);
  assert.equal(view.blocks[1]?.heartBought, true);
  assert.equal(view.blocks[1]?.status, "ready");
  assert.equal(view.goonsDown, before.goonsDown - HEART_PRICE);
  assert.equal(view.pendingPointsByTeamId["team-a"], resolveBrawlPoints(view.goonsDown, view.goonsTotal, POINTS_MAX));
  // The course's whole worth does not move: a bought heart only lowers the numerator.
  assert.equal(view.goonsTotal, before.goonsTotal);

  // The referee re-runs the bought block from four hearts.
  const ended = hostView(playBlock(bought.state, MASH));
  const refereed = runBrawlRun({ seed: RULES.courseSeed, blocks: RULES.blocksPerTurn, block: 1, hearts: 4 }, MASH);

  assert.equal(ended.blocks[1]?.result?.endTick, refereed.endTick);
  assert.equal(ended.blocks[1]?.result?.goons, refereed.goons);
  assert.notEqual(refereed.endTick, runBrawlRun({ seed: RULES.courseSeed, blocks: RULES.blocksPerTurn, block: 1 }, MASH).endTick);
});

test("does refuse a heart on the first block, once the block has started, a second time and when the bank cannot cover it", () => {
  // The first block: nothing banked to spend, and no handoff before it.
  assert.equal(reduce(initialize(), "buyHeart").didMutate, false);
  // The first thumb on the street closed the offer.
  assert.equal(reduce(reduce(onBlockOne(), "peck", { tick: 0 }).state, "buyHeart").didMutate, false);
  // Once is the whole offer.
  assert.equal(reduce(reduce(onBlockOne(), "buyHeart").state, "buyHeart").didMutate, false);
  // A skipped first block banks nothing, so there is nothing to pay with.
  assert.equal(reduce(reduce(initialize(), "skipBlock").state, "buyHeart").didMutate, false);
  // A dearer heart than the bank holds.
  const dear = playBlock(initialize({ ...RULES, heartPrice: 50 }), MASH);

  assert.equal(reduce(dear, "buyHeart").didMutate, false);
  // A payload that is not a record, and a turn that is over.
  assert.equal(reduce(onBlockOne(), "buyHeart", [] as SerializableValue).didMutate, false);
  assert.equal(reduce(reduce(onBlockOne(), "skipBlock").state, "buyHeart").didMutate, false);
});

test("does keep the price paid when the host skips a block the team bought a heart for", () => {
  const before = hostView(onBlockOne());
  const skipped = hostView(reduce(reduce(onBlockOne(), "buyHeart").state, "skipBlock").state);

  assert.equal(skipped.phase, "finished");
  assert.equal(skipped.blocks[1]?.heartBought, true);
  assert.equal(skipped.blocks[1]?.skipped, true);
  assert.equal(skipped.goonsDown, before.goonsDown - HEART_PRICE);
});

test("does unbuy every heart and refund its price when the host resets the turn", () => {
  const bought = reduce(onBlockOne(), "buyHeart").state;
  const reset = hostView(reduce(bought, "resetTurn").state);

  assert.deepEqual(
    reset.blocks.map((block) => block.heartBought),
    [false, false]
  );
  assert.equal(reset.goonsDown, 0);
  assert.equal(reset.pendingPointsByTeamId["team-a"], 0);
});

test("does hand on the finished turn's worth after its purchases as the one to beat", () => {
  const kept = playBlock(onBlockOne(), MASH);
  const bought = playBlock(reduce(onBlockOne(), "buyHeart").state, MASH);
  const keptWorth = hostView(kept).goonsDown;
  const boughtWorth = hostView(bought).goonsDown;

  assert.equal(memoryBestTurn(kept)?.goons, keptWorth);
  assert.equal(memoryBestTurn(bought)?.goons, boughtWorth);
  assert.equal(
    boughtWorth,
    resolveGoonsDown(runtimeState(bought).blocks, HEART_PRICE),
    "the turn to beat is the bank after the heart's price"
  );
  assert.ok(runtimeState(bought).blocks[1]?.heartBought);
});
