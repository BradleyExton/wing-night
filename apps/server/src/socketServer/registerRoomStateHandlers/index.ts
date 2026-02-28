import {
  CLIENT_TO_SERVER_EVENTS,
  SERVER_TO_CLIENT_EVENTS
} from "@wingnight/shared";
import type {
  HostSecretPayload,
  MinigameActionPayload,
  RoomState
} from "@wingnight/shared";

import {
  isGameReorderTurnOrderPayload,
  isHostSecretPayload,
  isMinigameActionEnvelope,
  isScoringAdjustTeamScorePayload,
  isScoringSetWingParticipationPayload,
  isSetupAssignPlayerPayload,
  isSetupCreateTeamPayload,
  isTimerExtendPayload
} from "./payloadGuards/index.js";

type RoomStateSocket = {
  emit: {
    (event: typeof SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT, roomState: RoomState): void;
    (event: typeof SERVER_TO_CLIENT_EVENTS.SECRET_ISSUED, payload: HostSecretPayload): void;
    (event: typeof SERVER_TO_CLIENT_EVENTS.SECRET_INVALID): void;
  };
  on: {
    (event: typeof CLIENT_TO_SERVER_EVENTS.REQUEST_STATE, listener: () => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL, listener: () => void): void;
    (event: Exclude<ClientEventName, typeof CLIENT_TO_SERVER_EVENTS.REQUEST_STATE | typeof CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL>, listener: (payload: unknown) => void): void;
  };
};

type HostAuth = {
  issueHostSecret: () => HostSecretPayload;
  isValidHostSecret: (hostSecret: string) => boolean;
};

type AuthorizedSetupMutationHandlers = {
  onAuthorizedNextPhase: () => void;
  onAuthorizedPreviousPhase: () => void;
  onAuthorizedSkipTurnBoundary: () => void;
  onAuthorizedReorderTurnOrder: (teamIds: string[]) => void;
  onAuthorizedResetGame: () => void;
  onAuthorizedCreateTeam: (name: string) => void;
  onAuthorizedAssignPlayer: (playerId: string, teamId: string | null) => void;
  onAuthorizedSetWingParticipation: (playerId: string, didEat: boolean) => void;
  onAuthorizedAdjustTeamScore: (teamId: string, delta: number) => void;
  onAuthorizedRedoLastMutation: () => void;
  onAuthorizedMinigameAction: (payload: MinigameActionPayload) => void;
  onAuthorizedPauseTimer: () => void;
  onAuthorizedResumeTimer: () => void;
  onAuthorizedExtendTimer: (additionalSeconds: number) => void;
};

type ClientEventName =
  (typeof CLIENT_TO_SERVER_EVENTS)[keyof typeof CLIENT_TO_SERVER_EVENTS];

type AuthorizedEventName = Exclude<
  ClientEventName,
  typeof CLIENT_TO_SERVER_EVENTS.REQUEST_STATE | typeof CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL
>;

export const registerRoomStateHandlers = (
  socket: RoomStateSocket,
  getSnapshot: () => RoomState,
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

  const registerAuthorizedMutation = <TPayload extends AuthorizedPayload>(
    event: AuthorizedEventName,
    isPayload: (candidate: unknown) => candidate is TPayload,
    onAuthorized: (typedPayload: TPayload) => void
  ): void => {
    socket.on(event, (payload: unknown): void => {
      runAuthorizedMutation(payload, isPayload, onAuthorized);
    });
  };

  const handleHostClaim = (): void => {
    if (!canClaimControl) {
      return;
    }

    socket.emit(SERVER_TO_CLIENT_EVENTS.SECRET_ISSUED, hostAuth.issueHostSecret());
  };

  emitSnapshot();

  socket.on(CLIENT_TO_SERVER_EVENTS.REQUEST_STATE, emitSnapshot);
  socket.on(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL, handleHostClaim);

  registerAuthorizedMutation(
    CLIENT_TO_SERVER_EVENTS.NEXT_PHASE,
    isHostSecretPayload,
    () => {
      mutationHandlers.onAuthorizedNextPhase();
    }
  );

  registerAuthorizedMutation(
    CLIENT_TO_SERVER_EVENTS.PREVIOUS_PHASE,
    isHostSecretPayload,
    () => {
      mutationHandlers.onAuthorizedPreviousPhase();
    }
  );

  registerAuthorizedMutation(
    CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY,
    isHostSecretPayload,
    () => {
      mutationHandlers.onAuthorizedSkipTurnBoundary();
    }
  );

  registerAuthorizedMutation(
    CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER,
    isGameReorderTurnOrderPayload,
    (typedPayload) => {
      mutationHandlers.onAuthorizedReorderTurnOrder(typedPayload.teamIds);
    }
  );

  registerAuthorizedMutation(CLIENT_TO_SERVER_EVENTS.RESET, isHostSecretPayload, () => {
    mutationHandlers.onAuthorizedResetGame();
  });

  registerAuthorizedMutation(
    CLIENT_TO_SERVER_EVENTS.CREATE_TEAM,
    isSetupCreateTeamPayload,
    (typedPayload) => {
      mutationHandlers.onAuthorizedCreateTeam(typedPayload.name);
    }
  );

  registerAuthorizedMutation(
    CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER,
    isSetupAssignPlayerPayload,
    (typedPayload) => {
      mutationHandlers.onAuthorizedAssignPlayer(typedPayload.playerId, typedPayload.teamId);
    }
  );

  registerAuthorizedMutation(
    CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION,
    isScoringSetWingParticipationPayload,
    (typedPayload) => {
      mutationHandlers.onAuthorizedSetWingParticipation(
        typedPayload.playerId,
        typedPayload.didEat
      );
    }
  );

  registerAuthorizedMutation(
    CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE,
    isScoringAdjustTeamScorePayload,
    (typedPayload) => {
      mutationHandlers.onAuthorizedAdjustTeamScore(typedPayload.teamId, typedPayload.delta);
    }
  );

  registerAuthorizedMutation(
    CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION,
    isHostSecretPayload,
    () => {
      mutationHandlers.onAuthorizedRedoLastMutation();
    }
  );

  registerAuthorizedMutation(
    CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION,
    isMinigameActionEnvelope,
    (typedPayload) => {
      mutationHandlers.onAuthorizedMinigameAction(typedPayload);
    }
  );

  registerAuthorizedMutation(CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE, isHostSecretPayload, () => {
    mutationHandlers.onAuthorizedPauseTimer();
  });

  registerAuthorizedMutation(CLIENT_TO_SERVER_EVENTS.TIMER_RESUME, isHostSecretPayload, () => {
    mutationHandlers.onAuthorizedResumeTimer();
  });

  registerAuthorizedMutation(
    CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND,
    isTimerExtendPayload,
    (typedPayload) => {
      mutationHandlers.onAuthorizedExtendTimer(typedPayload.additionalSeconds);
    }
  );
};
