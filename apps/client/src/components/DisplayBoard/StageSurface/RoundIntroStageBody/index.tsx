import type { GameConfigRound } from "@wingnight/shared";
import { Flame } from "lucide-react";

import { roundIntroStageCopy } from "./copy";
import * as styles from "./styles";

type RoundIntroStageBodyProps = {
  currentRoundConfig: GameConfigRound;
};

const IllustrationSparks = (): JSX.Element => (
  <div className={styles.sparkField} aria-hidden>
    <span className={styles.sparkGlow} />
    <span className={`${styles.spark} ${styles.sparkOne}`} />
    <span className={`${styles.spark} ${styles.sparkTwo}`} />
    <span className={`${styles.sparkTrail} ${styles.sparkTrailOne}`} />
    <span className={`${styles.sparkTrail} ${styles.sparkTrailTwo}`} />
  </div>
);

export const RoundIntroStageBody = ({
  currentRoundConfig
}: RoundIntroStageBodyProps): JSX.Element => {
  return (
    <div className={styles.root}>
      <span className={styles.atmosphereLayer} aria-hidden />
      <div className={styles.heroGrid}>
        <section className={styles.heroCopy}>
          <div className={styles.titleRow}>
            <span className={styles.titleLine} aria-hidden />
            <Flame className={styles.titleIcon} aria-hidden />
            <p className={styles.eyebrow}>{roundIntroStageCopy.phaseEyebrow}</p>
            <Flame className={`${styles.titleIcon} ${styles.titleIconTrailing}`} aria-hidden />
            <span className={styles.titleLine} aria-hidden />
          </div>
          <h2 className={styles.title}>
            {roundIntroStageCopy.headline(
              currentRoundConfig.round,
              currentRoundConfig.label
            )}
          </h2>
          <p className={styles.summary}>{roundIntroStageCopy.summary}</p>
          <div className={styles.metaRail}>
            <article className={styles.metaItem}>
              <p className={styles.metaLabel}>{roundIntroStageCopy.sauceLabel}</p>
              <p className={styles.metaValue}>{currentRoundConfig.sauce}</p>
            </article>
            <span className={styles.metaDivider} aria-hidden />
            <article className={styles.metaItem}>
              <p className={styles.metaLabel}>{roundIntroStageCopy.minigameLabel}</p>
              <p className={styles.metaValue}>{currentRoundConfig.minigame}</p>
            </article>
          </div>
        </section>
        <figure className={styles.heroIllustrationShell}>
          <span className={styles.heroIllustrationGlow} aria-hidden />
          <IllustrationSparks />
          <img
            className={styles.heroIllustration}
            src={roundIntroStageCopy.heroIllustrationPath}
            alt={roundIntroStageCopy.heroIllustrationAlt}
          />
        </figure>
      </div>
    </div>
  );
};
