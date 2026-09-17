import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { JoustMinigameHostView, JoustShotResult } from "@wingnight/shared";

import { resolveHitZoneCopy } from "../hitZoneCopy/index.js";
import { AimArena } from "./AimArena/index.js";
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

const ShotResultCard = ({ shot }: { shot: JoustShotResult }): JSX.Element => {
  const zoneCopy = resolveHitZoneCopy(shot.hitZone);
  const isHit = shot.hitZone !== null;

  return (
    <div className={styles.resultCard} data-joust-result>
      <p className={`${styles.resultTitle}${isHit ? ` ${styles.resultTitleHit}` : ""}`}>
        {zoneCopy.title}
      </p>
      <p className={styles.resultBlurb}>{zoneCopy.blurb}</p>
      <span className={styles.resultPoints}>
        {hostJoustSurfaceCopy.resultPoints(shot.points)}
      </span>
    </div>
  );
};

const ShotHistory = ({ view }: { view: JoustMinigameHostView }): JSX.Element => {
  const slots = Array.from({ length: view.shotsPerTurn }, (_unused, index) => {
    return view.shots[index] ?? null;
  });

  return (
    <div className={styles.historyRow}>
      <span className={styles.historyTitle}>{hostJoustSurfaceCopy.historyTitle}</span>
      {slots.map((shot, index) => (
        <span
          key={index}
          className={`${styles.historyChip}${
            shot !== null && shot.hitZone !== null ? ` ${styles.historyChipHit}` : ""
          }`}
        >
          {shot === null
            ? hostJoustSurfaceCopy.historyPending
            : hostJoustSurfaceCopy.resultPoints(shot.points)}
        </span>
      ))}
    </div>
  );
};

const RunningTotals = ({
  view,
  teamNameByTeamId
}: {
  view: JoustMinigameHostView;
  teamNameByTeamId: Map<string, string>;
}): JSX.Element => {
  const teamIds = Object.keys(view.pendingPointsByTeamId);

  return (
    <div className={styles.totalsCard}>
      <span className={styles.totalsTitle}>{hostJoustSurfaceCopy.totalsTitle}</span>
      {teamIds.map((teamId) => (
        <div
          key={teamId}
          className={`${styles.totalsRow}${
            teamId === view.activeTurnTeamId ? ` ${styles.totalsRowActive}` : ""
          }`}
        >
          <span>{teamNameByTeamId.get(teamId) ?? teamId}</span>
          <span className={styles.totalsPoints}>
            {hostJoustSurfaceCopy.totalsPoints(view.pendingPointsByTeamId[teamId] ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const HostJoustSurface = ({
  phase,
  minigameHostView,
  activeTeamName,
  teamNameByTeamId,
  canDispatchAction,
  onDispatchAction
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
              {arena !== null && (
                <p className={styles.arenaName}>{hostJoustSurfaceCopy.arenaLabel(arena.name)}</p>
              )}
            </div>
            {joustView.lastShot !== null && (isResolved || isDone) && (
              <ShotResultCard shot={joustView.lastShot} />
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
            <ShotHistory view={joustView} />
            <RunningTotals view={joustView} teamNameByTeamId={teamNameByTeamId} />
          </aside>
        </div>
      )}
    </div>
  );
};
