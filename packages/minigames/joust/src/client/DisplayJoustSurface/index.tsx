import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import type { JoustMinigameDisplayView, JoustMinigameShot } from "@wingnight/shared";

import { JoustArenaScene } from "../JoustArenaScene/index.js";
import { isReplayFinished, resolveJoustScene } from "../resolveJoustScene/index.js";
import { resolveShotCopy } from "../shotResultCopy/index.js";
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

const ResultPlaque = ({
  shot,
  nameByPlayerId
}: {
  shot: JoustMinigameShot;
  nameByPlayerId: Map<string, string>;
}): JSX.Element => {
  const copy = resolveShotCopy(shot.toppledPlayerIds.length, shot.isRackCleared);
  const isHit = shot.toppledPlayerIds.length > 0;
  const names = shot.toppledPlayerIds.map((playerId) => nameByPlayerId.get(playerId) ?? playerId);

  return (
    <div className={styles.resultOverlay} data-joust-result>
      <div className={`${styles.resultPlaque}${isHit ? "" : ` ${styles.resultPlaqueMiss}`}`}>
        <div>
          <p className={`${styles.resultTitle}${isHit ? "" : ` ${styles.resultTitleMiss}`}`}>
            {copy.title}
          </p>
          <p className={styles.resultBlurb}>
            {isHit ? displayJoustSurfaceCopy.toppledNames(names) : copy.blurb}
          </p>
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
      ? resolveShotCopy(view.lastShot.toppledPlayerIds.length, view.lastShot.isRackCleared).title
      : displayJoustSurfaceCopy.flyingPrompt;
  }

  if (aimMagnitude(view.aim) > 0.05) {
    return displayJoustSurfaceCopy.aimingDrawnPrompt;
  }

  // Naming whoever is up is the whole point of passing the tablet round; the TV is where the
  // room finds out it is their go.
  const shooter = view.teammates.find(
    (figure) => figure.playerId === view.activeShooterPlayerId
  );

  return shooter === undefined
    ? displayJoustSurfaceCopy.aimingPrompt
    : displayJoustSurfaceCopy.shooterPrompt(shooter.name);
};

const JoustPlayBody = ({
  view,
  activeTeamName,
  serverOrigin
}: {
  view: JoustMinigameDisplayView;
  activeTeamName: string | null;
  serverOrigin: string | null;
}): JSX.Element => {
  const replayIndex = useShotReplay(view.lastShot);
  const replayFinished = isReplayFinished(view.lastShot, replayIndex);
  const pendingPoints =
    view.activeTurnTeamId === null ? 0 : (view.pendingPointsByTeamId[view.activeTurnTeamId] ?? 0);
  const arena = view.arena;
  const scene =
    arena === null
      ? null
      : resolveJoustScene(
          arena,
          view.lineup,
          view.downPlayerIds,
          view.aim,
          view.lastShot,
          replayIndex
        );
  const nameByPlayerId = new Map(
    view.lineup.map((figure) => [figure.playerId, figure.name] as const)
  );

  return (
    <div className={styles.stage}>
      <header className={styles.marquee}>
        <h2 className={styles.marqueeTeamName}>{activeTeamName ?? ""}</h2>
        <span className={styles.marqueeTitle}>{displayJoustSurfaceCopy.title}</span>
        <div className={styles.marqueeMeta}>
          <span className={styles.marqueeShot}>
            {displayJoustSurfaceCopy.shotCounter(view.shotIndex + 1, view.shotsPerTurn)}
          </span>
          <span className={styles.marqueeShot}>
            {displayJoustSurfaceCopy.standing(
              view.lineup.length - view.downPlayerIds.length,
              view.lineup.length
            )}
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
              pins={scene.pins}
              fallen={scene.fallen}
              teammates={view.teammates}
              activeShooterPlayerId={view.activeShooterPlayerId}
              isAiming={view.lastShot === null}
              burstPinIndices={scene.burstPinIndices}
              serverOrigin={serverOrigin}
              sceneId="display-joust"
              label={displayJoustSurfaceCopy.sceneLabel(arena.name)}
            />
            {view.lastShot !== null && replayFinished && (
              <ResultPlaque shot={view.lastShot} nameByPlayerId={nameByPlayerId} />
            )}
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
  activeTeamName,
  serverOrigin
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

  return (
    <JoustPlayBody view={joustView} activeTeamName={activeTeamName} serverOrigin={serverOrigin} />
  );
};
