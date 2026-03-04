import type { RoomState } from "@wingnight/shared";
import { ArrowRight, Flame } from "lucide-react";
import {
  setupRoundEndIllustrationPath,
  setupRoundStartIllustrationPath,
  teamTurnLoopIllustrationPathByStepId
} from "./assetPaths";
import { setupStageCopy } from "./copy";
import { resolveMinigameIconPath } from "../minigameAssets";
import * as styles from "./styles";
type SetupStageBodyProps = {
  gameConfig: RoomState["gameConfig"];
};
const DEFAULT_SETUP_PREVIEW_ROUND_SLOTS = 3;
const resolveSetupPreviewRoundSlotCount = (gameConfig: RoomState["gameConfig"]): number => {
  const configuredPreviewRoundSlots = gameConfig?.setupPreviewRoundSlots;
  if (
    typeof configuredPreviewRoundSlots === "number" &&
    Number.isInteger(configuredPreviewRoundSlots) &&
    configuredPreviewRoundSlots > 0
  ) {
    return configuredPreviewRoundSlots;
  }
  return DEFAULT_SETUP_PREVIEW_ROUND_SLOTS;
};
const hasConfiguredSetupPreviewRoundSlots = (gameConfig: RoomState["gameConfig"]): boolean => {
  return (
    typeof gameConfig?.setupPreviewRoundSlots === "number" &&
    Number.isInteger(gameConfig.setupPreviewRoundSlots) &&
    gameConfig.setupPreviewRoundSlots > 0
  );
};
const IllustrationSparks = (): JSX.Element => (
  <div className={styles.sparkField} data-spark-field aria-hidden>
    <span className={styles.sparkGlow} data-spark-glow />
    <span className={`${styles.spark} ${styles.sparkOne}`} data-spark="one" />
    <span className={`${styles.spark} ${styles.sparkTwo}`} data-spark="two" />
    <span className={`${styles.spark} ${styles.sparkThree}`} data-spark="three" />
    <span className={`${styles.sparkTrail} ${styles.sparkTrailOne}`} data-spark-trail="one" />
    <span className={`${styles.sparkTrail} ${styles.sparkTrailTwo}`} data-spark-trail="two" />
  </div>
);
export const SetupStageBody = ({ gameConfig }: SetupStageBodyProps): JSX.Element => {
  const shouldRenderRoundFillers = hasConfiguredSetupPreviewRoundSlots(gameConfig);
  const previewRoundSlotCount = resolveSetupPreviewRoundSlotCount(gameConfig);
  const configuredRounds = gameConfig?.rounds ?? [];
  const visibleRounds = configuredRounds.slice(0, previewRoundSlotCount);
  const fillerRoundCount = shouldRenderRoundFillers
    ? Math.max(previewRoundSlotCount - visibleRounds.length, 0)
    : 0;
  const hiddenRoundCount = Math.max(configuredRounds.length - visibleRounds.length, 0);
  return (
    <div className={styles.setupRoot}>
      <span className={styles.atmosphereLayer} aria-hidden />
      <header className={styles.setupHeader}>
        <h2 className={styles.setupTitle}>{setupStageCopy.brandLabel}</h2>
      </header>
      <div className={styles.contentGrid}>
        <section className={styles.flowBand}>
          <div className={styles.flowLayout}>
            <article className={styles.flowPhase}>
              <p className={styles.flowStepLabel}>{setupStageCopy.roundStartLabel}</p>
              <div className={styles.flowIllustrationSlot}>
                <IllustrationSparks />
                <img
                  className={styles.flowIllustrationMedia}
                  src={setupRoundStartIllustrationPath}
                  alt={setupStageCopy.flowIllustrationAlt(setupStageCopy.roundStartLabel)}
                />
              </div>
            </article>
            <div className={`${styles.majorArrow} ${styles.majorArrowBeforeLoop}`} aria-hidden>
              <ArrowRight className={styles.majorArrowIcon} strokeWidth={3.25} />
            </div>
            <article className={styles.flowLoopShell}>
              <div className={styles.flowLoopTitleRow}>
                <span className={styles.titleAccentLine} aria-hidden />
                <Flame className={styles.titleAccentIcon} aria-hidden />
                <p className={styles.flowLoopTitle}>{setupStageCopy.teamTurnLoopTitle}</p>
                <Flame
                  className={`${styles.titleAccentIcon} ${styles.titleAccentIconTrailing}`}
                  aria-hidden
                />
                <span className={styles.titleAccentLine} aria-hidden />
                <span className={styles.titleGlow} aria-hidden />
              </div>
              <div className={styles.flowLoopSteps}>
                {setupStageCopy.teamTurnLoopSteps.map((step) => (
                  <div key={step.id} className={styles.flowLoopStepSlot}>
                    <article className={styles.flowPhase}>
                      <p className={styles.flowStepLabel}>{step.label}</p>
                      <div className={styles.flowIllustrationSlot}>
                        <IllustrationSparks />
                        <img
                          className={styles.flowLoopIllustrationMedia}
                          src={teamTurnLoopIllustrationPathByStepId[step.id]}
                          alt={setupStageCopy.flowIllustrationAlt(step.label)}
                        />
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            </article>
            <div className={`${styles.majorArrow} ${styles.majorArrowAfterLoop}`} aria-hidden>
              <ArrowRight className={styles.majorArrowIcon} strokeWidth={3.25} />
            </div>
            <article className={styles.flowPhase}>
              <p className={styles.flowStepLabel}>{setupStageCopy.roundEndLabel}</p>
              <div className={styles.flowIllustrationSlot}>
                <IllustrationSparks />
                <img
                  className={styles.flowRoundResultsIllustrationMedia}
                  src={setupRoundEndIllustrationPath}
                  alt={setupStageCopy.flowIllustrationAlt(setupStageCopy.roundEndLabel)}
                />
              </div>
            </article>
          </div>
        </section>
      </div>
      <div className={styles.sectionDivider} aria-hidden />
      {gameConfig ? (
        <section className={styles.bottomBand}>
          <div className={styles.roundLineupTitleRow}>
            <span className={styles.titleAccentLine} aria-hidden />
            <Flame className={styles.titleAccentIcon} aria-hidden />
            <h3 className={styles.roundLineupTitle}>{setupStageCopy.roundLineupTitle}</h3>
            <Flame
              className={`${styles.titleAccentIcon} ${styles.titleAccentIconTrailing}`}
              aria-hidden
            />
            <span className={styles.titleAccentLine} aria-hidden />
            <span className={styles.titleGlow} aria-hidden />
          </div>
          <p className={styles.roundLineupSubtitle}>{setupStageCopy.teamTurnLoopSubtitle}</p>
          <div className={styles.lineupGrid}>
            {visibleRounds.map((round, index) => (
              <article key={round.round} className={styles.roundCard}>
                <span
                  className={`${styles.roundCardShine} ${
                    styles.roundCardShineTimingByIndex[
                      index % styles.roundCardShineTimingByIndex.length
                    ]
                  }`}
                  aria-hidden
                />
                <span className={styles.roundCardBadge}>{round.round}</span>
                <div className={styles.roundIconSlot}>
                  <img
                    className={styles.roundIconMedia}
                    src={resolveMinigameIconPath(round.minigame)}
                    alt={setupStageCopy.minigameIconAlt(round.minigame)}
                  />
                </div>
                <h4 className={styles.roundCardTitle}>
                  {setupStageCopy.roundTitle(round.round, round.label)}
                </h4>
                <p className={styles.roundMetaLine}>
                  {setupStageCopy.roundSummaryValue(
                    round.sauce,
                    round.minigame,
                    round.pointsPerPlayer
                  )}
                </p>
              </article>
            ))}
            {Array.from({ length: fillerRoundCount }, (_, index) => {
              const previewRoundNumber = visibleRounds.length + index + 1;
              const shineTiming =
                styles.roundCardShineTimingByIndex[
                  previewRoundNumber % styles.roundCardShineTimingByIndex.length
                ];
              return (
                <article
                  key={`round-filler-${previewRoundNumber}`}
                  className={`${styles.roundCard} ${styles.roundCardPlaceholder}`}
                >
                  <span
                    className={`${styles.roundCardShine} ${shineTiming}`}
                    aria-hidden
                  />
                  <span className={styles.roundCardBadge}>{previewRoundNumber}</span>
                  <div className={styles.roundIconSlot}>
                    <Flame className={styles.roundPlaceholderIcon} aria-hidden />
                  </div>
                  <h4 className={styles.roundCardTitle}>
                    {setupStageCopy.placeholderRoundTitle(previewRoundNumber)}
                  </h4>
                  <p className={styles.roundMetaLine}>
                    {setupStageCopy.placeholderRoundSummary}
                  </p>
                </article>
              );
            })}
          </div>
          {hiddenRoundCount > 0 && (
            <p className={styles.extraRoundsLabel}>
              {setupStageCopy.additionalRoundsLabel(hiddenRoundCount)}
            </p>
          )}
        </section>
      ) : (
        <section className={styles.bottomBand}>
          <h3 className={styles.sectionTitle}>{setupStageCopy.expectationTitle}</h3>
          <ul className={styles.expectationList}>
            {setupStageCopy.expectations.map((expectation) => (
              <li key={expectation} className={styles.expectationItem}>
                {expectation}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
