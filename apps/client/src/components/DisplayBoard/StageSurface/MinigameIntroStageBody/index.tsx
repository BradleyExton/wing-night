import type { MinigameBriefingContent } from "../../../../copy/minigameBriefings";
import { Flame } from "lucide-react";
import { resolveTeamColorVariant } from "../../../../utils/resolveTeamColorVariant";

import { minigameIntroStageCopy } from "./copy";
import * as styles from "./styles";

type MinigameIntroStageBodyProps = {
  phaseLabel: string;
  briefingContent: MinigameBriefingContent | null;
  sauceName: string | null;
  activeTeamId: string | null;
  activeTeamName: string | null;
  activeTeamPlayerNames: string[];
};

export const MinigameIntroStageBody = ({
  phaseLabel,
  briefingContent,
  sauceName,
  activeTeamId,
  activeTeamName,
  activeTeamPlayerNames
}: MinigameIntroStageBodyProps): JSX.Element => {
  const resolvedTeamName = activeTeamName ?? minigameIntroStageCopy.fallbackTeamName;
  const resolvedBriefingContent =
    briefingContent ?? minigameIntroStageCopy.fallbackBriefingContent;
  const resolvedSauceName = sauceName ?? minigameIntroStageCopy.fallbackSauceLabel;
  const teamColorVariant =
    activeTeamId === null ? null : resolveTeamColorVariant(activeTeamId);
  const teamHeroClassName =
    teamColorVariant === null
      ? styles.teamHero
      : `${styles.teamHero} ${teamColorVariant.borderAccentClassName}`;
  const arrivalSignalClassName =
    teamColorVariant === null
      ? styles.arrivalSignalDot
      : `${styles.arrivalSignalDot} ${teamColorVariant.dotAccentClassName}`;

  return (
    <div className={styles.root}>
      <span className={styles.backdropGlowPrimary} aria-hidden />
      <span className={styles.backdropGlowHeat} aria-hidden />
      <div className={styles.heroGrid}>
        <section className={styles.heroCopy}>
          <div className={styles.titleRow}>
            <span className={styles.titleLine} aria-hidden />
            <div className={styles.arrivalSignal}>
              <span className={arrivalSignalClassName} aria-hidden />
              <p className={styles.arrivalSignalLabel}>
                {minigameIntroStageCopy.calloutLabel}
              </p>
            </div>
            <span className={styles.titleLine} aria-hidden />
          </div>
          <div className={teamHeroClassName}>
            <p className={styles.phaseLabel}>{phaseLabel}</p>
            <h2 className={styles.teamName}>{minigameIntroStageCopy.title(resolvedTeamName)}</h2>
            <p className={styles.arrivalTitle}>{minigameIntroStageCopy.arrivalTitle}</p>
            <p className={styles.arrivalSummary}>{minigameIntroStageCopy.arrivalSummary}</p>
          </div>
          <div className={styles.contextRail}>
            <article className={styles.contextItem}>
              <p className={styles.contextLabel}>{minigameIntroStageCopy.minigameLabel}</p>
              <p className={styles.contextValue}>
                {resolvedBriefingContent.displayName ?? minigameIntroStageCopy.fallbackMinigameLabel}
              </p>
            </article>
            <span className={styles.contextDivider} aria-hidden />
            <article className={styles.contextItem}>
              <p className={styles.contextLabel}>{minigameIntroStageCopy.sauceLabel}</p>
              <p className={styles.contextValue}>{resolvedSauceName}</p>
            </article>
          </div>
          <article className={styles.rosterBand}>
            <p className={styles.rosterTitle}>{minigameIntroStageCopy.rosterLabel}</p>
            {activeTeamPlayerNames.length > 0 ? (
              <div className={styles.rosterList}>
                {activeTeamPlayerNames.map((playerName) => (
                  <span key={playerName} className={styles.rosterPill}>
                    {playerName}
                  </span>
                ))}
              </div>
            ) : (
              <p className={styles.rosterEmpty}>{minigameIntroStageCopy.emptyRosterLabel}</p>
            )}
          </article>
        </section>
        <section className={styles.briefingStage}>
          <figure className={styles.heroIllustrationShell}>
            <span className={styles.heroIllustrationGlow} aria-hidden />
            <img
              className={styles.heroIllustration}
              src={resolvedBriefingContent.illustrationPath}
              alt={resolvedBriefingContent.illustrationAlt}
            />
          </figure>
          <div className={styles.briefingBody}>
            <div className={styles.summaryBlock}>
              <p className={styles.summary}>{resolvedBriefingContent.summary}</p>
            </div>
            <article className={styles.rulesBand}>
              <div className={styles.rulesHeader}>
                <span className={styles.titleLine} aria-hidden />
                <Flame className={styles.rulesIcon} aria-hidden />
                <p className={styles.rulesTitle}>{minigameIntroStageCopy.rulesTitle}</p>
                <Flame className={`${styles.rulesIcon} ${styles.rulesIconTrailing}`} aria-hidden />
                <span className={styles.titleLine} aria-hidden />
              </div>
              <ul className={styles.rulesList}>
                {resolvedBriefingContent.steps.map((item, index) => (
                  <li key={item} className={styles.rulesItem}>
                    <span className={styles.ruleStep}>{index + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
};
