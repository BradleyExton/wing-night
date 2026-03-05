import { turnResultsStageCopy } from "./copy";
import * as styles from "./styles";

type TurnResultsStageBodyProps = {
  activeTeamName: string | null;
  completedTurnCount: number;
  totalTurnCount: number;
  hasNextTurn: boolean;
};

export const TurnResultsStageBody = ({
  activeTeamName,
  completedTurnCount,
  totalTurnCount,
  hasNextTurn
}: TurnResultsStageBodyProps): JSX.Element => {
  const safeTotalTurnCount = Math.max(totalTurnCount, 1);

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>{turnResultsStageCopy.title}</h2>
      <p className={styles.summary}>{turnResultsStageCopy.summary}</p>
      <div className={styles.contextGrid}>
        <article className={styles.contextItem}>
          <p className={styles.contextLabel}>{turnResultsStageCopy.activeTeamLabel}</p>
          <p className={styles.contextValue}>
            {activeTeamName ?? turnResultsStageCopy.noActiveTeamLabel}
          </p>
        </article>
        <article className={styles.contextItem}>
          <p className={styles.contextLabel}>{turnResultsStageCopy.turnProgressLabel}</p>
          <p className={styles.contextValue}>
            {turnResultsStageCopy.turnProgressValue(
              completedTurnCount,
              safeTotalTurnCount
            )}
          </p>
        </article>
        <article className={styles.contextItem}>
          <p className={styles.contextLabel}>{turnResultsStageCopy.nextStepLabel}</p>
          <p className={styles.contextValue}>
            {hasNextTurn
              ? turnResultsStageCopy.nextTeamStepValue
              : turnResultsStageCopy.roundWrapStepValue}
          </p>
        </article>
      </div>
    </div>
  );
};
