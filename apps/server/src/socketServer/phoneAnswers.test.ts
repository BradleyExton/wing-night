import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import test, { beforeEach } from "node:test";

import {
  CLIENT_ROLES,
  CLIENT_TO_SERVER_EVENTS,
  MINIGAME_API_VERSION,
  PLAYER_MINIGAME_ACTION_REFUSAL_REASONS,
  Phase,
  SERVER_TO_CLIENT_EVENTS,
  type GameConfigFile,
  type PlayerMinigameActionResult,
  type PlayerMinigamePlayerViewPayload,
  type RoleScopedStateSnapshotEnvelope
} from "@wingnight/shared";
import { io, type Socket } from "socket.io-client";

import { playerClaimStore } from "../playerClaims/index.js";
import {
  assignPlayerToTeam,
  dispatchMinigameAction,
  createTeam,
  getRoomStateSnapshot,
  resetRoomState,
  setRoomStateGameConfig,
  setRoomStatePlayers
} from "../roomState/index.js";
import { advanceUntil, gameConfigFixture, geoPromptFixture, setRoomStateGeoPrompts } from "../roomState/testHarness.js";
import { attachSocketServer } from "./index.js";

// Answers on the phones over the wire: a real server, real Socket.IO clients, the real claim store
// and room. Round 1 is GEO; team 1 (players 1 and 2) plays it on its phones, player 3 watches. What
// is proved here is where an answer goes — its own phone's room, and no snapshot — and who may send
// one.

type RecordedEvent = [string, unknown[]];

type OpenedSocket = { socket: Socket; events: RecordedEvent[] };

const withSocketServer = async (handle: (url: string) => Promise<void>): Promise<void> => {
  const httpServer = createServer();
  const attached = attachSocketServer(httpServer, { hostControlToken: "room-token" });

  httpServer.listen(0, "127.0.0.1");
  await once(httpServer, "listening");

  try {
    await handle(`http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`);
  } finally {
    await attached.socketServer.close();
  }
};

const lanHost = (url: string): string => `192.168.1.23:${new URL(url).port}`;

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
  await new Promise((resolve) => socket.once(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT, resolve));

  return { socket, events };
};

const openPhone = async (url: string, playerId: string): Promise<OpenedSocket & { claimSecret: string }> => {
  const phone = await open(
    url,
    { clientRole: CLIENT_ROLES.PLAYER, joinToken: playerClaimStore.getJoinToken() },
    lanHost(url)
  );
  const result: { ok: boolean; claimSecret: string } = await phone.socket
    .timeout(2_000)
    .emitWithAck(CLIENT_TO_SERVER_EVENTS.PLAYER_CLAIM, { playerId });

  assert.equal(result.ok, true);

  return { ...phone, claimSecret: result.claimSecret };
};

const pin = (opened: OpenedSocket, lat: number, lng: number): Promise<PlayerMinigameActionResult> =>
  opened.socket.timeout(1_000).emitWithAck(CLIENT_TO_SERVER_EVENTS.PLAYER_MINIGAME_ACTION, {
    minigameId: "GEO",
    minigameApiVersion: MINIGAME_API_VERSION,
    actionType: "placePin",
    actionPayload: { lat, lng }
  });

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 200));

const playerViewsOf = (opened: OpenedSocket): PlayerMinigamePlayerViewPayload[] =>
  opened.events
    .filter(([name]) => name === SERVER_TO_CLIENT_EVENTS.PLAYER_MINIGAME_PLAYER_VIEW)
    .map(([, args]) => args[0] as PlayerMinigamePlayerViewPayload);

const lastSnapshotOf = (opened: OpenedSocket): RoleScopedStateSnapshotEnvelope => {
  const snapshots = opened.events.filter(([name]) => name === SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT);

  return snapshots[snapshots.length - 1][1][0] as RoleScopedStateSnapshotEnvelope;
};

const geoConfig: GameConfigFile = {
  ...gameConfigFixture,
  rounds: [{ ...gameConfigFixture.rounds[0], round: 1, minigame: "GEO" }]
};

beforeEach(() => {
  resetRoomState();
  setRoomStateGameConfig(geoConfig);
  setRoomStatePlayers([
    { id: "player-1", name: "Alex" },
    { id: "player-2", name: "Caitlin" },
    { id: "player-3", name: "Rob" }
  ]);
  createTeam("Team Alpha");
  createTeam("Team Beta");
  assignPlayerToTeam("player-1", "team-1");
  assignPlayerToTeam("player-2", "team-1");
  assignPlayerToTeam("player-3", "team-2");
  setRoomStateGeoPrompts(geoPromptFixture);
  advanceUntil(Phase.MINIGAME_PLAY, 1);
});

test("does tell only the pinning phone where its pin is when two playing-team phones pin", async () => {
  await withSocketServer(async (url) => {
    const display = await open(url, { clientRole: CLIENT_ROLES.DISPLAY });
    const alex = await openPhone(url, "player-1");
    const caitlin = await openPhone(url, "player-2");
    const rob = await openPhone(url, "player-3");

    assert.deepEqual(await pin(alex, 12.3456, 65.4321), { ok: true });
    assert.deepEqual(await pin(caitlin, -33.33, 151.15), { ok: true });
    await settle();

    const alexCard = playerViewsOf(alex).at(-1)?.minigamePlayerView;
    const caitlinCard = playerViewsOf(caitlin).at(-1)?.minigamePlayerView;

    assert.deepEqual(alexCard?.minigame === "GEO" ? alexCard.pin : undefined, { lat: 12.3456, lng: 65.4321 });
    assert.deepEqual(caitlinCard?.minigame === "GEO" ? caitlinCard.pin : undefined, { lat: -33.33, lng: 151.15 });

    // Nobody's events carry anyone else's pin; the watcher's phone is only ever told it has no card.
    assert.equal(JSON.stringify(alex.events).includes("151.15"), false);
    assert.equal(JSON.stringify(caitlin.events).includes("12.3456"), false);
    assert.deepEqual(
      playerViewsOf(rob).filter((payload) => payload.minigamePlayerView !== null),
      []
    );

    for (const opened of [display, rob]) {
      const serialized = JSON.stringify(opened.events);

      assert.equal(serialized.includes("12.3456"), false);
      assert.equal(serialized.includes("151.15"), false);
    }

    const displayEnvelope = lastSnapshotOf(display);

    assert.equal(displayEnvelope.clientRole, "DISPLAY");

    const displayView =
      displayEnvelope.clientRole === "DISPLAY" ? displayEnvelope.roomState.minigameDisplayView : null;

    assert.deepEqual(displayView?.minigame === "GEO" ? displayView.phoneAnswers : undefined, {
      answeredCount: 2,
      seatedCount: 2
    });

    for (const opened of [display, alex, caitlin, rob]) {
      opened.socket.close();
    }
  });
});

test("does refuse an answer when it comes from the watching team's phone", async () => {
  await withSocketServer(async (url) => {
    const rob = await openPhone(url, "player-3");

    assert.deepEqual(await pin(rob, 48.85, 2.29), {
      ok: false,
      reason: PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.NOT_ON_TURN
    });

    const hostView = getRoomStateSnapshot().minigameHostView;

    assert.equal(hostView?.minigame === "GEO" ? hostView.phoneAnswers : undefined, null);

    rob.socket.close();
  });
});

test("does hand a phone its own pin back when it reconnects on its own claim secret", async () => {
  await withSocketServer(async (url) => {
    const before = await openPhone(url, "player-1");

    await pin(before, 12.3456, 65.4321);
    before.socket.close();
    await settle();

    const after = await open(
      url,
      { clientRole: CLIENT_ROLES.PLAYER, joinToken: playerClaimStore.getJoinToken(), claimSecret: before.claimSecret },
      lanHost(url)
    );

    await settle();

    const card = playerViewsOf(after).at(-1)?.minigamePlayerView;

    assert.deepEqual(card?.minigame === "GEO" ? card.pin : undefined, { lat: 12.3456, lng: 65.4321 });

    after.socket.close();
  });
});

test("does give the next guest in a face a blank card when the last holder let it go", async () => {
  await withSocketServer(async (url) => {
    const first = await openPhone(url, "player-1");

    await pin(first, 12.3456, 65.4321);

    const released: { ok: boolean } = await first.socket
      .timeout(2_000)
      .emitWithAck(CLIENT_TO_SERVER_EVENTS.PLAYER_RELEASE, { claimSecret: first.claimSecret });

    assert.equal(released.ok, true);
    first.socket.close();
    await settle();

    const second = await openPhone(url, "player-1");

    await settle();

    const card = playerViewsOf(second).at(-1)?.minigamePlayerView;

    assert.equal(card?.minigame === "GEO" ? card.pin : undefined, null);
    assert.equal(JSON.stringify(second.events).includes("12.3456"), false);

    second.socket.close();
  });
});

// The crash this guards against: a seated phone naming a game this build does not know used to
// read the runtime plugin of `undefined` and throw out of the event loop, ending the server.
const watchUncaught = async (run: () => Promise<void>): Promise<unknown[]> => {
  const uncaught: unknown[] = [];
  const onUncaught = (error: unknown): void => {
    uncaught.push(error);
  };

  process.on("uncaughtException", onUncaught);

  try {
    await run();
  } finally {
    process.off("uncaughtException", onUncaught);
  }

  return uncaught;
};

test("does refuse a phone's action as malformed when it names a game that does not exist", async () => {
  const uncaught = await watchUncaught(async () => {
    await withSocketServer(async (url) => {
      const rob = await openPhone(url, "player-3");
      const alex = await openPhone(url, "player-1");

      for (const opened of [rob, alex]) {
        const ack = await opened.socket.timeout(1_000).emitWithAck(CLIENT_TO_SERVER_EVENTS.PLAYER_MINIGAME_ACTION, {
          minigameId: "NOPE",
          minigameApiVersion: MINIGAME_API_VERSION,
          actionType: "placePin",
          actionPayload: {}
        });

        assert.deepEqual(ack, { ok: false, reason: PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.MALFORMED });
      }

      await settle();

      for (const opened of [rob, alex]) {
        opened.socket.close();
      }
    });
  });

  assert.deepEqual(uncaught, []);
});

test("does refuse a new guest's late pin and keep the last holder's locked pin off their card when the photo is locked", async () => {
  await withSocketServer(async (url) => {
    const first = await openPhone(url, "player-1");

    assert.deepEqual(await pin(first, 12.3456, 65.4321), { ok: true });
    dispatchMinigameAction("GEO", "submitGuess", {});

    const released: { ok: boolean } = await first.socket
      .timeout(2_000)
      .emitWithAck(CLIENT_TO_SERVER_EVENTS.PLAYER_RELEASE, { claimSecret: first.claimSecret });

    assert.equal(released.ok, true);
    first.socket.close();
    await settle();

    const second = await openPhone(url, "player-1");

    // The photo is locked: the game does not take the pin, and the phone is told so.
    assert.deepEqual(await pin(second, -10, -10), {
      ok: false,
      reason: PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.NOT_ACCEPTED
    });

    second.socket.emit(CLIENT_TO_SERVER_EVENTS.REQUEST_STATE);
    await settle();

    const card = playerViewsOf(second).at(-1)?.minigamePlayerView;

    assert.equal(card?.minigame === "GEO" ? card.pin : undefined, null);
    assert.equal(JSON.stringify(second.events).includes("12.3456"), false);

    second.socket.close();
  });
});

const deepJunk = (depth: number): unknown => (depth === 0 ? { end: [null, 1, "x"] } : { a: [deepJunk(depth - 1)] });

const PLAYER_FAMILY_EVENTS = [
  CLIENT_TO_SERVER_EVENTS.PLAYER_CLAIM,
  CLIENT_TO_SERVER_EVENTS.PLAYER_RELEASE,
  CLIENT_TO_SERVER_EVENTS.PLAYER_MINIGAME_ACTION,
  CLIENT_TO_SERVER_EVENTS.PLAYER_PLACE_BET
] as const;

const GARBAGE_PAYLOADS: unknown[] = [
  null,
  42,
  "x",
  "x".repeat(200_000),
  [],
  [1, "two", { three: 3 }],
  {},
  deepJunk(40),
  { playerId: { $gt: "" }, claimSecret: 12 },
  { playerId: "player-404" },
  { playerId: "__proto__" },
  { claimSecret: ["nope"] },
  { pick: "sideways" },
  { pick: { over: true } },
  { minigameId: "GEO", minigameApiVersion: MINIGAME_API_VERSION, actionType: "placePin" },
  { minigameId: "GEO", minigameApiVersion: MINIGAME_API_VERSION, actionType: "placePin", actionPayload: { lat: "x" } },
  { minigameId: "GEO", minigameApiVersion: MINIGAME_API_VERSION, actionType: "placePin", actionPayload: deepJunk(40) },
  { minigameId: "GEO", minigameApiVersion: MINIGAME_API_VERSION, actionType: "x".repeat(50_000), actionPayload: 1 },
  { minigameId: "TRIVIA", minigameApiVersion: MINIGAME_API_VERSION, actionType: "chooseAnswer", actionPayload: { choiceIndex: 1e308 } },
  { minigameId: "constructor", minigameApiVersion: MINIGAME_API_VERSION, actionType: "toString", actionPayload: {} },
  { minigameId: "GEO", minigameApiVersion: 999, actionType: "submitGuess", actionPayload: {} },
  { hostSecret: "guess", minigameId: "GEO", minigameApiVersion: MINIGAME_API_VERSION, actionType: "submitGuess", actionPayload: {} }
];

test("does keep serving when phones send every event garbage", async () => {
  const uncaught = await watchUncaught(async () => {
    await withSocketServer(async (url) => {
      const seated = await openPhone(url, "player-1");
      const unseated = await open(
        url,
        { clientRole: CLIENT_ROLES.PLAYER, joinToken: playerClaimStore.getJoinToken() },
        lanHost(url)
      );

      // Every event a client can name, fire and forget — the host's and the TV's included, which a
      // phone socket has no business sending — and the phone family again with an ack to answer.
      for (const event of Object.values(CLIENT_TO_SERVER_EVENTS)) {
        for (const payload of GARBAGE_PAYLOADS) {
          for (const opened of [seated, unseated]) {
            opened.socket.emit(event, payload);
          }
        }
      }

      for (const event of PLAYER_FAMILY_EVENTS) {
        for (const payload of GARBAGE_PAYLOADS) {
          for (const opened of [seated, unseated]) {
            const ack: unknown = await opened.socket.timeout(2_000).emitWithAck(event, payload);

            // Every phone-family message with an ack is answered, and garbage is never an ok.
            assert.equal((ack as { ok?: unknown }).ok, false, `${event} ${JSON.stringify(payload).slice(0, 60)}`);
          }
        }
      }

      // Let the token buckets the garbage spent refill before the real pin.
      await new Promise((resolve) => setTimeout(resolve, 2_000));

      // Still serving: a fresh display is handed the room, and the seated phone's real pin lands.
      const display = await open(url, { clientRole: CLIENT_ROLES.DISPLAY });

      assert.equal(lastSnapshotOf(display).clientRole, "DISPLAY");
      assert.equal(seated.socket.connected, true);
      assert.deepEqual(await pin(seated, 48.85, 2.29), { ok: true });

      for (const opened of [seated, unseated, display]) {
        opened.socket.close();
      }
    });
  });

  assert.deepEqual(uncaught, []);
});
