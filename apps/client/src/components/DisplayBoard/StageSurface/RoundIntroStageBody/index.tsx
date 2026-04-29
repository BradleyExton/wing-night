import type { GameConfigRound } from "@wingnight/shared";

import { roundIntroStageCopy } from "./copy";
import * as styles from "./styles";

type RoundIntroStageBodyProps = {
  currentRoundConfig: GameConfigRound;
};

export const RoundIntroStageBody = ({
  currentRoundConfig
}: RoundIntroStageBodyProps): JSX.Element => {
  return (
    <div className={styles.container}>
      <span className={styles.ambient} aria-hidden />
      <span className={`${styles.beatBase} ${styles.beatDelay1} ${styles.eyebrow}`}>
        {roundIntroStageCopy.eyebrow}
      </span>
      <p className={`${styles.beatBase} ${styles.beatDelay2} ${styles.round}`}>
        <span className={styles.roundNum}>
          {roundIntroStageCopy.formatRoundNumber(currentRoundConfig.round)}
        </span>
        {currentRoundConfig.label}
      </p>
      <p className={`${styles.beatBase} ${styles.beatDelay3} ${styles.sauce}`}>
        {currentRoundConfig.sauce}
      </p>
      <p className={`${styles.beatBase} ${styles.beatDelay4} ${styles.minigame}`}>
        <span className={styles.minigameLabel}>{roundIntroStageCopy.followedByLabel}</span>
        {currentRoundConfig.minigame}
      </p>
    </div>
  );
};
