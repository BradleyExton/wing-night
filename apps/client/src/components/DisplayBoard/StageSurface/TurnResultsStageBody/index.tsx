import { Check } from "lucide-react";

import type { TurnTile } from "../resolveStageViewModel";
import { turnResultsStageCopy } from "./copy";
import * as styles from "./styles";

type TurnResultsStageBodyProps = {
  justFinishedTeamName: string | null;
  turnTiles: TurnTile[];
  nextTeamName: string | null;
};

const resolveDotClassName = (status: TurnTile["status"]): string => {
  if (status === "just-done") {
    return `${styles.dotBase} ${styles.dotJustDone}`;
  }
  if (status === "done") {
    return `${styles.dotBase} ${styles.dotDone}`;
  }
  return styles.dotBase;
};

export const TurnResultsStageBody = ({
  justFinishedTeamName,
  turnTiles,
  nextTeamName
}: TurnResultsStageBodyProps): JSX.Element => {
  const resolvedTeamName =
    justFinishedTeamName ?? turnResultsStageCopy.fallbackTeamName;
  const nextLineText =
    nextTeamName !== null
      ? `${turnResultsStageCopy.nextLabelPrefix}${turnResultsStageCopy.nextLabelSeparator} ${nextTeamName}`
      : turnResultsStageCopy.roundWrapLabel;

  return (
    <div className={styles.container}>
      <span className={styles.ambient} aria-hidden />
      <span className={`${styles.beatBase} ${styles.beatDelay1} ${styles.eyebrow}`}>
        <Check className={styles.eyebrowIcon} aria-hidden />
        {turnResultsStageCopy.eyebrow}
      </span>
      <p className={`${styles.beatBase} ${styles.beatDelay2} ${styles.teamName}`}>
        {resolvedTeamName}
        <span className={styles.strikethrough} aria-hidden />
      </p>
      {turnTiles.length > 0 && (
        <span className={`${styles.beatBase} ${styles.beatDelay3} ${styles.dotsRow}`}>
          {turnTiles.map((tile) => (
            <span
              key={tile.teamId}
              className={resolveDotClassName(tile.status)}
              aria-label={tile.teamName}
            />
          ))}
        </span>
      )}
      <p className={`${styles.beatBase} ${styles.beatDelay4} ${styles.next}`}>
        <span className={styles.nextArrow}>→</span>
        {nextLineText}
      </p>
    </div>
  );
};
