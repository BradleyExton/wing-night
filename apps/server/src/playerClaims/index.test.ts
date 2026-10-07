import assert from "node:assert/strict";
import test from "node:test";

import {
  PLAYER_CLAIM_GONE_REASONS,
  PLAYER_CLAIM_REFUSAL_REASONS
} from "@wingnight/shared";

import { createPlayerClaimStore, type ReleasedPlayerClaim } from "./index.js";

const ROSTER = [
  { id: "player-1", name: "Brad" },
  { id: "player-2", name: "Rob" },
  { id: "player-3", name: "Kim" }
];

const createStore = () => {
  let minted = 0;
  const store = createPlayerClaimStore(() => {
    minted += 1;
    return `join-token-${minted}`;
  });
  const released: ReleasedPlayerClaim[] = [];

  store.onClaimReleased((claim) => {
    released.push(claim);
  });

  const claim = (
    playerId: string,
    socketId: string,
    claimSecret: string | null = null,
    peerAddress: string | null = null
  ) => store.claim({ players: ROSTER, playerId, socketId, claimSecret, peerAddress });

  return { store, released, claim };
};

const claimSecretOf = (outcome: ReturnType<ReturnType<typeof createStore>["claim"]>): string => {
  assert.equal(outcome.ok, true);

  return outcome.ok ? outcome.claimSecret : "";
};

test("does hand back a fresh claim secret when a phone claims a free face", () => {
  const { store, claim } = createStore();

  const outcome = claim("player-1", "socket-a");

  assert.equal(outcome.ok, true);
  assert.equal(outcome.ok && outcome.claimSecret.length > 20, true);
  assert.deepEqual(store.resolveFlags(ROSTER), {
    claimedPlayerIds: ["player-1"],
    connectedPlayerIds: ["player-1"]
  });
});

test("does refuse a claim when the player is not on the roster", () => {
  const { claim } = createStore();

  assert.deepEqual(claim("player-9", "socket-a"), {
    ok: false,
    reason: PLAYER_CLAIM_REFUSAL_REASONS.UNKNOWN_PLAYER
  });
});

test("does refuse a claim when another phone holds the face", () => {
  const { claim } = createStore();

  claim("player-1", "socket-a");

  assert.deepEqual(claim("player-1", "socket-b"), {
    ok: false,
    reason: PLAYER_CLAIM_REFUSAL_REASONS.ALREADY_CLAIMED
  });
  assert.deepEqual(claim("player-1", "socket-b", "guessed-secret"), {
    ok: false,
    reason: PLAYER_CLAIM_REFUSAL_REASONS.ALREADY_CLAIMED
  });
});

test("does keep the same secret when a phone claims its own face again", () => {
  const { claim, released } = createStore();
  const firstSecret = claimSecretOf(claim("player-1", "socket-a"));

  assert.equal(claimSecretOf(claim("player-1", "socket-a")), firstSecret);
  assert.equal(claimSecretOf(claim("player-1", "socket-b", firstSecret)), firstSecret);
  // The second socket brought the secret, so the first one is told it lost it.
  assert.deepEqual(released, [
    { playerId: "player-1", socketId: "socket-a", reason: PLAYER_CLAIM_GONE_REASONS.SUPERSEDED }
  ]);
});

test("does release the first face in silence when a phone claims a second", () => {
  const { store, claim, released } = createStore();
  const firstSecret = claimSecretOf(claim("player-1", "socket-a"));
  const outcome = claim("player-2", "socket-a");

  assert.equal(outcome.ok && outcome.releasedPlayerId, "player-1");
  assert.deepEqual(store.resolveFlags(ROSTER).claimedPlayerIds, ["player-2"]);
  assert.equal(store.rebind(firstSecret, "socket-a", null), null);
  assert.deepEqual(released, []);
});

test("does re-bind a sleeping phone's face when it comes back with its secret", () => {
  const { store, claim } = createStore();
  const secret = claimSecretOf(claim("player-2", "socket-a"));

  assert.equal(store.disconnect("socket-a"), "player-2");
  assert.deepEqual(store.resolveFlags(ROSTER), {
    claimedPlayerIds: ["player-2"],
    connectedPlayerIds: []
  });

  assert.equal(store.rebind(secret, "socket-b", null), "player-2");
  assert.deepEqual(store.resolveFlags(ROSTER).connectedPlayerIds, ["player-2"]);
  assert.equal(store.rebind("unknown-secret", "socket-c", null), null);
});

test("does free a face in silence when the phone releases it with its own secret", () => {
  const { store, claim, released } = createStore();
  const secret = claimSecretOf(claim("player-3", "socket-a"));

  assert.equal(store.releaseBySecret("wrong", "socket-a"), null);
  assert.equal(store.releaseBySecret(secret, "socket-a"), "player-3");
  assert.deepEqual(store.resolveFlags(ROSTER).claimedPlayerIds, []);
  assert.deepEqual(released, []);
});

test("does tell the phone when the host releases its face", () => {
  const { store, claim, released } = createStore();

  claim("player-1", "socket-a");

  assert.equal(store.release("player-1", PLAYER_CLAIM_GONE_REASONS.RELEASED_BY_HOST), true);
  assert.equal(store.release("player-1", PLAYER_CLAIM_GONE_REASONS.RELEASED_BY_HOST), false);
  assert.deepEqual(released, [
    { playerId: "player-1", socketId: "socket-a", reason: PLAYER_CLAIM_GONE_REASONS.RELEASED_BY_HOST }
  ]);
  // Free again: someone else may take it.
  assert.equal(claim("player-1", "socket-b").ok, true);
});

test("does drop a claim when its id is gone or now names somebody else", () => {
  const { store, claim, released } = createStore();

  claim("player-1", "socket-a");
  claim("player-2", "socket-b");
  claim("player-3", "socket-c");

  // A reload that dropped Kim and, positionally, put Sam where Rob was.
  const didRelease = store.prune([
    { id: "player-1", name: "Brad" },
    { id: "player-2", name: "Sam" }
  ]);

  assert.equal(didRelease, true);
  assert.deepEqual(store.resolveFlags(ROSTER).claimedPlayerIds, ["player-1"]);
  assert.deepEqual(
    released.map((claim) => [claim.playerId, claim.reason]),
    [
      ["player-2", PLAYER_CLAIM_GONE_REASONS.ROSTER_CHANGED],
      ["player-3", PLAYER_CLAIM_GONE_REASONS.ROSTER_CHANGED]
    ]
  );
  assert.equal(store.prune(ROSTER.slice(0, 1)), false);
});

test("does clear every claim and announce each when the night resets", () => {
  const { store, claim, released } = createStore();

  claim("player-1", "socket-a");
  claim("player-2", "socket-b");
  store.disconnect("socket-b");

  assert.equal(store.clear(PLAYER_CLAIM_GONE_REASONS.NIGHT_RESET), true);
  assert.deepEqual(store.resolveFlags(ROSTER).claimedPlayerIds, []);
  assert.deepEqual(released, [
    { playerId: "player-1", socketId: "socket-a", reason: PLAYER_CLAIM_GONE_REASONS.NIGHT_RESET },
    { playerId: "player-2", socketId: null, reason: PLAYER_CLAIM_GONE_REASONS.NIGHT_RESET }
  ]);
  assert.equal(store.clear(PLAYER_CLAIM_GONE_REASONS.NIGHT_RESET), false);
});

test("does accept only the current join token when it is rotated", () => {
  const { store } = createStore();
  const heard: string[] = [];

  store.onJoinTokenRotated((joinToken) => {
    heard.push(joinToken);
  });

  assert.equal(store.isJoinToken("join-token-1"), true);
  assert.equal(store.isJoinToken(null), false);
  assert.equal(store.isJoinToken("join-token-"), false);

  store.rotateJoinToken();

  assert.equal(store.isJoinToken("join-token-1"), false);
  assert.equal(store.isJoinToken("join-token-2"), true);
  assert.equal(store.getJoinToken(), "join-token-2");
  assert.deepEqual(heard, ["join-token-2"]);
});

test("does list claimed ids in roster order whatever order they were claimed in", () => {
  const { store, claim } = createStore();

  claim("player-3", "socket-c");
  claim("player-1", "socket-a");

  assert.deepEqual(store.resolveFlags(ROSTER).claimedPlayerIds, ["player-1", "player-3"]);
});

test("does tell the holder when another socket releases its face with the same secret", () => {
  const { store, claim, released } = createStore();
  const secret = claimSecretOf(claim("player-1", "socket-a"));

  assert.equal(store.releaseBySecret(secret, "socket-b"), "player-1");
  assert.deepEqual(released, [
    { playerId: "player-1", socketId: "socket-a", reason: PLAYER_CLAIM_GONE_REASONS.RELEASED_ELSEWHERE }
  ]);
  assert.equal(store.resolveHolderSocketId("player-1"), null);
});

test("does let one Wi-Fi address hold one face and give the last one back when it claims another", () => {
  const { store, claim, released } = createStore();

  claim("player-1", "socket-a", null, "192.168.1.40");
  claim("player-2", "socket-b", null, "192.168.1.40");

  assert.deepEqual(store.resolveFlags(ROSTER).claimedPlayerIds, ["player-2"]);
  assert.deepEqual(released, [
    { playerId: "player-1", socketId: "socket-a", reason: PLAYER_CLAIM_GONE_REASONS.ANOTHER_FACE }
  ]);

  // Another phone, another address: no conflict. The laptop (null) is exempt.
  claim("player-3", "socket-c", null, "192.168.1.41");
  claim("player-1", "socket-d");
  assert.deepEqual(store.resolveFlags(ROSTER).claimedPlayerIds, ["player-1", "player-2", "player-3"]);
});

test("does cap the address when a sleeping phone wakes on an address that already holds a face", () => {
  const { store, claim, released } = createStore();
  const secret = claimSecretOf(claim("player-1", "socket-a", null, "192.168.1.40"));

  store.disconnect("socket-a");
  claim("player-2", "socket-b", null, "192.168.1.41");

  assert.equal(store.rebind(secret, "socket-c", "192.168.1.41"), "player-1");
  assert.deepEqual(store.resolveFlags(ROSTER).claimedPlayerIds, ["player-1"]);
  assert.deepEqual(released, [
    { playerId: "player-2", socketId: "socket-b", reason: PLAYER_CLAIM_GONE_REASONS.ANOTHER_FACE }
  ]);
});

test("does drop a claim when the id keeps its name but now wears a different head", () => {
  const { store, released } = createStore();
  const players = [{ id: "player-1", name: "Brad", avatarSrc: "avatars/brad.png" }];

  store.claim({ players, playerId: "player-1", socketId: "socket-a", claimSecret: null, peerAddress: null });

  assert.equal(store.prune(players), false);
  assert.equal(store.prune([{ id: "player-1", name: "Brad", avatarSrc: "avatars/other-brad.png" }]), true);
  assert.equal(released[0]?.reason, PLAYER_CLAIM_GONE_REASONS.ROSTER_CHANGED);
});

test("does recognise a live claim secret and a seated socket, and forget both when released", () => {
  const { store, claim } = createStore();
  const secret = claimSecretOf(claim("player-2", "socket-a"));

  assert.equal(store.isClaimSecret(secret), true);
  assert.equal(store.isClaimSecret("guessed"), false);
  assert.equal(store.isClaimSecret(null), false);
  assert.equal(store.isSocketSeated("socket-a"), true);
  assert.equal(store.resolveHolderSocketId("player-2"), "socket-a");

  store.releaseBySecret(secret, "socket-a");

  assert.equal(store.isClaimSecret(secret), false);
  assert.equal(store.isSocketSeated("socket-a"), false);
});

test("does report every end of a claim when the phone lets go, a claim moves faces or the host frees it, and none when the phone only sleeps", () => {
  const { store, claim } = createStore();
  const ended: string[] = [];

  store.onClaimEnded((playerId) => {
    ended.push(playerId);
  });

  const secret = claimSecretOf(claim("player-1", "socket-a"));

  store.disconnect("socket-a");
  assert.equal(store.rebind(secret, "socket-a", null), "player-1");
  assert.deepEqual(ended, []);

  // Silent: the phone asked for another face, so its first goes back without an announcement.
  claim("player-2", "socket-a");
  // Silent: "this isn't me" from the holder itself.
  store.releaseBySecret(claimSecretOf(claim("player-2", "socket-a")), "socket-a");
  claim("player-3", "socket-b");
  store.release("player-3", PLAYER_CLAIM_GONE_REASONS.RELEASED_BY_HOST);

  assert.deepEqual(ended, ["player-1", "player-2", "player-3"]);
});

test("does give a face a new claim serial when someone claims it fresh and keep it when the phone comes back on its secret", () => {
  const { store, claim } = createStore();
  const secret = claimSecretOf(claim("player-1", "socket-a"));
  const first = store.resolveClaimSerial("player-1");

  store.disconnect("socket-a");
  store.rebind(secret, "socket-b", null);
  assert.equal(store.resolveClaimSerial("player-1"), first);

  store.releaseBySecret(secret, "socket-b");
  assert.equal(store.resolveClaimSerial("player-1"), null);

  claim("player-1", "socket-c");
  assert.notEqual(store.resolveClaimSerial("player-1"), first);
});
