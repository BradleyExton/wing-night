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
  type AuthorizedPayload = { hostSecret: string };
  type AuthorizedMutationEvent =
    | typeof CLIENT_TO_SERVER_EVENTS.NEXT_PHASE
    | typeof CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY
    | typeof CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER
    | typeof CLIENT_TO_SERVER_EVENTS.RESET
    | typeof CLIENT_TO_SERVER_EVENTS.CREATE_TEAM
    | typeof CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER
    | typeof CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION
    | typeof CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE
    | typeof CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION
    | typeof CLIENT_TO_SERVER_EVENTS.RECORD_TRIVIA_ATTEMPT
    | typeof CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE
    | typeof CLIENT_TO_SERVER_EVENTS.TIMER_RESUME
    | typeof CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND;

  const emitSnapshot = (): void => {
    socket.emit(SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT, getSnapshot());
  };

  const emitSecretInvalid = (): void => {
    if (!canClaimControl) {
      return;
    }

    socket.emit(SERVER_TO_CLIENT_EVENTS.SECRET_INVALID);
  };

  const runAuthorizedMutation = <TPayload extends AuthorizedPayload>(
    payload: unknown,
    isPayload: (candidate: unknown) => candidate is TPayload,
    onAuthorized: (typedPayload: TPayload) => void
  ): void => {
    if (!isPayload(payload)) {
      return;
    }

    if (!hostAuth.isValidHostSecret(payload.hostSecret)) {
      emitSecretInvalid();
      return;
    }

    onAuthorized(payload);
  };

  const handleHostClaim = (): void => {
    if (!canClaimControl) {
      return;
    }

    socket.emit(SERVER_TO_CLIENT_EVENTS.SECRET_ISSUED, hostAuth.issueHostSecret());
  };

  const registerAuthorizedMutationListener = <TPayload extends AuthorizedPayload>(
    event: AuthorizedMutationEvent,
    isPayload: (candidate: unknown) => candidate is TPayload,
    onAuthorized: (typedPayload: TPayload) => void
  ): void => {
    const onAuthorizedEvent = socket.on.bind(socket) as (
      nextEvent: AuthorizedMutationEvent,
      listener: (payload: unknown) => void
    ) => void;

    onAuthorizedEvent(event, (payload: unknown) => {
      runAuthorizedMutation(payload, isPayload, onAuthorized);
    });
  };

  emitSnapshot();

  socket.on(CLIENT_TO_SERVER_EVENTS.REQUEST_STATE, emitSnapshot);
  socket.on(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL, handleHostClaim);
  registerAuthorizedMutationListener(
    CLIENT_TO_SERVER_EVENTS.NEXT_PHASE,
    isHostSecretPayload,
    () => {
      mutationHandlers.onAuthorizedNextPhase();
    }
  );
  registerAuthorizedMutationListener(
    CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY,
    isHostSecretPayload,
    () => {
      mutationHandlers.onAuthorizedSkipTurnBoundary();
    }
  );
  registerAuthorizedMutationListener(
    CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER,
    isGameReorderTurnOrderPayload,
    (typedPayload) => {
      mutationHandlers.onAuthorizedReorderTurnOrder(typedPayload.teamIds);
    }
  );
  registerAuthorizedMutationListener(CLIENT_TO_SERVER_EVENTS.RESET, isHostSecretPayload, () => {
    mutationHandlers.onAuthorizedResetGame();
  });
  registerAuthorizedMutationListener(
    CLIENT_TO_SERVER_EVENTS.CREATE_TEAM,
    isSetupCreateTeamPayload,
    (typedPayload) => {
      mutationHandlers.onAuthorizedCreateTeam(typedPayload.name);
    }
  );
  registerAuthorizedMutationListener(
    CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER,
    isSetupAssignPlayerPayload,
    (typedPayload) => {
      mutationHandlers.onAuthorizedAssignPlayer(typedPayload.playerId, typedPayload.teamId);
    }
  );
  registerAuthorizedMutationListener(
    CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION,
    isScoringSetWingParticipationPayload,
    (typedPayload) => {
      mutationHandlers.onAuthorizedSetWingParticipation(
        typedPayload.playerId,
        typedPayload.didEat
      );
    }
  );
  registerAuthorizedMutationListener(
    CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE,
    isScoringAdjustTeamScorePayload,
    (typedPayload) => {
      mutationHandlers.onAuthorizedAdjustTeamScore(typedPayload.teamId, typedPayload.delta);
    }
  );
  registerAuthorizedMutationListener(
    CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION,
    isHostSecretPayload,
    () => {
      mutationHandlers.onAuthorizedRedoLastMutation();
    }
  );
  registerAuthorizedMutationListener(
    CLIENT_TO_SERVER_EVENTS.RECORD_TRIVIA_ATTEMPT,
    isMinigameRecordTriviaAttemptPayload,
    (typedPayload) => {
      mutationHandlers.onAuthorizedRecordTriviaAttempt(typedPayload.isCorrect);
    }
  );
  registerAuthorizedMutationListener(CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE, isHostSecretPayload, () => {
    mutationHandlers.onAuthorizedPauseTimer();
  });
  registerAuthorizedMutationListener(CLIENT_TO_SERVER_EVENTS.TIMER_RESUME, isHostSecretPayload, () => {
    mutationHandlers.onAuthorizedResumeTimer();
  });
  registerAuthorizedMutationListener(
    CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND,
    isTimerExtendPayload,
    (typedPayload) => {
      mutationHandlers.onAuthorizedExtendTimer(typedPayload.additionalSeconds);
    }
  );
};
