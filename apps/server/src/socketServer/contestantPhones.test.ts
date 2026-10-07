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
  type PlayerMinigameActionResult,
  type PlayerMinigameHostViewPayload,
  type RoleScopedStateSnapshotEnvelope
} from "@wingnight/shared";
import { io, type Socket } from "socket.io-client";

import { playerClaimStore } from "../playerClaims/index.js";
import { getRoomStateSnapshot, resetRoomState, setRoundDeviceMode } from "../roomState/index.js";
import { advanceUntil, setupArcadeNight } from "../roomState/testHarness.js";
import { PLAYER_MINIGAME_ACTION_BURST } from "./registerPlayerHandlers/index.js";
import { attachSocketServer, type AttachedSocketServer } from "./index.js";

// The contestant's phone over the wire: a real server, real Socket.IO clients, the real claim
// store and room. What is proved here is the line the milestone draws — the game's host view
// reaches the one phone playing the leg in hand, in phones mode, for an arcade relay, and nobody
// else; and a phone's input lands only on its own leg, only while it holds it.

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

const openPhone = async (url: string, playerId: string): Promise<OpenedSocket> => {
  const phone = await open(
    url,
    { clientRole: CLIENT_ROLES.PLAYER, joinToken: playerClaimStore.getJoinToken() },
    lanHost(url)
  );
  const result: { ok: boolean } = await phone.socket
    .timeout(2_000)
    .emitWithAck(CLIENT_TO_SERVER_EVENTS.PLAYER_CLAIM, { playerId });

  assert.equal(result.ok, true);

  return phone;
};

const openHost = async (url: string): Promise<{ host: OpenedSocket; hostSecret: string }> => {
  const host = await open(url, { clientRole: CLIENT_ROLES.HOST });
  const issued = nextEvent(host.socket, SERVER_TO_CLIENT_EVENTS.SECRET_ISSUED);

  host.socket.emit(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL);

  const [{ hostSecret }] = (await issued) as [{ hostSecret: string }];

  return { host, hostSecret };
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

const hostViewsOf = (opened: OpenedSocket): PlayerMinigameHostViewPayload[] =>
  opened.events
    .filter(([name]) => name === SERVER_TO_CLIENT_EVENTS.PLAYER_MINIGAME_HOST_VIEW)
    .map(([, args]) => args[0] as PlayerMinigameHostViewPayload);

const snapshotsOf = (opened: OpenedSocket): RoleScopedStateSnapshotEnvelope[] =>
  opened.events
    .filter(([name]) => name === SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT)
    .map(([, args]) => args[0] as RoleScopedStateSnapshotEnvelope);

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

test("does hand the host view to the contestant's phone alone and never into a snapshot", async () => {
  setRoundDeviceMode(1, "phones");
  advanceUntil(Phase.MINIGAME_PLAY, 1);

  await withSocketServer(async (url) => {
    const display = await open(url, { clientRole: CLIENT_ROLES.DISPLAY });
    const lanDisplay = await open(url, { clientRole: CLIENT_ROLES.DISPLAY }, lanHost(url));
    const contestant = await openPhone(url, "player-1");
    const teammate = await openPhone(url, "player-2");
    const rival = await openPhone(url, "player-3");
    const unseated = await open(
      url,
      { clientRole: CLIENT_ROLES.PLAYER, joinToken: playerClaimStore.getJoinToken() },
      lanHost(url)
    );

    await settle();
    assert.equal(getRoomStateSnapshot().contestantTurn?.controller, "phone");
    assert.ok(hostViewsOf(contestant).length > 0);
    assert.equal(hostViewsOf(contestant).at(-1)?.minigameHostView.minigame, "FAPPY");

    // The contestant flies; every broadcast re-sends the view, to the contestant alone.
    assert.deepEqual(await act(contestant, "flap", { tick: 2 }), { ok: true });
    await settle();
    const latestView = hostViewsOf(contestant).at(-1)?.minigameHostView;

    assert.ok(latestView?.minigame === "FAPPY");
    assert.deepEqual(latestView.legs[0]?.flapTicks, [2]);

    for (const other of [display, lanDisplay, teammate, rival, unseated]) {
      assert.deepEqual(hostViewsOf(other), []);
    }

    for (const phone of [contestant, teammate, rival, unseated]) {
      const snapshots = snapshotsOf(phone);

      assert.ok(snapshots.length > 0);

      for (const snapshot of snapshots) {
        assert.equal(snapshot.clientRole, CLIENT_ROLES.PLAYER);
        assert.equal("minigameHostView" in snapshot.roomState, false);
        assert.equal("minigameDisplayView" in snapshot.roomState, false);
      }
    }

    // Phones do learn whose leg it is and who writes it — ids, a number and a mode.
    assert.deepEqual(
      snapshotsOf(teammate).at(-1)?.clientRole === CLIENT_ROLES.PLAYER &&
        snapshotsOf(teammate).at(-1)?.roomState.contestantTurn,
      {
        minigame: "FAPPY",
        deviceMode: "phones",
        legIndex: 0,
        contestantPlayerId: "player-1",
        nextContestantPlayerId: "player-2",
        controller: "phone",
        tabletLegIndexes: [],
        droppedPlayerId: null
      }
    );

    closeAll([display, lanDisplay, contestant, teammate, rival, unseated]);
  });
});

test("does move the host view to the next teammate's phone when the leg hands off", async () => {
  setRoundDeviceMode(1, "phones");
  advanceUntil(Phase.MINIGAME_PLAY, 1);

  await withSocketServer(async (url) => {
    const first = await openPhone(url, "player-1");
    const second = await openPhone(url, "player-2");
    const { host, hostSecret } = await openHost(url);

    await settle();
    assert.deepEqual(hostViewsOf(second), []);

    const deliveredToFirst = hostViewsOf(first).length;

    host.socket.emit(CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION, {
      hostSecret,
      minigameId: "FAPPY",
      minigameApiVersion: MINIGAME_API_VERSION,
      actionType: "skipLeg",
      actionPayload: {}
    });
    await settle();

    assert.equal(hostViewsOf(first).length, deliveredToFirst);
    assert.ok(hostViewsOf(second).length > 0);
    assert.deepEqual(await act(first, "flap", { tick: 1 }), {
      ok: false,
      reason: PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.NOT_CONTESTANT
    });
    assert.deepEqual(await act(second, "flap", { tick: 1 }), { ok: true });

    closeAll([first, second, host]);
  });
});

test("does hand no phone a host view, and take no phone input, in a turn locked to the tablet", async () => {
  advanceUntil(Phase.MINIGAME_PLAY, 1);

  await withSocketServer(async (url) => {
    const contestant = await openPhone(url, "player-1");

    await settle();
    assert.deepEqual(await act(contestant, "flap", { tick: 2 }), {
      ok: false,
      reason: PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.TABLET_MODE
    });
    await settle();
    assert.deepEqual(hostViewsOf(contestant), []);
    assert.deepEqual(fappyTicksOf(), []);

    closeAll([contestant]);
  });
});

test("does refuse a phone's input for the wrong player, the wrong phase, a hatch and no face", async () => {
  setRoundDeviceMode(1, "phones");
  advanceUntil(Phase.EATING, 1);

  await withSocketServer(async (url, { broadcaster }) => {
    const contestant = await openPhone(url, "player-1");
    const teammate = await openPhone(url, "player-2");
    const rival = await openPhone(url, "player-3");
    const unseated = await open(
      url,
      { clientRole: CLIENT_ROLES.PLAYER, joinToken: playerClaimStore.getJoinToken() },
      lanHost(url)
    );

    assert.deepEqual(await act(contestant, "flap", { tick: 1 }), {
      ok: false,
      reason: PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.WRONG_PHASE
    });

    broadcaster.applyAndBroadcast(() => {
      advanceUntil(Phase.MINIGAME_PLAY, 1);
      return getRoomStateSnapshot();
    });
    await settle();

    const refusals = {
      rival: await act(rival, "flap", { tick: 1 }),
      offTurnTeammate: await act(teammate, "flap", { tick: 1 }),
      hatch: await act(contestant, "skipLeg", {}),
      otherGame: await act(contestant, "press", { tick: 1 }, "SCHLONIC"),
      noFace: await act(unseated, "flap", { tick: 1 }),
      malformed: (await contestant.socket
        .timeout(2_000)
        .emitWithAck(CLIENT_TO_SERVER_EVENTS.PLAYER_MINIGAME_ACTION, { actionType: "flap" })) as unknown
    };

    assert.deepEqual(refusals, {
      rival: { ok: false, reason: PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.NOT_CONTESTANT },
      offTurnTeammate: { ok: false, reason: PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.NOT_CONTESTANT },
      hatch: { ok: false, reason: PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.HOST_ONLY_ACTION },
      otherGame: { ok: false, reason: PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.WRONG_PHASE },
      noFace: { ok: false, reason: PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.NOT_SEATED },
      malformed: { ok: false, reason: PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.MALFORMED }
    });
    assert.deepEqual(fappyTicksOf(), []);
    assert.equal(getRoomStateSnapshot().minigameHostView?.minigame, "FAPPY");

    closeAll([contestant, teammate, rival, unseated]);
  });
});

test("does give the leg one writer: the phone's, then after a take-back the tablet's", async () => {
  setRoundDeviceMode(1, "phones");
  advanceUntil(Phase.MINIGAME_PLAY, 1);

  await withSocketServer(async (url) => {
    const contestant = await openPhone(url, "player-1");
    const { host, hostSecret } = await openHost(url);
    const tabletSends = (actionType: string, actionPayload: unknown): void => {
      host.socket.emit(CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION, {
        hostSecret,
        minigameId: "FAPPY",
        minigameApiVersion: MINIGAME_API_VERSION,
        actionType,
        actionPayload
      });
    };

    await settle();

    // The phone holds the leg: the tablet's flap is refused, the phone's lands.
    tabletSends("flap", { tick: 5 });
    await settle();
    assert.deepEqual(fappyTicksOf(), []);
    assert.deepEqual(await act(contestant, "flap", { tick: 3 }), { ok: true });
    await settle();
    assert.deepEqual(fappyTicksOf(), [3]);

    // The host takes it back: the leg restarts clean on the tablet, and the phone is refused.
    host.socket.emit(CLIENT_TO_SERVER_EVENTS.TAKE_BACK_CONTESTANT_LEG, { hostSecret });
    await settle();
    assert.equal(getRoomStateSnapshot().contestantTurn?.controller, "tablet");
    assert.deepEqual(fappyTicksOf(), []);
    assert.deepEqual(await act(contestant, "flap", { tick: 9 }), {
      ok: false,
      reason: PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.TABLET_HOLDS_LEG
    });

    const deliveredBeforeTabletPlay = hostViewsOf(contestant).length;

    tabletSends("flap", { tick: 0 });
    await settle();
    assert.deepEqual(fappyTicksOf(), [0]);
    // Off the phone: no more host views for it.
    assert.equal(hostViewsOf(contestant).length, deliveredBeforeTabletPlay);

    closeAll([contestant, host]);
  });
});

test("does hold a flooding phone to its bucket and let the leg's real input through", async () => {
  setRoundDeviceMode(1, "phones");
  advanceUntil(Phase.MINIGAME_PLAY, 1);

  await withSocketServer(async (url) => {
    const contestant = await openPhone(url, "player-1");

    await settle();

    const results = await Promise.all(
      Array.from({ length: PLAYER_MINIGAME_ACTION_BURST + 20 }, (_unused, tick) =>
        act(contestant, "flap", { tick })
      )
    );
    const limited = results.filter(
      (result) => !result.ok && result.reason === PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.RATE_LIMITED
    );

    assert.ok(limited.length > 0);
    assert.ok(results.filter((result) => result.ok).length >= PLAYER_MINIGAME_ACTION_BURST);
    await settle();
    assert.ok(fappyTicksOf().length >= PLAYER_MINIGAME_ACTION_BURST);

    closeAll([contestant]);
  });
});

test("does tell the host's tablet when the phone holding the leg drops mid-leg", async () => {
  setRoundDeviceMode(1, "phones");
  advanceUntil(Phase.MINIGAME_PLAY, 1);

  await withSocketServer(async (url) => {
    const contestant = await openPhone(url, "player-1");
    const { host } = await openHost(url);

    await settle();
    assert.deepEqual(await act(contestant, "flap", { tick: 1 }), { ok: true });
    contestant.socket.close();
    await settle();

    const hostSnapshot = snapshotsOf(host).at(-1);

    assert.ok(hostSnapshot?.clientRole === CLIENT_ROLES.HOST);
    assert.equal(hostSnapshot.roomState.contestantTurn?.droppedPlayerId, "player-1");
    assert.equal(hostSnapshot.roomState.contestantTurn?.controller, "tablet");

    closeAll([host]);
  });
});
