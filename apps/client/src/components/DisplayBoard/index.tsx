import { type RoomState } from "@wingnight/shared";
import { useMemo } from "react";

import { displayBoardCopy } from "./copy";
import { StageSurface } from "./StageSurface";
import { StandingsSurface } from "./StandingsSurface";
import * as styles from "./styles";

type DisplayBoardProps = {
  roomState: RoomState | null;
};

export const DisplayBoard = ({ roomState }: DisplayBoardProps): JSX.Element => {
  const standings = useMemo(() => {
    if (!roomState) {
      return [];
    }

    return [...roomState.teams].sort((firstTeam, secondTeam) => {
      if (firstTeam.totalScore === secondTeam.totalScore) {
        return firstTeam.name.localeCompare(secondTeam.name);
      }

      return secondTeam.totalScore - firstTeam.totalScore;
    });
  }, [roomState]);

  const phase = roomState?.phase ?? null;
  const roundMetaLabel = roomState
    ? displayBoardCopy.currentRoundLabel(roomState.currentRound, roomState.totalRounds)
    : displayBoardCopy.waitingForStateLabel;

  const phaseLabel =
    phase === null
      ? displayBoardCopy.waitingPhaseLabel
      : displayBoardCopy.phaseLabel(phase);

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
