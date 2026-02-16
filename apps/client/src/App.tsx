import { type RoomState } from "@wingnight/shared";
import { useEffect, useState } from "react";

import { DisplayPlaceholder } from "./components/DisplayPlaceholder";
import { HostPlaceholder } from "./components/HostPlaceholder";
import { RouteNotFound } from "./components/RouteNotFound";
import { roomSocket } from "./socket/createRoomSocket";
import { saveHostSecret } from "./utils/hostSecretStorage";
import { requestAssignPlayer } from "./utils/requestAssignPlayer";
import { requestCreateTeam } from "./utils/requestCreateTeam";
import { requestNextPhase } from "./utils/requestNextPhase";
import { resolveClientRoute } from "./utils/resolveClientRoute";
import { wireHostControlClaim } from "./utils/wireHostControlClaim";
import { wireRoomStateRehydration } from "./utils/wireRoomStateRehydration";

export const App = (): JSX.Element => {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const route = resolveClientRoute(window.location.pathname);

  useEffect(() => {
    return wireRoomStateRehydration(roomSocket, setRoomState);
  }, []);

  useEffect(() => {
    if (route !== "HOST") {
      return;
    }

    return wireHostControlClaim(roomSocket, saveHostSecret);
  }, [route]);

  const handleNextPhase = (): void => {
    requestNextPhase(roomSocket, () => {
      roomSocket.emit("host:claimControl");
    });
  };

  const handleCreateTeam = (name: string): void => {
    requestCreateTeam(roomSocket, name, () => {
      roomSocket.emit("host:claimControl");
    });
  };

  const handleAssignPlayer = (playerId: string, teamId: string | null): void => {
    requestAssignPlayer(roomSocket, playerId, teamId, () => {
      roomSocket.emit("host:claimControl");
    });
  };

  if (route === "HOST") {
    return (
      <HostPlaceholder
        roomState={roomState}
        onNextPhase={handleNextPhase}
        onCreateTeam={handleCreateTeam}
        onAssignPlayer={handleAssignPlayer}
      />
    );
  }

  if (route === "DISPLAY") {
    return <DisplayPlaceholder />;
  }

  return <RouteNotFound />;
};
