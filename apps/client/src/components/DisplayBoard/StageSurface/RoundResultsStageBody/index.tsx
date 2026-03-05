import { roundResultsStageCopy } from "./copy";
import * as styles from "./styles";

type RoundResultsStageBodyProps = {
  wingPoints: number;
  minigamePoints: number;
  totalRoundPoints: number;
};

export const RoundResultsStageBody = ({
  wingPoints,
  minigamePoints,
  totalRoundPoints
}: RoundResultsStageBodyProps): JSX.Element => {
  return (
    <div className={styles.root}>
      <h2 className={styles.title}>{roundResultsStageCopy.title}</h2>
      <p className={styles.summary}>{roundResultsStageCopy.summary}</p>
      <div className={styles.metricGrid}>
        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>{roundResultsStageCopy.wingPointsLabel}</p>
          <p className={styles.metricValue}>
            {roundResultsStageCopy.pointsValue(wingPoints)}
          </p>
        </article>
        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>{roundResultsStageCopy.minigamePointsLabel}</p>
          <p className={styles.metricValue}>
            {roundResultsStageCopy.pointsValue(minigamePoints)}
          </p>
        </article>
        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>{roundResultsStageCopy.roundPointsLabel}</p>
          <p className={styles.metricValue}>
            {roundResultsStageCopy.pointsValue(totalRoundPoints)}
          </p>
        </article>
      </div>
    </div>
  );
};
