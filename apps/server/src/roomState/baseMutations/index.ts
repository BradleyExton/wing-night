import { isDeepStrictEqual } from "node:util";

import {
  type GameConfigFile,
  type MinigameType,
  type Player,
  type RoomFatalError,
  type RoomState,
  type Team
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import {
  resetMinigameRuntimeState,
  setMinigameContent,
  syncActiveMinigameRuntimeWithContent
} from "../../minigames/runtime/index.js";
import { createInitialRoomState } from "../createInitialRoomState/index.js";
import { setMusicForPhase } from "../musicState/index.js";
import { defineRoomMutation } from "../defineRoomMutation/index.js";
import { getRoomStateSnapshot } from "../getRoomStateSnapshot/index.js";
import { clearScoringMutationUndoState } from "../scoringState/index.js";
import {
  resolveCurrentRoundConfig,
  resolveMinigameRules
} from "../selectors/index.js";
import {
  getRoomState,
  getSetupBaselineSnapshot,
  overwriteRoomState,
  setSetupBaselineSnapshot
} from "../stateStore/index.js";

// Rebuilds a team in the form the baseline holds: everything that identifies it,
// none of the per-game score.
//
// The roster carries through rather than being emptied, which it used to be. A
// team's opening roster is preset content now — the seating the loader joins out
// of `players.json` → `team`, as much a property of the pack as the team's name
// or genre — so the state a reset restores has to include it. What keeps a reset
// from also restoring the host's LIVE moves is that those never enter the
// baseline: `assignPlayerToTeam` and `autoAssignRemainingPlayers` don't sync it
// at all, and `syncSetupBaselineTeamsFromState` takes rosters from the baseline
// rather than from live state. A pack that seats nobody therefore resets to
// empty rosters exactly as before.
//
// Optional content-pack fields are re-added by hand for the same reason
// `toTeamsContentEntries` does it: a fresh literal here silently drops anything
// not listed, and a reset to this baseline is what the display then renders.
const normalizeBaselineTeams = (teams: Team[]): Team[] => {
  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    playerIds: [...team.playerIds],
    totalScore: 0,
    ...(team.genre === undefined ? {} : { genre: team.genre }),
    ...(team.anthems === undefined ? {} : { anthems: team.anthems }),
    ...(team.color === undefined ? {} : { color: team.color })
  }));
};

const syncSetupBaselineSnapshot = (
  partialSnapshot: Partial<{
    players: Player[];
    teams: Team[];
    gameConfig: GameConfigFile | null;
  }>
): void => {
  const baselineSnapshot = getSetupBaselineSnapshot();

  setSetupBaselineSnapshot({
    players: partialSnapshot.players ?? baselineSnapshot.players,
    teams: partialSnapshot.teams ?? baselineSnapshot.teams,
    gameConfig:
      partialSnapshot.gameConfig === undefined
        ? baselineSnapshot.gameConfig
        : partialSnapshot.gameConfig
  });
};

// Players and teams added live during SETUP must survive "Reset Game" the
// same way preset content does, so live setup mutations re-sync the baseline.
export const syncSetupBaselinePlayersFromState = (state: RoomState): void => {
  syncSetupBaselineSnapshot({ players: structuredClone(state.players) });
};

// Identity comes from live state, so a team the host creates mid-SETUP reaches
// the baseline and survives a reset. Each roster comes from the baseline's own
// entry for that team, so the preset seating already there is carried forward
// untouched and a brand-new team starts empty. Reading rosters from live state
// instead — which is what this did before preset seating existed — would promote
// every live assignment into the baseline, and a reset would restore wherever
// the guests happened to be standing rather than the seating the pack shipped.
export const syncSetupBaselineTeamsFromState = (state: RoomState): void => {
  const baselinePlayerIdsByTeamId = new Map(
    getSetupBaselineSnapshot().teams.map(
      (team): [string, string[]] => [team.id, team.playerIds]
    )
  );

  syncSetupBaselineSnapshot({
    teams: normalizeBaselineTeams(
      state.teams.map((team) => ({
        ...team,
        playerIds: baselinePlayerIdsByTeamId.get(team.id) ?? []
      }))
    )
  });
};

export { getRoomStateSnapshot } from "../getRoomStateSnapshot/index.js";

export const resetRoomState = (): RoomState => {
  const roomState = getRoomState();

  overwriteRoomState(createInitialRoomState());
  setSetupBaselineSnapshot({
    players: [],
    teams: [],
    gameConfig: null
  });
  resetMinigameRuntimeState();
  clearScoringMutationUndoState(roomState);

  return getRoomStateSnapshot();
};

export const resetGameToSetup = defineRoomMutation({
  run: (roomState): boolean => {
    const previousSnapshot = getRoomStateSnapshot();
    const setupBaselineSnapshot = getSetupBaselineSnapshot();
    const restoredPlayers = structuredClone(setupBaselineSnapshot.players);
    const restoredTeams = normalizeBaselineTeams(setupBaselineSnapshot.teams);
    const restoredGameConfig = structuredClone(setupBaselineSnapshot.gameConfig);
    const nextState = createInitialRoomState();

    nextState.players = restoredPlayers;
    nextState.teams = restoredTeams;
    // Carried across from the LIVE state rather than the setup baseline: the
    // playlist is boot content that no mutation ever changes, and dropping it
    // here would silence the lobby music at exactly the moment a reset returns
    // the room to SETUP and people start milling around again.
    nextState.lobbyPlaylist = structuredClone(previousSnapshot.lobbyPlaylist);
    nextState.gameConfig = restoredGameConfig;
    nextState.totalRounds =
      restoredGameConfig === null ? nextState.totalRounds : restoredGameConfig.rounds.length;
    nextState.currentRoundConfig = null;
    // A reset lands the room back at SETUP with people milling around again,
    // and `createInitialRoomState` left the music null. Same seeding the SETUP
    // phase transition would have done.
    setMusicForPhase(nextState, nextState.phase);

    overwriteRoomState(nextState);
    resetMinigameRuntimeState();
    clearScoringMutationUndoState(roomState);

    return !isDeepStrictEqual(previousSnapshot, getRoomStateSnapshot());
  }
});

export const setRoomStateFatalError = (message: string): RoomState => {
  const roomState = getRoomState();

  overwriteRoomState(createInitialRoomState());
  resetMinigameRuntimeState();
  clearScoringMutationUndoState(roomState);

  const normalizedMessage =
    message.trim().length > 0
      ? message.trim()
      : "Unable to load content. Check local and sample content files.";

  const fatalError: RoomFatalError = {
    code: "CONTENT_LOAD_FAILED",
    message: normalizedMessage
  };

  roomState.fatalError = fatalError;

  return getRoomStateSnapshot();
};

// The inverse of `setRoomStateFatalError`, and deliberately NOT its mirror
// image: that one resets the whole room before flagging the error, which is
// right when content is broken at boot but wrong here. A successful reload has
// just re-seeded live room state, so clearing the flag must touch the flag and
// nothing else — otherwise repairing bad content would discard the rosters the
// host entered while the server sat in its fatal state, and repairing bad
// content is the entire point of the config surface.
export const clearRoomStateFatalError = (): RoomState => {
  const roomState = getRoomState();

  roomState.fatalError = null;

  return getRoomStateSnapshot();
};

export const setRoomStatePlayers = (players: Player[]): RoomState => {
  const roomState = getRoomState();
  const nextPlayers = structuredClone(players);

  roomState.players = nextPlayers;
  syncSetupBaselineSnapshot({ players: nextPlayers });

  return getRoomStateSnapshot();
};

export const setRoomStateTeams = (teams: Team[]): RoomState => {
  const roomState = getRoomState();
  const nextTeams = structuredClone(teams);

  roomState.teams = nextTeams;
  syncSetupBaselineSnapshot({
    teams: normalizeBaselineTeams(nextTeams)
  });

  return getRoomStateSnapshot();
};

// No setup-baseline sync: the playlist is not part of what "Reset Game"
// restores, it is part of what a reset carries through untouched.
export const setRoomStateLobbyPlaylist = (lobbyPlaylist: string[]): RoomState => {
  const roomState = getRoomState();

  roomState.lobbyPlaylist = structuredClone(lobbyPlaylist);
  // Boot seeds the playlist while the room is already sitting at SETUP, so no
  // phase transition is coming to start the music. Re-resolving here is also
  // what makes a mid-party content reload pick up a newly dropped track rather
  // than leaving the cursor on a list that no longer matches.
  setMusicForPhase(roomState, roomState.phase);

  return getRoomStateSnapshot();
};

export const setRoomStateGameConfig = (gameConfig: GameConfigFile): RoomState => {
  const roomState = getRoomState();
  const nextGameConfig = structuredClone(gameConfig);

  roomState.gameConfig = nextGameConfig;
  roomState.totalRounds = nextGameConfig.rounds.length;
  roomState.currentRoundConfig = resolveCurrentRoundConfig(roomState);
  syncSetupBaselineSnapshot({
    gameConfig: nextGameConfig
  });

  return getRoomStateSnapshot();
};

export const setRoomStateMinigameContent = (
  minigameId: MinigameType,
  content: SerializableValue
): RoomState => {
  const roomState = getRoomState();

  setMinigameContent(minigameId, content);
  syncActiveMinigameRuntimeWithContent(
    roomState,
    minigameId,
    resolveMinigameRules(roomState, minigameId)
  );

  return getRoomStateSnapshot();
};
