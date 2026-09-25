import { Check } from "lucide-react";
import type { TeamTheme } from "@wingnight/shared";

import { TeamAmbient } from "../../../TeamAmbient";
import { TeamWordmark } from "../../../TeamWordmark";
import type { TurnTile } from "../resolveStageViewModel";
import { turnResultsStageCopy } from "./copy";
import * as styles from "./styles";

type TurnResultsStageBodyProps = {
  justFinishedTeamName: string | null;
  justFinishedTeamTheme: TeamTheme | null;
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
  justFinishedTeamTheme,
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
      {/* Half strength: the team is what just happened, not the headline. */}
      {justFinishedTeamTheme !== null && (
        <TeamAmbient theme={justFinishedTeamTheme} strength="half" />
      )}
      <span className={`${styles.beatBase} ${styles.beatDelay1} ${styles.eyebrow}`}>
        <Check className={styles.eyebrowIcon} aria-hidden />
        {turnResultsStageCopy.eyebrow}
      </span>
      <p className={`${styles.beatBase} ${styles.beatDelay2} ${styles.teamName}`}>
        <span className={styles.struck}>
          {justFinishedTeamTheme !== null ? (
            <TeamWordmark
              name={resolvedTeamName}
              theme={justFinishedTeamTheme}
              sizeClassName={styles.teamWordmark}
            />
          ) : (
            resolvedTeamName
          )}
        </span>
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
        <span className={styles.nextArrow}>
          {turnResultsStageCopy.nextArrowGlyph}
        </span>
        {nextLineText}
      </p>
    </div>
  );
};
