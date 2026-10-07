import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import test, { beforeEach } from "node:test";

import {
  CLIENT_ROLES,
  CLIENT_TO_SERVER_EVENTS,
  Phase,
  SERVER_TO_CLIENT_EVENTS,
  SPECTATOR_BET_REFUSAL_REASONS,
  type PlayerPlaceBetResult,
  type PlayerSpectatorBetPayload,
  type RoleScopedStateSnapshotEnvelope
} from "@wingnight/shared";
import { io, type Socket } from "socket.io-client";

import { playerClaimStore } from "../playerClaims/index.js";
import { getRoomStateSnapshot, releasePlayerClaimByHost, resetRoomState } from "../roomState/index.js";
import { advanceUntil, setupArcadeNight } from "../roomState/testHarness.js";
import { attachSocketServer, type AttachedSocketServer } from "./index.js";

// The watchers' side bet over the wire: a real server, real Socket.IO clients, the real claim
// store and room. What is proved here is who may bet (a phone holding a face off the playing team,
// and nothing else) and where a pick goes (the bettor's own room, and no snapshot) before the turn
// settles. Team 1 (players 1 and 2) opens the arcade night; players 3 and 4 are its watchers.

type RecordedEvent = [string, unknown[]];

type OpenedSocket = { socket: Socket; events: RecordedEvent[] };

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

const openPhone = async (url: string, playerId: string | null): Promise<OpenedSocket> => {
  const phone = await open(
    url,
    { clientRole: CLIENT_ROLES.PLAYER, joinToken: playerClaimStore.getJoinToken() },
    lanHost(url)
  );

  if (playerId !== null) {
    const result: { ok: boolean } = await phone.socket
      .timeout(2_000)
      .emitWithAck(CLIENT_TO_SERVER_EVENTS.PLAYER_CLAIM, { playerId });

    assert.equal(result.ok, true);
  }

  return phone;
};

const bet = (opened: OpenedSocket, payload: unknown): Promise<PlayerPlaceBetResult> =>
  opened.socket.timeout(1_000).emitWithAck(CLIENT_TO_SERVER_EVENTS.PLAYER_PLACE_BET, payload);

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 200));

const ownBetsOf = (opened: OpenedSocket): PlayerSpectatorBetPayload[] =>
  opened.events
    .filter(([name]) => name === SERVER_TO_CLIENT_EVENTS.PLAYER_SPECTATOR_BET)
    .map(([, args]) => args[0] as PlayerSpectatorBetPayload);

const lastSnapshotOf = (opened: OpenedSocket): RoleScopedStateSnapshotEnvelope => {
  const snapshots = opened.events.filter(([name]) => name === SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT);

  return snapshots[snapshots.length - 1][1][0] as RoleScopedStateSnapshotEnvelope;
};

const closeAll = (opened: OpenedSocket[]): void => {
  for (const entry of opened) {
    entry.socket.close();
  }
};

beforeEach(() => {
  resetRoomState();
  setupArcadeNight();
  advanceUntil(Phase.MINIGAME_INTRO, 1);
});

test("does tell only the bettor's phone which way it went when a watcher bets over the wire", async () => {
  await withSocketServer(async (url) => {
    const display = await open(url, { clientRole: CLIENT_ROLES.DISPLAY });
    const bettor = await openPhone(url, "player-3");
    const neighbour = await openPhone(url, "player-4");

    assert.deepEqual(await bet(bettor, { pick: "under" }), { ok: true, turnKey: "1:0", pick: "under" });
    await settle();

    assert.deepEqual(ownBetsOf(bettor).at(-1), { turnKey: "1:0", pick: "under" });
    // The neighbour was told its own (empty) slip when it sat down, and nothing of the bettor's.
    assert.deepEqual(ownBetsOf(neighbour), [{ turnKey: "1:0", pick: null }]);

    // The room hears that a bet is in, never which way.
    for (const opened of [display, neighbour, bettor]) {
      const envelope = lastSnapshotOf(opened);

      assert.equal(envelope.roomState.spectatorBets?.betCount, 1);
      assert.doesNotMatch(JSON.stringify(envelope), /"under"/);
    }

    closeAll([display, bettor, neighbour]);
  });
});

test("does refuse a bet when it comes from the playing team, a socket with no face or names no side", async () => {
  await withSocketServer(async (url) => {
    const player = await openPhone(url, "player-1");
    const unseated = await openPhone(url, null);
    const watcher = await openPhone(url, "player-3");

    assert.deepEqual(
      {
        playing: await bet(player, { pick: "over" }),
        noFace: await bet(unseated, { pick: "over" }),
        malformed: await bet(watcher, { pick: "maybe" })
      },
      {
        playing: { ok: false, reason: SPECTATOR_BET_REFUSAL_REASONS.ACTIVE_TEAM },
        noFace: { ok: false, reason: SPECTATOR_BET_REFUSAL_REASONS.NOT_SEATED },
        malformed: { ok: false, reason: SPECTATOR_BET_REFUSAL_REASONS.MALFORMED }
      }
    );
    assert.equal(getRoomStateSnapshot().spectatorBets?.betCount, 0);

    closeAll([player, unseated, watcher]);
  });
});

test("does take no bet when a host or a display sends one", async () => {
  await withSocketServer(async (url) => {
    const host = await open(url, { clientRole: CLIENT_ROLES.HOST });
    const display = await open(url, { clientRole: CLIENT_ROLES.DISPLAY });

    for (const opened of [host, display]) {
      await assert.rejects(bet(opened, { pick: "over" }));
    }

    assert.equal(getRoomStateSnapshot().spectatorBets?.betCount, 0);

    closeAll([host, display]);
  });
});

test("does refuse a late bet when play has started", async () => {
  await withSocketServer(async (url, { broadcaster }) => {
    const watcher = await openPhone(url, "player-3");

    broadcaster.applyAndBroadcast(() => {
      advanceUntil(Phase.MINIGAME_PLAY, 1);
      return getRoomStateSnapshot();
    });
    await settle();

    assert.deepEqual(await bet(watcher, { pick: "over" }), {
      ok: false,
      reason: SPECTATOR_BET_REFUSAL_REASONS.CLOSED
    });
    assert.equal(getRoomStateSnapshot().spectatorBets?.betCount, 0);

    closeAll([watcher]);
  });
});

test("does hand a phone its own pick back when it reconnects on its own claim secret", async () => {
  await withSocketServer(async (url) => {
    const before = await open(
      url,
      { clientRole: CLIENT_ROLES.PLAYER, joinToken: playerClaimStore.getJoinToken() },
      lanHost(url)
    );
    const claimed: { ok: true; claimSecret: string } = await before.socket
      .timeout(2_000)
      .emitWithAck(CLIENT_TO_SERVER_EVENTS.PLAYER_CLAIM, { playerId: "player-4" });

    await bet(before, { pick: "over" });
    before.socket.close();
    await settle();

    const after = await open(
      url,
      { clientRole: CLIENT_ROLES.PLAYER, joinToken: playerClaimStore.getJoinToken(), claimSecret: claimed.claimSecret },
      lanHost(url)
    );

    await settle();

    assert.deepEqual(ownBetsOf(after).at(-1), { turnKey: "1:0", pick: "over" });

    closeAll([after]);
  });
});

const claimWithSecret = async (url: string, playerId: string): Promise<{ phone: OpenedSocket; claimSecret: string }> => {
  const phone = await open(
    url,
    { clientRole: CLIENT_ROLES.PLAYER, joinToken: playerClaimStore.getJoinToken() },
    lanHost(url)
  );
  const claimed: { ok: true; claimSecret: string } = await phone.socket
    .timeout(2_000)
    .emitWithAck(CLIENT_TO_SERVER_EVENTS.PLAYER_CLAIM, { playerId });

  return { phone, claimSecret: claimed.claimSecret };
};

const snapshotCountOf = (opened: OpenedSocket): number =>
  opened.events.filter(([name]) => name === SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT).length;

test("does keep a released face's pick from the next phone when another guest sits in the face", async () => {
  await withSocketServer(async (url) => {
    const { phone: first, claimSecret } = await claimWithSecret(url, "player-3");

    assert.deepEqual(await bet(first, { pick: "over" }), { ok: true, turnKey: "1:0", pick: "over" });

    const released: { ok: boolean } = await first.socket
      .timeout(2_000)
      .emitWithAck(CLIENT_TO_SERVER_EVENTS.PLAYER_RELEASE, { claimSecret });

    assert.equal(released.ok, true);
    first.socket.close();
    await settle();

    // The pick went with its holder while the window was open: the room counts no bet.
    assert.deepEqual(getRoomStateSnapshot().spectatorBets?.betsByPlayerId, {});
    assert.equal(getRoomStateSnapshot().spectatorBets?.betCount, 0);

    // A different guest's phone taps the now-free face: it is told it has no pick, and asking for
    // the room again does not change that.
    const second = await openPhone(url, "player-3");

    second.socket.emit(CLIENT_TO_SERVER_EVENTS.REQUEST_STATE);
    await settle();

    assert.ok(ownBetsOf(second).length > 0);
    assert.ok(ownBetsOf(second).every((own) => own.pick === null));

    closeAll([second]);
  });
});

test("does drop a watcher's open-window pick when the host frees their face", async () => {
  await withSocketServer(async (url, { broadcaster }) => {
    const watcher = await openPhone(url, "player-4");

    await bet(watcher, { pick: "under" });
    broadcaster.applyAndBroadcast(() => releasePlayerClaimByHost("player-4"));
    await settle();

    assert.equal(getRoomStateSnapshot().spectatorBets?.betCount, 0);

    closeAll([watcher]);
  });
});

test("does never hand a locked pick to the next guest when the face changes hands after play starts", async () => {
  await withSocketServer(async (url, { broadcaster }) => {
    const { phone: first, claimSecret } = await claimWithSecret(url, "player-3");

    await bet(first, { pick: "over" });
    broadcaster.applyAndBroadcast(() => {
      advanceUntil(Phase.MINIGAME_PLAY, 1);
      return getRoomStateSnapshot();
    });
    await first.socket.timeout(2_000).emitWithAck(CLIENT_TO_SERVER_EVENTS.PLAYER_RELEASE, { claimSecret });
    first.socket.close();
    await settle();

    // A locked bet stands for the turn it was placed on…
    assert.deepEqual(getRoomStateSnapshot().spectatorBets?.betsByPlayerId, { "player-3": "over" });

    // …but it was its holder's, and the guest who sits in the face next is never told it.
    const second = await openPhone(url, "player-3");

    second.socket.emit(CLIENT_TO_SERVER_EVENTS.REQUEST_STATE);
    await settle();

    assert.ok(ownBetsOf(second).length > 0);
    assert.ok(ownBetsOf(second).every((own) => own.pick === null));

    closeAll([second]);
  });
});

test("does send no screen a new snapshot when a watcher only flips their pick", async () => {
  await withSocketServer(async (url) => {
    const host = await open(url, { clientRole: CLIENT_ROLES.HOST });
    const display = await open(url, { clientRole: CLIENT_ROLES.DISPLAY });
    const bettor = await openPhone(url, "player-3");
    const neighbour = await openPhone(url, "player-4");

    await bet(bettor, { pick: "over" });
    await settle();

    // The first bet moved the count, so every screen heard it.
    assert.equal(display.events.length > 0, true);

    const before = [host, display, neighbour, bettor].map(snapshotCountOf);

    for (let index = 0; index < 4; index += 1) {
      assert.equal((await bet(bettor, { pick: index % 2 === 0 ? "under" : "over" })).ok, true);
    }

    await settle();

    // A flip changes no view — the count is the same and the pick is hidden from everyone — so no
    // snapshot goes out; the bettor alone is told its own pick each time.
    assert.deepEqual([host, display, neighbour, bettor].map(snapshotCountOf), before);
    assert.deepEqual(
      ownBetsOf(bettor)
        .slice(-4)
        .map((own) => own.pick),
      ["under", "over", "under", "over"]
    );

    // A new bettor does move the count, and the screens hear that.
    await bet(neighbour, { pick: "under" });
    await settle();

    assert.equal(snapshotCountOf(display), before[1] + 1);
    assert.equal(lastSnapshotOf(display).roomState.spectatorBets?.betCount, 2);

    closeAll([host, display, bettor, neighbour]);
  });
});
