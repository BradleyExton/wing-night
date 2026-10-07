import assert from "node:assert/strict";
import test, { afterEach, beforeEach } from "node:test";

import { PLAYER_CLAIM_GONE_REASONS, Phase, type Player } from "@wingnight/shared";

import { playerClaimStore, type ReleasedPlayerClaim } from "../../playerClaims/index.js";
import {
  advanceRoomStatePhase,
  rotatePlayerJoinTokenByHost,
  setRoomStateFatalError,
  applyRoomStateMutation,
  getRoomStateSnapshot,
  releasePlayerClaimByHost,
  resetGameToSetup,
  resetRoomState,
  setRoomStateGameConfig,
  setRoomStatePlayers,
  setRoomStateTeams,
  startQuickPlay,
  syncPlayerClaimFlags
} from "../index.js";
import { gameConfigFixture, setRoomStateTriviaPrompts, triviaPromptFixture } from "../testHarness.js";

const ROSTER: Player[] = [
  { id: "player-1", name: "Alex" },
  { id: "player-2", name: "Morgan" },
  { id: "player-3", name: "Jamie" }
];

let released: ReleasedPlayerClaim[] = [];
let stopListening = (): void => {};

const seedRoom = (): void => {
  setRoomStateGameConfig(gameConfigFixture);
  setRoomStatePlayers(ROSTER);
  setRoomStateTeams([
    { id: "team-1", name: "Molten Metal", playerIds: ["player-1"], totalScore: 0 },
    { id: "team-2", name: "Spice Girls", playerIds: ["player-2", "player-3"], totalScore: 0 }
  ]);
  setRoomStateTriviaPrompts(triviaPromptFixture);
};

// A phone taking a face the way the socket layer does: the store, then the sync.
const claimFace = (playerId: string, socketId: string): string => {
  const outcome = playerClaimStore.claim({
    players: getRoomStateSnapshot().players,
    playerId,
    socketId,
    claimSecret: null,
    peerAddress: null
  });

  assert.equal(outcome.ok, true);
  syncPlayerClaimFlags();

  return outcome.ok ? outcome.claimSecret : "";
};

beforeEach(() => {
  resetRoomState();
  seedRoom();
  released = [];
  stopListening = playerClaimStore.onClaimReleased((claim) => {
    released.push(claim);
  });
});

afterEach(() => {
  stopListening();
});

test("does publish claimed and connected ids when a phone claims and then sleeps", () => {
  claimFace("player-2", "socket-a");

  assert.deepEqual(getRoomStateSnapshot().claimedPlayerIds, ["player-2"]);
  assert.deepEqual(getRoomStateSnapshot().connectedPlayerIds, ["player-2"]);

  playerClaimStore.disconnect("socket-a");
  const result = applyRoomStateMutation(syncPlayerClaimFlags);

  assert.equal(result.didMutate, true);
  assert.deepEqual(result.roomState.claimedPlayerIds, ["player-2"]);
  assert.deepEqual(result.roomState.connectedPlayerIds, []);
  // Nothing moved the second time, so nothing would be broadcast.
  assert.equal(applyRoomStateMutation(syncPlayerClaimFlags).didMutate, false);
});

test("does clear every claim and rotate the join token when the host resets the game", () => {
  claimFace("player-1", "socket-a");
  claimFace("player-3", "socket-b");
  const joinTokenBefore = playerClaimStore.getJoinToken();

  const result = applyRoomStateMutation(resetGameToSetup);

  assert.equal(result.didMutate, true);
  assert.deepEqual(result.roomState.claimedPlayerIds, []);
  assert.deepEqual(result.roomState.connectedPlayerIds, []);
  assert.notEqual(playerClaimStore.getJoinToken(), joinTokenBefore);
  assert.equal(playerClaimStore.isJoinToken(joinTokenBefore), false);
  assert.deepEqual(
    released.map((claim) => [claim.playerId, claim.socketId, claim.reason]),
    [
      ["player-1", "socket-a", PLAYER_CLAIM_GONE_REASONS.NIGHT_RESET],
      ["player-3", "socket-b", PLAYER_CLAIM_GONE_REASONS.NIGHT_RESET]
    ]
  );
});

test("does rotate the join token on reset even when no phone had joined", () => {
  const joinTokenBefore = playerClaimStore.getJoinToken();

  resetGameToSetup();

  assert.notEqual(playerClaimStore.getJoinToken(), joinTokenBefore);
});

test("does drop the claims a content reload orphans when the players are rewritten", () => {
  claimFace("player-1", "socket-a");
  claimFace("player-2", "socket-b");
  claimFace("player-3", "socket-c");

  // Positional ids: Morgan is gone, so Jamie is now player-2 and Sam is player-3.
  setRoomStatePlayers([
    { id: "player-1", name: "Alex" },
    { id: "player-2", name: "Jamie" },
    { id: "player-3", name: "Sam" }
  ]);

  assert.deepEqual(getRoomStateSnapshot().claimedPlayerIds, ["player-1"]);
  assert.deepEqual(
    released.map((claim) => [claim.playerId, claim.reason]),
    [
      ["player-2", PLAYER_CLAIM_GONE_REASONS.ROSTER_CHANGED],
      ["player-3", PLAYER_CLAIM_GONE_REASONS.ROSTER_CHANGED]
    ]
  );
});

test("does keep every claim when the players are rewritten unchanged", () => {
  claimFace("player-1", "socket-a");
  claimFace("player-3", "socket-c");

  setRoomStatePlayers(ROSTER);

  assert.deepEqual(getRoomStateSnapshot().claimedPlayerIds, ["player-1", "player-3"]);
  assert.deepEqual(released, []);
});

test("does drop the claims of players Quick Play did not deal in", () => {
  claimFace("player-1", "socket-a");
  claimFace("player-2", "socket-b");

  startQuickPlay(
    [{ minigame: "TRIVIA" }],
    [
      { teamId: "team-1", playerIds: ["player-1"] },
      { teamId: "team-2", playerIds: ["player-3"] }
    ]
  );

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.MINIGAME_INTRO);
  assert.deepEqual(snapshot.claimedPlayerIds, ["player-1"]);
  assert.deepEqual(
    released.map((claim) => [claim.playerId, claim.reason]),
    [["player-2", PLAYER_CLAIM_GONE_REASONS.ROSTER_CHANGED]]
  );
});

test("does free a face and tell the phone when the host releases it in any phase", () => {
  claimFace("player-2", "socket-b");
  advanceRoomStatePhase();
  assert.notEqual(getRoomStateSnapshot().phase, Phase.SETUP);

  const result = applyRoomStateMutation(() => releasePlayerClaimByHost("player-2"));

  assert.equal(result.didMutate, true);
  assert.deepEqual(result.roomState.claimedPlayerIds, []);
  assert.deepEqual(released, [
    { playerId: "player-2", socketId: "socket-b", reason: PLAYER_CLAIM_GONE_REASONS.RELEASED_BY_HOST }
  ]);
  assert.equal(applyRoomStateMutation(() => releasePlayerClaimByHost("player-2")).didMutate, false);
});

test("does drop every claim when a fatal content error empties the room", () => {
  claimFace("player-1", "socket-a");

  setRoomStateFatalError("broken pack");

  assert.deepEqual(getRoomStateSnapshot().claimedPlayerIds, []);
  assert.deepEqual(
    released.map((claim) => [claim.playerId, claim.reason]),
    [["player-1", PLAYER_CLAIM_GONE_REASONS.ROSTER_CHANGED]]
  );
});

test("does print a new join code and keep every face when the host rotates it", () => {
  claimFace("player-2", "socket-b");
  const joinTokenBefore = playerClaimStore.getJoinToken();

  const result = applyRoomStateMutation(rotatePlayerJoinTokenByHost);

  assert.equal(result.didMutate, false);
  assert.equal(playerClaimStore.isJoinToken(joinTokenBefore), false);
  assert.deepEqual(getRoomStateSnapshot().claimedPlayerIds, ["player-2"]);
  assert.deepEqual(released, []);
});
