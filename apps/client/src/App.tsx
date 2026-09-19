import {
  resolveMinigameTypeFromSlug,
  type RoleScopedStateSnapshotEnvelope
} from "@wingnight/shared";
import { useEffect, useMemo, useState } from "react";

import { RouteContent } from "./components/RouteContent";
import { HostHandlersProvider } from "./context/HostHandlersContext";
import { RoomStateProvider } from "./context/RoomStateContext";
import { createRoomSocket } from "./socket/createRoomSocket";
import { shouldCreateRoomSocket } from "./socket/shouldCreateRoomSocket";
import { saveHostSecret } from "./utils/hostSecretStorage";
import { createDisplayReportHandlers } from "./utils/displayReports";
import { createHostRequestHandlers } from "./utils/hostRequests";
import {
  resolveClientRoute,
  resolveDevLabName,
  resolveDevMinigameSlug
} from "./utils/resolveClientRoute";
import { wireHostControlClaim } from "./utils/wireHostControlClaim";
import { wireRoomStateRehydration } from "./utils/wireRoomStateRehydration";

export const App = (): JSX.Element => {
  const pathname = window.location.pathname;
  const [roomStateEnvelope, setRoomStateEnvelope] =
    useState<RoleScopedStateSnapshotEnvelope | null>(null);
  const route = resolveClientRoute(pathname);
  const devMinigameSlug = resolveDevMinigameSlug(pathname);
  const devMinigameType =
    devMinigameSlug === null ? null : resolveMinigameTypeFromSlug(devMinigameSlug);
  const devLabName = resolveDevLabName(pathname);
  const roomSocket = useMemo(() => {
    if (!shouldCreateRoomSocket(route)) {
      return null;
    }

    return createRoomSocket(pathname);
  }, [pathname, route]);

  const displayReports = useMemo(() => {
    if (route !== "DISPLAY" || roomSocket === null) {
      return null;
    }

    return createDisplayReportHandlers(roomSocket);
  }, [roomSocket, route]);

  const hostHandlers = useMemo(() => {
    if (route !== "HOST" || roomSocket === null) {
      return null;
    }

    return createHostRequestHandlers(roomSocket);
  }, [roomSocket, route]);

  useEffect(() => {
    if (roomSocket === null) {
      return;
    }

    return wireRoomStateRehydration(roomSocket, setRoomStateEnvelope);
  }, [roomSocket]);

  // ADMIN claims host control too — `config:*` are host-authorized events, so
  // without the claim the wizard never holds a secret to send with them.
  useEffect(() => {
    if ((route !== "HOST" && route !== "ADMIN") || roomSocket === null) {
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

  return (
    <RoomStateProvider value={roomStateEnvelope}>
      <HostHandlersProvider value={hostHandlers}>
        <RouteContent
          route={route}
          devMinigameType={devMinigameType}
          devLabName={devLabName}
          roomSocket={roomSocket}
          displayReports={displayReports}
        />
      </HostHandlersProvider>
    </RoomStateProvider>
  );
};
