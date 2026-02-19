import {
  MINIGAME_ACTION_TYPES,
  MINIGAME_CONTRACT_METADATA_BY_ID,
  Phase,
  TIMER_EXTEND_MAX_SECONDS,
  type GameConfigFile,
  type MinigameActionEnvelopePayload,
  type MinigameContractCompatibilityStatus,
  type MinigameType,
  type Player,
  type RoomFatalError,
  type RoomState,
  type RoomTimerState,
  type TriviaPrompt
} from "@wingnight/shared";

import {
  logManualScoreAdjustment,
  logPhaseTransition,
  logScoreMutation
} from "../logger/index.js";
import {
  captureMinigameRuntimeSnapshot,
  clearMinigameRuntime,
  dispatchMinigameRuntimeAction,
  initializeMinigameRuntime,
  resetMinigameRuntimeState,
  restoreMinigameRuntimeSnapshot,
  syncMinigameRuntimeContent,
  syncMinigameRuntimePendingPoints,
  type MinigameRuntimeSnapshotEnvelope
} from "../minigames/orchestrator/index.js";
import { getNextPhase } from "../utils/getNextPhase/index.js";

const DEFAULT_TOTAL_ROUNDS = 3;
const TRIVIA_RECORD_ATTEMPT_ACTION_TYPE = MINIGAME_ACTION_TYPES.TRIVIA_RECORD_ATTEMPT;

type ActiveMinigameContract = {
  minigameId: MinigameType;
  minigameApiVersion: number;
  capabilityFlags: string[];
};

const isRoomInFatalState = (state: RoomState): boolean => {
  return state.fatalError !== null;
};

const resolveCurrentRoundConfig = (state: RoomState): RoomState["currentRoundConfig"] => {
  if (!state.gameConfig || state.currentRound <= 0) {
    return null;
  }

  return state.gameConfig.rounds[state.currentRound - 1] ?? null;
};

const resolveMinigamePointsMax = (state: RoomState): number | null => {
  if (!state.gameConfig || state.currentRound <= 0) {
    return null;
  }

  if (state.currentRound === state.totalRounds) {
    return state.gameConfig.minigameScoring.finalRoundMax;
  }

  return state.gameConfig.minigameScoring.defaultMax;
};

const resolveTriviaQuestionsPerTurn = (state: RoomState): number => {
  const configuredQuestionsPerTurn =
    state.gameConfig?.minigameRules?.trivia?.questionsPerTurn;

  if (
    typeof configuredQuestionsPerTurn !== "number" ||
    !Number.isInteger(configuredQuestionsPerTurn) ||
    configuredQuestionsPerTurn <= 0
  ) {
    return 1;
  }

  return configuredQuestionsPerTurn;
};

const resolveMinigameTimerSeconds = (state: RoomState): number | null => {
  if (!state.gameConfig || !state.currentRoundConfig) {
    return null;
  }

  switch (state.currentRoundConfig.minigame) {
    case "TRIVIA":
      return state.gameConfig.timers.triviaSeconds;
    case "GEO":
      return state.gameConfig.timers.geoSeconds;
    case "DRAWING":
      return state.gameConfig.timers.drawingSeconds;
    default:
      return null;
  }
};

const resolveMinigameContractMetadata = (
  minigameId: MinigameType
): ActiveMinigameContract => {
  const metadata = MINIGAME_CONTRACT_METADATA_BY_ID[minigameId];

  return {
    minigameId,
    minigameApiVersion: metadata.minigameApiVersion,
    capabilityFlags: [...metadata.capabilityFlags]
  };
};

const createRunningTimer = (
  phase: Phase,
  durationSeconds: number
): RoomTimerState => {
  const startedAt = Date.now();
  const durationMs = durationSeconds * 1000;

  return {
    phase,
    startedAt,
    endsAt: startedAt + durationMs,
    durationMs,
    isPaused: false,
    remainingMs: durationMs
  };
};

export const createInitialRoomState = (): RoomState => {
  return {
    phase: Phase.SETUP,
    currentRound: 0,
    totalRounds: DEFAULT_TOTAL_ROUNDS,
    players: [],
    teams: [],
    gameConfig: null,
    triviaPrompts: [],
    currentRoundConfig: null,
    turnOrderTeamIds: [],
    roundTurnCursor: -1,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: null,
    activeTurnTeamId: null,
    currentTriviaPrompt: null,
    triviaPromptCursor: 0,
    minigameHostView: null,
    minigameDisplayView: null,
    timer: null,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {},
    fatalError: null,
    canRedoScoringMutation: false,
    canAdvancePhase: false
  };
};

// This module-scoped state is intentionally single-process for the MVP.
// If the server is scaled across workers/processes, migrate to shared storage.
const roomState = createInitialRoomState();
type ScoringMutationUndoSnapshot = {
  round: number;
  teamTotalScoreById: Record<string, number>;
  wingParticipationByPlayerId: Record<string, boolean>;
  pendingWingPointsByTeamId: Record<string, number>;
  pendingMinigamePointsByTeamId: Record<string, number>;
  minigameRuntimeSnapshot: MinigameRuntimeSnapshotEnvelope;
};
let scoringMutationUndoSnapshot: ScoringMutationUndoSnapshot | null = null;
let minigameCompatibilityStatus: MinigameContractCompatibilityStatus = "COMPATIBLE";
let minigameCompatibilityMessage: string | null = null;

const markMinigameContractCompatible = (): void => {
  minigameCompatibilityStatus = "COMPATIBLE";
  minigameCompatibilityMessage = null;
};

const markMinigameContractMismatch = (message: string): void => {
  const normalizedMessage =
    message.trim().length > 0
      ? message.trim()
      : "Minigame contract mismatch detected. Refresh host and try again.";

  minigameCompatibilityStatus = "MISMATCH";
  minigameCompatibilityMessage = normalizedMessage;
};

const applyMinigameCompatibilityToHostView = (state: RoomState): void => {
  if (state.minigameHostView === null) {
    return;
  }

  state.minigameHostView.compatibilityStatus = minigameCompatibilityStatus;
  state.minigameHostView.compatibilityMessage = minigameCompatibilityMessage;
};

const overwriteRoomState = (nextState: RoomState): void => {
  Object.assign(roomState, nextState);
};

const clearScoringMutationUndoState = (state: RoomState): void => {
  scoringMutationUndoSnapshot = null;
  state.canRedoScoringMutation = false;
};

const captureTeamTotalScoreById = (
  state: RoomState
): Record<string, number> => {
  const teamTotalScoreById: Record<string, number> = {};

  for (const team of state.teams) {
    teamTotalScoreById[team.id] = team.totalScore;
  }

  return teamTotalScoreById;
};

const createScoringMutationUndoSnapshot = (
  state: RoomState
): ScoringMutationUndoSnapshot => {
  return {
    round: state.currentRound,
    teamTotalScoreById: captureTeamTotalScoreById(state),
    wingParticipationByPlayerId: structuredClone(state.wingParticipationByPlayerId),
    pendingWingPointsByTeamId: structuredClone(state.pendingWingPointsByTeamId),
    pendingMinigamePointsByTeamId: structuredClone(state.pendingMinigamePointsByTeamId),
    minigameRuntimeSnapshot: captureMinigameRuntimeSnapshot(state)
  };
};

const captureScoringMutationUndoState = (state: RoomState): void => {
  scoringMutationUndoSnapshot = createScoringMutationUndoSnapshot(state);
};

const restoreScoringMutationUndoState = (
  state: RoomState,
  snapshot: ScoringMutationUndoSnapshot
): void => {
  for (const team of state.teams) {
    const snapshotScore = snapshot.teamTotalScoreById[team.id];

    if (typeof snapshotScore === "number") {
      team.totalScore = snapshotScore;
    }
  }

  state.wingParticipationByPlayerId = structuredClone(
    snapshot.wingParticipationByPlayerId
  );
  state.pendingWingPointsByTeamId = structuredClone(
    snapshot.pendingWingPointsByTeamId
  );
  state.pendingMinigamePointsByTeamId = structuredClone(
    snapshot.pendingMinigamePointsByTeamId
  );
  restoreMinigameRuntimeSnapshot(state, snapshot.minigameRuntimeSnapshot);
};

export const getRoomStateSnapshot = (): RoomState => {
  applyMinigameCompatibilityToHostView(roomState);
  const snapshot = structuredClone(roomState);
  snapshot.canAdvancePhase = resolveCanAdvancePhase(roomState);

  return snapshot;
};

export const resetRoomState = (): RoomState => {
  overwriteRoomState(createInitialRoomState());
  resetMinigameRuntimeState();
  markMinigameContractCompatible();
  clearScoringMutationUndoState(roomState);

  return getRoomStateSnapshot();
};

export const resetGameToSetup = (): RoomState => {
  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  const preservedPlayers = structuredClone(roomState.players);
  const preservedGameConfig = structuredClone(roomState.gameConfig);
  const preservedTriviaPrompts = structuredClone(roomState.triviaPrompts);
  const nextState = createInitialRoomState();

  nextState.players = preservedPlayers;
  nextState.gameConfig = preservedGameConfig;
  nextState.triviaPrompts = preservedTriviaPrompts;
  nextState.totalRounds =
    preservedGameConfig === null ? nextState.totalRounds : preservedGameConfig.rounds.length;
  nextState.currentRoundConfig = null;

  overwriteRoomState(nextState);
  resetMinigameRuntimeState();
  markMinigameContractCompatible();
  clearScoringMutationUndoState(roomState);

  return getRoomStateSnapshot();
};

export const setRoomStateFatalError = (message: string): RoomState => {
  overwriteRoomState(createInitialRoomState());
  resetMinigameRuntimeState();
  markMinigameContractCompatible();
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
  roomState.players = structuredClone(players);

  return getRoomStateSnapshot();
};

export const setRoomStateGameConfig = (
  gameConfig: GameConfigFile
): RoomState => {
  roomState.gameConfig = structuredClone(gameConfig);
  roomState.totalRounds = gameConfig.rounds.length;
  roomState.currentRoundConfig = resolveCurrentRoundConfig(roomState);

  return getRoomStateSnapshot();
};

export const setRoomStateTriviaPrompts = (
  triviaPrompts: TriviaPrompt[]
): RoomState => {
  roomState.triviaPrompts = structuredClone(triviaPrompts);
  syncMinigameRuntimeContent(roomState);

  return getRoomStateSnapshot();
};

const initializeActiveMinigameTurnState = (state: RoomState): void => {
  markMinigameContractCompatible();
  const minigameType = state.currentRoundConfig?.minigame;

  if (minigameType === undefined) {
    clearMinigameRuntime(state);
    return;
  }

  const minigamePointsMax = resolveMinigamePointsMax(state);

  if (minigamePointsMax === null) {
    clearMinigameRuntime(state);
    return;
  }

  initializeMinigameRuntime(state, {
    minigameId: minigameType,
    pointsMax: minigamePointsMax,
    questionsPerTurn: resolveTriviaQuestionsPerTurn(state)
  });
};

const recomputePendingWingPoints = (state: RoomState): void => {
  if (!state.currentRoundConfig) {
    state.pendingWingPointsByTeamId = {};
    return;
  }

  const pointsPerPlayer = state.currentRoundConfig.pointsPerPlayer;
  const nextPendingPointsByTeamId: Record<string, number> = {};

  for (const team of state.teams) {
    const ateCount = team.playerIds.reduce((count, playerId) => {
      return state.wingParticipationByPlayerId[playerId] === true ? count + 1 : count;
    }, 0);

    nextPendingPointsByTeamId[team.id] = ateCount * pointsPerPlayer;
  }

  state.pendingWingPointsByTeamId = nextPendingPointsByTeamId;
};

const resetRoundWingParticipation = (state: RoomState): void => {
  state.wingParticipationByPlayerId = {};
  state.pendingWingPointsByTeamId = {};
};

const clearPendingRoundScores = (state: RoomState): void => {
  state.pendingWingPointsByTeamId = {};
  state.pendingMinigamePointsByTeamId = {};
};

const arePointsByTeamIdEqual = (
  left: Record<string, number>,
  right: Record<string, number>
): boolean => {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => left[key] === right[key]);
};

const applyPendingRoundScoresToTotals = (state: RoomState): void => {
  for (const team of state.teams) {
    const wingPoints = state.pendingWingPointsByTeamId[team.id] ?? 0;
    const minigamePoints = state.pendingMinigamePointsByTeamId[team.id] ?? 0;
    const roundPoints = wingPoints + minigamePoints;

    if (roundPoints === 0) {
      continue;
    }

    team.totalScore += roundPoints;
    logScoreMutation(team.id, state.currentRound, wingPoints, minigamePoints, team.totalScore);
  }
};

const resolveTeamIdByPlayerId = (
  state: RoomState,
  playerId: string
): string | null => {
  for (const team of state.teams) {
    if (team.playerIds.includes(playerId)) {
      return team.id;
    }
  }

  return null;
};

const ensureTurnOrderTeamIds = (state: RoomState): void => {
  if (state.turnOrderTeamIds.length > 0) {
    return;
  }

  state.turnOrderTeamIds = state.teams.map((team) => team.id);
};

const initializeRoundTurnState = (state: RoomState): void => {
  ensureTurnOrderTeamIds(state);
  state.roundTurnCursor = state.turnOrderTeamIds.length > 0 ? 0 : -1;
  state.completedRoundTurnTeamIds = [];
  state.activeRoundTeamId =
    state.roundTurnCursor === -1
      ? null
      : state.turnOrderTeamIds[state.roundTurnCursor] ?? null;
};

const isExactTeamIdSet = (
  teamIds: string[],
  teams: RoomState["teams"]
): boolean => {
  if (teamIds.length !== teams.length) {
    return false;
  }

  const expectedTeamIds = new Set(teams.map((team) => team.id));
  const seenTeamIds = new Set<string>();

  for (const teamId of teamIds) {
    if (!expectedTeamIds.has(teamId) || seenTeamIds.has(teamId)) {
      return false;
    }

    seenTeamIds.add(teamId);
  }

  return seenTeamIds.size === expectedTeamIds.size;
};

const finalizeActiveRoundTurn = (state: RoomState): void => {
  const activeRoundTeamId = state.activeRoundTeamId;

  if (activeRoundTeamId !== null) {
    state.completedRoundTurnTeamIds = [
      ...state.completedRoundTurnTeamIds,
      activeRoundTeamId
    ];
  }

  const nextRoundTurnCursor = state.roundTurnCursor + 1;
  const hasNextRoundTurn = nextRoundTurnCursor < state.turnOrderTeamIds.length;

  if (!hasNextRoundTurn) {
    return;
  }

  state.roundTurnCursor = nextRoundTurnCursor;
  state.activeRoundTeamId = state.turnOrderTeamIds[nextRoundTurnCursor] ?? null;
};

const resolveNextPhase = (state: RoomState, previousPhase: Phase): Phase => {
  if (previousPhase === Phase.MINIGAME_PLAY) {
    const hasNextRoundTurn =
      state.roundTurnCursor + 1 < state.turnOrderTeamIds.length;

    return hasNextRoundTurn ? Phase.EATING : Phase.ROUND_RESULTS;
  }

  return getNextPhase(previousPhase, state.currentRound, state.totalRounds);
};

export const createTeam = (name: string): RoomState => {
  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  if (roomState.phase !== Phase.SETUP) {
    return getRoomStateSnapshot();
  }

  const normalizedName = name.trim();

  if (normalizedName.length === 0) {
    return getRoomStateSnapshot();
  }

  const nextTeamIndex = roomState.teams.length + 1;
  roomState.teams.push({
    id: `team-${nextTeamIndex}`,
    name: normalizedName,
    playerIds: [],
    totalScore: 0
  });

  return getRoomStateSnapshot();
};

export const assignPlayerToTeam = (
  playerId: string,
  teamId: string | null
): RoomState => {
  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  if (roomState.phase !== Phase.SETUP) {
    return getRoomStateSnapshot();
  }

  const playerExists = roomState.players.some((player) => player.id === playerId);

  if (!playerExists) {
    return getRoomStateSnapshot();
  }

  if (teamId !== null && !roomState.teams.some((team) => team.id === teamId)) {
    return getRoomStateSnapshot();
  }

  for (const team of roomState.teams) {
    team.playerIds = team.playerIds.filter((id) => id !== playerId);
  }

  if (teamId === null) {
    return getRoomStateSnapshot();
  }

  const targetTeam = roomState.teams.find((team) => team.id === teamId);

  if (!targetTeam) {
    return getRoomStateSnapshot();
  }

  targetTeam.playerIds.push(playerId);

  return getRoomStateSnapshot();
};

export const reorderTurnOrder = (teamIds: string[]): RoomState => {
  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  if (roomState.phase !== Phase.ROUND_INTRO) {
    return getRoomStateSnapshot();
  }

  if (!Array.isArray(teamIds) || !teamIds.every((teamId) => typeof teamId === "string")) {
    return getRoomStateSnapshot();
  }

  if (!isExactTeamIdSet(teamIds, roomState.teams)) {
    return getRoomStateSnapshot();
  }

  roomState.turnOrderTeamIds = [...teamIds];
  roomState.roundTurnCursor = teamIds.length > 0 ? 0 : -1;
  roomState.completedRoundTurnTeamIds = [];
  roomState.activeRoundTeamId =
    roomState.roundTurnCursor === -1
      ? null
      : roomState.turnOrderTeamIds[roomState.roundTurnCursor] ?? null;

  return getRoomStateSnapshot();
};

export const setWingParticipation = (
  playerId: string,
  didEat: boolean
): RoomState => {
  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  if (roomState.phase !== Phase.EATING) {
    return getRoomStateSnapshot();
  }

  if (!roomState.currentRoundConfig) {
    return getRoomStateSnapshot();
  }

  const playerExists = roomState.players.some((player) => player.id === playerId);

  if (!playerExists) {
    return getRoomStateSnapshot();
  }

  const playerTeamId = resolveTeamIdByPlayerId(roomState, playerId);

  if (playerTeamId === null) {
    return getRoomStateSnapshot();
  }

  if (
    roomState.activeRoundTeamId === null ||
    playerTeamId !== roomState.activeRoundTeamId
  ) {
    return getRoomStateSnapshot();
  }

  if (roomState.wingParticipationByPlayerId[playerId] === didEat) {
    return getRoomStateSnapshot();
  }

  captureScoringMutationUndoState(roomState);
  roomState.wingParticipationByPlayerId[playerId] = didEat;
  recomputePendingWingPoints(roomState);
  roomState.canRedoScoringMutation = true;

  return getRoomStateSnapshot();
};

export const adjustTeamScore = (teamId: string, delta: number): RoomState => {
  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  if (roomState.phase === Phase.SETUP) {
    return getRoomStateSnapshot();
  }

  if (!Number.isInteger(delta) || delta === 0) {
    return getRoomStateSnapshot();
  }

  const targetTeam = roomState.teams.find((team) => team.id === teamId);

  if (!targetTeam) {
    return getRoomStateSnapshot();
  }

  const nextTotalScore = targetTeam.totalScore + delta;

  if (nextTotalScore < 0) {
    return getRoomStateSnapshot();
  }

  captureScoringMutationUndoState(roomState);
  targetTeam.totalScore = nextTotalScore;
  roomState.canRedoScoringMutation = true;
  logManualScoreAdjustment(
    targetTeam.id,
    delta,
    targetTeam.totalScore,
    roomState.currentRound,
    roomState.phase
  );

  return getRoomStateSnapshot();
};

export const setPendingMinigamePoints = (
  pointsByTeamId: Record<string, number>
): RoomState => {
  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  if (roomState.phase !== Phase.MINIGAME_PLAY) {
    return getRoomStateSnapshot();
  }

  const minigamePointsMax = resolveMinigamePointsMax(roomState);

  if (minigamePointsMax === null) {
    return getRoomStateSnapshot();
  }

  const activeRoundTeamId = roomState.activeRoundTeamId;

  if (activeRoundTeamId === null) {
    return getRoomStateSnapshot();
  }

  for (const teamId of Object.keys(pointsByTeamId)) {
    if (teamId !== activeRoundTeamId) {
      return getRoomStateSnapshot();
    }
  }

  const nextPoints = pointsByTeamId[activeRoundTeamId] ?? 0;

  if (
    !Number.isFinite(nextPoints) ||
    nextPoints < 0 ||
    nextPoints > minigamePointsMax
  ) {
    return getRoomStateSnapshot();
  }

  const nextPendingMinigamePointsByTeamId: Record<string, number> = {
    ...roomState.pendingMinigamePointsByTeamId,
    [activeRoundTeamId]: nextPoints
  };

  for (const team of roomState.teams) {
    if (nextPendingMinigamePointsByTeamId[team.id] === undefined) {
      nextPendingMinigamePointsByTeamId[team.id] = 0;
    }
  }

  if (
    arePointsByTeamIdEqual(
      roomState.pendingMinigamePointsByTeamId,
      nextPendingMinigamePointsByTeamId
    )
  ) {
    return getRoomStateSnapshot();
  }

  captureScoringMutationUndoState(roomState);
  roomState.pendingMinigamePointsByTeamId = nextPendingMinigamePointsByTeamId;
  roomState.canRedoScoringMutation = true;

  syncMinigameRuntimePendingPoints(roomState, nextPendingMinigamePointsByTeamId);

  return getRoomStateSnapshot();
};

export const recordTriviaAttempt = (isCorrect: boolean): RoomState => {
  return dispatchMinigameAction({
    hostSecret: "__server-runtime__",
    minigameId: "TRIVIA",
    minigameApiVersion: MINIGAME_CONTRACT_METADATA_BY_ID.TRIVIA.minigameApiVersion,
    capabilityFlags: [...MINIGAME_CONTRACT_METADATA_BY_ID.TRIVIA.capabilityFlags],
    actionType: TRIVIA_RECORD_ATTEMPT_ACTION_TYPE,
    actionPayload: {
      isCorrect
    }
  });
};

export const getActiveMinigameContract = (): ActiveMinigameContract | null => {
  if (
    roomState.phase !== Phase.MINIGAME_PLAY ||
    roomState.currentRoundConfig === null
  ) {
    return null;
  }

  return resolveMinigameContractMetadata(roomState.currentRoundConfig.minigame);
};

export const setMinigameCompatibilityMismatch = (message: string): RoomState => {
  markMinigameContractMismatch(message);

  return getRoomStateSnapshot();
};

export const dispatchMinigameAction = (
  payload: MinigameActionEnvelopePayload
): RoomState => {
  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  if (
    roomState.phase !== Phase.MINIGAME_PLAY ||
    roomState.currentRoundConfig === null ||
    roomState.currentRoundConfig.minigame !== payload.minigameId
  ) {
    return getRoomStateSnapshot();
  }

  const minigamePointsMax = resolveMinigamePointsMax(roomState);

  if (minigamePointsMax === null) {
    return getRoomStateSnapshot();
  }

  const nextUndoSnapshot = createScoringMutationUndoSnapshot(roomState);
  const didDispatch = dispatchMinigameRuntimeAction(roomState, {
    actionEnvelope: {
      minigameId: payload.minigameId,
      minigameApiVersion: payload.minigameApiVersion,
      capabilityFlags: [...payload.capabilityFlags],
      actionType: payload.actionType,
      actionPayload: payload.actionPayload
    },
    pointsMax: minigamePointsMax,
    questionsPerTurn: resolveTriviaQuestionsPerTurn(roomState)
  });

  if (!didDispatch) {
    return getRoomStateSnapshot();
  }

  markMinigameContractCompatible();
  scoringMutationUndoSnapshot = nextUndoSnapshot;
  roomState.canRedoScoringMutation = true;

  return getRoomStateSnapshot();
};

export const redoLastScoringMutation = (): RoomState => {
  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  if (scoringMutationUndoSnapshot === null) {
    return getRoomStateSnapshot();
  }

  if (scoringMutationUndoSnapshot.round !== roomState.currentRound) {
    clearScoringMutationUndoState(roomState);
    return getRoomStateSnapshot();
  }

  const snapshotToRestore = scoringMutationUndoSnapshot;
  restoreScoringMutationUndoState(roomState, snapshotToRestore);
  clearScoringMutationUndoState(roomState);

  return getRoomStateSnapshot();
};

export const pauseRoomTimer = (): RoomState => {
  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  const currentTimer = roomState.timer;

  if (
    roomState.phase !== Phase.EATING ||
    currentTimer === null ||
    currentTimer.phase !== Phase.EATING ||
    currentTimer.isPaused
  ) {
    return getRoomStateSnapshot();
  }

  const now = Date.now();
  const remainingMs = Math.max(0, currentTimer.endsAt - now);

  roomState.timer = {
    ...currentTimer,
    isPaused: true,
    remainingMs,
    endsAt: now + remainingMs
  };

  return getRoomStateSnapshot();
};

export const resumeRoomTimer = (): RoomState => {
  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  const currentTimer = roomState.timer;

  if (
    roomState.phase !== Phase.EATING ||
    currentTimer === null ||
    currentTimer.phase !== Phase.EATING ||
    !currentTimer.isPaused
  ) {
    return getRoomStateSnapshot();
  }

  const now = Date.now();

  roomState.timer = {
    ...currentTimer,
    startedAt: now,
    endsAt: now + currentTimer.remainingMs,
    isPaused: false
  };

  return getRoomStateSnapshot();
};

export const extendRoomTimer = (additionalSeconds: number): RoomState => {
  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  const currentTimer = roomState.timer;

  if (
    roomState.phase !== Phase.EATING ||
    currentTimer === null ||
    currentTimer.phase !== Phase.EATING ||
    !Number.isInteger(additionalSeconds) ||
    additionalSeconds <= 0 ||
    additionalSeconds > TIMER_EXTEND_MAX_SECONDS
  ) {
    return getRoomStateSnapshot();
  }
  const additionalMs = additionalSeconds * 1000;
  const now = Date.now();

  if (currentTimer.isPaused) {
    const nextRemainingMs = currentTimer.remainingMs + additionalMs;
    roomState.timer = {
      ...currentTimer,
      remainingMs: nextRemainingMs,
      durationMs: currentTimer.durationMs + additionalMs,
      endsAt: now + nextRemainingMs
    };

    return getRoomStateSnapshot();
  }

  const nextEndsAt = currentTimer.endsAt + additionalMs;
  roomState.timer = {
    ...currentTimer,
    endsAt: nextEndsAt,
    durationMs: currentTimer.durationMs + additionalMs,
    remainingMs: Math.max(0, nextEndsAt - now)
  };

  return getRoomStateSnapshot();
};

export const skipTurnBoundary = (): RoomState => {
  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  const previousPhase = roomState.phase;
  const canSkipTurn =
    previousPhase === Phase.EATING ||
    previousPhase === Phase.MINIGAME_INTRO ||
    previousPhase === Phase.MINIGAME_PLAY;

  if (!canSkipTurn) {
    return getRoomStateSnapshot();
  }

  const hasNextRoundTurn =
    roomState.roundTurnCursor + 1 < roomState.turnOrderTeamIds.length;
  finalizeActiveRoundTurn(roomState);

  const nextPhase = hasNextRoundTurn ? Phase.EATING : Phase.ROUND_RESULTS;
  roomState.phase = nextPhase;
  roomState.currentRoundConfig = resolveCurrentRoundConfig(roomState);

  if (previousPhase === Phase.MINIGAME_PLAY) {
    clearMinigameRuntime(roomState);
    markMinigameContractCompatible();
  }

  if (nextPhase === Phase.ROUND_RESULTS) {
    clearScoringMutationUndoState(roomState);
    applyPendingRoundScoresToTotals(roomState);
  }

  if (nextPhase === Phase.EATING) {
    const eatingSeconds = roomState.gameConfig?.timers.eatingSeconds ?? null;
    roomState.timer =
      eatingSeconds === null
        ? null
        : createRunningTimer(Phase.EATING, eatingSeconds);
  } else {
    roomState.timer = null;
  }

  logPhaseTransition(previousPhase, nextPhase, roomState.currentRound);

  return getRoomStateSnapshot();
};

const isSetupReadyToStart = (state: RoomState): boolean => {
  if (state.gameConfig === null) {
    return false;
  }

  if (state.players.length === 0) {
    return false;
  }

  if (state.teams.length < 2) {
    return false;
  }

  const playerIds = new Set(state.players.map((player) => player.id));
  const assignedPlayerIds = new Set<string>();

  for (const team of state.teams) {
    if (team.playerIds.length === 0) {
      return false;
    }

    for (const playerId of team.playerIds) {
      if (!playerIds.has(playerId)) {
        return false;
      }

      if (assignedPlayerIds.has(playerId)) {
        return false;
      }

      assignedPlayerIds.add(playerId);
    }
  }

  return assignedPlayerIds.size === playerIds.size;
};

export const advanceRoomStatePhase = (): RoomState => {
  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  const previousPhase = roomState.phase;
  const previousRound = roomState.currentRound;

  if (previousPhase === Phase.SETUP && !isSetupReadyToStart(roomState)) {
    return getRoomStateSnapshot();
  }

  const nextPhase = resolveNextPhase(roomState, previousPhase);

  if (previousPhase === Phase.MINIGAME_PLAY) {
    finalizeActiveRoundTurn(roomState);
  }

  roomState.phase = nextPhase;

  if (
    previousPhase === Phase.INTRO &&
    nextPhase === Phase.ROUND_INTRO &&
    roomState.currentRound === 0
  ) {
    roomState.currentRound = 1;
  }

  if (previousPhase === Phase.ROUND_RESULTS && nextPhase === Phase.ROUND_INTRO) {
    roomState.currentRound += 1;
  }

  if (nextPhase === Phase.FINAL_RESULTS) {
    roomState.currentRoundConfig = null;
  } else {
    roomState.currentRoundConfig = resolveCurrentRoundConfig(roomState);
  }

  if (nextPhase === Phase.ROUND_INTRO) {
    initializeRoundTurnState(roomState);
  }

  if (previousPhase === Phase.MINIGAME_INTRO && nextPhase === Phase.MINIGAME_PLAY) {
    initializeActiveMinigameTurnState(roomState);
  }

  if (previousPhase === Phase.MINIGAME_PLAY && nextPhase !== Phase.MINIGAME_PLAY) {
    clearMinigameRuntime(roomState);
    markMinigameContractCompatible();
  }

  if (previousPhase === Phase.MINIGAME_PLAY && nextPhase === Phase.ROUND_RESULTS) {
    clearScoringMutationUndoState(roomState);
    applyPendingRoundScoresToTotals(roomState);
  }

  if (previousPhase === Phase.ROUND_RESULTS) {
    clearPendingRoundScores(roomState);
  }

  if (previousPhase === Phase.ROUND_INTRO && nextPhase === Phase.EATING) {
    resetRoundWingParticipation(roomState);
    const eatingSeconds = roomState.gameConfig?.timers.eatingSeconds ?? null;
    roomState.timer =
      eatingSeconds === null
        ? null
        : createRunningTimer(Phase.EATING, eatingSeconds);
  } else if (previousPhase === Phase.MINIGAME_PLAY && nextPhase === Phase.EATING) {
    const eatingSeconds = roomState.gameConfig?.timers.eatingSeconds ?? null;
    roomState.timer =
      eatingSeconds === null
        ? null
        : createRunningTimer(Phase.EATING, eatingSeconds);
  } else if (nextPhase === Phase.MINIGAME_PLAY) {
    const minigameSeconds = resolveMinigameTimerSeconds(roomState);
    roomState.timer =
      minigameSeconds === null
        ? null
        : createRunningTimer(Phase.MINIGAME_PLAY, minigameSeconds);
  } else {
    roomState.timer = null;
  }

  if (roomState.currentRound !== previousRound) {
    clearScoringMutationUndoState(roomState);
  }

  logPhaseTransition(previousPhase, nextPhase, roomState.currentRound);

  return getRoomStateSnapshot();
};

const resolveCanAdvancePhase = (state: RoomState): boolean => {
  if (isRoomInFatalState(state)) {
    return false;
  }

  if (state.phase === Phase.FINAL_RESULTS) {
    return false;
  }

  if (state.phase === Phase.SETUP) {
    return isSetupReadyToStart(state);
  }

  return true;
};
