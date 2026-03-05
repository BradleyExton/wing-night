import type { MinigameType } from "@wingnight/shared";

import { minigameIntroStageCopy } from "./copy";
import * as styles from "./styles";

type MinigameIntroStageBodyProps = {
  minigameType: MinigameType | null;
  sauceName: string | null;
  activeTeamName: string | null;
};

export const MinigameIntroStageBody = ({
  minigameType,
  sauceName,
  activeTeamName
}: MinigameIntroStageBodyProps): JSX.Element => {
  const resolvedTeamName = activeTeamName ?? minigameIntroStageCopy.fallbackTeamName;
  const minigameLabel = minigameType ?? minigameIntroStageCopy.fallbackMinigameLabel;
  const resolvedSauceName = sauceName ?? minigameIntroStageCopy.fallbackSauceLabel;
  const rules =
    minigameType === null
      ? minigameIntroStageCopy.fallbackRules
      : minigameIntroStageCopy.rulesByMinigame[minigameType];

  return (
    <div className={styles.root}>
      <div className={styles.heroGrid}>
        <section className={styles.heroCopy}>
          <p className={styles.eyebrow}>{minigameIntroStageCopy.eyebrow}</p>
          <h2 className={styles.title}>{minigameIntroStageCopy.title(resolvedTeamName)}</h2>
          <p className={styles.summary}>{minigameIntroStageCopy.summary}</p>
          <div className={styles.contextGrid}>
            <article className={styles.contextItem}>
              <p className={styles.contextLabel}>{minigameIntroStageCopy.minigameLabel}</p>
              <p className={styles.contextValue}>{minigameLabel}</p>
            </article>
            <article className={styles.contextItem}>
              <p className={styles.contextLabel}>{minigameIntroStageCopy.sauceLabel}</p>
              <p className={styles.contextValue}>{resolvedSauceName}</p>
            </article>
          </div>
          <article className={styles.rulesShell}>
            <p className={styles.rulesTitle}>{minigameIntroStageCopy.rulesTitle}</p>
            <ul className={styles.rulesList}>
              {rules.map((item) => (
                <li key={item} className={styles.rulesItem}>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </section>
        <figure className={styles.heroIllustrationShell}>
          <span className={styles.heroIllustrationGlow} aria-hidden />
          <img
            className={styles.heroIllustration}
            src={minigameIntroStageCopy.heroIllustrationPath}
            alt={minigameIntroStageCopy.heroIllustrationAlt}
          />
        </figure>
      </div>
    </div>
  );
};
