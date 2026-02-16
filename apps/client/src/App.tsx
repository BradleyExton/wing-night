import { type RoomState } from "@wingnight/shared";
import { useEffect, useState } from "react";

import { DisplayPlaceholder } from "./components/DisplayPlaceholder";
import { HostPlaceholder } from "./components/HostPlaceholder";
import { RouteNotFound } from "./components/RouteNotFound";
import { roomSocket } from "./socket/createRoomSocket";
import { saveHostSecret } from "./utils/hostSecretStorage";
import { requestNextPhase } from "./utils/requestNextPhase";
import { resolveClientRoute } from "./utils/resolveClientRoute";
import { wireHostControlClaim } from "./utils/wireHostControlClaim";
import { wireRoomStateRehydration } from "./utils/wireRoomStateRehydration";

export const App = (): JSX.Element => {
  const [, setRoomState] = useState<RoomState | null>(null);
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

  if (route === "HOST") {
    return <HostPlaceholder onNextPhase={handleNextPhase} />;
  }

  if (route === "DISPLAY") {
    return <DisplayPlaceholder />;
  }

  return <RouteNotFound />;
};
