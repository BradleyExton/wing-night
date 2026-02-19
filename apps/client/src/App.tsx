import {
  CLIENT_ROLES,
  type DisplayRoomStateSnapshot,
  type HostRoomStateSnapshot
} from "@wingnight/shared";
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
  const [roomState, setRoomState] = useState<
    HostRoomStateSnapshot | DisplayRoomStateSnapshot | null
  >(null);
  const route = resolveClientRoute(window.location.pathname);

  const hostControlPanelHandlers = useMemo(() => {
    return createHostControlPanelHandlers(roomSocket);
  }, []);

  useEffect(() => {
    setRoomState(null);

    if (route === "HOST") {
      return wireRoomStateRehydration(
        roomSocket,
        CLIENT_ROLES.HOST,
        (snapshot) => {
          setRoomState(snapshot);
        }
      );
    }

    if (route === "DISPLAY") {
      return wireRoomStateRehydration(
        roomSocket,
        CLIENT_ROLES.DISPLAY,
        (snapshot) => {
          setRoomState(snapshot);
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
    return (
      <HostControlPanel
        roomState={roomState as HostRoomStateSnapshot | null}
        {...hostControlPanelHandlers}
      />
    );
  }

  if (route === "DISPLAY") {
    return <DisplayBoard roomState={roomState as DisplayRoomStateSnapshot | null} />;
  }

  return <RouteNotFound />;
};
