import assert from "node:assert/strict";
import test from "node:test";
import { Phase, type RoomState, type Team } from "@wingnight/shared";

import { renderDisplayMarkup } from "../../testSupport/renderWithProviders";
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
  const html = renderDisplayMarkup(<DisplayBoard />);

  assert.match(html, /Waiting for room state/);
  assert.match(html, /No teams have joined yet/);
  assert.match(html, /data-display-atmosphere/);
  assert.match(html, /h-\[100dvh\]/);
  assert.match(html, /w-full/);
});

test("renders fatal content state when snapshot reports content load failure", () => {
  const html = renderDisplayMarkup(<DisplayBoard />, {
    roomState: buildSnapshot(Phase.SETUP, [], {
      fatalError: {
        code: "CONTENT_LOAD_FAILED",
        message: "Missing players content file."
      }
    })
  });

  assert.match(html, /Content Load Error/);
  assert.match(html, /CONTENT_LOAD_FAILED/);
  assert.match(html, /Missing players content file\./);
  assert.doesNotMatch(html, /No teams have joined yet/);
});

test("renders eating timer view from snapshot config", () => {
  const html = renderDisplayMarkup(<DisplayBoard />, {
    roomState: buildSnapshot(Phase.EATING)
  });

  assert.match(html, /02:00/);
  assert.match(html, /Eating ·/);
  assert.doesNotMatch(html, /<header/);
  assert.doesNotMatch(html, /Phase:/);
  assert.doesNotMatch(html, /Round:/);
});

test("renders a full-screen locked overlay during INTRO", () => {
  const html = renderDisplayMarkup(<DisplayBoard />, {
    roomState: buildSnapshot(Phase.INTRO)
  });

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
  const html = renderDisplayMarkup(<DisplayBoard />, {
    roomState: buildSnapshot(Phase.ROUND_RESULTS, teams, { players })
  });

  assert.match(html, /Team Beta/);
  assert.match(html, /Team Alpha/);
  assert.match(html, /Leading/);
});

const ANTHEM_TEAM: Team = {
  id: "team-anthem",
  name: "Hot Ones",
  playerIds: [],
  totalScore: 0,
  genre: "metal",
  anthems: ["blaze.mp3"]
};

const SILENT_TEAM: Team = {
  id: "team-silent",
  name: "Mild Bunch",
  playerIds: [],
  totalScore: 0
};

const renderAtPhase = (phase: Phase, team: Team): string => {
  return renderDisplayMarkup(<DisplayBoard />, {
    roomState: buildSnapshot(phase, [team], { activeRoundTeamId: team.id })
  });
};

test("renders the audio unlock overlay at MINIGAME_INTRO for a team with anthems", () => {
  const html = renderAtPhase(Phase.MINIGAME_INTRO, ANTHEM_TEAM);

  assert.match(html, /data-audio-unlock-overlay/);
  assert.match(html, /Tap the screen to turn on team anthems\./);
});

test("renders no audio unlock overlay at MINIGAME_INTRO for a team with no anthems", () => {
  const html = renderAtPhase(Phase.MINIGAME_INTRO, SILENT_TEAM);

  assert.doesNotMatch(html, /data-audio-unlock-overlay/);
  assert.doesNotMatch(html, /Tap the screen to turn on team anthems\./);
});

// The overlay is scoped to MINIGAME_INTRO by construction, so these three
// phases cannot show it however long the session has been running.
test("renders no audio unlock overlay at SETUP", () => {
  assert.doesNotMatch(
    renderAtPhase(Phase.SETUP, ANTHEM_TEAM),
    /data-audio-unlock-overlay/
  );
});

test("renders no audio unlock overlay at INTRO", () => {
  assert.doesNotMatch(
    renderAtPhase(Phase.INTRO, ANTHEM_TEAM),
    /data-audio-unlock-overlay/
  );
});

test("renders no audio unlock overlay at ROUND_INTRO", () => {
  assert.doesNotMatch(
    renderAtPhase(Phase.ROUND_INTRO, ANTHEM_TEAM),
    /data-audio-unlock-overlay/
  );
});

test("renders an anthem audio element for a team with anthems", () => {
  assert.match(renderAtPhase(Phase.MINIGAME_INTRO, ANTHEM_TEAM), /data-team-anthem/);
});

// AC7: a team with no anthems is exactly as the display was before this ticket.
test("renders no anthem audio element for a team with no anthems", () => {
  assert.doesNotMatch(
    renderAtPhase(Phase.MINIGAME_INTRO, SILENT_TEAM),
    /data-team-anthem/
  );
});

// The element is keyed to the team, not the phase, so it is still mounted for
// the cue to pause when the host advances out of MINIGAME_INTRO.
test("keeps the anthem audio element mounted after the phase leaves MINIGAME_INTRO", () => {
  assert.match(renderAtPhase(Phase.EATING, ANTHEM_TEAM), /data-team-anthem/);
});
