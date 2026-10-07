import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  PLAYER_AUTH_REQUIRED_ERROR_CODE,
  PLAYER_CLAIM_GONE_REASONS,
  PLAYER_CLAIM_REFUSAL_REASONS,
  SERVER_TO_CLIENT_EVENTS
} from "@wingnight/shared";

import type { PlayerSeat } from "../playerSeatStorage";
import { createPlayerSeatController, type PlayerSeatSocket } from "./index";

type Handler = (...args: unknown[]) => void;

const createFakeSocket = (answer: (event: string, payload: unknown) => Promise<unknown>) => {
  const handlers = new Map<string, Handler>();
  const sent: [string, unknown][] = [];

  const socket = {
    on: (event: string, handler: Handler) => {
      handlers.set(event, handler);
    },
    off: (event: string) => {
      handlers.delete(event);
    },
    timeout: () => ({
      emitWithAck: (event: string, payload: unknown) => {
        sent.push([event, payload]);
        return answer(event, payload);
      }
    })
  } as unknown as PlayerSeatSocket;

  return {
    socket,
    sent,
    fire: (event: string, ...args: unknown[]) => handlers.get(event)?.(...args),
    hasHandler: (event: string) => handlers.has(event)
  };
};

const createMemoryStorage = (initial: PlayerSeat | null) => {
  let seat = initial;

  return {
    get seat(): PlayerSeat | null {
      return seat;
    },
    read: () => seat,
    saveClaim: (playerId: string, claimSecret: string) => {
      seat = seat === null ? null : { ...seat, playerId, claimSecret };
    },
    forgetClaim: () => {
      seat = seat === null ? null : { ...seat, playerId: null, claimSecret: null };
    },
    clear: () => {
      seat = null;
    }
  };
};

const flush = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

const SCANNED: PlayerSeat = { joinToken: "tok", claimSecret: null, playerId: null };

test("does start locked, picking or seated from what the phone stored", () => {
  const { socket } = createFakeSocket(async () => undefined);

  assert.deepEqual(createPlayerSeatController(socket, createMemoryStorage(null)).getState(), {
    status: "locked"
  });
  assert.equal(createPlayerSeatController(socket, createMemoryStorage(SCANNED)).getState().status, "picking");
  assert.deepEqual(
    createPlayerSeatController(
      socket,
      createMemoryStorage({ joinToken: "tok", claimSecret: "sec", playerId: "player-2" })
    ).getState(),
    { status: "seated", playerId: "player-2", confirmed: false }
  );
});

test("does keep the secret and seat the phone when its claim is accepted", async () => {
  const fake = createFakeSocket(async (_event, payload) => ({
    ok: true,
    playerId: (payload as { playerId: string }).playerId,
    claimSecret: "sec-1"
  }));
  const storage = createMemoryStorage(SCANNED);
  const controller = createPlayerSeatController(fake.socket, storage);

  controller.claim("player-1");

  assert.deepEqual(controller.getState(), {
    status: "picking",
    claimingPlayerId: "player-1",
    refusal: null,
    ownPlayerId: null
  });
  await flush();

  assert.deepEqual(fake.sent, [[CLIENT_TO_SERVER_EVENTS.PLAYER_CLAIM, { playerId: "player-1" }]]);
  assert.deepEqual(controller.getState(), { status: "seated", playerId: "player-1", confirmed: false });
  assert.deepEqual(storage.seat, { joinToken: "tok", claimSecret: "sec-1", playerId: "player-1" });
});

test("does stay on the picker and say why when the claim is refused", async () => {
  const fake = createFakeSocket(async () => ({
    ok: false,
    reason: PLAYER_CLAIM_REFUSAL_REASONS.ALREADY_CLAIMED
  }));
  const controller = createPlayerSeatController(fake.socket, createMemoryStorage(SCANNED));

  controller.claim("player-1");
  await flush();

  assert.deepEqual(controller.getState(), {
    status: "picking",
    claimingPlayerId: null,
    refusal: PLAYER_CLAIM_REFUSAL_REASONS.ALREADY_CLAIMED,
    ownPlayerId: null
  });
});

test("does let go of the face and send the secret when the guest says it isn't them", async () => {
  const fake = createFakeSocket(async () => ({ ok: true }));
  const storage = createMemoryStorage({ joinToken: "tok", claimSecret: "sec", playerId: "player-1" });
  const controller = createPlayerSeatController(fake.socket, storage);

  controller.release();
  await flush();

  assert.equal(controller.getState().status, "picking");
  assert.deepEqual(fake.sent, [[CLIENT_TO_SERVER_EVENTS.PLAYER_RELEASE, { claimSecret: "sec" }]]);
  assert.deepEqual(storage.seat, SCANNED);
});

test("does show claim gone and forget the face when the host releases it", () => {
  const fake = createFakeSocket(async () => undefined);
  const storage = createMemoryStorage({ joinToken: "tok", claimSecret: "sec", playerId: "player-1" });
  const controller = createPlayerSeatController(fake.socket, storage);

  fake.fire(SERVER_TO_CLIENT_EVENTS.PLAYER_CLAIM_GONE, {
    playerId: "player-1",
    reason: PLAYER_CLAIM_GONE_REASONS.RELEASED_BY_HOST
  });

  assert.deepEqual(controller.getState(), {
    status: "claim_gone",
    playerId: "player-1",
    reason: PLAYER_CLAIM_GONE_REASONS.RELEASED_BY_HOST
  });
  assert.deepEqual(storage.seat, SCANNED);

  controller.backToPicker();
  assert.equal(controller.getState().status, "picking");
});

test("does keep the shared secret when another tab took the face", () => {
  const fake = createFakeSocket(async () => undefined);
  const storage = createMemoryStorage({ joinToken: "tok", claimSecret: "sec", playerId: "player-1" });
  const controller = createPlayerSeatController(fake.socket, storage);

  fake.fire(SERVER_TO_CLIENT_EVENTS.PLAYER_CLAIM_GONE, {
    playerId: "player-1",
    reason: PLAYER_CLAIM_GONE_REASONS.SUPERSEDED
  });

  assert.equal(controller.getState().status, "claim_gone");
  assert.equal(storage.seat?.claimSecret, "sec");
});

test("does lock the phone and drop everything when the night resets or the token is refused", () => {
  for (const trigger of [
    (fake: ReturnType<typeof createFakeSocket>) =>
      fake.fire(SERVER_TO_CLIENT_EVENTS.PLAYER_CLAIM_GONE, {
        playerId: "player-1",
        reason: PLAYER_CLAIM_GONE_REASONS.NIGHT_RESET
      }),
    (fake: ReturnType<typeof createFakeSocket>) =>
      fake.fire("connect_error", new Error(PLAYER_AUTH_REQUIRED_ERROR_CODE)),
    (fake: ReturnType<typeof createFakeSocket>) => fake.fire("disconnect", "io server disconnect")
  ]) {
    const fake = createFakeSocket(async () => undefined);
    const storage = createMemoryStorage({ joinToken: "tok", claimSecret: "sec", playerId: "player-1" });
    const controller = createPlayerSeatController(fake.socket, storage);

    trigger(fake);

    assert.deepEqual(controller.getState(), { status: "locked" });
    assert.equal(storage.seat, null);
  }
});

test("does ride out a dropped Wi-Fi without losing the face", () => {
  const fake = createFakeSocket(async () => undefined);
  const storage = createMemoryStorage({ joinToken: "tok", claimSecret: "sec", playerId: "player-1" });
  const controller = createPlayerSeatController(fake.socket, storage);

  fake.fire("disconnect", "transport close");
  fake.fire("connect_error", new Error("xhr poll error"));

  assert.deepEqual(controller.getState(), { status: "seated", playerId: "player-1", confirmed: false });
  assert.equal(storage.seat?.claimSecret, "sec");

  controller.dispose();
  assert.equal(fake.hasHandler(SERVER_TO_CLIENT_EVENTS.PLAYER_SELF), false);
});

test("does never let a late ack timeout demote a phone the server has seated", async () => {
  let rejectAck: (error: Error) => void = () => undefined;
  const fake = createFakeSocket(
    () =>
      new Promise((_resolve, reject) => {
        rejectAck = reject;
      })
  );
  const controller = createPlayerSeatController(fake.socket, createMemoryStorage(SCANNED));

  controller.claim("player-1");
  fake.fire(SERVER_TO_CLIENT_EVENTS.PLAYER_SELF, { playerId: "player-1" });
  rejectAck(new Error("operation has timed out"));
  await flush();

  assert.deepEqual(controller.getState(), { status: "seated", playerId: "player-1", confirmed: true });
});

test("does keep the secret from an ack that lands after player:self already seated the phone", async () => {
  const fake = createFakeSocket(async () => ({ ok: true, playerId: "player-2", claimSecret: "sec-2" }));
  const storage = createMemoryStorage(SCANNED);
  const controller = createPlayerSeatController(fake.socket, storage);

  controller.claim("player-2");
  fake.fire(SERVER_TO_CLIENT_EVENTS.PLAYER_SELF, { playerId: "player-2" });
  await flush();

  assert.deepEqual(controller.getState(), { status: "seated", playerId: "player-2", confirmed: true });
  assert.equal(storage.seat?.claimSecret, "sec-2");
});

test("does mark a stored seat confirmed only once the server re-binds it", () => {
  const fake = createFakeSocket(async () => undefined);
  const controller = createPlayerSeatController(
    fake.socket,
    createMemoryStorage({ joinToken: "tok", claimSecret: "sec", playerId: "player-3" })
  );

  assert.deepEqual(controller.getState(), { status: "seated", playerId: "player-3", confirmed: false });

  fake.fire(SERVER_TO_CLIENT_EVENTS.PLAYER_SELF, { playerId: "player-3" });

  assert.deepEqual(controller.getState(), { status: "seated", playerId: "player-3", confirmed: true });
});

test("does keep this phone's own face on the picker when its face moved to another tab", () => {
  const fake = createFakeSocket(async () => undefined);
  const controller = createPlayerSeatController(
    fake.socket,
    createMemoryStorage({ joinToken: "tok", claimSecret: "sec", playerId: "player-1" })
  );

  fake.fire(SERVER_TO_CLIENT_EVENTS.PLAYER_SELF, { playerId: "player-1" });
  fake.fire(SERVER_TO_CLIENT_EVENTS.PLAYER_CLAIM_GONE, {
    playerId: "player-1",
    reason: PLAYER_CLAIM_GONE_REASONS.SUPERSEDED
  });
  controller.backToPicker();

  assert.deepEqual(controller.getState(), {
    status: "picking",
    claimingPlayerId: null,
    refusal: null,
    ownPlayerId: "player-1"
  });
});
