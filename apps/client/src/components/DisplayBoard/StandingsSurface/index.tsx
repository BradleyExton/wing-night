import { Phase, type Team } from "@wingnight/shared";

import { displayBoardCopy } from "../copy";
import * as styles from "./styles";

type StandingsSurfaceProps = {
  phase: Phase | null;
  standings: Team[];
};

export const StandingsSurface = ({ phase, standings }: StandingsSurfaceProps): JSX.Element => {
  const leadingTeamId = standings[0]?.id ?? null;

  return (
    <footer className={styles.footer}>
      <h2 className={styles.heading}>{displayBoardCopy.standingsTitle}</h2>
      {standings.length === 0 && (
        <p className={styles.emptyLabel}>{displayBoardCopy.standingsEmptyLabel}</p>
      )}
      {standings.length > 0 && (
        <ul className={styles.standingsList}>
          {standings.map((team) => {
            const isLeader = leadingTeamId !== null && team.id === leadingTeamId;
            const isFinalResultsLeader = phase === Phase.FINAL_RESULTS && isLeader;
            const standingCardClassName = isFinalResultsLeader
              ? styles.winnerStandingCard
              : isLeader
                ? styles.leadingStandingCard
                : styles.standingCard;

            return (
              <li key={team.id} className={standingCardClassName}>
                <p className={styles.teamName}>{team.name}</p>
                <p className={styles.score}>
                  {displayBoardCopy.standingScoreLabel(team.totalScore)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </footer>
  );
};
