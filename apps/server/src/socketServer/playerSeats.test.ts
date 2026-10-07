import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import test, { beforeEach } from "node:test";

import {
  CLIENT_ROLES,
  CLIENT_TO_SERVER_EVENTS,
  PLAYER_AUTH_REQUIRED_ERROR_CODE,
  PLAYER_CLAIM_GONE_REASONS,
  SERVER_TO_CLIENT_EVENTS,
  type PlayerClaimResult,
  type RoleScopedStateSnapshotEnvelope
} from "@wingnight/shared";
import { io, type Socket } from "socket.io-client";

import { playerClaimStore } from "../playerClaims/index.js";
import {
  resetGameToSetup,
  releasePlayerClaimByHost,
  resetRoomState,
  rotatePlayerJoinTokenByHost,
  setRoomStatePlayers
} from "../roomState/index.js";
import { attachSocketServer, type AttachedSocketServer } from "./index.js";

// The whole phone seat over the wire: a real server, real Socket.IO clients,
// the real claim store and room. What is proved here is the property the
// milestone stands on — the join token and the claim secrets reach exactly
// the devices they were made for, and no snapshot carries either.

type RecordedEvent = [string, unknown[]];

type OpenedSocket = {
  socket: Socket;
  events: RecordedEvent[];
  waitFor: (event: string) => Promise<unknown[]>;
};

const ROSTER = [
  { id: "player-1", name: "Brad" },
  { id: "player-2", name: "Rob" },
  { id: "player-3", name: "Kim" }
];

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

// WebSocket transport, so the Host header the test sets is the one the server
// reads: a "LAN" display is the same process with the Wi-Fi's Host header.
const open = (url: string, auth: Record<string, string>, host?: string): OpenedSocket => {
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

  const waitFor = (event: string): Promise<unknown[]> =>
    new Promise((resolve, reject) => {
      const seen = events.find(([name]) => name === event);

      if (seen !== undefined) {
        resolve(seen[1]);
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error(`timed out waiting for ${event}`));
      }, 2_000);

      socket.on(event, (...args: unknown[]) => {
        clearTimeout(timeout);
        resolve(args);
      });
    });

  return { socket, events, waitFor };
};

const claim = (phone: OpenedSocket, playerId: string): Promise<PlayerClaimResult> =>
  phone.socket.timeout(2_000).emitWithAck(CLIENT_TO_SERVER_EVENTS.PLAYER_CLAIM, { playerId });

const lanHost = (url: string): string => `192.168.1.23:${new URL(url).port}`;

// Lets every event in flight land before the logs are read.
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 150));

const snapshotsOf = (opened: OpenedSocket): RoleScopedStateSnapshotEnvelope[] =>
  opened.events
    .filter(([name]) => name === SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT)
    .map(([, args]) => args[0] as RoleScopedStateSnapshotEnvelope);

beforeEach(() => {
  resetRoomState();
  setRoomStatePlayers(ROSTER);
});

test("does refuse a PLAYER handshake over the wire when the join token is wrong", async () => {
  await withSocketServer(async (url) => {
    for (const joinToken of ["guessed", ""]) {
      const outcome = await new Promise<string>((resolve) => {
        const socket = io(url, {
          auth: { clientRole: CLIENT_ROLES.PLAYER, joinToken },
          extraHeaders: { Host: lanHost(url) },
          transports: ["websocket"],
          reconnection: false,
          forceNew: true
        });

        socket.on("connect_error", (error) => {
          socket.close();
          resolve(error.message);
        });
        socket.on(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT, (envelope: RoleScopedStateSnapshotEnvelope) => {
          socket.close();
          resolve(`seated as ${envelope.clientRole}`);
        });
      });

      assert.equal(outcome, PLAYER_AUTH_REQUIRED_ERROR_CODE);
    }
  });
});

test("does hand the join token to the laptop's display and never to a display on the Wi-Fi", async () => {
  await withSocketServer(async (url, { broadcaster }) => {
    const laptopDisplay = open(url, { clientRole: CLIENT_ROLES.DISPLAY });
    const lanDisplay = open(url, { clientRole: CLIENT_ROLES.DISPLAY }, lanHost(url));

    const [first] = await laptopDisplay.waitFor(SERVER_TO_CLIENT_EVENTS.PLAYER_JOIN_TOKEN);
    const firstToken = (first as { joinToken: string }).joinToken;

    assert.equal(firstToken, playerClaimStore.getJoinToken());

    // Reset Game rotates it, and the TV is handed the new one at once.
    broadcaster.applyAndBroadcast(resetGameToSetup);
    await settle();

    const laptopTokens = laptopDisplay.events
      .filter(([name]) => name === SERVER_TO_CLIENT_EVENTS.PLAYER_JOIN_TOKEN)
      .map(([, args]) => (args[0] as { joinToken: string }).joinToken);

    assert.deepEqual(laptopTokens, [firstToken, playerClaimStore.getJoinToken()]);
    assert.notEqual(laptopTokens[1], firstToken);

    const lanTranscript = JSON.stringify(lanDisplay.events);

    assert.equal(snapshotsOf(lanDisplay).length > 0, true);
    assert.equal(lanTranscript.includes(SERVER_TO_CLIENT_EVENTS.PLAYER_JOIN_TOKEN), false);
    for (const token of laptopTokens) {
      assert.equal(lanTranscript.includes(token), false);
    }

    laptopDisplay.socket.close();
    lanDisplay.socket.close();
  });
});

test("does keep the join token and every claim secret out of display and player snapshots", async () => {
  await withSocketServer(async (url) => {
    const joinToken = playerClaimStore.getJoinToken();
    const laptopDisplay = open(url, { clientRole: CLIENT_ROLES.DISPLAY });
    const lanDisplay = open(url, { clientRole: CLIENT_ROLES.DISPLAY }, lanHost(url));
    const phoneA = open(url, { clientRole: CLIENT_ROLES.PLAYER, joinToken }, lanHost(url));
    const phoneB = open(url, { clientRole: CLIENT_ROLES.PLAYER, joinToken }, lanHost(url));

    await phoneA.waitFor(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT);
    await phoneB.waitFor(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT);

    const claimA = await claim(phoneA, "player-1");
    const claimB = await claim(phoneB, "player-2");

    assert.equal(claimA.ok && claimB.ok, true);
    await settle();

    const secrets = [joinToken, claimA.ok ? claimA.claimSecret : "", claimB.ok ? claimB.claimSecret : ""];

    for (const opened of [laptopDisplay, lanDisplay, phoneA, phoneB]) {
      const snapshots = snapshotsOf(opened);
      const serialized = JSON.stringify(snapshots);

      assert.equal(snapshots.length > 0, true);
      for (const secret of secrets) {
        assert.equal(serialized.includes(secret), false);
      }
    }

    // The room does learn whose faces are taken — by id, and nothing more.
    const lastPhoneSnapshot = snapshotsOf(phoneB).at(-1);

    assert.equal(lastPhoneSnapshot?.clientRole, CLIENT_ROLES.PLAYER);
    assert.deepEqual(lastPhoneSnapshot?.roomState.claimedPlayerIds, ["player-1", "player-2"]);

    for (const opened of [laptopDisplay, lanDisplay, phoneA, phoneB]) {
      opened.socket.close();
    }
  });
});

test("does tell only the claiming phone who it is", async () => {
  await withSocketServer(async (url) => {
    const joinToken = playerClaimStore.getJoinToken();
    const phoneA = open(url, { clientRole: CLIENT_ROLES.PLAYER, joinToken });
    const phoneB = open(url, { clientRole: CLIENT_ROLES.PLAYER, joinToken });
    const display = open(url, { clientRole: CLIENT_ROLES.DISPLAY });

    await phoneA.waitFor(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT);
    await phoneB.waitFor(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT);
    await claim(phoneA, "player-3");
    await settle();

    const selfEventsOf = (opened: OpenedSocket): unknown[] =>
      opened.events
        .filter(([name]) => name === SERVER_TO_CLIENT_EVENTS.PLAYER_SELF)
        .map(([, args]) => args[0]);

    assert.deepEqual(selfEventsOf(phoneA), [{ playerId: "player-3" }]);
    assert.deepEqual(selfEventsOf(phoneB), []);
    assert.deepEqual(selfEventsOf(display), []);

    for (const opened of [phoneA, phoneB, display]) {
      opened.socket.close();
    }
  });
});

test("does tell a phone its face is gone and let it go when the host resets the night", async () => {
  await withSocketServer(async (url, { broadcaster }) => {
    const phone = open(url, { clientRole: CLIENT_ROLES.PLAYER, joinToken: playerClaimStore.getJoinToken() });

    await phone.waitFor(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT);
    await claim(phone, "player-1");
    const disconnected = new Promise<string>((resolve) => {
      phone.socket.on("disconnect", resolve);
    });
    broadcaster.applyAndBroadcast(resetGameToSetup);

    const [gone] = await phone.waitFor(SERVER_TO_CLIENT_EVENTS.PLAYER_CLAIM_GONE);

    assert.deepEqual(gone, { playerId: "player-1", reason: PLAYER_CLAIM_GONE_REASONS.NIGHT_RESET });

    // And the socket that joined on the old token is let go, for good.
    assert.equal(await disconnected, "io server disconnect");
    phone.socket.close();
  });
});

test("does keep another phone's per-player events off a socket when a different socket released its face", async () => {
  await withSocketServer(async (url) => {
    const joinToken = playerClaimStore.getJoinToken();
    const holder = open(url, { clientRole: CLIENT_ROLES.PLAYER, joinToken });
    const releaser = open(url, { clientRole: CLIENT_ROLES.PLAYER, joinToken });
    const nextPhone = open(url, { clientRole: CLIENT_ROLES.PLAYER, joinToken });

    for (const opened of [holder, releaser, nextPhone]) {
      await opened.waitFor(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT);
    }

    const held = await claim(holder, "player-1");

    assert.equal(held.ok, true);

    // A socket that does not hold the face sends its secret (a second tab on
    // the same phone, a copied localStorage).
    const released: { ok: boolean } = await releaser.socket
      .timeout(2_000)
      .emitWithAck(CLIENT_TO_SERVER_EVENTS.PLAYER_RELEASE, {
        claimSecret: held.ok ? held.claimSecret : ""
      });
    await settle();

    const holderWasTold = holder.events.some(
      ([name]) => name === SERVER_TO_CLIENT_EVENTS.PLAYER_CLAIM_GONE
    );

    // Either only the holder may release, or the holder hears its face went.
    assert.ok(!released.ok || holderWasTold, "the holder still believes it holds player-1");

    await claim(nextPhone, "player-1");
    await settle();

    const holderSelfEvents = holder.events.filter(
      ([name]) => name === SERVER_TO_CLIENT_EVENTS.PLAYER_SELF
    );

    // The old holder heard its own `player:self` once, and never the next phone's.
    assert.equal(holderSelfEvents.length, 1);

    for (const opened of [holder, releaser, nextPhone]) {
      opened.socket.close();
    }
  });
});

// The invariant behind every per-player event: `player:<id>` holds exactly the
// socket the store says holds that face, and nobody when nobody does.
const assertPlayerRoomsMatchHolders = (attached: AttachedSocketServer): void => {
  for (const { id } of ROSTER) {
    const members = [...(attached.socketServer.sockets.adapter.rooms.get(`player:${id}`) ?? [])];
    const holder = playerClaimStore.resolveHolderSocketId(id);

    assert.deepEqual(members, holder === null ? [] : [holder], `player:${id}`);
  }
};

test("does keep each player room to its one current holder through claims, switches, releases and takeovers", async () => {
  await withSocketServer(async (url, attached) => {
    const joinToken = playerClaimStore.getJoinToken();
    const phoneA = open(url, { clientRole: CLIENT_ROLES.PLAYER, joinToken });
    const phoneB = open(url, { clientRole: CLIENT_ROLES.PLAYER, joinToken });

    await phoneA.waitFor(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT);
    await phoneB.waitFor(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT);

    const first = await claim(phoneA, "player-1");
    assertPlayerRoomsMatchHolders(attached);

    await claim(phoneA, "player-2");
    assertPlayerRoomsMatchHolders(attached);

    // Phone B sends A's first secret (spent: A let that face go to switch),
    // which frees nothing, then takes the free face.
    await phoneB.socket.timeout(2_000).emitWithAck(CLIENT_TO_SERVER_EVENTS.PLAYER_RELEASE, {
      claimSecret: first.ok ? first.claimSecret : ""
    });
    await claim(phoneB, "player-1");
    await settle();
    assertPlayerRoomsMatchHolders(attached);

    // The host frees B's face, and A — which holds player-2 — takes it.
    attached.broadcaster.applyAndBroadcast(() => releasePlayerClaimByHost("player-1"));
    await settle();
    assertPlayerRoomsMatchHolders(attached);

    await claim(phoneA, "player-1");
    await settle();
    assertPlayerRoomsMatchHolders(attached);

    for (const opened of [phoneA, phoneB]) {
      opened.socket.close();
    }
  });
});

test("does tell the first tab its face moved when a second socket comes back on the same secret", async () => {
  await withSocketServer(async (url, attached) => {
    const joinToken = playerClaimStore.getJoinToken();
    const firstTab = open(url, { clientRole: CLIENT_ROLES.PLAYER, joinToken });

    await firstTab.waitFor(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT);
    const held = await claim(firstTab, "player-2");
    const claimSecret = held.ok ? held.claimSecret : "";
    const secondTab = open(url, { clientRole: CLIENT_ROLES.PLAYER, joinToken, claimSecret });

    const [gone] = await firstTab.waitFor(SERVER_TO_CLIENT_EVENTS.PLAYER_CLAIM_GONE);
    const [self] = await secondTab.waitFor(SERVER_TO_CLIENT_EVENTS.PLAYER_SELF);

    assert.deepEqual(gone, { playerId: "player-2", reason: PLAYER_CLAIM_GONE_REASONS.SUPERSEDED });
    assert.deepEqual(self, { playerId: "player-2" });
    assert.equal(playerClaimStore.resolveHolderSocketId("player-2"), secondTab.socket.id);
    assertPlayerRoomsMatchHolders(attached);

    firstTab.socket.close();
    secondTab.socket.close();
  });
});

test("does turn a flood of claim toggles into a handful of snapshots for the TV", async () => {
  await withSocketServer(async (url) => {
    const tv = open(url, { clientRole: CLIENT_ROLES.DISPLAY });
    const phone = open(url, { clientRole: CLIENT_ROLES.PLAYER, joinToken: playerClaimStore.getJoinToken() });

    await tv.waitFor(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT);
    await phone.waitFor(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT);
    const snapshotsBefore = snapshotsOf(tv).length;

    const answers = await Promise.all(
      Array.from({ length: 300 }, (_, index) =>
        claim(phone, index % 2 === 0 ? "player-1" : "player-2")
      )
    );
    await settle();

    const rateLimited = answers.filter((answer) => !answer.ok && answer.reason === "rate_limited");

    assert.equal(rateLimited.length > 280, true, `${rateLimited.length} refused`);
    assert.equal(snapshotsOf(tv).length - snapshotsBefore <= 3, true);

    tv.socket.close();
    phone.socket.close();
  });
});

test("does keep seated phones and drop unseated ones when the host prints a new join code", async () => {
  await withSocketServer(async (url, { broadcaster }) => {
    const oldToken = playerClaimStore.getJoinToken();
    const tv = open(url, { clientRole: CLIENT_ROLES.DISPLAY });
    const seated = open(url, { clientRole: CLIENT_ROLES.PLAYER, joinToken: oldToken });
    const browsing = open(url, { clientRole: CLIENT_ROLES.PLAYER, joinToken: oldToken });

    await seated.waitFor(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT);
    await browsing.waitFor(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT);
    await tv.waitFor(SERVER_TO_CLIENT_EVENTS.PLAYER_JOIN_TOKEN);
    const held = await claim(seated, "player-3");
    const browsingDropped = new Promise<string>((resolve) => {
      browsing.socket.on("disconnect", resolve);
    });

    broadcaster.applyAndBroadcast(rotatePlayerJoinTokenByHost);

    assert.equal(await browsingDropped, "io server disconnect");
    await settle();
    assert.equal(seated.socket.connected, true);
    assert.notEqual(playerClaimStore.getJoinToken(), oldToken);
    assert.equal(
      tv.events.filter(([name]) => name === SERVER_TO_CLIENT_EVENTS.PLAYER_JOIN_TOKEN).length,
      2
    );

    // A new phone on the old code is refused; the seated phone comes back on
    // its claim secret with the same old code.
    const refused = await new Promise<string>((resolve) => {
      const socket = io(url, {
        auth: { clientRole: CLIENT_ROLES.PLAYER, joinToken: oldToken },
        transports: ["websocket"],
        reconnection: false,
        forceNew: true
      });

      socket.on("connect_error", (error) => {
        socket.close();
        resolve(error.message);
      });
      socket.on("connect", () => {
        socket.close();
        resolve("connected");
      });
    });

    assert.equal(refused, PLAYER_AUTH_REQUIRED_ERROR_CODE);

    const rejoined = open(url, {
      clientRole: CLIENT_ROLES.PLAYER,
      joinToken: oldToken,
      claimSecret: held.ok ? held.claimSecret : ""
    });
    const [self] = await rejoined.waitFor(SERVER_TO_CLIENT_EVENTS.PLAYER_SELF);

    assert.deepEqual(self, { playerId: "player-3" });

    for (const opened of [tv, seated, browsing, rejoined]) {
      opened.socket.close();
    }
  });
});

test("does answer a token request from the laptop's display and not from a display on the Wi-Fi", async () => {
  await withSocketServer(async (url) => {
    const laptopDisplay = open(url, { clientRole: CLIENT_ROLES.DISPLAY });
    const lanDisplay = open(url, { clientRole: CLIENT_ROLES.DISPLAY }, lanHost(url));

    await laptopDisplay.waitFor(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT);
    await lanDisplay.waitFor(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT);

    laptopDisplay.socket.emit(CLIENT_TO_SERVER_EVENTS.REQUEST_PLAYER_JOIN_TOKEN);
    lanDisplay.socket.emit(CLIENT_TO_SERVER_EVENTS.REQUEST_PLAYER_JOIN_TOKEN);
    await settle();

    const tokenEventsOf = (opened: OpenedSocket): number =>
      opened.events.filter(([name]) => name === SERVER_TO_CLIENT_EVENTS.PLAYER_JOIN_TOKEN).length;

    // One on connect, one on request.
    assert.equal(tokenEventsOf(laptopDisplay), 2);
    assert.equal(tokenEventsOf(lanDisplay), 0);

    laptopDisplay.socket.close();
    lanDisplay.socket.close();
  });
});
