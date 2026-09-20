import assert from "node:assert/strict";
import test from "node:test";
import {
  MUSIC_PLAYBACK_SOURCES,
  Phase,
  type RoomMusicPlaybackState,
  type RoomState,
  type Team
} from "@wingnight/shared";

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

// What the server puts in `musicPlayback` when a phase owns music. The display
// no longer derives this from the phase and the team, so a test that wants the
// music on has to say so — which is the point of the change.
const ANTHEM_PLAYBACK: RoomMusicPlaybackState = {
  source: MUSIC_PLAYBACK_SOURCES.ANTHEM,
  trackFileName: "blaze.mp3",
  trackIndex: 0,
  trackCount: 1,
  isPlaying: true
};

const LOBBY_PLAYBACK: RoomMusicPlaybackState = {
  source: MUSIC_PLAYBACK_SOURCES.LOBBY,
  trackFileName: "03-hot-in-herre.mp3",
  trackIndex: 2,
  trackCount: 12,
  isPlaying: true
};

const renderAtPhase = (
  phase: Phase,
  team: Team,
  overrides: Partial<RoomState> = {}
): string => {
  return renderDisplayMarkup(<DisplayBoard />, {
    roomState: buildSnapshot(phase, [team], {
      activeRoundTeamId: team.id,
      ...overrides
    })
  });
};

test("renders the audio unlock overlay when the server has music queued", () => {
  const html = renderAtPhase(Phase.MINIGAME_INTRO, ANTHEM_TEAM, {
    musicPlayback: ANTHEM_PLAYBACK
  });

  assert.match(html, /data-audio-unlock-overlay/);
  assert.match(html, /Tap the screen to turn on the music\./);
});

test("renders no audio unlock overlay when the server queued no music", () => {
  const html = renderAtPhase(Phase.MINIGAME_INTRO, SILENT_TEAM);

  assert.doesNotMatch(html, /data-audio-unlock-overlay/);
  assert.doesNotMatch(html, /Tap the screen to turn on the music\./);
});

// A display that reloads after the anthem finished, or while the host has the
// lobby playlist paused, must not ask the room to tap to fix nothing.
test("renders no audio unlock overlay when the queued music is not playing", () => {
  const html = renderAtPhase(Phase.MINIGAME_INTRO, ANTHEM_TEAM, {
    musicPlayback: { ...ANTHEM_PLAYBACK, isPlaying: false }
  });

  assert.doesNotMatch(html, /data-audio-unlock-overlay/);
});

// The finished anthem takes its row with it: frozen bars would read as paused,
// which is not what a one-shot that ran to the end is.
test("hides the now-playing strip once the anthem has finished", () => {
  const html = renderAtPhase(Phase.MINIGAME_INTRO, ANTHEM_TEAM, {
    musicPlayback: { ...ANTHEM_PLAYBACK, isPlaying: false }
  });

  assert.doesNotMatch(html, /data-now-playing/);
});

// The overlay follows the music rather than the phase, so a phase the server
// queues nothing for cannot show it however long the session has been running.
test("renders no audio unlock overlay at INTRO", () => {
  assert.doesNotMatch(
    renderAtPhase(Phase.INTRO, ANTHEM_TEAM),
    /data-audio-unlock-overlay/
  );
});

test("renders no audio unlock overlay at MINIGAME_INTRO", () => {
  assert.doesNotMatch(
    renderAtPhase(Phase.MINIGAME_INTRO, ANTHEM_TEAM),
    /data-audio-unlock-overlay/
  );
});

test("renders an audio element for a team with anthems", () => {
  assert.match(renderAtPhase(Phase.MINIGAME_INTRO, ANTHEM_TEAM), /data-team-anthem/);
});

// A room with no music source at all is exactly as the display was before any
// of this shipped.
test("renders no audio element when the room has no music source", () => {
  assert.doesNotMatch(
    renderAtPhase(Phase.MINIGAME_INTRO, SILENT_TEAM),
    /data-team-anthem/
  );
});

// The element is keyed to the ROOM having music, not to any playing, so it is
// still mounted for the cue to pause when the host advances out of the phase.
test("keeps the audio element mounted after the phase leaves MINIGAME_INTRO", () => {
  assert.match(renderAtPhase(Phase.EATING, ANTHEM_TEAM), /data-team-anthem/);
});

test("renders no now-playing strip when the phase owns no music", () => {
  assert.doesNotMatch(renderAtPhase(Phase.EATING, ANTHEM_TEAM), /data-now-playing/);
});

test("names the team whose anthem is playing", () => {
  const html = renderAtPhase(Phase.MINIGAME_INTRO, ANTHEM_TEAM, {
    musicPlayback: ANTHEM_PLAYBACK
  });

  assert.match(html, /data-now-playing/);
  assert.match(html, /Hot Ones anthem/);
  assert.match(html, /Blaze/);
});

// The pill is a corner chip, not a media player: "n of m" is host-deck detail,
// and the room only needs to know what is playing.
test("titles a lobby track from its filename and shows no track position", () => {
  const html = renderAtPhase(Phase.SETUP, ANTHEM_TEAM, {
    musicPlayback: LOBBY_PLAYBACK,
    lobbyPlaylist: ["03-hot-in-herre.mp3"]
  });

  assert.match(html, /Now playing/);
  assert.match(html, /Hot In Herre/);
  assert.doesNotMatch(html, /3 \/ 12/);
});

// The pill stays put when the host pauses — vanishing it would flicker the TV
// on every tap — and says so instead.
test("keeps the now-playing pill and labels it paused when the host pauses", () => {
  const html = renderAtPhase(Phase.SETUP, ANTHEM_TEAM, {
    musicPlayback: { ...LOBBY_PLAYBACK, isPlaying: false },
    lobbyPlaylist: ["03-hot-in-herre.mp3"]
  });

  assert.match(html, /data-now-playing/);
  assert.match(html, /Paused/);
  assert.match(html, /Hot In Herre/);
});
