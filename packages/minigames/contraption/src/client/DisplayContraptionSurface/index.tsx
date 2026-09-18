import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import type { ContraptionMinigameDisplayView } from "@wingnight/shared";

import { useRunPlayback } from "../useRunPlayback/index.js";
import { ContraptionStage, resolveStageSequence } from "./ContraptionStage/index.js";
import { displayContraptionSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

const ContraptionIntro = (): JSX.Element => {
  return (
    <div className={styles.container}>
      <h2 className={styles.introTitle}>{displayContraptionSurfaceCopy.introTitle}</h2>
      <p className={styles.introDescription}>
        {displayContraptionSurfaceCopy.introDescription}
      </p>
    </div>
  );
};

const VerdictPlaque = ({ view }: { view: ContraptionMinigameDisplayView }): JSX.Element | null => {
  if (view.run === null) {
    return null;
  }

  const landed = view.run.outcome === "landed";
  const bonuses = displayContraptionSurfaceCopy.bonusesClipped(view.run.collectedPickupIds.length);

  return (
    <div className={styles.verdictOverlay} data-contraption-verdict={view.run.outcome}>
      <div className={landed ? styles.verdictPlaqueLanded : styles.verdictPlaqueMissed}>
        <div>
          <p className={styles.verdictLabel}>
            {displayContraptionSurfaceCopy.outcomeLabel[view.run.outcome]}
          </p>
          {bonuses.length > 0 && <p className={styles.verdictMeta}>{bonuses}</p>}
        </div>
        <p className={styles.verdictPoints}>
          {displayContraptionSurfaceCopy.runPoints(view.run.points)}
        </p>
      </div>
    </div>
  );
};

const ContraptionPlayBody = ({
  view,
  elapsedMs
}: {
  view: ContraptionMinigameDisplayView;
  elapsedMs: number;
}): JSX.Element => {
  const sequence = resolveStageSequence(view, elapsedMs);
  const showVerdict = sequence !== null && sequence.stage !== "flight";
  const attemptNumber =
    view.phase === "building" ? view.attemptsUsed + 1 : Math.max(view.attemptsUsed, 1);

  return (
    <div className={styles.stage}>
      <ContraptionStage view={view} elapsedMs={elapsedMs} />
      <div className={styles.chipRow}>
        {view.level !== null && <span className={styles.levelChip}>{view.level.title}</span>}
        <span className={styles.metaChip}>
          {displayContraptionSurfaceCopy.attemptCounter(
            Math.min(attemptNumber, view.attemptsPerTurn),
            view.attemptsPerTurn
          )}
        </span>
        {view.level !== null && (
          <span className={styles.metaChip}>
            {displayContraptionSurfaceCopy.piecesCounter(view.pieces.length, view.level.pieceBudget)}
          </span>
        )}
      </div>
      {view.phase === "building" && (
        <div className={styles.buildingBanner} data-contraption-building>
          <p className={styles.buildingPrompt}>{displayContraptionSurfaceCopy.buildingPrompt}</p>
          <p className={styles.buildingHint}>{displayContraptionSurfaceCopy.buildingHint}</p>
        </div>
      )}
      {showVerdict && <VerdictPlaque view={view} />}
      {view.phase === "done" && sequence !== null && sequence.stage === "held" && (
        <div className={styles.buildingBanner} data-contraption-done>
          <p className={styles.doneTitle}>{displayContraptionSurfaceCopy.donePrompt}</p>
          <p className={styles.buildingHint}>
            {displayContraptionSurfaceCopy.doneHint(view.bestPoints)}
          </p>
        </div>
      )}
    </div>
  );
};

export const DisplayContraptionSurface = ({
  phase,
  minigameDisplayView
}: MinigameDisplayRendererProps): JSX.Element => {
  const view = minigameDisplayView?.minigame === "CONTRAPTION" ? minigameDisplayView : null;
  const elapsedMs = useRunPlayback(view?.run ?? null);

  if (phase !== "play") {
    return <ContraptionIntro />;
  }

  if (view === null) {
    return (
      <div className={styles.container}>
        <p className={styles.hint}>{displayContraptionSurfaceCopy.waitingLabel}</p>
      </div>
    );
  }

  return <ContraptionPlayBody view={view} elapsedMs={elapsedMs} />;
};
