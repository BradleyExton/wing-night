import type { HostSecretPayload, RoomState } from "@wingnight/shared";

type RoomStateSocket = {
  emit: {
    (event: "server:stateSnapshot", roomState: RoomState): void;
    (event: "host:secretIssued", payload: HostSecretPayload): void;
  };
  on: {
    (event: "client:requestState", listener: () => void): void;
    (event: "host:claimControl", listener: () => void): void;
    (event: "game:nextPhase", listener: (payload: unknown) => void): void;
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
  canClaimControl: boolean,
  hostAuth: HostAuth
): void => {
  const emitSnapshot = (): void => {
    socket.emit("server:stateSnapshot", getSnapshot());
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

    onAuthorizedNextPhase();
  };

  emitSnapshot();

  socket.on("client:requestState", emitSnapshot);
  socket.on("host:claimControl", handleHostClaim);
  socket.on("game:nextPhase", handleNextPhase);
};
