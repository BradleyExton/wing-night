import { Fragment } from "react";
import type { MinigameType } from "@wingnight/shared";

import { minigameIntroStageCopy } from "./copy";
import * as styles from "./styles";

type MinigameIntroStageBodyProps = {
  activeTeamName: string | null;
  activeTeamGenre: string | null;
  activeTeamPlayerNames: string[];
  minigameType: MinigameType | null;
};

export const MinigameIntroStageBody = ({
  activeTeamName,
  activeTeamGenre,
  activeTeamPlayerNames,
  minigameType
}: MinigameIntroStageBodyProps): JSX.Element => {
  const resolvedTeamName = activeTeamName ?? minigameIntroStageCopy.fallbackTeamName;
  const resolvedMinigameLabel = minigameType ?? minigameIntroStageCopy.fallbackMinigameLabel;

  return (
    <div className={styles.container}>
      <span className={styles.ambient} aria-hidden />
      {/* The genre rides the eyebrow rather than taking a line of its own: it is
          the label for the anthem already playing under this screen, not a
          headline. A team with no genre renders exactly what it did before. */}
      <span className={`${styles.beatBase} ${styles.beatDelay1} ${styles.eyebrow}`}>
        {minigameIntroStageCopy.eyebrow}
        {activeTeamGenre !== null && (
          <>
            <span className={styles.eyebrowSeparator} aria-hidden>
              {minigameIntroStageCopy.rosterSeparator}
            </span>
            <span className={styles.genre}>{activeTeamGenre}</span>
          </>
        )}
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
