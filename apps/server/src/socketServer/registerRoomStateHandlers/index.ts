import {
  CLIENT_TO_SERVER_EVENTS,
  TIMER_EXTEND_MAX_SECONDS,
  SERVER_TO_CLIENT_EVENTS
} from "@wingnight/shared";
import type {
  GameReorderTurnOrderPayload,
  HostSecretPayload,
  MinigameRecordTriviaAttemptPayload,
  ScoringAdjustTeamScorePayload,
  ScoringSetWingParticipationPayload,
  RoomState,
  TimerExtendPayload,
  SetupAssignPlayerPayload,
  SetupCreateTeamPayload
} from "@wingnight/shared";

type RoomStateSocket = {
  emit: {
    (event: typeof SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT, roomState: RoomState): void;
    (event: typeof SERVER_TO_CLIENT_EVENTS.SECRET_ISSUED, payload: HostSecretPayload): void;
    (event: typeof SERVER_TO_CLIENT_EVENTS.SECRET_INVALID): void;
  };
  on: {
    (event: typeof CLIENT_TO_SERVER_EVENTS.REQUEST_STATE, listener: () => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL, listener: () => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.NEXT_PHASE, listener: (payload: unknown) => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY, listener: (payload: unknown) => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER, listener: (payload: unknown) => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.RESET, listener: (payload: unknown) => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.CREATE_TEAM, listener: (payload: unknown) => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER, listener: (payload: unknown) => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION, listener: (payload: unknown) => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE, listener: (payload: unknown) => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION, listener: (payload: unknown) => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.RECORD_TRIVIA_ATTEMPT, listener: (payload: unknown) => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE, listener: (payload: unknown) => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.TIMER_RESUME, listener: (payload: unknown) => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND, listener: (payload: unknown) => void): void;
  };
};

type HostAuth = {
  issueHostSecret: () => HostSecretPayload;
  isValidHostSecret: (hostSecret: string) => boolean;
};

type AuthorizedSetupMutationHandlers = {
  onAuthorizedNextPhase: () => void;
  onAuthorizedSkipTurnBoundary: () => void;
  onAuthorizedReorderTurnOrder: (teamIds: string[]) => void;
  onAuthorizedResetGame: () => void;
  onAuthorizedCreateTeam: (name: string) => void;
  onAuthorizedAssignPlayer: (playerId: string, teamId: string | null) => void;
  onAuthorizedSetWingParticipation: (playerId: string, didEat: boolean) => void;
  onAuthorizedAdjustTeamScore: (teamId: string, delta: number) => void;
  onAuthorizedRedoLastMutation: () => void;
  onAuthorizedRecordTriviaAttempt: (isCorrect: boolean) => void;
  onAuthorizedPauseTimer: () => void;
  onAuthorizedResumeTimer: () => void;
  onAuthorizedExtendTimer: (additionalSeconds: number) => void;
};

const isHostSecretPayload = (payload: unknown): payload is HostSecretPayload => {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  if (!("hostSecret" in payload)) {
    return false;
  }

  return typeof payload.hostSecret === "string";
};

const isSetupCreateTeamPayload = (
  payload: unknown
): payload is SetupCreateTeamPayload => {
  if (!isHostSecretPayload(payload)) {
    return false;
  }

  return "name" in payload && typeof payload.name === "string";
};

const isGameReorderTurnOrderPayload = (
  payload: unknown
): payload is GameReorderTurnOrderPayload => {
  if (!isHostSecretPayload(payload)) {
    return false;
  }

  if (!("teamIds" in payload) || !Array.isArray(payload.teamIds)) {
    return false;
  }

  return payload.teamIds.every((teamId) => typeof teamId === "string");
};

const isSetupAssignPlayerPayload = (
  payload: unknown
): payload is SetupAssignPlayerPayload => {
  if (!isHostSecretPayload(payload)) {
    return false;
  }

  if (!("playerId" in payload) || typeof payload.playerId !== "string") {
    return false;
  }

  if (!("teamId" in payload)) {
    return false;
  }

  return payload.teamId === null || typeof payload.teamId === "string";
};

const isScoringSetWingParticipationPayload = (
  payload: unknown
): payload is ScoringSetWingParticipationPayload => {
  if (!isHostSecretPayload(payload)) {
    return false;
  }

  if (!("playerId" in payload) || typeof payload.playerId !== "string") {
    return false;
  }

  if (!("didEat" in payload) || typeof payload.didEat !== "boolean") {
    return false;
  }

  return true;
};

const isScoringAdjustTeamScorePayload = (
  payload: unknown
): payload is ScoringAdjustTeamScorePayload => {
  if (!isHostSecretPayload(payload)) {
    return false;
  }

  if (!("teamId" in payload) || typeof payload.teamId !== "string") {
    return false;
  }

  if (!("delta" in payload) || typeof payload.delta !== "number") {
    return false;
  }

  return Number.isInteger(payload.delta) && payload.delta !== 0;
};

const isMinigameRecordTriviaAttemptPayload = (
  payload: unknown
): payload is MinigameRecordTriviaAttemptPayload => {
  if (!isHostSecretPayload(payload)) {
    return false;
  }

  if (!("isCorrect" in payload) || typeof payload.isCorrect !== "boolean") {
    return false;
  }

  return true;
};

const isTimerExtendPayload = (payload: unknown): payload is TimerExtendPayload => {
  if (!isHostSecretPayload(payload)) {
    return false;
  }

  if (
    !("additionalSeconds" in payload) ||
    typeof payload.additionalSeconds !== "number" ||
    !Number.isInteger(payload.additionalSeconds)
  ) {
    return false;
  }

  return (
    payload.additionalSeconds > 0 &&
    payload.additionalSeconds <= TIMER_EXTEND_MAX_SECONDS
  );
};

export const registerRoomStateHandlers = (
  socket: RoomStateSocket,
  getSnapshot: () => RoomState,
  mutationHandlers: AuthorizedSetupMutationHandlers,
  canClaimControl: boolean,
  hostAuth: HostAuth
): void => {
  const emitSnapshot = (): void => {
    socket.emit(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT, getSnapshot());
  };

  const handleHostClaim = (): void => {
    if (!canClaimControl) {
      return;
    }

    socket.emit(SERVER_TO_CLIENT_EVENTS.SECRET_ISSUED, hostAuth.issueHostSecret());
  };

  const handleNextPhase = (payload: unknown): void => {
    if (!isHostSecretPayload(payload)) {
      return;
    }

    if (!hostAuth.isValidHostSecret(payload.hostSecret)) {
      if (canClaimControl) {
        socket.emit(SERVER_TO_CLIENT_EVENTS.SECRET_INVALID);
      }
      return;
    }

    mutationHandlers.onAuthorizedNextPhase();
  };

  const handleReorderTurnOrder = (payload: unknown): void => {
    if (!isGameReorderTurnOrderPayload(payload)) {
      return;
    }

    if (!hostAuth.isValidHostSecret(payload.hostSecret)) {
      if (canClaimControl) {
        socket.emit(SERVER_TO_CLIENT_EVENTS.SECRET_INVALID);
      }
      return;
    }

    mutationHandlers.onAuthorizedReorderTurnOrder(payload.teamIds);
  };

  const handleSkipTurnBoundary = (payload: unknown): void => {
    if (!isHostSecretPayload(payload)) {
      return;
    }

    if (!hostAuth.isValidHostSecret(payload.hostSecret)) {
      if (canClaimControl) {
        socket.emit(SERVER_TO_CLIENT_EVENTS.SECRET_INVALID);
      }
      return;
    }

    mutationHandlers.onAuthorizedSkipTurnBoundary();
  };

  const handleResetGame = (payload: unknown): void => {
    if (!isHostSecretPayload(payload)) {
      return;
    }

    if (!hostAuth.isValidHostSecret(payload.hostSecret)) {
      if (canClaimControl) {
        socket.emit(SERVER_TO_CLIENT_EVENTS.SECRET_INVALID);
      }
      return;
    }

    mutationHandlers.onAuthorizedResetGame();
  };

  const handleCreateTeam = (payload: unknown): void => {
    if (!isSetupCreateTeamPayload(payload)) {
      return;
    }

    if (!hostAuth.isValidHostSecret(payload.hostSecret)) {
      if (canClaimControl) {
        socket.emit(SERVER_TO_CLIENT_EVENTS.SECRET_INVALID);
      }
      return;
    }

    mutationHandlers.onAuthorizedCreateTeam(payload.name);
  };

  const handleAssignPlayer = (payload: unknown): void => {
    if (!isSetupAssignPlayerPayload(payload)) {
      return;
    }

    if (!hostAuth.isValidHostSecret(payload.hostSecret)) {
      if (canClaimControl) {
        socket.emit(SERVER_TO_CLIENT_EVENTS.SECRET_INVALID);
      }
      return;
    }

    mutationHandlers.onAuthorizedAssignPlayer(payload.playerId, payload.teamId);
  };

  const handleSetWingParticipation = (payload: unknown): void => {
    if (!isScoringSetWingParticipationPayload(payload)) {
      return;
    }

    if (!hostAuth.isValidHostSecret(payload.hostSecret)) {
      if (canClaimControl) {
        socket.emit(SERVER_TO_CLIENT_EVENTS.SECRET_INVALID);
      }
      return;
    }

    mutationHandlers.onAuthorizedSetWingParticipation(payload.playerId, payload.didEat);
  };

  const handleAdjustTeamScore = (payload: unknown): void => {
    if (!isScoringAdjustTeamScorePayload(payload)) {
      return;
    }

    if (!hostAuth.isValidHostSecret(payload.hostSecret)) {
      if (canClaimControl) {
        socket.emit(SERVER_TO_CLIENT_EVENTS.SECRET_INVALID);
      }
      return;
    }

    mutationHandlers.onAuthorizedAdjustTeamScore(payload.teamId, payload.delta);
  };

  const handleRedoLastMutation = (payload: unknown): void => {
    if (!isHostSecretPayload(payload)) {
      return;
    }

    if (!hostAuth.isValidHostSecret(payload.hostSecret)) {
      if (canClaimControl) {
        socket.emit(SERVER_TO_CLIENT_EVENTS.SECRET_INVALID);
      }
      return;
    }

    mutationHandlers.onAuthorizedRedoLastMutation();
  };

  const handleRecordTriviaAttempt = (payload: unknown): void => {
    if (!isMinigameRecordTriviaAttemptPayload(payload)) {
      return;
    }

    if (!hostAuth.isValidHostSecret(payload.hostSecret)) {
      if (canClaimControl) {
        socket.emit(SERVER_TO_CLIENT_EVENTS.SECRET_INVALID);
      }
      return;
    }

    mutationHandlers.onAuthorizedRecordTriviaAttempt(payload.isCorrect);
  };

  const handleTimerPause = (payload: unknown): void => {
    if (!isHostSecretPayload(payload)) {
      return;
    }

    if (!hostAuth.isValidHostSecret(payload.hostSecret)) {
      if (canClaimControl) {
        socket.emit(SERVER_TO_CLIENT_EVENTS.SECRET_INVALID);
      }
      return;
    }

    mutationHandlers.onAuthorizedPauseTimer();
  };

  const handleTimerResume = (payload: unknown): void => {
    if (!isHostSecretPayload(payload)) {
      return;
    }

    if (!hostAuth.isValidHostSecret(payload.hostSecret)) {
      if (canClaimControl) {
        socket.emit(SERVER_TO_CLIENT_EVENTS.SECRET_INVALID);
      }
      return;
    }

    mutationHandlers.onAuthorizedResumeTimer();
  };

  const handleTimerExtend = (payload: unknown): void => {
    if (!isTimerExtendPayload(payload)) {
      return;
    }

    if (!hostAuth.isValidHostSecret(payload.hostSecret)) {
      if (canClaimControl) {
        socket.emit(SERVER_TO_CLIENT_EVENTS.SECRET_INVALID);
      }
      return;
    }

    mutationHandlers.onAuthorizedExtendTimer(payload.additionalSeconds);
  };

  emitSnapshot();

  socket.on(CLIENT_TO_SERVER_EVENTS.REQUEST_STATE, emitSnapshot);
  socket.on(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL, handleHostClaim);
  socket.on(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE, handleNextPhase);
  socket.on(CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY, handleSkipTurnBoundary);
  socket.on(CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER, handleReorderTurnOrder);
  socket.on(CLIENT_TO_SERVER_EVENTS.RESET, handleResetGame);
  socket.on(CLIENT_TO_SERVER_EVENTS.CREATE_TEAM, handleCreateTeam);
  socket.on(CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER, handleAssignPlayer);
  socket.on(
    CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION,
    handleSetWingParticipation
  );
  socket.on(CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE, handleAdjustTeamScore);
  socket.on(CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION, handleRedoLastMutation);
  socket.on(
    CLIENT_TO_SERVER_EVENTS.RECORD_TRIVIA_ATTEMPT,
    handleRecordTriviaAttempt
  );
  socket.on(CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE, handleTimerPause);
  socket.on(CLIENT_TO_SERVER_EVENTS.TIMER_RESUME, handleTimerResume);
  socket.on(CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND, handleTimerExtend);
};
