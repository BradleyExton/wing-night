import { type RoomState } from "@wingnight/shared";
import { useMemo } from "react";

import { displayBoardCopy } from "./copy";
import { ContentFatalState } from "../ContentFatalState";
import { StageSurface } from "./StageSurface";
import { StandingsSurface } from "./StandingsSurface";
import { resolveSortedStandings } from "../../utils/resolveSortedStandings";
import * as styles from "./styles";

type DisplayBoardProps = {
  roomState: RoomState | null;
};

export const DisplayBoard = ({ roomState }: DisplayBoardProps): JSX.Element => {
  const fatalError = roomState?.fatalError ?? null;
  const standings = useMemo(() => {
    if (!roomState) {
      return [];
    }

    return resolveSortedStandings(roomState.teams);
  }, [roomState]);

  const phase = roomState?.phase ?? null;
  const roundMetaLabel = roomState
    ? displayBoardCopy.currentRoundLabel(roomState.currentRound, roomState.totalRounds)
    : displayBoardCopy.waitingForStateLabel;

  const phaseLabel =
    phase === null
      ? displayBoardCopy.waitingPhaseLabel
      : displayBoardCopy.phaseLabel(phase);

  if (fatalError !== null) {
    return <ContentFatalState fatalError={fatalError} />;
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTopRow}>
          <p className={styles.roundMeta}>{roundMetaLabel}</p>
          <p className={styles.phaseBadge}>{phaseLabel}</p>
        </div>
        <h1 className={styles.heading}>{displayBoardCopy.title}</h1>
      </header>

      <section className={styles.main}>
        <div className={styles.content}>
          <StageSurface roomState={roomState} phaseLabel={phaseLabel} />
        </div>
      </section>

      <StandingsSurface phase={phase} standings={standings} />
    </main>
  );
};
