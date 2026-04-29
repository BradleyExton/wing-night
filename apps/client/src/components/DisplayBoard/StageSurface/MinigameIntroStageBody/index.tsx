import { Fragment } from "react";
import type { MinigameType } from "@wingnight/shared";

import { minigameIntroStageCopy } from "./copy";
import * as styles from "./styles";

type MinigameIntroStageBodyProps = {
  activeTeamName: string | null;
  activeTeamPlayerNames: string[];
  minigameType: MinigameType | null;
};

export const MinigameIntroStageBody = ({
  activeTeamName,
  activeTeamPlayerNames,
  minigameType
}: MinigameIntroStageBodyProps): JSX.Element => {
  const resolvedTeamName = activeTeamName ?? minigameIntroStageCopy.fallbackTeamName;
  const resolvedMinigameLabel = minigameType ?? minigameIntroStageCopy.fallbackMinigameLabel;

  return (
    <div className={styles.container}>
      <span className={styles.ambient} aria-hidden />
      <span className={`${styles.beatBase} ${styles.beatDelay1} ${styles.eyebrow}`}>
        {minigameIntroStageCopy.eyebrow}
      </span>
      <p className={`${styles.beatBase} ${styles.beatDelay2} ${styles.teamName}`}>
        {resolvedTeamName}
      </p>
      {activeTeamPlayerNames.length > 0 && (
        <p className={`${styles.beatBase} ${styles.beatDelay3} ${styles.rosterLine}`}>
          {activeTeamPlayerNames.map((playerName, index) => (
            <Fragment key={`${playerName}-${index}`}>
              {index > 0 && (
                <span className={styles.rosterSeparator} aria-hidden>
                  {minigameIntroStageCopy.rosterSeparator}
                </span>
              )}
              {playerName}
            </Fragment>
          ))}
        </p>
      )}
      <p className={`${styles.beatBase} ${styles.beatDelay4} ${styles.post}`}>
        <span className={styles.postLabel}>{minigameIntroStageCopy.playingLabel}</span>
        {resolvedMinigameLabel}
      </p>
    </div>
  );
};
