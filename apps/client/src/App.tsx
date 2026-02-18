import { type RoomState } from "@wingnight/shared";
import { useEffect, useMemo, useState } from "react";

import { DisplayBoard } from "./components/DisplayBoard";
import { HostControlPanel } from "./components/HostControlPanel";
import { RouteNotFound } from "./components/RouteNotFound";
import { roomSocket } from "./socket/createRoomSocket";
import { saveHostSecret } from "./utils/hostSecretStorage";
import { createHostControlPanelHandlers } from "./utils/createHostControlPanelHandlers";
import { resolveClientRoute } from "./utils/resolveClientRoute";
import { wireHostControlClaim } from "./utils/wireHostControlClaim";
import { wireRoomStateRehydration } from "./utils/wireRoomStateRehydration";

export const App = (): JSX.Element => {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const route = resolveClientRoute(window.location.pathname);

  const hostControlPanelHandlers = useMemo(() => {
    return createHostControlPanelHandlers(roomSocket);
  }, []);

  useEffect(() => {
    return wireRoomStateRehydration(roomSocket, setRoomState);
  }, []);

  useEffect(() => {
    if (route !== "HOST") {
      return;
    }

    return wireHostControlClaim(roomSocket, saveHostSecret);
  }, [route]);

  if (route === "HOST") {
    return <HostControlPanel roomState={roomState} {...hostControlPanelHandlers} />;
  }

  if (route === "DISPLAY") {
    return <DisplayBoard roomState={roomState} />;
  }

  return <RouteNotFound />;
};
