import type { RoomState } from "@wingnight/shared";

import {
  flowIllustrationPathByStepId,
  setupHeroIllustrationPath,
  setupTextureIllustrationPath
} from "./assetPaths";
import { setupStageCopy } from "./copy";
import { resolveMinigameIconPath } from "../minigameAssets";
import * as styles from "./styles";

type SetupStageBodyProps = {
  gameConfig: RoomState["gameConfig"];
  teamCount: number;
  playerCount: number;
  canAdvancePhase: boolean | null;
};

export const SetupStageBody = ({
  gameConfig,
  teamCount,
  playerCount,
  canAdvancePhase
}: SetupStageBodyProps): JSX.Element => {
  const setupStatusLabel = canAdvancePhase
    ? setupStageCopy.setupReadyLabel
    : setupStageCopy.setupInProgressLabel;

  const packChipLabel = gameConfig
    ? setupStageCopy.packChipLabel(gameConfig.name)
    : setupStageCopy.packUnavailableChipLabel;
  const visibleRounds = gameConfig?.rounds.slice(0, 3) ?? [];
  const hiddenRoundCount = Math.max((gameConfig?.rounds.length ?? 0) - visibleRounds.length, 0);

  return (
    <div className={styles.setupRoot}>
      <header>
        <h2 className={styles.setupTitle}>{setupStageCopy.title}</h2>
        <p className={styles.setupSubtitle}>{setupStageCopy.subtitle}</p>
      </header>

      <section className={styles.setupStatusBand}>
        <h3 className={styles.sectionTitle}>{setupStageCopy.setupStatusTitle}</h3>
        <div className={styles.statusChipRow}>
          <p className={styles.primaryStatusChip}>{setupStatusLabel}</p>
          <p className={styles.statusChip}>{setupStageCopy.teamCountChipLabel(teamCount)}</p>
          <p className={styles.statusChip}>{setupStageCopy.playerCountChipLabel(playerCount)}</p>
          <p className={styles.statusChip}>{packChipLabel}</p>
          <p className={styles.statusChip}>
            {setupStageCopy.roundsChipLabel(gameConfig?.rounds.length ?? 0)}
          </p>
        </div>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.heroBand}>
          <div className={styles.heroIllustrationSlot}>
            <img
              className={styles.heroIllustrationMedia}
              src={setupHeroIllustrationPath}
              alt={setupStageCopy.heroIllustrationAlt}
            />
          </div>
          <div className={styles.textureSlot}>
            <img
              className={styles.textureIllustrationMedia}
              src={setupTextureIllustrationPath}
              alt={setupStageCopy.textureIllustrationAlt}
            />
          </div>
        </section>

        <section className={styles.flowBand}>
          <h3 className={styles.sectionTitle}>{setupStageCopy.roundFlowTitle}</h3>
          <div className={styles.flowGrid}>
            {setupStageCopy.roundFlowSteps.map((step) => (
              <article key={step.id} className={styles.flowCard}>
                <div className={styles.flowIllustrationSlot}>
                  <img
                    className={styles.flowIllustrationMedia}
                    src={flowIllustrationPathByStepId[step.id]}
                    alt={setupStageCopy.flowIllustrationAlt(step.label)}
                  />
                </div>
                <p className={styles.flowStepLabel}>{step.label}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      {gameConfig ? (
        <section className={styles.bottomBand}>
          <h3 className={styles.sectionTitle}>{setupStageCopy.roundLineupTitle}</h3>
          <div className={styles.lineupGrid}>
            {visibleRounds.map((round) => (
              <article key={round.round} className={styles.roundCard}>
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
