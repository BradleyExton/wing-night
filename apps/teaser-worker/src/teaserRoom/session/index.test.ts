import assert from "node:assert/strict";
import test from "node:test";

import type { TeaserRoster } from "@wingnight/shared";

import {
  closeRoomSocket,
  createRoomSnapshot,
  createTeaserRoomSession,
  fireRoomDeadline,
  openRoomSocket,
  receiveRoomMessage,
  resolveRoomDeadline,
  resolveSocketPlayerId,
  type TeaserRoomSession
} from "./index.ts";

const roster: TeaserRoster = {
  players: [
    { id: "p-rob", name: "Rob" },
    { id: "p-jaz", name: "Jaz" },
    { id: "p-sam", name: "Sam" }
  ],
  teams: [
    { id: "t-metal", name: "Iron Hens", genre: "metal", playerIds: ["p-rob", "p-jaz"], totalScore: 0 },
    { id: "t-disco", name: "Mirror Balls", genre: "disco", playerIds: ["p-sam"], totalScore: 0 }
  ]
};

const say = (session: TeaserRoomSession, socketId: string, message: unknown, nowMs = 1000) =>
  receiveRoomMessage(session, socketId, JSON.stringify(message), nowMs);

// A phone that opened the room, said hello and sat down as `playerId`.
const seat = (session: TeaserRoomSession, socketId: string, playerId: string): void => {
  openRoomSocket(session, socketId, 0);
  say(session, socketId, { t: "hello", clientId: `tab-${socketId}` });
  say(session, socketId, { t: "seat", playerId });
};

test("does seat a phone as a roster player and refuse that face to a second phone", () => {
  const session = createTeaserRoomSession("ABCD", roster);

  seat(session, "a", "p-rob");
  openRoomSocket(session, "b", 0);
  say(session, "b", { t: "hello", clientId: "tab-b" });

  const { reply } = say(session, "b", { t: "seat", playerId: "p-rob" });

  assert.deepEqual(reply, [{ t: "refused", reason: "seat_taken" }]);
  assert.equal(resolveSocketPlayerId(session, "a"), "p-rob");
  assert.equal(resolveSocketPlayerId(session, "b"), null);
});

test("does refuse a player the roster does not have", () => {
  const session = createTeaserRoomSession("ABCD", roster);

  openRoomSocket(session, "a", 0);
  say(session, "a", { t: "hello", clientId: "tab-a" });

  assert.deepEqual(say(session, "a", { t: "seat", playerId: "p-nobody" }).reply, [{ t: "refused", reason: "refused" }]);
});

test("does start the game with every seated player out and the first stage running", () => {
  const session = createTeaserRoomSession("ABCD", roster);

  seat(session, "a", "p-rob");
  seat(session, "b", "p-sam");

  assert.equal(say(session, "a", { t: "start" }).changed, true);

  const snapshot = createRoomSnapshot(session);

  assert.equal(snapshot.phase, "playing");
  assert.equal(snapshot.crewStatus, "running");
  assert.deepEqual(Object.keys(snapshot.pads).sort(), ["p-rob", "p-sam"]);
  assert.ok(Object.values(snapshot.pads).every((pad) => pad.state === "up"));
});

test("does play a thumb as the seat's own player when a seated phone sends one", () => {
  const session = createTeaserRoomSession("ABCD", roster);

  seat(session, "a", "p-rob");
  say(session, "a", { t: "start" });

  assert.equal(say(session, "a", { t: "action", actionType: "walk", actionPayload: { dir: 1 } }, 1100).changed, true);
});

test("does refuse a host's action when a phone sends it", () => {
  const session = createTeaserRoomSession("ABCD", roster);

  seat(session, "a", "p-rob");
  say(session, "a", { t: "start" });

  for (const actionType of ["resetTurn", "skipBlock", "startBlock", "pulse"]) {
    assert.deepEqual(say(session, "a", { t: "action", actionType, actionPayload: {} }).reply, [{ t: "refused", reason: "refused" }], actionType);
  }
});

test("does refuse a thumb from a phone that only watches", () => {
  const session = createTeaserRoomSession("ABCD", roster);

  seat(session, "a", "p-rob");
  say(session, "a", { t: "start" });
  openRoomSocket(session, "w", 0);
  say(session, "w", { t: "hello", clientId: "tab-w" });

  assert.deepEqual(say(session, "w", { t: "action", actionType: "walk", actionPayload: { dir: 1 } }).reply, [
    { t: "refused", reason: "not_seated" }
  ]);
  assert.deepEqual(say(session, "w", { t: "seat", playerId: "p-jaz" }).reply, [{ t: "refused", reason: "refused" }]);
});

test("does keep a seat through a dropped phone mid-game and hand it back to the same tab", () => {
  const session = createTeaserRoomSession("ABCD", roster);

  seat(session, "a", "p-rob");
  say(session, "a", { t: "start" });
  closeRoomSocket(session, "a");

  assert.deepEqual(createRoomSnapshot(session).seats, [{ playerId: "p-rob", connected: false }]);

  openRoomSocket(session, "a2", 0);
  say(session, "a2", { t: "hello", clientId: "tab-a" });

  assert.equal(resolveSocketPlayerId(session, "a2"), "p-rob");
  assert.deepEqual(createRoomSnapshot(session).seats, [{ playerId: "p-rob", connected: true }]);
});

test("does free a seat when its phone leaves the lobby", () => {
  const session = createTeaserRoomSession("ABCD", roster);

  seat(session, "a", "p-rob");
  closeRoomSocket(session, "a");

  assert.deepEqual(createRoomSnapshot(session).seats, []);
});

test("does run the game to its end card on the room's clock when a thumb starts each later stage", () => {
  const session = createTeaserRoomSession("ABCD", roster);

  seat(session, "a", "p-rob");
  say(session, "a", { t: "start" });

  let steps = 0;
  let nowMs = 1000;

  // The room's pulse plays each stage out; between stages the game waits for a crew thumb, as it
  // does at the party, and the test's player gives it one once the hold is over.
  while (session.phase === "playing" && steps < 5000) {
    const deadline = resolveRoomDeadline(session);

    if (deadline === null) {
      nowMs += 3000;
      say(session, "a", { t: "action", actionType: "walk", actionPayload: { dir: 1 } }, nowMs);
      say(session, "a", { t: "action", actionType: "walk", actionPayload: { dir: 0 } }, nowMs + 1);
    } else {
      nowMs = deadline;
      fireRoomDeadline(session, nowMs);
    }

    steps += 1;
  }

  const snapshot = createRoomSnapshot(session);

  assert.equal(snapshot.phase, "finished");
  assert.equal(snapshot.view?.minigame, "BRAWL");
  assert.equal(snapshot.view?.minigame === "BRAWL" ? snapshot.view.phase : null, "finished");
  assert.equal(say(session, "a", { t: "start" }, nowMs + 10).changed, true, "the end card's start plays again");
  assert.equal(createRoomSnapshot(session).phase, "playing");
});

// Base Borden's room: the same room, its own start action, two hens at a time, four seats.
const bordenRoster: TeaserRoster = {
  players: ["rob", "jaz", "sam", "kim", "lee"].map((name) => ({ id: `p-${name}`, name })),
  teams: [{ id: "t-metal", name: "Iron Hens", genre: "metal", playerIds: ["p-rob", "p-jaz", "p-sam", "p-kim", "p-lee"], totalScore: 0 }]
};

test("does start Base Borden's first stretch with the first pair up and the third player out", () => {
  const session = createTeaserRoomSession("ABCD", bordenRoster, "BORDEN");

  seat(session, "a", "p-rob");
  seat(session, "b", "p-jaz");
  seat(session, "c", "p-sam");

  assert.equal(say(session, "a", { t: "start" }).changed, true);

  const snapshot = createRoomSnapshot(session);

  assert.equal(snapshot.game, "BORDEN");
  assert.equal(snapshot.view?.minigame, "BORDEN");
  assert.equal(snapshot.crewStatus, "running");
  assert.deepEqual(snapshot.pads["p-rob"], { state: "up", slot: 0, hearts: 3 });
  assert.deepEqual(snapshot.pads["p-jaz"], { state: "up", slot: 1, hearts: 3 });
  assert.equal(snapshot.pads["p-sam"]?.state, "out");
});

test("does seat only four phones in a Base Borden room", () => {
  const session = createTeaserRoomSession("ABCD", bordenRoster, "BORDEN");

  ["a", "b", "c", "d"].forEach((socketId, index) => {
    seat(session, socketId, bordenRoster.players[index]?.id ?? "");
  });
  openRoomSocket(session, "e", 0);
  say(session, "e", { t: "hello", clientId: "tab-e" });

  assert.deepEqual(say(session, "e", { t: "seat", playerId: "p-lee" }).reply, [{ t: "refused", reason: "full" }]);
  assert.equal(session.seats.length, 4);
});

test("does play Base Borden's thumbs and refuse another game's when a phone in the pair sends them", () => {
  const session = createTeaserRoomSession("ABCD", bordenRoster, "BORDEN");

  seat(session, "a", "p-rob");
  seat(session, "b", "p-jaz");
  say(session, "a", { t: "start" });

  assert.equal(say(session, "a", { t: "action", actionType: "stick", actionPayload: { dir: 1 } }, 1100).changed, true);
  assert.equal(say(session, "b", { t: "action", actionType: "jump", actionPayload: {} }, 1150).changed, true);
  assert.deepEqual(say(session, "a", { t: "action", actionType: "walk", actionPayload: { dir: 1 } }, 1200).reply, [
    { t: "refused", reason: "refused" }
  ]);
  assert.deepEqual(say(session, "a", { t: "action", actionType: "skipStretch", actionPayload: {} }, 1250).reply, [
    { t: "refused", reason: "refused" }
  ]);
});

test("does step Base Borden's quiet stretch on the room's own pulse", () => {
  const session = createTeaserRoomSession("ABCD", bordenRoster, "BORDEN");

  seat(session, "a", "p-rob");
  say(session, "a", { t: "start" });

  const atMs = resolveRoomDeadline(session);

  assert.notEqual(atMs, null);
  assert.equal(fireRoomDeadline(session, atMs ?? 0), true);

  const view = createRoomSnapshot(session).view;
  const tick = view?.minigame === "BORDEN" ? (view.stretches[0]?.frame?.tick ?? 0) : 0;

  assert.ok(tick > 0);
});
