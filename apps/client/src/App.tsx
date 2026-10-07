import {
  CLIENT_ROLES,
  resolveMinigameTypeFromSlug,
  type RoleScopedStateSnapshotEnvelope
} from "@wingnight/shared";
import { useEffect, useMemo, useState } from "react";

import { AdminConfigWizard } from "./components/AdminConfigWizard";
import { AnamorphLab } from "./components/AnamorphLab";
import { ContraptionLab } from "./components/ContraptionLab";
import { ContraptionUiLab } from "./components/ContraptionUiLab";
import { DevRouteIndex } from "./components/DevRouteIndex";
import { DisplayBoard } from "./components/DisplayBoard";
import { HostControlPanel } from "./components/HostControlPanel";
import { HostSeatLocked } from "./components/HostSeatLocked";
import { MinigameDevSandbox } from "./components/MinigameDevSandbox";
import { PlayerPhone } from "./components/PlayerPhone";
import { QuickPlayLauncher } from "./components/QuickPlayLauncher";
import { RootRouteLanding } from "./components/RootRouteLanding";
import { RouteNotFound } from "./components/RouteNotFound";
import { HostHandlersProvider } from "./context/HostHandlersContext";
import { PlayerJoinTokenProvider } from "./context/PlayerJoinTokenContext";
import { RoomStateProvider } from "./context/RoomStateContext";
import { createRoomSocket, resolveSocketClientRole } from "./socket/createRoomSocket";
import { shouldCreateRoomSocket } from "./socket/shouldCreateRoomSocket";
import { clearHostControlToken } from "./utils/hostControlToken";
import { saveHostSecret } from "./utils/hostSecretStorage";
import { createDisplayReportHandlers } from "./utils/displayReports";
import { createHostRequestHandlers } from "./utils/hostRequests";
import { createContestantLegController, type ContestantLegController } from "./utils/contestantLeg";
import { createPlayerSeatController, type PlayerSeatController } from "./utils/playerSeat";
import { createSpectatorBetSlipController, type SpectatorBetSlipController } from "./utils/spectatorBetSlip";
import {
  resolveClientRoute,
  resolveDevLabName,
  resolveDevMinigameSlug
} from "./utils/resolveClientRoute";
import { wireHostControlClaim } from "./utils/wireHostControlClaim";
import { wireHostSeatLock } from "./utils/wireHostSeatLock";
import { wirePlayerJoinToken } from "./utils/wirePlayerJoinToken";
import { wireRoomStateRehydration } from "./utils/wireRoomStateRehydration";

// Throwaway — deleted along with the lab when the ANAMORPH minigame ships
// (BACKLOG.md § Minigames).
const ANAMORPH_LAB_NAME = "anamorph";

// Throwaway — deleted along with the lab when the CONTRAPTION minigame ships.
const CONTRAPTION_LAB_NAME = "contraption";

// Throwaway — deleted along with the prototype when CONTRAPTION ships.
const CONTRAPTION_UI_LAB_NAME = "contraption-ui";

const resolveRouteContent = (
  route: ReturnType<typeof resolveClientRoute>,
  devMinigameType: ReturnType<typeof resolveMinigameTypeFromSlug> | null,
  devLabName: string | null,
  roomSocket: ReturnType<typeof createRoomSocket> | null,
  displayReports: ReturnType<typeof createDisplayReportHandlers> | null,
  playerSeat: PlayerSeatController | null,
  contestantLeg: ContestantLegController | null,
  betSlip: SpectatorBetSlipController | null
): JSX.Element => {
  if (route === "HOST") {
    return <HostControlPanel />;
  }

  // The wizard talks to the server directly over `config:*` rather than through
  // room state, so it takes the socket instead of reading a context.
  if (route === "ADMIN") {
    return <AdminConfigWizard socket={roomSocket} />;
  }

  // The launcher is a host surface on another path: same room state, same
  // request handlers, one extra event.
  if (route === "QUICKPLAY") {
    return <QuickPlayLauncher />;
  }

  if (route === "DISPLAY") {
    // The board takes the reporter as a prop rather than reading a context,
    // because it is the only thing the display ever sends and a context for one
    // callback is more machinery than the callback.
    return <DisplayBoard onMusicTrackEnded={displayReports?.onMusicTrackEnded} />;
  }

  // A guest's phone. Its seat (which face is this phone's) is its own, held
  // beside room state rather than in it, so it rides in as a prop — and so
  // does its leg of an arcade relay, whose host view only this phone is sent,
  // and its own side bet, whose pick only this phone is told.
  if (route === "PLAY") {
    return <PlayerPhone seat={playerSeat} contestantLeg={contestantLeg} betSlip={betSlip} />;
  }

  if (route === "ROOT") {
    return <RootRouteLanding />;
  }

  if (route === "DEV_INDEX") {
    return <DevRouteIndex />;
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
  const [isHostSeatLocked, setIsHostSeatLocked] = useState(false);
  const [playerJoinToken, setPlayerJoinToken] = useState<string | null>(null);
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

  const playerSeat = useMemo(() => {
    if (route !== "PLAY" || roomSocket === null) {
      return null;
    }

    return createPlayerSeatController(roomSocket);
  }, [roomSocket, route]);

  useEffect(() => {
    return (): void => {
      playerSeat?.dispose();
    };
  }, [playerSeat]);

  const contestantLeg = useMemo(() => {
    if (route !== "PLAY" || roomSocket === null) {
      return null;
    }

    return createContestantLegController(roomSocket);
  }, [roomSocket, route]);

  useEffect(() => {
    return (): void => {
      contestantLeg?.dispose();
    };
  }, [contestantLeg]);

  const betSlip = useMemo(() => {
    if (route !== "PLAY" || roomSocket === null) {
      return null;
    }

    return createSpectatorBetSlipController(roomSocket);
  }, [roomSocket, route]);

  useEffect(() => {
    return (): void => {
      betSlip?.dispose();
    };
  }, [betSlip]);

  // The TV's player QR: only the laptop's display is ever handed the token.
  useEffect(() => {
    if (route !== "DISPLAY" || roomSocket === null) {
      return;
    }

    return wirePlayerJoinToken(roomSocket, setPlayerJoinToken);
  }, [roomSocket, route]);

  const hostHandlers = useMemo(() => {
    if ((route !== "HOST" && route !== "QUICKPLAY") || roomSocket === null) {
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

  // ADMIN and QUICKPLAY claim host control too — `config:*` and
  // `quickplay:start` are host-authorized events, so without the claim
  // neither page ever holds a secret to send with them.
  useEffect(() => {
    if (
      (route !== "HOST" && route !== "ADMIN" && route !== "QUICKPLAY") ||
      roomSocket === null
    ) {
      return;
    }

    return wireHostControlClaim(roomSocket, saveHostSecret);
  }, [roomSocket, route]);

  // A host page the server turned away: forget the token that failed (it is
  // was rotated, or never was one) and say where the way in is.
  useEffect(() => {
    if (roomSocket === null || resolveSocketClientRole(pathname) !== CLIENT_ROLES.HOST) {
      return;
    }

    return wireHostSeatLock(roomSocket, () => {
      clearHostControlToken();
      setIsHostSeatLocked(true);
    });
  }, [pathname, roomSocket]);

  useEffect(() => {
    if (roomSocket === null) {
      return;
    }

    return (): void => {
      roomSocket.disconnect();
    };
  }, [roomSocket]);

  if (isHostSeatLocked) {
    return <HostSeatLocked />;
  }

  return (
    <RoomStateProvider value={roomStateEnvelope}>
      <HostHandlersProvider value={hostHandlers}>
        <PlayerJoinTokenProvider value={playerJoinToken}>
          {resolveRouteContent(
            route,
            devMinigameType,
            devLabName,
            roomSocket,
            displayReports,
            playerSeat,
            contestantLeg,
            betSlip
          )}
        </PlayerJoinTokenProvider>
      </HostHandlersProvider>
    </RoomStateProvider>
  );
};
