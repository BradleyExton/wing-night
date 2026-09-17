import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import type { JoustMinigameDisplayView, JoustShotResult } from "@wingnight/shared";

import { JoustArenaScene } from "../JoustArenaScene/index.js";
import { resolveHitZoneCopy } from "../hitZoneCopy/index.js";
import { isReplayFinished, resolveSceneFrame } from "../resolveSceneFrame/index.js";
import { useShotReplay } from "../useShotReplay/index.js";
import { displayJoustSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

const aimMagnitude = (aim: { x: number; y: number }): number => {
  return Math.sqrt(aim.x * aim.x + aim.y * aim.y);
};

const JoustIntro = (): JSX.Element => {
  return (
    <div className={styles.container}>
      <h2 className={styles.introTitle}>{displayJoustSurfaceCopy.introTitle}</h2>
      <p className={styles.introDescription}>{displayJoustSurfaceCopy.introDescription}</p>
    </div>
  );
};

const ResultPlaque = ({ shot }: { shot: JoustShotResult }): JSX.Element => {
  const zoneCopy = resolveHitZoneCopy(shot.hitZone);
  const isHit = shot.hitZone !== null;

  return (
    <div className={styles.resultOverlay} data-joust-result>
      <div className={`${styles.resultPlaque}${isHit ? "" : ` ${styles.resultPlaqueMiss}`}`}>
        <div>
          <p className={`${styles.resultTitle}${isHit ? "" : ` ${styles.resultTitleMiss}`}`}>
            {zoneCopy.title}
          </p>
          <p className={styles.resultBlurb}>{zoneCopy.blurb}</p>
        </div>
        {isHit && (
          <span className={styles.resultPoints}>
            {displayJoustSurfaceCopy.resultPoints(shot.points)}
          </span>
        )}
      </div>
    </div>
  );
};

const resolveStatusLine = (view: JoustMinigameDisplayView, replayFinished: boolean): string => {
  if (view.phase === "done") {
    return displayJoustSurfaceCopy.donePrompt;
  }

  if (view.lastShot !== null) {
    return replayFinished
      ? resolveHitZoneCopy(view.lastShot.hitZone).title
      : displayJoustSurfaceCopy.flyingPrompt;
  }

  return aimMagnitude(view.aim) > 0.05
    ? displayJoustSurfaceCopy.aimingDrawnPrompt
    : displayJoustSurfaceCopy.aimingPrompt;
};

const JoustPlayBody = ({
  view,
  activeTeamName
}: {
  view: JoustMinigameDisplayView;
  activeTeamName: string | null;
}): JSX.Element => {
  const replayIndex = useShotReplay(view.lastShot);
  const replayFinished = isReplayFinished(view.lastShot, replayIndex);
  const pendingPoints =
    view.activeTurnTeamId === null ? 0 : (view.pendingPointsByTeamId[view.activeTurnTeamId] ?? 0);
  const arena = view.arena;
  const scene = arena === null ? null : resolveSceneFrame(arena, view.aim, view.lastShot, replayIndex);

  return (
    <div className={styles.stage}>
      <header className={styles.marquee}>
        <h2 className={styles.marqueeTeamName}>{activeTeamName ?? ""}</h2>
        <span className={styles.marqueeTitle}>{displayJoustSurfaceCopy.title}</span>
        <div className={styles.marqueeMeta}>
          <span className={styles.marqueeShot}>
            {displayJoustSurfaceCopy.shotCounter(view.shotIndex + 1, view.shotsPerTurn)}
          </span>
          <span className={styles.marqueePending}>
            {displayJoustSurfaceCopy.pendingPoints(pendingPoints)}
          </span>
        </div>
      </header>
      <div className={styles.arenaArea}>
        {arena === null || scene === null ? (
          <div className={styles.container}>
            <p className={styles.hint}>{displayJoustSurfaceCopy.noArenaLabel}</p>
          </div>
        ) : (
          <>
            <JoustArenaScene
              arena={arena}
              frame={scene.frame}
              isAiming={view.lastShot === null}
              impactBodyIndex={scene.impactBodyIndex}
              sceneId="display-joust"
              label={displayJoustSurfaceCopy.sceneLabel(arena.name)}
            />
            {view.lastShot !== null && replayFinished && <ResultPlaque shot={view.lastShot} />}
          </>
        )}
      </div>
      <p className={styles.statusLine}>{resolveStatusLine(view, replayFinished)}</p>
    </div>
  );
};

export const DisplayJoustSurface = ({
  phase,
  minigameDisplayView,
  activeTeamName
}: MinigameDisplayRendererProps): JSX.Element => {
  const joustView = minigameDisplayView?.minigame === "JOUST" ? minigameDisplayView : null;

  if (phase !== "play") {
    return <JoustIntro />;
  }

  if (joustView === null) {
    return (
      <div className={styles.container}>
        <p className={styles.hint}>{displayJoustSurfaceCopy.waitingLabel}</p>
      </div>
    );
  }

  return <JoustPlayBody view={joustView} activeTeamName={activeTeamName} />;
};
