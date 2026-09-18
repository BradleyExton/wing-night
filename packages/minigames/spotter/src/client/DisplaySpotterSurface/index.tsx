import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";

import { SpotterField } from "./SpotterField/index.js";
import { displaySpotterSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

export const DisplaySpotterSurface = ({
  phase,
  minigameDisplayView,
  activeTeamName
}: MinigameDisplayRendererProps): JSX.Element => {
  const spotterDisplayView =
    minigameDisplayView?.minigame === "SPOTTER" ? minigameDisplayView : null;
  const isPlayPhase = phase === "play";
  const isDone = spotterDisplayView?.status === "done";
  const pendingPoints =
    spotterDisplayView !== null && spotterDisplayView.activeTurnTeamId !== null
      ? (spotterDisplayView.pendingPointsByTeamId[spotterDisplayView.activeTurnTeamId] ?? 0)
      : null;

  return (
    <div className={styles.stage}>
      <header className={styles.marquee}>
        <p className={styles.marqueeTeamName}>{activeTeamName ?? ""}</p>
        <span className={styles.marqueeTitle}>{displaySpotterSurfaceCopy.marqueeTitle}</span>
        <div className={styles.marqueeMeta}>
          <span className={styles.marqueePending}>
            {pendingPoints !== null ? displaySpotterSurfaceCopy.pendingChip(pendingPoints) : ""}
          </span>
          {spotterDisplayView !== null && (
            <span className={styles.marqueeProgress}>
              {displaySpotterSurfaceCopy.targetProgress(
                Math.min(spotterDisplayView.targetIndex + 1, spotterDisplayView.targets.length),
                spotterDisplayView.targets.length
              )}
            </span>
          )}
        </div>
      </header>
      <main className={styles.fieldArea}>
        {spotterDisplayView !== null && <SpotterField view={spotterDisplayView} />}
        {!isPlayPhase && (
          <div className={styles.idleOverlay}>
            <p className={styles.idleText}>{displaySpotterSurfaceCopy.introMessage}</p>
          </div>
        )}
      </main>
      {isPlayPhase && spotterDisplayView !== null && (
        <p className={styles.statusLine}>
          {isDone
            ? displaySpotterSurfaceCopy.doneStatus
            : displaySpotterSurfaceCopy.aimingStatus(activeTeamName ?? "")}
        </p>
      )}
    </div>
  );
};
