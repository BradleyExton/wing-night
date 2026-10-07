import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  PLAYER_CLAIM_GONE_REASONS,
  PLAYER_CLAIM_REFUSAL_REASONS,
  SERVER_TO_CLIENT_EVENTS,
  type PlayerHandshake
} from "@wingnight/shared";

import { createPlayerClaimStore } from "../../playerClaims/index.js";
import {
  PLAYER_ACTION_BURST,
  registerPlayerHandlers,
  resolvePlayerRoom
} from "./index.js";

const ROSTER = [
  { id: "player-1", name: "Brad" },
  { id: "player-2", name: "Rob" }
];

type Listener = (payload?: unknown, ack?: unknown) => void;

const createPhone = (
  socketId: string,
  store: ReturnType<typeof createPlayerClaimStore>,
  handshake: PlayerHandshake = { joinToken: "join-token", claimSecret: null },
  clock: { now: number } = { now: 0 }
) => {
  const listeners = new Map<string, Listener>();
  const rooms = new Set<string>();
  const emitted: [string, unknown][] = [];
  const selfEvents: string[] = [];
  let syncCount = 0;

  registerPlayerHandlers(
    {
      id: socketId,
      join: (room) => {
        rooms.add(room);
      },
      leave: (room) => {
        rooms.delete(room);
      },
      emit: (event, payload) => {
        emitted.push([event, payload]);
      },
      on: (event: string, listener: Listener) => {
        listeners.set(event, listener);
      }
    },
    { handshake, peerAddress: null },
    {
      now: () => clock.now,
      claimStore: store,
      getPlayers: () => ROSTER,
      emitPlayerSelf: (playerId) => {
        selfEvents.push(playerId);
      },
      syncClaimFlags: () => {
        syncCount += 1;
      }
    }
  );

  const call = (event: string, payload: unknown): unknown => {
    let answer: unknown;
    const listener = listeners.get(event);

    assert.ok(listener, `${event} must be registered`);
    listener(payload, (result: unknown) => {
      answer = result;
    });

    return answer;
  };

  return {
    rooms,
    emitted,
    selfEvents,
    get syncCount(): number {
      return syncCount;
    },
    claim: (payload: unknown) => call(CLIENT_TO_SERVER_EVENTS.PLAYER_CLAIM, payload),
    release: (payload: unknown) => call(CLIENT_TO_SERVER_EVENTS.PLAYER_RELEASE, payload),
    disconnect: () => listeners.get("disconnect")?.()
  };
};

const createStore = () => createPlayerClaimStore(() => "join-token");

test("does seat the phone in its own player room when it claims a free face", () => {
  const store = createStore();
  const phone = createPhone("socket-a", store);

  const result = phone.claim({ playerId: "player-1" }) as { ok: boolean; claimSecret: string };

  assert.equal(result.ok, true);
  assert.equal(typeof result.claimSecret, "string");
  assert.deepEqual([...phone.rooms], [resolvePlayerRoom("player-1")]);
  assert.deepEqual(phone.selfEvents, ["player-1"]);
  assert.equal(phone.syncCount, 1);
});

test("does refuse a malformed claim and a taken face without seating the phone", () => {
  const store = createStore();
  const first = createPhone("socket-a", store);
  const second = createPhone("socket-b", store);

  first.claim({ playerId: "player-1" });

  assert.deepEqual(second.claim({ playerId: 7 }), {
    ok: false,
    reason: PLAYER_CLAIM_REFUSAL_REASONS.UNKNOWN_PLAYER
  });
  assert.deepEqual(second.claim({ playerId: "player-1" }), {
    ok: false,
    reason: PLAYER_CLAIM_REFUSAL_REASONS.ALREADY_CLAIMED
  });
  assert.deepEqual([...second.rooms], []);
  assert.equal(second.syncCount, 0);
});

test("does move the phone between player rooms when it claims a second face", () => {
  const store = createStore();
  const phone = createPhone("socket-a", store);

  phone.claim({ playerId: "player-1" });
  phone.claim({ playerId: "player-2" });

  assert.deepEqual([...phone.rooms], [resolvePlayerRoom("player-2")]);
  assert.deepEqual(store.resolveFlags(ROSTER).claimedPlayerIds, ["player-2"]);
});

test("does leave the player room when the phone releases its own face", () => {
  const store = createStore();
  const phone = createPhone("socket-a", store);
  const { claimSecret } = phone.claim({ playerId: "player-2" }) as { claimSecret: string };

  assert.deepEqual(phone.release({ claimSecret: "not-mine" }), {
    ok: false,
    reason: PLAYER_CLAIM_REFUSAL_REASONS.UNKNOWN_CLAIM
  });
  assert.deepEqual(phone.release({ claimSecret }), { ok: true });
  assert.deepEqual([...phone.rooms], []);
  assert.deepEqual(store.resolveFlags(ROSTER).claimedPlayerIds, []);
});

test("does re-bind the face without a re-pick when the phone reconnects with its secret", () => {
  const store = createStore();
  const before = createPhone("socket-a", store);
  const { claimSecret } = before.claim({ playerId: "player-1" }) as { claimSecret: string };

  before.disconnect();
  assert.deepEqual(store.resolveFlags(ROSTER).connectedPlayerIds, []);

  const after = createPhone("socket-b", store, { joinToken: "join-token", claimSecret });

  assert.deepEqual([...after.rooms], [resolvePlayerRoom("player-1")]);
  assert.deepEqual(after.selfEvents, ["player-1"]);
  assert.equal(after.syncCount, 1);
  assert.deepEqual(store.resolveFlags(ROSTER).connectedPlayerIds, ["player-1"]);
});

test("does tell the phone its face is gone when it reconnects with a secret the server forgot", () => {
  const store = createStore();
  const phone = createPhone("socket-a", store, { joinToken: "join-token", claimSecret: "forgotten" });

  assert.deepEqual(phone.emitted, [
    [
      SERVER_TO_CLIENT_EVENTS.PLAYER_CLAIM_GONE,
      { playerId: null, reason: PLAYER_CLAIM_GONE_REASONS.CLAIM_NOT_FOUND }
    ]
  ]);
  assert.deepEqual([...phone.rooms], []);
});

test("does keep the face but mark it asleep when the phone's socket drops", () => {
  const store = createStore();
  const phone = createPhone("socket-a", store);

  phone.claim({ playerId: "player-2" });
  phone.disconnect();

  assert.deepEqual(store.resolveFlags(ROSTER), {
    claimedPlayerIds: ["player-2"],
    connectedPlayerIds: []
  });
  assert.equal(phone.syncCount, 2);
});

test("does refuse claims and releases past the burst until the clock refills the bucket", () => {
  const store = createStore();
  const clock = { now: 0 };
  const phone = createPhone("socket-a", store, { joinToken: "join-token", claimSecret: null }, clock);
  const answers: unknown[] = [];

  for (let index = 0; index < PLAYER_ACTION_BURST + 3; index += 1) {
    answers.push(phone.claim({ playerId: index % 2 === 0 ? "player-1" : "player-2" }));
  }

  const refused = answers.filter(
    (answer) => (answer as { reason?: string }).reason === PLAYER_CLAIM_REFUSAL_REASONS.RATE_LIMITED
  );

  assert.equal(refused.length, 3);
  assert.deepEqual(phone.release({ claimSecret: "anything" }), {
    ok: false,
    reason: PLAYER_CLAIM_REFUSAL_REASONS.RATE_LIMITED
  });
  // Only the claims that got through touched the room.
  assert.equal(phone.syncCount, PLAYER_ACTION_BURST);

  clock.now = 1_000;
  assert.equal((phone.claim({ playerId: "player-1" }) as { ok: boolean }).ok, true);
});
