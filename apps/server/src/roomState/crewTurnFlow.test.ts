import assert from "node:assert/strict";
import test, { beforeEach, mock } from "node:test";

import {
  PLAYER_MINIGAME_ACTION_REFUSAL_REASONS,
  Phase,
  toDisplayRoomStateSnapshot,
  toPlayerRoomStateSnapshot,
  type BrawlMinigameHostView
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import {
  applyRoomStateMutation,
  dispatchContestantMinigameAction,
  dispatchMinigameAction,
  dispatchServerMinigameAction,
  getRoomStateSnapshot,
  readContestantActionRefusal,
  readMinigameDeadline,
  resetRoomState,
  setRoundDeviceMode
} from "./index.js";
import { advanceUntil, seatPhone, setupArcadeNight } from "./testHarness.js";

// Streets of Barrie as the room runs it (docs/minigames/brawl-crew-spec.md §0.5, §0.6): every
// player on the active team is a pad at once, the server stamps who sent what, and the fight is
// stepped on the server's own clock. Round 3 of the arcade night; rounds rotate who opens, so
// each test reads whose turn it is off the room rather than assuming.
const BRAWL_ROUND = 3;
const T0 = 1_800_000_000_000;

const brawlView = (): BrawlMinigameHostView => {
  const view = getRoomStateSnapshot().minigameHostView;

  assert.ok(view !== null && view.minigame === "BRAWL");

  return view;
};

const playBrawlTurn = (deviceMode: "phones" | "tablet" = "phones"): { crew: string[]; rivals: string[] } => {
  setRoundDeviceMode(BRAWL_ROUND, deviceMode);

  for (const playerId of ["player-1", "player-2", "player-3", "player-4"]) {
    seatPhone(playerId);
  }

  advanceUntil(Phase.MINIGAME_PLAY, BRAWL_ROUND, 256);

  const room = getRoomStateSnapshot();
  const team = room.teams.find((candidate) => candidate.id === room.activeRoundTeamId);

  assert.ok(team !== undefined && team.playerIds.length === 2);

  return {
    crew: team.playerIds,
    rivals: room.players.map((player) => player.id).filter((playerId) => !team.playerIds.includes(playerId))
  };
};

const phoneSends = (playerId: string, actionType: string, actionPayload: SerializableValue = {}): string | null => {
  const refusal = readContestantActionRefusal(playerId, "BRAWL", actionType);

  if (refusal === null) {
    dispatchContestantMinigameAction(playerId, "BRAWL", actionType, actionPayload);
  }

  return refusal;
};

beforeEach(() => {
  mock.timers.reset();
  mock.timers.enable({ apis: ["Date"], now: T0 });
  resetRoomState();
  setupArcadeNight();
});

test("does make every player on the team a pad and nobody a contestant when a crew turn is played on phones", () => {
  const { crew } = playBrawlTurn();
  const room = getRoomStateSnapshot();

  assert.equal(room.contestantTurn, null, "a crew turn is not a relay's");
  assert.deepEqual(room.crewTurn, {
    minigame: "BRAWL",
    deviceMode: "phones",
    status: "ready",
    playerIds: crew,
    pads: Object.fromEntries(crew.map((playerId) => [playerId, { state: "out", slot: null, hearts: 0 }]))
  });
});

test("does let both teammates step out and play at once, each moving her own hen", () => {
  const { crew } = playBrawlTurn();
  const [first, second] = crew as [string, string];

  assert.equal(phoneSends(second, "stepOut"), null);
  assert.equal(phoneSends(first, "stepOut"), null);
  assert.deepEqual(getRoomStateSnapshot().crewTurn?.pads, {
    [second]: { state: "up", slot: 0, hearts: 3 },
    [first]: { state: "up", slot: 1, hearts: 3 }
  });

  dispatchMinigameAction("BRAWL", "startBlock", {});
  mock.timers.tick(500);

  assert.equal(phoneSends(first, "walk", { dir: 1 }), null);
  assert.equal(phoneSends(second, "peck", { held: true }), null);

  const frame = brawlView().blocks[0]?.frame;

  assert.equal(frame?.hens[1]?.walk, 1, "the first player is slot 1");
  assert.equal(frame?.hens[0]?.walk, 0);
  assert.equal(frame?.hens[0]?.peckHeld, true);
  assert.equal(getRoomStateSnapshot().crewTurn?.status, "running");
});

test("does refuse a rival's phone, a hatch from a crew phone, and a phone that tries to start block one", () => {
  const { crew, rivals } = playBrawlTurn();

  assert.equal(phoneSends(rivals[0] ?? "", "stepOut"), PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.NOT_IN_CREW);

  for (const actionType of ["startBlock", "skipBlock", "resetTurn", "pulse"]) {
    assert.equal(phoneSends(crew[0] ?? "", actionType), PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.HOST_ONLY_ACTION, actionType);
  }

  assert.equal(brawlView().blocks[0]?.status, "ready");
});

test("does ignore the tablet's thumbs in a crew's fight: the tablet is never a pad beside phones", () => {
  const { crew } = playBrawlTurn();

  phoneSends(crew[0] ?? "", "stepOut");
  dispatchMinigameAction("BRAWL", "startBlock", {});
  mock.timers.tick(200);

  assert.equal(
    applyRoomStateMutation(() => dispatchMinigameAction("BRAWL", "walk", { dir: 1 })).didMutate,
    false
  );
});

test("does give no phone a pad and play one hen on the tablet when the turn is locked to the tablet", () => {
  const { crew } = playBrawlTurn("tablet");

  assert.deepEqual(getRoomStateSnapshot().crewTurn?.playerIds, []);
  assert.equal(phoneSends(crew[0] ?? "", "stepOut"), PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.TABLET_MODE);

  dispatchMinigameAction("BRAWL", "startBlock", {});
  mock.timers.tick(200);
  dispatchMinigameAction("BRAWL", "walk", { dir: 1 });

  const block = brawlView().blocks[0];

  assert.equal(block?.tablet, true);
  assert.equal(block?.crewSize, 1);
  assert.equal(block?.frame?.hens[0]?.walk, 1);
});

test("does step the fight on the server's own clock when no thumb moves", () => {
  const { crew } = playBrawlTurn();

  phoneSends(crew[0] ?? "", "stepOut");

  assert.equal(readMinigameDeadline(), null, "nothing runs until the host starts it");

  dispatchMinigameAction("BRAWL", "startBlock", {});

  const deadline = readMinigameDeadline();

  assert.deepEqual(deadline, { minigameId: "BRAWL", actionType: "pulse", atMs: T0 + 500 });

  mock.timers.tick(525);
  dispatchServerMinigameAction("BRAWL", "pulse", Date.now());

  assert.equal(brawlView().blocks[0]?.frame?.tick, 31);
  assert.equal(readMinigameDeadline()?.atMs, T0 + Math.ceil(((31 + 30) * 1000) / 60));
});

test("does leave the phones' snapshot alone when a thumb moves and send the wall the new frame", () => {
  const { crew } = playBrawlTurn();

  phoneSends(crew[0] ?? "", "stepOut");
  dispatchMinigameAction("BRAWL", "startBlock", {});
  mock.timers.tick(300);

  const before = getRoomStateSnapshot();

  phoneSends(crew[0] ?? "", "walk", { dir: 3 });

  const after = getRoomStateSnapshot();

  assert.deepEqual(toPlayerRoomStateSnapshot(after), toPlayerRoomStateSnapshot(before));
  assert.notDeepEqual(toDisplayRoomStateSnapshot(after).minigameDisplayView, toDisplayRoomStateSnapshot(before).minigameDisplayView);
});

test("does not make a thumb the host's undo point", () => {
  const { crew } = playBrawlTurn();

  phoneSends(crew[0] ?? "", "stepOut");
  dispatchMinigameAction("BRAWL", "startBlock", {});

  const canRedo = getRoomStateSnapshot().canRedoScoringMutation;

  mock.timers.tick(300);
  phoneSends(crew[0] ?? "", "walk", { dir: 1 });
  dispatchServerMinigameAction("BRAWL", "pulse", Date.now() + 600);

  assert.equal(getRoomStateSnapshot().canRedoScoringMutation, canRedo);
});
