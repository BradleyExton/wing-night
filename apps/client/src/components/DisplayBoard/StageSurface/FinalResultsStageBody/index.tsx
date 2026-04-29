import { Trophy } from "lucide-react";

import { finalResultsStageCopy } from "./copy";
import * as styles from "./styles";

type FinalResultsStageBodyProps = {
  winnerTeamName: string | null;
  winnerScore: number | null;
};

export const FinalResultsStageBody = ({
  winnerTeamName,
  winnerScore
}: FinalResultsStageBodyProps): JSX.Element => {
  const resolvedTeamName = winnerTeamName ?? finalResultsStageCopy.noWinnerLabel;

  return (
    <div className={styles.container}>
      <span className={styles.ambient} aria-hidden />
      <span className={`${styles.beatBase} ${styles.beatDelay1} ${styles.gameOver}`}>
        {finalResultsStageCopy.gameOverLabel}
      </span>
      <span className={`${styles.beatBase} ${styles.beatDelay2} ${styles.champion}`}>
        <Trophy className={styles.championIcon} aria-hidden />
        {finalResultsStageCopy.championLabel}
      </span>
      <p className={`${styles.beatBase} ${styles.beatDelay3} ${styles.teamName}`}>
        {resolvedTeamName}
      </p>
      {winnerScore !== null && (
        <p className={`${styles.beatBase} ${styles.beatDelay4} ${styles.score}`}>
          <span className={styles.scoreNum}>{winnerScore}</span>
          <span className={styles.scoreUnit}>{finalResultsStageCopy.pointsUnitLabel}</span>
        </p>
      )}
    </div>
  );
};
