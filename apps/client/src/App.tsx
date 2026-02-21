import { type RoomState } from "@wingnight/shared";
import { useEffect, useMemo, useState } from "react";

import { DisplayBoard } from "./components/DisplayBoard";
import { HostControlPanel } from "./components/HostControlPanel";
import { MinigameDevSandbox } from "./components/MinigameDevSandbox";
import { RouteNotFound } from "./components/RouteNotFound";
import { createRoomSocket } from "./socket/createRoomSocket";
import { shouldCreateRoomSocket } from "./socket/shouldCreateRoomSocket";
import { resolveMinigameTypeFromSlug } from "./minigames/registry";
import { saveHostSecret } from "./utils/hostSecretStorage";
import { createHostControlPanelHandlers } from "./utils/createHostControlPanelHandlers";
import { resolveClientRoute, resolveDevMinigameSlug } from "./utils/resolveClientRoute";
import { wireHostControlClaim } from "./utils/wireHostControlClaim";
import { wireRoomStateRehydration } from "./utils/wireRoomStateRehydration";

export const App = (): JSX.Element => {
  const pathname = window.location.pathname;
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const route = resolveClientRoute(pathname);
  const devMinigameSlug = resolveDevMinigameSlug(pathname);
  const devMinigameType =
    devMinigameSlug === null ? null : resolveMinigameTypeFromSlug(devMinigameSlug);
  const roomSocket = useMemo(() => {
    if (!shouldCreateRoomSocket(route)) {
      return null;
    }

    return createRoomSocket(pathname);
  }, [pathname, route]);

  const hostControlPanelHandlers = useMemo(() => {
    if (route !== "HOST" || roomSocket === null) {
      return null;
    }

    return createHostControlPanelHandlers(roomSocket);
  }, [roomSocket, route]);

  useEffect(() => {
    if (roomSocket === null) {
      return;
    }

    return wireRoomStateRehydration(roomSocket, setRoomState);
  }, [roomSocket]);

  useEffect(() => {
    if (route !== "HOST" || roomSocket === null) {
      return;
    }

    return wireHostControlClaim(roomSocket, saveHostSecret);
  }, [roomSocket, route]);

  useEffect(() => {
    if (roomSocket === null) {
      return;
    }

    return (): void => {
      roomSocket.disconnect();
    };
  }, [roomSocket]);

  if (route === "HOST") {
    return (
      <HostControlPanel roomState={roomState} {...(hostControlPanelHandlers ?? {})} />
    );
  }

  if (route === "DISPLAY") {
    return <DisplayBoard roomState={roomState} />;
  }

  if (route === "DEV_MINIGAME" && devMinigameType !== null) {
    return <MinigameDevSandbox minigameType={devMinigameType} />;
  }

  return <RouteNotFound />;
};
