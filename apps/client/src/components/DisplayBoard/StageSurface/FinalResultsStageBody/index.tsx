import { finalResultsStageCopy } from "./copy";
import * as styles from "./styles";

type FinalResultsStageBodyProps = {
  winnerTeamName: string | null;
  winnerScore: number | null;
  teamCount: number;
};

export const FinalResultsStageBody = ({
  winnerTeamName,
  winnerScore,
  teamCount
}: FinalResultsStageBodyProps): JSX.Element => {
  return (
    <div className={styles.root}>
      <h2 className={styles.title}>{finalResultsStageCopy.title}</h2>
      <p className={styles.subtitle}>{finalResultsStageCopy.subtitle}</p>
      <article className={styles.winnerPanel}>
        <p className={styles.winnerLabel}>{finalResultsStageCopy.winnerLabel}</p>
        <p className={styles.winnerName}>
          {winnerTeamName ?? finalResultsStageCopy.noWinnerLabel}
        </p>
        {winnerScore !== null && (
          <p className={styles.winnerScore}>
            {finalResultsStageCopy.scoreLabel(winnerScore)}
          </p>
        )}
      </article>
      <p className={styles.teamsCompeted}>
        {finalResultsStageCopy.teamsCompetedLabel(teamCount)}
      </p>
    </div>
  );
};
