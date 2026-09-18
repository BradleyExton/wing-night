import { Swords, Trophy } from "lucide-react";
import type { TeamTheme } from "@wingnight/shared";

import { TeamAmbient } from "../../../TeamAmbient";
import { TeamWordmark } from "../../../TeamWordmark";
import { finalResultsStageCopy } from "./copy";
import * as styles from "./styles";

type FinalResultsStageBodyProps = {
  winnerTeamNames: string[];
  winnerScore: number | null;
  // The single champion's kit; null for a tie, which stays heat and text.
  winnerTheme: TeamTheme | null;
};

export const FinalResultsStageBody = ({
  winnerTeamNames,
  winnerScore,
  winnerTheme
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
      {!isTie && winnerTheme !== null && <TeamAmbient theme={winnerTheme} />}
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
        {/* Gold stays the winner colour (DESIGN.md §0.1): the champion keeps
            the genre face and drops the treatment. */}
        {!isTie && winnerTheme !== null ? (
          <TeamWordmark
            name={resolvedTeamName}
            theme={winnerTheme}
            sizeClassName={styles.teamWordmark}
            winner
          />
        ) : (
          resolvedTeamName
        )}
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
