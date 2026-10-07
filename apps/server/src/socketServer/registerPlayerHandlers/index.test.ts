import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  MINIGAME_API_VERSION,
  PLAYER_CLAIM_GONE_REASONS,
  PLAYER_CLAIM_REFUSAL_REASONS,
  PLAYER_MINIGAME_ACTION_REFUSAL_REASONS,
  SERVER_TO_CLIENT_EVENTS,
  SPECTATOR_BET_REFUSAL_REASONS,
  type PlayerHandshake,
  type PlayerMinigameActionPayload,
  type PlayerMinigameActionResult
} from "@wingnight/shared";

import { createPlayerClaimStore } from "../../playerClaims/index.js";
import type { TokenBucket } from "../../utils/tokenBucket/index.js";
import {
  PLAYER_ACTION_BURST,
  PLAYER_MINIGAME_ACTION_BURST,
  PLAYER_MINIGAME_ACTIONS_PER_SECOND,
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
  clock: { now: number } = { now: 0 },
  buckets?: Map<string, TokenBucket>,
  betBuckets?: Map<string, TokenBucket>
) => {
  const listeners = new Map<string, Listener>();
  const rooms = new Set<string>();
  const emitted: [string, unknown][] = [];
  const selfEvents: string[] = [];
  const hostViewRequests: string[] = [];
  const dispatched: [string, PlayerMinigameActionPayload][] = [];
  const bets: [string, string][] = [];
  const ownBetRequests: string[] = [];
  let syncCount = 0;
  let syncNowCount = 0;

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
      emitContestantHostView: (playerId) => {
        hostViewRequests.push(playerId);
      },
      dispatchMinigameAction: (playerId, action): PlayerMinigameActionResult => {
        dispatched.push([playerId, action]);
        return { ok: true };
      },
      placeBet: (playerId, pick) => {
        bets.push([playerId, pick]);
        return { ok: true, turnKey: "1:0", pick };
      },
      emitOwnSpectatorBet: (playerId) => {
        ownBetRequests.push(playerId);
      },
      syncClaimFlags: () => {
        syncCount += 1;
      },
      syncClaimFlagsNow: () => {
        syncNowCount += 1;
      },
      ...(buckets === undefined ? {} : { minigameActionBuckets: buckets }),
      ...(betBuckets === undefined ? {} : { betBuckets })
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
    hostViewRequests,
    dispatched,
    bets,
    ownBetRequests,
    get syncCount(): number {
      return syncCount;
    },
    get syncNowCount(): number {
      return syncNowCount;
    },
    claim: (payload: unknown) => call(CLIENT_TO_SERVER_EVENTS.PLAYER_CLAIM, payload),
    release: (payload: unknown) => call(CLIENT_TO_SERVER_EVENTS.PLAYER_RELEASE, payload),
    act: (payload: unknown) => call(CLIENT_TO_SERVER_EVENTS.PLAYER_MINIGAME_ACTION, payload),
    bet: (payload: unknown) => call(CLIENT_TO_SERVER_EVENTS.PLAYER_PLACE_BET, payload),
    actWithoutAck: (payload: unknown) => listeners.get(CLIENT_TO_SERVER_EVENTS.PLAYER_MINIGAME_ACTION)?.(payload),
    requestState: () => listeners.get(CLIENT_TO_SERVER_EVENTS.REQUEST_STATE)?.(),
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
  // At once, not coalesced: the input the phone buffered while away is handled next.
  assert.equal(after.syncNowCount, 1);
  assert.equal(after.syncCount, 0);
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

const FLAP: PlayerMinigameActionPayload = {
  minigameId: "FAPPY",
  minigameApiVersion: MINIGAME_API_VERSION,
  actionType: "flap",
  actionPayload: { tick: 3 }
};

test("does pass a seated phone's action on as its own face and never one it names", () => {
  const store = createStore();
  const phone = createPhone("socket-a", store);

  phone.claim({ playerId: "player-2" });

  // The payload has no say in who is acting: the socket's face does.
  assert.deepEqual(phone.act({ ...FLAP, playerId: "player-1" }), { ok: true });
  assert.deepEqual(
    phone.dispatched.map(([playerId]) => playerId),
    ["player-2"]
  );
});

test("does refuse a phone's action when it holds no face or sends no envelope", () => {
  const store = createStore();
  const phone = createPhone("socket-a", store);

  assert.deepEqual(phone.act(FLAP), {
    ok: false,
    reason: PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.NOT_SEATED
  });

  phone.claim({ playerId: "player-1" });

  for (const malformed of [
    undefined,
    { ...FLAP, minigameApiVersion: 999 },
    { minigameId: "FAPPY", minigameApiVersion: MINIGAME_API_VERSION, actionType: 7, actionPayload: {} },
    { minigameId: "FAPPY", minigameApiVersion: MINIGAME_API_VERSION, actionType: "flap" }
  ]) {
    assert.deepEqual(phone.act(malformed), {
      ok: false,
      reason: PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.MALFORMED
    });
  }

  assert.equal(phone.dispatched.length, 0);
});

test("does rate-limit game input on its own bucket so play never spends the claim bucket", () => {
  const store = createStore();
  const clock = { now: 0 };
  const phone = createPhone("socket-a", store, { joinToken: "join-token", claimSecret: null }, clock);

  phone.claim({ playerId: "player-1" });

  const answers = Array.from({ length: PLAYER_MINIGAME_ACTION_BURST + 5 }, () => phone.act(FLAP));
  const refused = answers.filter(
    (answer) =>
      (answer as { reason?: string }).reason === PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.RATE_LIMITED
  );

  assert.equal(refused.length, 5);
  assert.equal(phone.dispatched.length, PLAYER_MINIGAME_ACTION_BURST);
  // The claim bucket is untouched by a burst of play.
  assert.equal((phone.claim({ playerId: "player-1" }) as { ok: boolean }).ok, true);

  // A thumb at the sustained rate is never refused: a second of refill is a second of input.
  clock.now = 1_000;
  const sustained = Array.from({ length: PLAYER_MINIGAME_ACTIONS_PER_SECOND }, () => phone.act(FLAP));

  assert.equal(sustained.every((answer) => (answer as { ok: boolean }).ok), true);
});

test("does let two minutes of the busiest real input through without one refusal", () => {
  const store = createStore();
  const clock = { now: 0 };
  const phone = createPhone("socket-a", store, { joinToken: "join-token", claimSecret: null }, clock);

  phone.claim({ playerId: "player-1" });

  // Two minutes of the busiest real input — a BRAWL brawler on two thumbs, ~20 a second.
  for (let step = 0; step < 2_400; step += 1) {
    clock.now = step * 50;
    assert.deepEqual(phone.act(FLAP), { ok: true });
  }
});

test("does answer an action without an ack in silence and still pass it on", () => {
  const store = createStore();
  const phone = createPhone("socket-a", store);

  phone.claim({ playerId: "player-1" });

  assert.doesNotThrow(() => {
    phone.actWithoutAck(FLAP);
    phone.actWithoutAck(undefined);
  });
  assert.equal(phone.dispatched.length, 1);
});

test("does hand a seated phone its leg back when it takes its seat or asks for the room", () => {
  const store = createStore();
  const phone = createPhone("socket-a", store);

  phone.requestState();
  assert.deepEqual(phone.hostViewRequests, []);

  phone.claim({ playerId: "player-1" });
  phone.requestState();

  assert.deepEqual(phone.hostViewRequests, ["player-1", "player-1"]);
});

test("does keep spending the same game-input bucket when the face comes back on a new socket", () => {
  const store = createStore();
  const clock = { now: 0 };
  const buckets = new Map<string, TokenBucket>();
  const before = createPhone("socket-a", store, { joinToken: "join-token", claimSecret: null }, clock, buckets);
  const { claimSecret } = before.claim({ playerId: "player-1" }) as { claimSecret: string };

  for (let index = 0; index < PLAYER_MINIGAME_ACTION_BURST; index += 1) {
    assert.deepEqual(before.act(FLAP), { ok: true });
  }

  before.disconnect();

  const after = createPhone("socket-b", store, { joinToken: "join-token", claimSecret }, clock, buckets);

  assert.deepEqual(after.act(FLAP), {
    ok: false,
    reason: PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.RATE_LIMITED
  });
});

test("does refuse a bet when the socket holds no face or the bet names no side", () => {
  const store = createStore();
  const phone = createPhone("socket-a", store);

  assert.deepEqual(phone.bet({ pick: "over" }), {
    ok: false,
    reason: SPECTATOR_BET_REFUSAL_REASONS.NOT_SEATED
  });

  phone.claim({ playerId: "player-1" });

  assert.deepEqual(phone.bet({ pick: "sideways" }), {
    ok: false,
    reason: SPECTATOR_BET_REFUSAL_REASONS.MALFORMED
  });
  assert.deepEqual(phone.bet({ pick: "under", playerId: "player-2" }), { ok: true, turnKey: "1:0", pick: "under" });
  // The face the socket holds is the bettor, whatever the payload names.
  assert.deepEqual(phone.bets, [["player-1", "under"]]);
});

test("does rate-limit bets like claims when a phone flips faster than a thumb, on a bucket of their own", () => {
  const store = createStore();
  const clock = { now: 0 };
  const phone = createPhone("socket-a", store, { joinToken: "join-token", claimSecret: null }, clock);

  phone.claim({ playerId: "player-1" });

  for (let index = 0; index < PLAYER_ACTION_BURST; index += 1) {
    assert.equal((phone.bet({ pick: index % 2 === 0 ? "over" : "under" }) as { ok: boolean }).ok, true);
  }

  assert.deepEqual(phone.bet({ pick: "over" }), {
    ok: false,
    reason: SPECTATOR_BET_REFUSAL_REASONS.RATE_LIMITED
  });
  // Flipping a bet never cost the phone its claim bucket.
  assert.equal((phone.claim({ playerId: "player-2" }) as { ok: boolean }).ok, true);
});

test("does hand a seated phone its own bet back when it takes its seat or asks for the room", () => {
  const store = createStore();
  const phone = createPhone("socket-a", store);

  phone.requestState();
  assert.deepEqual(phone.ownBetRequests, []);

  phone.claim({ playerId: "player-1" });
  phone.requestState();

  assert.deepEqual(phone.ownBetRequests, ["player-1", "player-1"]);
});

test("does keep spending the same bet bucket when the face comes back on a new socket", () => {
  const store = createStore();
  const clock = { now: 0 };
  const betBuckets = new Map<string, TokenBucket>();
  const before = createPhone("socket-a", store, { joinToken: "join-token", claimSecret: null }, clock, undefined, betBuckets);
  const { claimSecret } = before.claim({ playerId: "player-1" }) as { claimSecret: string };

  for (let index = 0; index < PLAYER_ACTION_BURST; index += 1) {
    assert.equal((before.bet({ pick: index % 2 === 0 ? "over" : "under" }) as { ok: boolean }).ok, true);
  }

  assert.deepEqual(before.bet({ pick: "over" }), { ok: false, reason: SPECTATOR_BET_REFUSAL_REASONS.RATE_LIMITED });

  before.disconnect();

  // Same instant, same face, a fresh socket re-bound on the claim secret: no fresh burst.
  const after = createPhone("socket-b", store, { joinToken: "join-token", claimSecret }, clock, undefined, betBuckets);

  assert.deepEqual(after.bet({ pick: "under" }), {
    ok: false,
    reason: SPECTATOR_BET_REFUSAL_REASONS.RATE_LIMITED
  });
});

test("does refuse every phone message with a server error and never throw when a handler faults", () => {
  const store = createPlayerClaimStore();
  const listeners = new Map<string, Listener>();
  const fault = (): never => {
    throw new Error("a fault deep in the room");
  };

  store.claim({ players: ROSTER, playerId: "player-1", socketId: "socket-faulty", claimSecret: null, peerAddress: null });

  registerPlayerHandlers(
    {
      id: "socket-faulty",
      join: () => undefined,
      leave: () => undefined,
      emit: () => undefined,
      on: (event: string, listener: Listener) => {
        listeners.set(event, listener);
      }
    },
    { handshake: { joinToken: "join-token", claimSecret: null }, peerAddress: null },
    {
      claimStore: store,
      getPlayers: fault,
      emitPlayerSelf: fault,
      emitContestantHostView: fault,
      dispatchMinigameAction: fault,
      placeBet: fault,
      emitOwnSpectatorBet: fault,
      emitOwnPlayerView: fault,
      syncClaimFlags: fault,
      syncClaimFlagsNow: fault
    }
  );

  const answers = new Map<string, unknown>();
  const send = (event: string, payload: unknown): void => {
    const listener = listeners.get(event);

    assert.ok(listener, `${event} must be registered`);
    assert.doesNotThrow(() => {
      listener(payload, (result: unknown) => {
        answers.set(event, result);
      });
    });
  };

  send(CLIENT_TO_SERVER_EVENTS.PLAYER_CLAIM, { playerId: "player-2" });
  send(CLIENT_TO_SERVER_EVENTS.PLAYER_MINIGAME_ACTION, {
    minigameId: "GEO",
    minigameApiVersion: MINIGAME_API_VERSION,
    actionType: "placePin",
    actionPayload: { lat: 1, lng: 2 }
  });
  send(CLIENT_TO_SERVER_EVENTS.PLAYER_PLACE_BET, { pick: "over" });
  send(CLIENT_TO_SERVER_EVENTS.REQUEST_STATE, undefined);
  send("disconnect", undefined);

  assert.deepEqual(answers.get(CLIENT_TO_SERVER_EVENTS.PLAYER_CLAIM), {
    ok: false,
    reason: PLAYER_CLAIM_REFUSAL_REASONS.SERVER_ERROR
  });
  assert.deepEqual(answers.get(CLIENT_TO_SERVER_EVENTS.PLAYER_MINIGAME_ACTION), {
    ok: false,
    reason: PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.SERVER_ERROR
  });
  assert.deepEqual(answers.get(CLIENT_TO_SERVER_EVENTS.PLAYER_PLACE_BET), {
    ok: false,
    reason: SPECTATOR_BET_REFUSAL_REASONS.SERVER_ERROR
  });
});
