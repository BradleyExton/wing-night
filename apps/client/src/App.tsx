import {
  CLIENT_ROLES,
  type DisplayRoomStateSnapshot,
  type HostRoomStateSnapshot
} from "@wingnight/shared";
import { useEffect, useMemo, useState } from "react";

import { DisplayBoard } from "./components/DisplayBoard";
import { HostRouteShell } from "./components/HostControlPanel/HostRouteShell";
import { RouteNotFound } from "./components/RouteNotFound";
import { roomSocket } from "./socket/createRoomSocket";
import { saveHostSecret } from "./utils/hostSecretStorage";
import { createHostControlPanelHandlers } from "./utils/createHostControlPanelHandlers";
import { resolveClientRoute } from "./utils/resolveClientRoute";
import { wireHostControlClaim } from "./utils/wireHostControlClaim";
import { wireRoomStateRehydration } from "./utils/wireRoomStateRehydration";

export const App = (): JSX.Element => {
  const [hostRoomState, setHostRoomState] = useState<HostRoomStateSnapshot | null>(
    null
  );
  const [displayRoomState, setDisplayRoomState] =
    useState<DisplayRoomStateSnapshot | null>(null);
  const route = resolveClientRoute(window.location.pathname);

  const hostControlPanelHandlers = useMemo(() => {
    return createHostControlPanelHandlers(roomSocket);
  }, []);

  useEffect(() => {
    setHostRoomState(null);
    setDisplayRoomState(null);

    if (route === "HOST") {
      return wireRoomStateRehydration(
        roomSocket,
        CLIENT_ROLES.HOST,
        (snapshot) => {
          setHostRoomState(snapshot);
        }
      );
    }

    if (route === "DISPLAY") {
      return wireRoomStateRehydration(
        roomSocket,
        CLIENT_ROLES.DISPLAY,
        (snapshot) => {
          setDisplayRoomState(snapshot);
        }
      );
    }

    return;
  }, [route]);

  useEffect(() => {
    if (route !== "HOST") {
      return;
    }

    return wireHostControlClaim(roomSocket, saveHostSecret);
  }, [route]);

  if (route === "HOST") {
    return <HostRouteShell roomState={hostRoomState} {...hostControlPanelHandlers} />;
  }

  if (route === "DISPLAY") {
    return <DisplayBoard roomState={displayRoomState} />;
  }

  return <RouteNotFound />;
};
