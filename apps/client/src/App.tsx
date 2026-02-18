import { CLIENT_TO_SERVER_EVENTS, type RoomState } from "@wingnight/shared";
import { useEffect, useState } from "react";

import { DisplayBoard } from "./components/DisplayBoard";
import { HostControlPanel } from "./components/HostControlPanel";
import { RouteNotFound } from "./components/RouteNotFound";
import { roomSocket } from "./socket/createRoomSocket";
import { saveHostSecret } from "./utils/hostSecretStorage";
import { requestAssignPlayer } from "./utils/requestAssignPlayer";
import { requestAdjustTeamScore } from "./utils/requestAdjustTeamScore";
import { requestCreateTeam } from "./utils/requestCreateTeam";
import { requestExtendTimer } from "./utils/requestExtendTimer";
import { requestNextPhase } from "./utils/requestNextPhase";
import { requestPauseTimer } from "./utils/requestPauseTimer";
import { requestReorderTurnOrder } from "./utils/requestReorderTurnOrder";
import { requestRecordTriviaAttempt } from "./utils/requestRecordTriviaAttempt";
import { requestRedoLastMutation } from "./utils/requestRedoLastMutation";
import { requestResetGame } from "./utils/requestResetGame";
import { requestResumeTimer } from "./utils/requestResumeTimer";
import { requestSetWingParticipation } from "./utils/requestSetWingParticipation";
import { requestSkipTurnBoundary } from "./utils/requestSkipTurnBoundary";
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

  const handlePauseTimer = (): void => {
    requestPauseTimer(roomSocket, () => {
      roomSocket.emit(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL);
    });
  };

  const handleResumeTimer = (): void => {
    requestResumeTimer(roomSocket, () => {
      roomSocket.emit(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL);
    });
  };

  const handleExtendTimer = (additionalSeconds: number): void => {
    requestExtendTimer(roomSocket, additionalSeconds, () => {
      roomSocket.emit(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL);
    });
  };

  const handleReorderTurnOrder = (teamIds: string[]): void => {
    requestReorderTurnOrder(roomSocket, teamIds, () => {
      roomSocket.emit(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL);
    });
  };

  const handleSkipTurnBoundary = (): void => {
    requestSkipTurnBoundary(roomSocket, () => {
      roomSocket.emit(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL);
    });
  };

  const handleAdjustTeamScore = (teamId: string, delta: number): void => {
    requestAdjustTeamScore(roomSocket, teamId, delta, () => {
      roomSocket.emit(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL);
    });
  };

  const handleResetGame = (): void => {
    requestResetGame(roomSocket, () => {
      roomSocket.emit(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL);
    });
  };

  const handleRedoLastMutation = (): void => {
    requestRedoLastMutation(roomSocket, () => {
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
        onPauseTimer={handlePauseTimer}
        onResumeTimer={handleResumeTimer}
        onExtendTimer={handleExtendTimer}
        onReorderTurnOrder={handleReorderTurnOrder}
        onSkipTurnBoundary={handleSkipTurnBoundary}
        onAdjustTeamScore={handleAdjustTeamScore}
        onResetGame={handleResetGame}
        onRedoLastMutation={handleRedoLastMutation}
      />
    );
  }

  if (route === "DISPLAY") {
    return <DisplayBoard roomState={roomState} />;
  }

  return <RouteNotFound />;
};
