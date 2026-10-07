import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import test, { beforeEach } from "node:test";

import {
  CLIENT_ROLES,
  CLIENT_TO_SERVER_EVENTS,
  MINIGAME_API_VERSION,
  Phase,
  SERVER_TO_CLIENT_EVENTS,
  type PlayerMinigameActionResult
} from "@wingnight/shared";
import { io, type Socket } from "socket.io-client";

import { playerClaimStore } from "../playerClaims/index.js";
import { getRoomStateSnapshot, resetRoomState, setRoundDeviceMode } from "../roomState/index.js";
import { advanceUntil, setupArcadeNight } from "../roomState/testHarness.js";
import { PLAYER_MINIGAME_ACTION_BURST } from "./registerPlayerHandlers/index.js";
import { attachSocketServer, type AttachedSocketServer } from "./index.js";

// A contestant's phone reconnecting over the wire mid-leg — a Wi-Fi blip, not a reload: the
// phone comes back on its claim secret, and socket.io flushes the input it buffered meanwhile.

type RecordedEvent = [string, unknown[]];

type OpenedSocket = {
  socket: Socket;
  events: RecordedEvent[];
};

const withSocketServer = async (
  handle: (url: string, attached: AttachedSocketServer) => Promise<void>
): Promise<void> => {
  const httpServer = createServer();
  const attached = attachSocketServer(httpServer, { hostControlToken: "room-token" });

  httpServer.listen(0, "127.0.0.1");
  await once(httpServer, "listening");

  try {
    await handle(`http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`, attached);
  } finally {
    await attached.socketServer.close();
  }
};

const lanHost = (url: string): string => `192.168.1.23:${new URL(url).port}`;

const nextEvent = (socket: Socket, event: string): Promise<unknown[]> =>
  new Promise((resolve) => {
    socket.once(event, (...args: unknown[]) => {
      resolve(args);
    });
  });

const open = async (url: string, auth: Record<string, string>, host?: string): Promise<OpenedSocket> => {
  const events: RecordedEvent[] = [];
  const socket = io(url, {
    auth,
    extraHeaders: host === undefined ? {} : { Host: host },
    transports: ["websocket"],
    reconnection: false,
    forceNew: true
  });

  socket.onAny((event: string, ...args: unknown[]) => {
    events.push([event, args]);
  });
  await nextEvent(socket, SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT);

  return { socket, events };
};

// Lets every event in flight land (and the claim flags' 100 ms coalescer fire).
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 200));

const act = (
  phone: OpenedSocket,
  actionType: string,
  actionPayload: unknown,
  minigameId = "FAPPY"
): Promise<PlayerMinigameActionResult> =>
  phone.socket.timeout(2_000).emitWithAck(CLIENT_TO_SERVER_EVENTS.PLAYER_MINIGAME_ACTION, {
    minigameId,
    minigameApiVersion: MINIGAME_API_VERSION,
    actionType,
    actionPayload
  });

const closeAll = (opened: OpenedSocket[]): void => {
  for (const entry of opened) {
    entry.socket.close();
  }
};

const fappyTicksOf = (): number[] => {
  const view = getRoomStateSnapshot().minigameHostView;

  assert.ok(view?.minigame === "FAPPY");

  return view.legs[view.legIndex]?.flapTicks ?? [];
};

beforeEach(() => {
  resetRoomState();
  setupArcadeNight();
});

const openPhoneWithSecret = async (url: string, playerId: string): Promise<{ phone: OpenedSocket; claimSecret: string }> => {
  const phone = await open(
    url,
    { clientRole: CLIENT_ROLES.PLAYER, joinToken: playerClaimStore.getJoinToken() },
    lanHost(url)
  );
  const result = (await phone.socket
    .timeout(2_000)
    .emitWithAck(CLIENT_TO_SERVER_EVENTS.PLAYER_CLAIM, { playerId })) as { ok: true; claimSecret: string };

  assert.equal(result.ok, true);

  return { phone, claimSecret: result.claimSecret };
};

const reopenPhone = (url: string, claimSecret: string): Promise<OpenedSocket> =>
  open(url, { clientRole: CLIENT_ROLES.PLAYER, claimSecret }, lanHost(url));

test("does take a reconnected contestant's first input when its phone dropped mid-leg", async () => {
  setRoundDeviceMode(1, "phones");
  advanceUntil(Phase.MINIGAME_PLAY, 1);

  await withSocketServer(async (url) => {
    const { phone, claimSecret } = await openPhoneWithSecret(url, "player-1");

    await settle();
    assert.deepEqual(await act(phone, "flap", { tick: 1 }), { ok: true });
    phone.socket.close();
    await settle();
    assert.equal(getRoomStateSnapshot().contestantTurn?.droppedPlayerId, "player-1");

    // The same phone, back on its secret: the flaps socket.io buffered while it was away are
    // flushed the moment it connects.
    const back = await reopenPhone(url, claimSecret);
    const flushed = await act(back, "flap", { tick: 40 });

    assert.deepEqual(flushed, { ok: true }, `the reconnected contestant's first input was refused; log ${JSON.stringify(fappyTicksOf())}`);

    closeAll([back]);
  });
});

test("does hold a contestant to one action bucket when its phone keeps reconnecting", async () => {
  setRoundDeviceMode(1, "phones");
  advanceUntil(Phase.MINIGAME_PLAY, 1);

  await withSocketServer(async (url) => {
    const opened = await openPhoneWithSecret(url, "player-1");
    const { claimSecret } = opened;
    let { phone } = opened;
    let accepted = 0;
    let tick = 0;
    const startedAt = Date.now();

    await settle();

    for (let round = 0; round < 5; round += 1) {
      const results = await Promise.all(
        Array.from({ length: PLAYER_MINIGAME_ACTION_BURST }, () => act(phone, "flap", { tick: (tick += 1) }))
      );

      accepted += results.filter((result) => result.ok).length;
      phone.socket.close();
      phone = await reopenPhone(url, claimSecret);
      await settle();
    }

    const elapsedSeconds = (Date.now() - startedAt) / 1000;
    // What one socket's bucket would allow in the same time: the burst plus the refill.
    const budget = PLAYER_MINIGAME_ACTION_BURST + 30 * elapsedSeconds;

    assert.ok(accepted <= budget, `accepted ${accepted} actions against a budget of ${Math.round(budget)}`);
    closeAll([phone]);
  });
});
