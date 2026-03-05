import {
  type GameConfigFile,
  type MinigameType,
  type Player,
  type RoomFatalError,
  type RoomState
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
import { getRoomState, overwriteRoomState } from "../stateStore/index.js";

export const getRoomStateSnapshot = (): RoomState => {
  const roomState = getRoomState();
  const snapshot = structuredClone(roomState);
  snapshot.canAdvancePhase = resolveCanAdvancePhase(roomState);

  return snapshot;
};

export const resetRoomState = (): RoomState => {
  const roomState = getRoomState();

  overwriteRoomState(createInitialRoomState());
  resetMinigameRuntimeState();
  clearScoringMutationUndoState(roomState);

  return getRoomStateSnapshot();
};

export const resetGameToSetup = (): RoomState => {
  const roomState = getRoomState();

  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  const preservedPlayers = structuredClone(roomState.players);
  const preservedGameConfig = structuredClone(roomState.gameConfig);
  const nextState = createInitialRoomState();

  nextState.players = preservedPlayers;
  nextState.gameConfig = preservedGameConfig;
  nextState.totalRounds =
    preservedGameConfig === null ? nextState.totalRounds : preservedGameConfig.rounds.length;
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

  roomState.players = structuredClone(players);

  return getRoomStateSnapshot();
};

export const setRoomStateGameConfig = (gameConfig: GameConfigFile): RoomState => {
  const roomState = getRoomState();

  roomState.gameConfig = structuredClone(gameConfig);
  roomState.totalRounds = gameConfig.rounds.length;
  roomState.currentRoundConfig = resolveCurrentRoundConfig(roomState);

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
