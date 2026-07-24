import { Swords, Trophy } from "lucide-react";

import { finalResultsStageCopy } from "./copy";
import * as styles from "./styles";

type FinalResultsStageBodyProps = {
  winnerTeamNames: string[];
  winnerScore: number | null;
};

export const FinalResultsStageBody = ({
  winnerTeamNames,
  winnerScore
}: FinalResultsStageBodyProps): JSX.Element => {
  const isTie = winnerTeamNames.length > 1;
  const resolvedTeamName =
    winnerTeamNames.length === 0
      ? finalResultsStageCopy.noWinnerLabel
      : winnerTeamNames.join(finalResultsStageCopy.tieNameJoiner);
  const OutcomeIcon = isTie ? Swords : Trophy;

  return (
    <div className={styles.container}>
      <span className={styles.ambient} aria-hidden />
      <span className={`${styles.beatBase} ${styles.beatDelay1} ${styles.gameOver}`}>
        {finalResultsStageCopy.gameOverLabel}
      </span>
      <span
        className={`${styles.beatBase} ${styles.beatDelay2} ${isTie ? styles.tie : styles.champion}`}
      >
        <OutcomeIcon
          className={isTie ? styles.tieIcon : styles.championIcon}
          aria-hidden
        />
        {isTie ? finalResultsStageCopy.tieLabel : finalResultsStageCopy.championLabel}
      </span>
      <p
        className={`${styles.beatBase} ${styles.beatDelay3} ${isTie ? styles.tiedTeamNames : styles.teamName}`}
      >
        {resolvedTeamName}
      </p>
      {winnerScore !== null && (
        <p className={`${styles.beatBase} ${styles.beatDelay4} ${styles.score}`}>
          <span className={styles.scoreNum}>{winnerScore}</span>
          <span className={styles.scoreUnit}>{finalResultsStageCopy.pointsUnitLabel}</span>
        </p>
      )}
      {isTie && (
        <p className={`${styles.beatBase} ${styles.beatDelay4} ${styles.tieHint}`}>
          {finalResultsStageCopy.tieHintLabel}
        </p>
      )}
    </div>
  );
};
