import {
  CLIENT_TO_SERVER_EVENTS,
  SERVER_TO_CLIENT_EVENTS
} from "@wingnight/shared";
import type {
  HostSecretPayload,
  MinigameRecordTriviaAttemptPayload,
  MinigameTogglePassAndPlayLockPayload,
  ScoringSetWingParticipationPayload,
  RoomState,
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
    (event: typeof CLIENT_TO_SERVER_EVENTS.CREATE_TEAM, listener: (payload: unknown) => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER, listener: (payload: unknown) => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION, listener: (payload: unknown) => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.RECORD_TRIVIA_ATTEMPT, listener: (payload: unknown) => void): void;
    (event: typeof CLIENT_TO_SERVER_EVENTS.TOGGLE_PASS_AND_PLAY_LOCK, listener: (payload: unknown) => void): void;
  };
};

type HostAuth = {
  issueHostSecret: () => HostSecretPayload;
  isValidHostSecret: (hostSecret: string) => boolean;
};

type AuthorizedSetupMutationHandlers = {
  onAuthorizedNextPhase: () => void;
  onAuthorizedCreateTeam: (name: string) => void;
  onAuthorizedAssignPlayer: (playerId: string, teamId: string | null) => void;
  onAuthorizedSetWingParticipation: (playerId: string, didEat: boolean) => void;
  onAuthorizedRecordTriviaAttempt: (isCorrect: boolean) => void;
  onAuthorizedTogglePassAndPlayLock: () => void;
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

const isMinigameTogglePassAndPlayLockPayload = (
  payload: unknown
): payload is MinigameTogglePassAndPlayLockPayload => {
  return isHostSecretPayload(payload);
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

  const handleTogglePassAndPlayLock = (payload: unknown): void => {
    if (!isMinigameTogglePassAndPlayLockPayload(payload)) {
      return;
    }

    if (!hostAuth.isValidHostSecret(payload.hostSecret)) {
      if (canClaimControl) {
        socket.emit(SERVER_TO_CLIENT_EVENTS.SECRET_INVALID);
      }
      return;
    }

    mutationHandlers.onAuthorizedTogglePassAndPlayLock();
  };

  emitSnapshot();

  socket.on(CLIENT_TO_SERVER_EVENTS.REQUEST_STATE, emitSnapshot);
  socket.on(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL, handleHostClaim);
  socket.on(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE, handleNextPhase);
  socket.on(CLIENT_TO_SERVER_EVENTS.CREATE_TEAM, handleCreateTeam);
  socket.on(CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER, handleAssignPlayer);
  socket.on(
    CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION,
    handleSetWingParticipation
  );
  socket.on(
    CLIENT_TO_SERVER_EVENTS.RECORD_TRIVIA_ATTEMPT,
    handleRecordTriviaAttempt
  );
  socket.on(
    CLIENT_TO_SERVER_EVENTS.TOGGLE_PASS_AND_PLAY_LOCK,
    handleTogglePassAndPlayLock
  );
};
