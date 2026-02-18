import type { GameConfigRound } from "@wingnight/shared";

import { displayBoardCopy } from "../../copy";
import * as styles from "./styles";

type RoundIntroStageBodyProps = {
  currentRoundConfig: GameConfigRound;
};

export const RoundIntroStageBody = ({
  currentRoundConfig
}: RoundIntroStageBodyProps): JSX.Element => {
  return (
    <>
      <h2 className={styles.title}>
        {displayBoardCopy.roundIntroTitle(
          currentRoundConfig.round,
          currentRoundConfig.label
        )}
      </h2>
      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <p className={styles.metaLabel}>{displayBoardCopy.sauceLabel}</p>
          <p className={styles.metaValue}>{currentRoundConfig.sauce}</p>
        </div>
        <div className={styles.metaItem}>
          <p className={styles.metaLabel}>{displayBoardCopy.minigameLabel}</p>
          <p className={styles.metaValue}>{currentRoundConfig.minigame}</p>
        </div>
      </div>
    </>
  );
};
