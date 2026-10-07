import assert from "node:assert/strict";
import test from "node:test";
import { Phase, type ContestantTurn, type Team } from "@wingnight/shared";

import { resolvePhoneTurn } from "./index";

const TEAMS: Team[] = [
  { id: "team-1", name: "Spice Girls", playerIds: ["alex", "caitlin", "dan"], totalScore: 0 },
  { id: "team-2", name: "Molten Metal", playerIds: ["rob"], totalScore: 0 }
];

const TURN: ContestantTurn = {
  minigame: "FAPPY",
  deviceMode: "phones",
  legIndex: 0,
  contestantPlayerId: "alex",
  nextContestantPlayerId: "caitlin",
  controller: "phone",
  tabletLegIndexes: [],
  droppedPlayerId: null
};

const room = (overrides: Partial<ContestantTurn> = {}, phase: Phase = Phase.MINIGAME_PLAY) => ({
  phase,
  teams: TEAMS,
  activeRoundTeamId: "team-1",
  activeTurnTeamId: null,
  contestantTurn: { ...TURN, ...overrides }
});

test("does hand the game to the contestant when their phone holds the leg", () => {
  assert.deepEqual(resolvePhoneTurn(room(), "alex", null), { role: "play", legIndex: 0, previousPlayerId: null });
});

test("does tell the contestant to grab the tablet when the tablet holds their leg", () => {
  assert.deepEqual(resolvePhoneTurn(room({ controller: "tablet", tabletLegIndexes: [0] }), "alex", null), {
    role: "tablet"
  });
  assert.deepEqual(resolvePhoneTurn(room({ deviceMode: "tablet", controller: "tablet" }), "alex", null), {
    role: "tablet"
  });
});

test("does keep the game on the contestant's phone when the server saw that phone drop mid-leg", () => {
  assert.deepEqual(
    resolvePhoneTurn(room({ controller: "tablet", droppedPlayerId: "alex" }), "alex", null),
    { role: "play", legIndex: 0, previousPlayerId: null }
  );
});

test("does tell the next teammate they are next and never hand them the game when a leg is in hand", () => {
  assert.deepEqual(resolvePhoneTurn(room(), "caitlin", null), {
    role: "next",
    deviceMode: "phones",
    contestantPlayerId: "alex"
  });
});

test("does send every other teammate to the TV when they are neither on nor next", () => {
  assert.deepEqual(resolvePhoneTurn(room(), "dan", null), { role: "watch", contestantPlayerId: "alex" });
});

test("does leave another team's phones on their idle card when it is not their turn", () => {
  assert.equal(resolvePhoneTurn(room(), "rob", null), null);
});

test("does say what to pick up when the team's briefing is up", () => {
  assert.deepEqual(resolvePhoneTurn(room({ legIndex: null }, Phase.MINIGAME_INTRO), "dan", null), {
    role: "briefing",
    deviceMode: "phones"
  });
});

test("does send the team to the TV when the turn is over", () => {
  assert.deepEqual(resolvePhoneTurn(room({ legIndex: null, contestantPlayerId: null }), "alex", null), {
    role: "watch",
    contestantPlayerId: null
  });
  assert.deepEqual(resolvePhoneTurn(room({}, Phase.TURN_RESULTS), "alex", null), {
    role: "watch",
    contestantPlayerId: null
  });
});

test("does carry who held the leg before into the handoff when the leg reaches this phone", () => {
  assert.deepEqual(resolvePhoneTurn(room({ legIndex: 1, contestantPlayerId: "caitlin" }), "caitlin", "alex"), {
    role: "play",
    legIndex: 1,
    previousPlayerId: "alex"
  });
});

test("does show nothing when the game has no phone turns", () => {
  assert.equal(resolvePhoneTurn({ ...room(), contestantTurn: null }, "alex", null), null);
});
