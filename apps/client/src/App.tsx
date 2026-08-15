import {
  resolveMinigameTypeFromSlug,
  type RoleScopedStateSnapshotEnvelope
} from "@wingnight/shared";
import { useEffect, useMemo, useState } from "react";

import { AdminConfigWizard } from "./components/AdminConfigWizard";
import { AnamorphLab } from "./components/AnamorphLab";
import { ContraptionLab } from "./components/ContraptionLab";
import { ContraptionUiLab } from "./components/ContraptionUiLab";
import { DisplayBoard } from "./components/DisplayBoard";
import { HostControlPanel } from "./components/HostControlPanel";
import { MinigameDevSandbox } from "./components/MinigameDevSandbox";
import { RootRouteLanding } from "./components/RootRouteLanding";
import { RouteNotFound } from "./components/RouteNotFound";
import { HostHandlersProvider } from "./context/HostHandlersContext";
import { RoomStateProvider } from "./context/RoomStateContext";
import { createRoomSocket } from "./socket/createRoomSocket";
import { shouldCreateRoomSocket } from "./socket/shouldCreateRoomSocket";
import { saveHostSecret } from "./utils/hostSecretStorage";
import { createHostRequestHandlers } from "./utils/hostRequests";
import {
  resolveClientRoute,
  resolveDevLabName,
  resolveDevMinigameSlug
} from "./utils/resolveClientRoute";
import { wireHostControlClaim } from "./utils/wireHostControlClaim";
import { wireRoomStateRehydration } from "./utils/wireRoomStateRehydration";

// Deleted by WN-14 along with the lab itself.
const ANAMORPH_LAB_NAME = "anamorph";

// Deleted by WN-15 along with the lab itself.
const CONTRAPTION_LAB_NAME = "contraption";

// Deleted by WN-15 along with the prototype itself.
const CONTRAPTION_UI_LAB_NAME = "contraption-ui";

const resolveRouteContent = (
  route: ReturnType<typeof resolveClientRoute>,
  devMinigameType: ReturnType<typeof resolveMinigameTypeFromSlug> | null,
  devLabName: string | null,
  roomSocket: ReturnType<typeof createRoomSocket> | null
): JSX.Element => {
  if (route === "HOST") {
    return <HostControlPanel />;
  }

  // The wizard talks to the server directly over `config:*` rather than through
  // room state, so it takes the socket instead of reading a context.
  if (route === "ADMIN") {
    return <AdminConfigWizard socket={roomSocket} />;
  }

  if (route === "DISPLAY") {
    return <DisplayBoard />;
  }

  if (route === "ROOT") {
    return <RootRouteLanding />;
  }

  if (route === "DEV_MINIGAME" && devMinigameType !== null) {
    return <MinigameDevSandbox minigameType={devMinigameType} />;
  }

  if (route === "DEV_LAB" && devLabName === ANAMORPH_LAB_NAME) {
    return <AnamorphLab />;
  }

  if (route === "DEV_LAB" && devLabName === CONTRAPTION_LAB_NAME) {
    return <ContraptionLab />;
  }

  if (route === "DEV_LAB" && devLabName === CONTRAPTION_UI_LAB_NAME) {
    return <ContraptionUiLab />;
  }

  return <RouteNotFound />;
};

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
        {resolveRouteContent(route, devMinigameType, devLabName, roomSocket)}
      </HostHandlersProvider>
    </RoomStateProvider>
  );
};
