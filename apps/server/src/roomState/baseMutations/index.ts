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
import { resolveCanAdvancePhase } from "../phaseState/index.js";
import { clearScoringMutationUndoState } from "../scoringState/index.js";
import {
  isRoomInFatalState,
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

export const getRoomStateSnapshot = (): RoomState => {
  const roomState = getRoomState();
  const snapshot = structuredClone(roomState);
  snapshot.canAdvancePhase = resolveCanAdvancePhase(roomState);

  return snapshot;
};

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

export const resetGameToSetup = (): RoomState => {
  const roomState = getRoomState();

  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

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

  return getRoomStateSnapshot();
};

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
