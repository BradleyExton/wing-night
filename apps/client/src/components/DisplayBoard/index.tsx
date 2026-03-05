import type { DisplayRoomStateSnapshot } from "@wingnight/shared";
import { useMemo } from "react";

import { ContentFatalState } from "../ContentFatalState";
import { GameStartCountdownOverlay } from "./GameStartCountdownOverlay";
import { StageSurface } from "./StageSurface";
import { StandingsSurface } from "./StandingsSurface";
import { resolveSortedStandings } from "../../utils/resolveSortedStandings";
import { useGameStartCountdown } from "./useGameStartCountdown";
import * as styles from "./styles";

type DisplayBoardProps = {
  roomState: DisplayRoomStateSnapshot | null;
};

export const DisplayBoard = ({ roomState }: DisplayBoardProps): JSX.Element => {
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

  if (fatalError !== null) {
    return <ContentFatalState fatalError={fatalError} />;
  }

  return (
    <main className={styles.container}>
      <div className={styles.displayAtmosphere} data-display-atmosphere aria-hidden />
      <section className={styles.main}>
        <div className={styles.content}>
          <div className={styles.stageShell}>
            <StageSurface roomState={roomState} />
            {gameStartCountdownRemainingSeconds !== null && (
              <GameStartCountdownOverlay
                remainingSeconds={gameStartCountdownRemainingSeconds}
              />
            )}
          </div>
        </div>
      </section>

      <StandingsSurface phase={phase} standings={standings} players={players} />
    </main>
  );
};
