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

const normalizeBaselineTeams = (teams: Team[]): Team[] => {
  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    playerIds: [],
    totalScore: 0
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

export const syncSetupBaselineTeamsFromState = (state: RoomState): void => {
  syncSetupBaselineSnapshot({ teams: normalizeBaselineTeams(state.teams) });
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
    nextState.gameConfig = restoredGameConfig;
    nextState.totalRounds =
      restoredGameConfig === null ? nextState.totalRounds : restoredGameConfig.rounds.length;
    nextState.currentRoundConfig = null;

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
