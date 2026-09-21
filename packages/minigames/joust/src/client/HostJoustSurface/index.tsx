import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { JoustShotResult } from "@wingnight/shared";

import { resolveShotCopy } from "../shotResultCopy/index.js";
import { AimArena } from "./AimArena/index.js";
import { RunningTotals } from "./RunningTotals/index.js";
import { ShotHistory } from "./ShotHistory/index.js";
import { hostJoustSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

const resolveActiveTeamName = ({
  minigameHostView,
  teamNameByTeamId,
  activeTeamName
}: Pick<
  MinigameHostRendererProps,
  "minigameHostView" | "teamNameByTeamId" | "activeTeamName"
>): string => {
  if (minigameHostView?.activeTurnTeamId) {
    return (
      teamNameByTeamId.get(minigameHostView.activeTurnTeamId) ??
      hostJoustSurfaceCopy.noAssignedTeamLabel
    );
  }

  return activeTeamName ?? hostJoustSurfaceCopy.noAssignedTeamLabel;
};

const ShotResultCard = ({
  shot,
  nameByPlayerId
}: {
  shot: JoustShotResult;
  nameByPlayerId: Map<string, string>;
}): JSX.Element => {
  const copy = resolveShotCopy(shot);
  const isHit = shot.toppledPlayerIds.length > 0;
  const names = shot.toppledPlayerIds.map((playerId) => nameByPlayerId.get(playerId) ?? playerId);

  return (
    <div className={styles.resultCard} data-joust-result>
      <p className={`${styles.resultTitle}${isHit ? ` ${styles.resultTitleHit}` : ""}`}>
        {copy.title}
      </p>
      <p className={styles.resultBlurb}>
        {isHit ? hostJoustSurfaceCopy.toppledNames(names) : copy.blurb}
      </p>
      <span className={styles.resultPoints}>
        {hostJoustSurfaceCopy.resultPoints(shot.points)}
      </span>
    </div>
  );
};

export const HostJoustSurface = ({
  phase,
  minigameHostView,
  activeTeamName,
  teamNameByTeamId,
  canDispatchAction,
  onDispatchAction,
  serverOrigin
}: MinigameHostRendererProps): JSX.Element => {
  const joustView = minigameHostView?.minigame === "JOUST" ? minigameHostView : null;
  const resolvedActiveTeamName = resolveActiveTeamName({
    minigameHostView,
    teamNameByTeamId,
    activeTeamName
  });
  const isPlayPhase = phase === "play";
  const pendingPoints =
    joustView === null || joustView.activeTurnTeamId === null
      ? null
      : (joustView.pendingPointsByTeamId[joustView.activeTurnTeamId] ?? 0);
  const canAct = canDispatchAction && joustView !== null;
  const joustPhase = joustView?.phase ?? "aiming";
  const isAimingPhase = joustPhase === "aiming";
  const isResolved = joustPhase === "resolved";
  const isDone = joustPhase === "done";
  const arena = joustView?.arena ?? null;
  const standingCount =
    joustView === null ? 0 : joustView.lineup.length - joustView.downPlayerIds.length;
  const nameByPlayerId = new Map(
    (joustView?.lineup ?? []).map((figure) => [figure.playerId, figure.name] as const)
  );
  const shooter =
    joustView?.teammates.find(
      (figure) => figure.playerId === joustView.activeShooterPlayerId
    ) ?? null;

  const dispatch = (actionType: string): void => {
    onDispatchAction(actionType, {});
  };

  return (
    <div className={styles.container}>
      <div className={styles.rail}>
        <span className={styles.railTitle}>{hostJoustSurfaceCopy.railTitle}</span>
        <span className={styles.railTeam}>
          <span className={styles.railTeamDot} aria-hidden="true" />
          {hostJoustSurfaceCopy.teamPrefix} {resolvedActiveTeamName}
        </span>
        {isPlayPhase && pendingPoints !== null && (
          <span className={styles.railPending}>
            {hostJoustSurfaceCopy.pendingChip(pendingPoints)}
          </span>
        )}
      </div>
      {!isPlayPhase && (
        <p className={styles.introCard}>{hostJoustSurfaceCopy.introDescription}</p>
      )}
      {isPlayPhase && joustView !== null && (
        <div className={styles.playArea}>
          <div className={styles.arenaColumn}>
            {arena === null ? (
              <p className={styles.waitingNote}>{hostJoustSurfaceCopy.waitingArenaLabel}</p>
            ) : (
              <>
                <div className={styles.arenaFrame}>
                  <AimArena
                    arena={arena}
                    lineup={joustView.lineup}
                    teammates={joustView.teammates}
                    activeShooterPlayerId={joustView.activeShooterPlayerId}
                    downPlayerIds={joustView.downPlayerIds}
                    collapsedPerchIndices={joustView.collapsedPerchIndices}
                    previousShotGhost={joustView.previousShotGhost}
                    serverOrigin={serverOrigin}
                    aim={joustView.aim}
                    lastShot={joustView.lastShot}
                    canAim={canAct && isAimingPhase}
                    sceneLabel={hostJoustSurfaceCopy.sceneLabel(arena.name)}
                    onAim={(aim): void => {
                      onDispatchAction("setAim", aim);
                    }}
                    onLaunch={(aim): void => {
                      onDispatchAction("launch", aim);
                    }}
                  />
                </div>
                <p className={styles.arenaHint}>
                  {isAimingPhase
                    ? canAct
                      ? hostJoustSurfaceCopy.aimingHint
                      : hostJoustSurfaceCopy.aimingLockedHint
                    : isResolved
                      ? hostJoustSurfaceCopy.replayingHint
                      : hostJoustSurfaceCopy.turnOverLabel}
                </p>
              </>
            )}
          </div>
          <aside className={styles.deck}>
            <div className={styles.shotCard}>
              <span className={styles.shotCounter}>
                {hostJoustSurfaceCopy.shotCounter(joustView.shotIndex + 1, joustView.shotsPerTurn)}
              </span>
              {shooter !== null && (
                <p className={styles.arenaName} data-joust-shooter>
                  {hostJoustSurfaceCopy.shooterLabel(shooter.name)}
                </p>
              )}
              {arena !== null && (
                <p className={styles.arenaName}>{hostJoustSurfaceCopy.arenaLabel(arena.name)}</p>
              )}
              <p className={styles.arenaName}>
                {standingCount === 0
                  ? hostJoustSurfaceCopy.emptyRackLabel
                  : hostJoustSurfaceCopy.standingLabel(standingCount, joustView.lineup.length)}
              </p>
            </div>
            {joustView.lastShot !== null && (isResolved || isDone) && (
              <ShotResultCard shot={joustView.lastShot} nameByPlayerId={nameByPlayerId} />
            )}
            {isDone ? (
              <p className={styles.doneNote}>{hostJoustSurfaceCopy.turnOverLabel}</p>
            ) : (
              <button
                className={styles.primaryButton}
                type="button"
                disabled={!canAct || !isResolved}
                onClick={(): void => {
                  dispatch("nextShot");
                }}
              >
                {hostJoustSurfaceCopy.nextShotButtonLabel}
              </button>
            )}
            <div className={styles.deckRows}>
              <button
                className={styles.deckRowButton}
                type="button"
                disabled={!canAct || !isAimingPhase}
                onClick={(): void => {
                  dispatch("skipShot");
                }}
              >
                {hostJoustSurfaceCopy.skipShotButtonLabel}
              </button>
              <button
                className={styles.deckRowButton}
                type="button"
                disabled={!canAct}
                onClick={(): void => {
                  dispatch("resetTurn");
                }}
              >
                {hostJoustSurfaceCopy.resetTurnButtonLabel}
              </button>
            </div>
            <ShotHistory shots={joustView.shots} shotsPerTurn={joustView.shotsPerTurn} />
            <RunningTotals
              pendingPointsByTeamId={joustView.pendingPointsByTeamId}
              activeTurnTeamId={joustView.activeTurnTeamId}
              teamNameByTeamId={teamNameByTeamId}
            />
          </aside>
        </div>
      )}
    </div>
  );
};
