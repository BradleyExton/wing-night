import type { DisplayRoomStateSnapshot } from "@wingnight/shared";
import { useMemo } from "react";

import { ContentFatalState } from "../ContentFatalState";
import { GameStartCountdownOverlay } from "./GameStartCountdownOverlay";
import { StageSurface } from "./StageSurface";
import { resolveStageViewModel } from "./StageSurface/resolveStageViewModel";
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
  const stageViewModel = resolveStageViewModel(roomState);
  const shouldRenderSetupAtmosphere =
    stageViewModel.stageMode === "setup" || stageViewModel.stageMode === "setup_locked";

  if (fatalError !== null) {
    return <ContentFatalState fatalError={fatalError} />;
  }

  return (
    <main className={styles.container}>
      {shouldRenderSetupAtmosphere && <div className={styles.setupAtmosphere} aria-hidden />}
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
