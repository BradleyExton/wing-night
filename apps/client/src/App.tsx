import { CLIENT_TO_SERVER_EVENTS, type RoomState } from "@wingnight/shared";
import { useEffect, useState } from "react";

import { DisplayPlaceholder } from "./components/DisplayPlaceholder";
import { HostControlPanel } from "./components/HostControlPanel";
import { RouteNotFound } from "./components/RouteNotFound";
import { roomSocket } from "./socket/createRoomSocket";
import { saveHostSecret } from "./utils/hostSecretStorage";
import { requestAssignPlayer } from "./utils/requestAssignPlayer";
import { requestCreateTeam } from "./utils/requestCreateTeam";
import { requestNextPhase } from "./utils/requestNextPhase";
import { requestRecordTriviaAttempt } from "./utils/requestRecordTriviaAttempt";
import { requestSetWingParticipation } from "./utils/requestSetWingParticipation";
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
      roomSocket.emit(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL);
    });
  };

  const handleCreateTeam = (name: string): void => {
    requestCreateTeam(roomSocket, name, () => {
      roomSocket.emit(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL);
    });
  };

  const handleAssignPlayer = (playerId: string, teamId: string | null): void => {
    requestAssignPlayer(roomSocket, playerId, teamId, () => {
      roomSocket.emit(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL);
    });
  };

  const handleSetWingParticipation = (
    playerId: string,
    didEat: boolean
  ): void => {
    requestSetWingParticipation(roomSocket, playerId, didEat, () => {
      roomSocket.emit(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL);
    });
  };

  const handleRecordTriviaAttempt = (isCorrect: boolean): void => {
    requestRecordTriviaAttempt(roomSocket, isCorrect, () => {
      roomSocket.emit(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL);
    });
  };

  if (route === "HOST") {
    return (
      <HostControlPanel
        roomState={roomState}
        onNextPhase={handleNextPhase}
        onCreateTeam={handleCreateTeam}
        onAssignPlayer={handleAssignPlayer}
        onSetWingParticipation={handleSetWingParticipation}
        onRecordTriviaAttempt={handleRecordTriviaAttempt}
      />
    );
  }

  if (route === "DISPLAY") {
    return <DisplayPlaceholder roomState={roomState} />;
  }

  return <RouteNotFound />;
};
