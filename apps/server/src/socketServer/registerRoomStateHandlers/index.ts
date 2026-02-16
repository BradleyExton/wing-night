import type {
  HostSecretPayload,
  RoomState,
  SetupAssignPlayerPayload,
  SetupCreateTeamPayload
} from "@wingnight/shared";

type RoomStateSocket = {
  emit: {
    (event: "server:stateSnapshot", roomState: RoomState): void;
    (event: "host:secretIssued", payload: HostSecretPayload): void;
  };
  on: {
    (event: "client:requestState", listener: () => void): void;
    (event: "host:claimControl", listener: () => void): void;
    (event: "game:nextPhase", listener: (payload: unknown) => void): void;
    (event: "setup:createTeam", listener: (payload: unknown) => void): void;
    (event: "setup:assignPlayer", listener: (payload: unknown) => void): void;
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

export const registerRoomStateHandlers = (
  socket: RoomStateSocket,
  getSnapshot: () => RoomState,
  mutationHandlers: AuthorizedSetupMutationHandlers,
  canClaimControl: boolean,
  hostAuth: HostAuth
): void => {
  const emitSnapshot = (): void => {
    socket.emit("server:stateSnapshot", getSnapshot());
  };

  const handleHostClaim = (): void => {
    if (!canClaimControl) {
      return;
    }

    socket.emit("host:secretIssued", hostAuth.issueHostSecret());
  };

  const handleNextPhase = (payload: unknown): void => {
    if (!isHostSecretPayload(payload)) {
      return;
    }

    if (!hostAuth.isValidHostSecret(payload.hostSecret)) {
      return;
    }

    mutationHandlers.onAuthorizedNextPhase();
  };

  const handleCreateTeam = (payload: unknown): void => {
    if (!isSetupCreateTeamPayload(payload)) {
      return;
    }

    if (!hostAuth.isValidHostSecret(payload.hostSecret)) {
      return;
    }

    mutationHandlers.onAuthorizedCreateTeam(payload.name);
  };

  const handleAssignPlayer = (payload: unknown): void => {
    if (!isSetupAssignPlayerPayload(payload)) {
      return;
    }

    if (!hostAuth.isValidHostSecret(payload.hostSecret)) {
      return;
    }

    mutationHandlers.onAuthorizedAssignPlayer(payload.playerId, payload.teamId);
  };

  emitSnapshot();

  socket.on("client:requestState", emitSnapshot);
  socket.on("host:claimControl", handleHostClaim);
  socket.on("game:nextPhase", handleNextPhase);
  socket.on("setup:createTeam", handleCreateTeam);
  socket.on("setup:assignPlayer", handleAssignPlayer);
};
