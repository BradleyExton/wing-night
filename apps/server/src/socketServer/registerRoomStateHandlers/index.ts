import {
  CLIENT_TO_SERVER_EVENTS,
  TIMER_EXTEND_MAX_SECONDS,
  SERVER_TO_CLIENT_EVENTS
} from "@wingnight/shared";
import type {
  GameReorderTurnOrderPayload,
  HostSecretPayload,
  MinigameActionEnvelopePayload,
  ScoringAdjustTeamScorePayload,
  ScoringSetWingParticipationPayload,
  TimerExtendPayload,
  SetupAssignPlayerPayload,
  SetupCreateTeamPayload
} from "@wingnight/shared";

type RoomStateSocket<TSnapshot> = {
  emit: {
    (
      event: typeof SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT,
      roomState: TSnapshot
    ): void;
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
    (event: typeof CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION, listener: (payload: unknown) => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE, listener: (payload: unknown) => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.TIMER_RESUME, listener: (payload: unknown) => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND, listener: (payload: unknown) => void): void;
  };
};

type HostAuth = {
  issueHostSecret: () => HostSecretPayload;
  isValidHostSecret: (hostSecret: string) => boolean;
};

type ActiveMinigameContract = {
  minigameId: MinigameActionEnvelopePayload["minigameId"];
  minigameApiVersion: number;
  capabilityFlags: string[];
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
  onAuthorizedDispatchMinigameAction: (
    payload: MinigameActionEnvelopePayload
  ) => void;
  onMinigameActionRejectedForCompatibility: (message: string) => void;
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

const isMinigameActionEnvelopePayload = (
  payload: unknown
): payload is MinigameActionEnvelopePayload => {
  if (!isHostSecretPayload(payload)) {
    return false;
  }

  if (!("minigameId" in payload) || typeof payload.minigameId !== "string") {
    return false;
  }

  if (
    !("minigameApiVersion" in payload) ||
    typeof payload.minigameApiVersion !== "number" ||
    !Number.isInteger(payload.minigameApiVersion) ||
    payload.minigameApiVersion <= 0
  ) {
    return false;
  }

  if (
    !("capabilityFlags" in payload) ||
    !Array.isArray(payload.capabilityFlags) ||
    !payload.capabilityFlags.every((flag) => typeof flag === "string")
  ) {
    return false;
  }

  if (
    !("actionType" in payload) ||
    typeof payload.actionType !== "string" ||
    payload.actionType.trim().length === 0
  ) {
    return false;
  }

  if (!("actionPayload" in payload)) {
    return false;
  }

  if (
    typeof payload.actionPayload !== "object" ||
    payload.actionPayload === null ||
    Array.isArray(payload.actionPayload)
  ) {
    return false;
  }

  return true;
};

const areCapabilityFlagsEqual = (
  left: string[],
  right: string[]
): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  const leftSet = new Set(left);
  const rightSet = new Set(right);

  if (leftSet.size !== rightSet.size) {
    return false;
  }

  for (const capabilityFlag of leftSet) {
    if (!rightSet.has(capabilityFlag)) {
      return false;
    }
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

export const registerRoomStateHandlers = <TSnapshot>(
  socket: RoomStateSocket<TSnapshot>,
  getSnapshot: () => TSnapshot,
  resolveActiveMinigameContract: () => ActiveMinigameContract | null,
  mutationHandlers: AuthorizedSetupMutationHandlers,
  canClaimControl: boolean,
  hostAuth: HostAuth
): void => {
  type AuthorizedPayload = { hostSecret: string };

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

  const handleNextPhase = (payload: unknown): void => {
    runAuthorizedMutation(payload, isHostSecretPayload, () => {
      mutationHandlers.onAuthorizedNextPhase();
    });
  };

  const handleReorderTurnOrder = (payload: unknown): void => {
    runAuthorizedMutation(payload, isGameReorderTurnOrderPayload, (typedPayload) => {
      mutationHandlers.onAuthorizedReorderTurnOrder(typedPayload.teamIds);
    });
  };

  const handleSkipTurnBoundary = (payload: unknown): void => {
    runAuthorizedMutation(payload, isHostSecretPayload, () => {
      mutationHandlers.onAuthorizedSkipTurnBoundary();
    });
  };

  const handleResetGame = (payload: unknown): void => {
    runAuthorizedMutation(payload, isHostSecretPayload, () => {
      mutationHandlers.onAuthorizedResetGame();
    });
  };

  const handleCreateTeam = (payload: unknown): void => {
    runAuthorizedMutation(payload, isSetupCreateTeamPayload, (typedPayload) => {
      mutationHandlers.onAuthorizedCreateTeam(typedPayload.name);
    });
  };

  const handleAssignPlayer = (payload: unknown): void => {
    runAuthorizedMutation(payload, isSetupAssignPlayerPayload, (typedPayload) => {
      mutationHandlers.onAuthorizedAssignPlayer(typedPayload.playerId, typedPayload.teamId);
    });
  };

  const handleSetWingParticipation = (payload: unknown): void => {
    runAuthorizedMutation(
      payload,
      isScoringSetWingParticipationPayload,
      (typedPayload) => {
        mutationHandlers.onAuthorizedSetWingParticipation(
          typedPayload.playerId,
          typedPayload.didEat
        );
      }
    );
  };

  const handleAdjustTeamScore = (payload: unknown): void => {
    runAuthorizedMutation(payload, isScoringAdjustTeamScorePayload, (typedPayload) => {
      mutationHandlers.onAuthorizedAdjustTeamScore(typedPayload.teamId, typedPayload.delta);
    });
  };

  const handleRedoLastMutation = (payload: unknown): void => {
    runAuthorizedMutation(payload, isHostSecretPayload, () => {
      mutationHandlers.onAuthorizedRedoLastMutation();
    });
  };

  const handleMinigameAction = (payload: unknown): void => {
    runAuthorizedMutation(
      payload,
      isMinigameActionEnvelopePayload,
      (typedPayload) => {
        const activeMinigameContract = resolveActiveMinigameContract();

        if (
          activeMinigameContract === null ||
          typedPayload.minigameId !== activeMinigameContract.minigameId
        ) {
          mutationHandlers.onMinigameActionRejectedForCompatibility(
            "Active minigame changed. Refresh host and try again."
          );
          return;
        }

        if (
          typedPayload.minigameApiVersion !==
          activeMinigameContract.minigameApiVersion
        ) {
          mutationHandlers.onMinigameActionRejectedForCompatibility(
            "Minigame API version mismatch. Refresh host and try again."
          );
          return;
        }

        if (
          !areCapabilityFlagsEqual(
            typedPayload.capabilityFlags,
            activeMinigameContract.capabilityFlags
          )
        ) {
          mutationHandlers.onMinigameActionRejectedForCompatibility(
            "Minigame capability mismatch. Refresh host and try again."
          );
          return;
        }

        if (!typedPayload.capabilityFlags.includes(typedPayload.actionType)) {
          mutationHandlers.onMinigameActionRejectedForCompatibility(
            "Unsupported minigame action. Refresh host and try again."
          );
          return;
        }

        mutationHandlers.onAuthorizedDispatchMinigameAction(typedPayload);
      }
    );
  };

  const handleTimerPause = (payload: unknown): void => {
    runAuthorizedMutation(payload, isHostSecretPayload, () => {
      mutationHandlers.onAuthorizedPauseTimer();
    });
  };

  const handleTimerResume = (payload: unknown): void => {
    runAuthorizedMutation(payload, isHostSecretPayload, () => {
      mutationHandlers.onAuthorizedResumeTimer();
    });
  };

  const handleTimerExtend = (payload: unknown): void => {
    runAuthorizedMutation(payload, isTimerExtendPayload, (typedPayload) => {
      mutationHandlers.onAuthorizedExtendTimer(typedPayload.additionalSeconds);
    });
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
  socket.on(CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION, handleMinigameAction);
  socket.on(CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE, handleTimerPause);
  socket.on(CLIENT_TO_SERVER_EVENTS.TIMER_RESUME, handleTimerResume);
  socket.on(CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND, handleTimerExtend);
};
