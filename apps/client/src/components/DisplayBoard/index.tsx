import { Phase } from "@wingnight/shared";
import { useMemo } from "react";

import { ContentFatalState } from "../ContentFatalState";
import { GameLockedOverlay } from "./GameLockedOverlay";
import { StageSurface } from "./StageSurface";
import { StandingsSurface } from "./StandingsSurface";
import { useDisplayRoomState } from "../../context/RoomStateContext";
import { resolveSortedStandings } from "../../utils/resolveSortedStandings";
import { useGameStartCountdown } from "./useGameStartCountdown";
import * as styles from "./styles";

export const DisplayBoard = (): JSX.Element => {
  const roomState = useDisplayRoomState();
  const fatalError = roomState?.fatalError ?? null;
  const players = roomState?.players ?? [];
  const standings = useMemo(() => {
    if (!roomState) {
      return [];
    }

    return resolveSortedStandings(roomState.teams);
  }, [roomState]);

  const phase = roomState?.phase ?? null;
  const gameStartCountdownRemainingSeconds = useGameStartCountdown({
    phase,
    currentRound: roomState?.currentRound ?? null
  });
  const shouldShowGameLockedOverlay =
    phase === Phase.INTRO || gameStartCountdownRemainingSeconds !== null;

  if (fatalError !== null) {
    return <ContentFatalState fatalError={fatalError} />;
  }

  return (
    <main className={styles.container}>
      <div className={styles.displayAtmosphere} data-display-atmosphere aria-hidden />
      <section className={styles.main}>
        <div className={styles.content}>
          <div className={styles.stageShell}>
            <StageSurface showSetupPreview={shouldShowGameLockedOverlay} />
          </div>
        </div>
      </section>

      <StandingsSurface phase={phase} standings={standings} players={players} />
      {shouldShowGameLockedOverlay && (
        <GameLockedOverlay remainingSeconds={gameStartCountdownRemainingSeconds} />
      )}
    </main>
  );
};
