import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Phase, type RoomState, type Team } from "@wingnight/shared";

import { buildRoomState } from "../../testSupport/roomStateFixtures";
import { DisplayBoard } from "./index";

const buildSnapshot = (
  phase: Phase,
  teams: Team[] = [],
  overrides: Partial<RoomState> = {}
): RoomState => {
  return buildRoomState({
    phase,
    teams,
    players: [],
    turnOrderTeamIds: [],
    roundTurnCursor: -1,
    activeRoundTeamId: null,
    ...overrides
  });
};

test("renders waiting copy when room state is missing", () => {
  const html = renderToStaticMarkup(<DisplayBoard roomState={null} />);

  assert.match(html, /Waiting for room state/);
  assert.match(html, /No teams have joined yet/);
  assert.match(html, /data-display-atmosphere/);
  assert.match(html, /h-\[100dvh\]/);
  assert.match(html, /w-full/);
});

test("renders fatal content state when snapshot reports content load failure", () => {
  const html = renderToStaticMarkup(
    <DisplayBoard
      roomState={buildSnapshot(Phase.SETUP, [], {
        fatalError: {
          code: "CONTENT_LOAD_FAILED",
          message: "Missing players content file."
        }
      })}
    />
  );

  assert.match(html, /Content Load Error/);
  assert.match(html, /CONTENT_LOAD_FAILED/);
  assert.match(html, /Missing players content file\./);
  assert.doesNotMatch(html, /No teams have joined yet/);
});

test("renders eating timer view from snapshot config", () => {
  const html = renderToStaticMarkup(
    <DisplayBoard roomState={buildSnapshot(Phase.EATING)} />
  );

  assert.match(html, /02:00/);
  assert.match(html, /Eating ·/);
  assert.doesNotMatch(html, /<header/);
  assert.doesNotMatch(html, /Phase:/);
  assert.doesNotMatch(html, /Round:/);
});

test("renders a full-screen locked overlay during INTRO", () => {
  const html = renderToStaticMarkup(
    <DisplayBoard roomState={buildSnapshot(Phase.INTRO)} />
  );

  assert.match(html, /Locked/);
  assert.match(html, /Host is ready to launch the round\./);
  assert.match(html, /fixed inset-0/);
  assert.match(html, /Wing Night/);
  assert.doesNotMatch(html, /Sauce is locked\. Mini-game is up next\./);
});

test("renders standings in descending score order", () => {
  const teams: Team[] = [
    {
      id: "team-alpha",
      name: "Team Alpha",
      playerIds: ["player-1", "player-2", "player-3"],
      totalScore: 8
    },
    {
      id: "team-beta",
      name: "Team Beta",
      playerIds: ["player-4"],
      totalScore: 12
    }
  ];
  const players = [
    { id: "player-1", name: "Alex" },
    { id: "player-2", name: "Morgan" },
    { id: "player-3", name: "Sam" },
    { id: "player-4", name: "Jules" }
  ];
  const html = renderToStaticMarkup(
    <DisplayBoard
      roomState={buildSnapshot(Phase.ROUND_RESULTS, teams, { players })}
    />
  );

  assert.match(html, /Team Beta/);
  assert.match(html, /Team Alpha/);
  assert.match(html, /Leading/);
});
