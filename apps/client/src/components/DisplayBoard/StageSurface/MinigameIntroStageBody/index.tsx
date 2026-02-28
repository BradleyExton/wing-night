import { type MinigameIntroMetadata } from "@wingnight/minigames-core";
import type { MinigameType, RoomState } from "@wingnight/shared";

import { displayBoardCopy } from "../../copy";
import { TurnMeta } from "../TurnMeta";
import { resolveMinigameIconPathFromKey } from "../minigameAssets";
import { minigameIntroStageCopy } from "./copy";
import * as styles from "./styles";

type MinigameIntroStageBodyProps = {
  phaseLabel: string;
  minigameType: MinigameType | null;
  minigameIntroMetadata: MinigameIntroMetadata | null;
  currentRoundConfig: RoomState["currentRoundConfig"];
  shouldRenderTeamTurnContext: boolean;
  activeTeamName: string | null;
};

export const MinigameIntroStageBody = ({
  phaseLabel,
  minigameType,
  minigameIntroMetadata,
  currentRoundConfig,
  shouldRenderTeamTurnContext,
  activeTeamName
}: MinigameIntroStageBodyProps): JSX.Element => {
  if (minigameType === null || minigameIntroMetadata === null) {
    return (
      <>
        <h2 className={styles.title}>{displayBoardCopy.phaseContextTitle(phaseLabel)}</h2>
        <p className={styles.sectionText}>
          {minigameType === null
            ? displayBoardCopy.roundFallbackLabel
            : minigameIntroStageCopy.fallbackDescription(minigameType)}
        </p>
      </>
    );
  }

  const iconPath = resolveMinigameIconPathFromKey(
    minigameIntroMetadata.iconKey,
    minigameType
  );

  return (
    <div className={styles.root}>
      <section className={styles.topRow}>
        <div className={styles.iconWrap}>
          <img
            className={styles.icon}
            src={iconPath}
            alt={minigameIntroStageCopy.iconAlt(minigameIntroMetadata.displayName)}
          />
        </div>
        <div>
          <h2 className={styles.title}>
            {minigameIntroStageCopy.title(minigameIntroMetadata.displayName)}
          </h2>
          <p className={styles.tagline}>{minigameIntroMetadata.shortTagline}</p>
          <div className={styles.metaRow}>
            <p className={styles.metaChip}>
              {minigameIntroStageCopy.sauceChip(
                currentRoundConfig?.sauce ?? displayBoardCopy.roundFallbackLabel
              )}
            </p>
            <p className={styles.metaChip}>
              {minigameIntroStageCopy.minigameChip(minigameType)}
            </p>
          </div>
        </div>
      </section>

      {shouldRenderTeamTurnContext && activeTeamName !== null && (
        <TurnMeta activeTeamName={activeTeamName} />
      )}

      <section className={styles.bodyGrid}>
        <div className={styles.section}>
          <p className={styles.sectionLabel}>{minigameIntroStageCopy.objectiveLabel}</p>
          <p className={styles.sectionText}>{minigameIntroMetadata.objective}</p>
        </div>
        <div className={styles.section}>
          <p className={styles.sectionLabel}>{minigameIntroStageCopy.howToPlayLabel}</p>
          <ol className={styles.howToList}>
            {minigameIntroMetadata.howToPlay.map((instruction) => (
              <li key={instruction} className={styles.howToItem}>
                {instruction}
              </li>
            ))}
          </ol>
        </div>
        <div className={styles.section}>
          <p className={styles.sectionLabel}>{minigameIntroStageCopy.winConditionLabel}</p>
          <p className={styles.sectionText}>{minigameIntroMetadata.winCondition}</p>
        </div>
        <div className={styles.section}>
          <p className={styles.sectionLabel}>{minigameIntroStageCopy.quickTipLabel}</p>
          <p className={styles.sectionText}>{minigameIntroMetadata.quickTip}</p>
        </div>
      </section>
    </div>
  );
};
