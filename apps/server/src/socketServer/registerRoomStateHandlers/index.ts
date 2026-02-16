import type { HostSecretPayload, RoomState } from "@wingnight/shared";

type RoomStateSocket = {
  emit: {
    (event: "server:stateSnapshot", roomState: RoomState): void;
    (event: "host:secretIssued", payload: HostSecretPayload): void;
  };
  on: {
    (event: "client:requestState", listener: () => void): void;
    (event: "host:claimControl", listener: () => void): void;
    (
      event: "game:nextPhase",
      listener: (payload: HostSecretPayload) => void
    ): void;
  };
};

type HostAuth = {
  issueHostSecret: () => HostSecretPayload;
  isValidHostSecret: (hostSecret: string) => boolean;
};

export const registerRoomStateHandlers = (
  socket: RoomStateSocket,
  getSnapshot: () => RoomState,
  onAuthorizedNextPhase: () => void,
  hostAuth: HostAuth
): void => {
  const emitSnapshot = (): void => {
    socket.emit("server:stateSnapshot", getSnapshot());
  };

  const handleHostClaim = (): void => {
    socket.emit("host:secretIssued", hostAuth.issueHostSecret());
  };

  const handleNextPhase = (payload: HostSecretPayload): void => {
    if (!hostAuth.isValidHostSecret(payload.hostSecret)) {
      return;
    }

    onAuthorizedNextPhase();
    emitSnapshot();
  };

  emitSnapshot();

  socket.on("client:requestState", emitSnapshot);
  socket.on("host:claimControl", handleHostClaim);
  socket.on("game:nextPhase", handleNextPhase);
};
