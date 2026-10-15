import {
  CLIENT_ROLES,
  resolveMinigameTypeFromSlug,
  type RoleScopedStateSnapshotEnvelope
} from "@wingnight/shared";
import { useEffect, useMemo, useState } from "react";

import { HostSeatLocked } from "./components/HostSeatLocked";
import { RouteContent } from "./components/RouteContent";
import { HostHandlersProvider } from "./context/HostHandlersContext";
import { PlayerJoinTokenProvider } from "./context/PlayerJoinTokenContext";
import { RoomStateProvider } from "./context/RoomStateContext";
import { createRoomSocket, resolveSocketClientRole } from "./socket/createRoomSocket";
import { shouldCreateRoomSocket } from "./socket/shouldCreateRoomSocket";
import { clearHostControlToken } from "./utils/hostControlToken";
import { saveHostSecret } from "./utils/hostSecretStorage";
import { createDisplayReportHandlers } from "./utils/displayReports";
import { createHostRequestHandlers } from "./utils/hostRequests";
import { createContestantLegController } from "./utils/contestantLeg";
import { createPhoneAnswerCardController } from "./utils/phoneAnswerCard";
import { createPlayerSeatController } from "./utils/playerSeat";
import { createSpectatorBetSlipController } from "./utils/spectatorBetSlip";
import {
  resolveClientRoute,
  resolveDevLabName,
  resolveDevMinigameSlug
} from "./utils/resolveClientRoute";
import { wireHostControlClaim } from "./utils/wireHostControlClaim";
import { wireHostSeatLock } from "./utils/wireHostSeatLock";
import { wirePlayerJoinToken } from "./utils/wirePlayerJoinToken";
import { wireRoomStateRehydration } from "./utils/wireRoomStateRehydration";

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

  const answerCard = useMemo(() => {
    if (route !== "PLAY" || roomSocket === null) {
      return null;
    }

    return createPhoneAnswerCardController(roomSocket);
  }, [roomSocket, route]);

  useEffect(() => {
    return (): void => {
      answerCard?.dispose();
    };
  }, [answerCard]);

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
          <RouteContent
            route={route}
            devMinigameType={devMinigameType}
            devLabName={devLabName}
            roomSocket={roomSocket}
            displayReports={displayReports}
            playerSeat={playerSeat}
            contestantLeg={contestantLeg}
            betSlip={betSlip}
            answerCard={answerCard}
          />
        </PlayerJoinTokenProvider>
      </HostHandlersProvider>
    </RoomStateProvider>
  );
};
