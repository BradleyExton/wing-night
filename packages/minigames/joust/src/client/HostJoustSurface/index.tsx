import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { JoustShotResult } from "@wingnight/shared";
import { RunningTotals, TakeoverCanvas } from "@wingnight/surface";

import { resolveShotCopy } from "../shotResultCopy/index.js";
import { AimArena } from "./AimArena/index.js";
import { ShotHistory } from "./ShotHistory/index.js";
import { hostJoustSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// Which lane, and whose go. Body content rather than chrome: a slot holds the
// turn's counts and the turn's controls, and this is neither — it is what the
// scene underneath it IS, the way GEO's photo plate is the question rather
// than a chip about it. It rides inside the arena frame, over sky, and takes
// no pointer: the whole lane is a drag surface and a caption must not eat a
// pull that starts in the corner.
const LanePlate = ({
  arenaName,
  shooterName
}: {
  arenaName: string;
  shooterName: string | null;
}): JSX.Element => (
  <div className={styles.plate}>
    <p className={styles.plateTitle}>{hostJoustSurfaceCopy.arenaLabel(arenaName)}</p>
    {shooterName !== null && (
      <p className={styles.plateShooter} data-joust-shooter>
        {hostJoustSurfaceCopy.shooterLabel(shooterName)}
      </p>
    )}
  </div>
);

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

// JOUST's host surface. At play it is a `<TakeoverCanvas>`
// (docs/takeover-layout-api.md §3, §5): the lane is evenly spread scenery, so
// a chip in one corner costs a corner of desert rather than a word, and the
// 330px control deck this file used to grow — which cost the arena 342px of
// the tablet — is gone. Its contents went to the slots §5 names: the counts
// to `counter`, the beat-enders and the hint to `actions`, the last shot and
// the running totals to `readout`.
//
// It renders no rail and no team chip of its own — `rail` arrives filled with
// the shell's `<HostMiniRail />`, which already says the round, the sauce and
// whose turn it is — which is why the `resolveActiveTeamName` helper that all
// nine host surfaces had copied is no longer here. It writes no z-index, no
// `isolate` and no dock gutter either; the layout owns all three.
export const HostJoustSurface = ({
  phase,
  minigameHostView,
  teamNameByTeamId,
  rail,
  clock,
  canDispatchAction,
  onDispatchAction,
  serverOrigin
}: MinigameHostRendererProps): JSX.Element => {
  const joustView = minigameHostView?.minigame === "JOUST" ? minigameHostView : null;

  // The intro beat is a panel in the host's own control deck rather than a
  // takeover — `rail` and `clock` are both null on it — so a full-bleed lane
  // there would be nonsense and it gets the briefing note instead.
  if (phase !== "play") {
    return (
      <div className={styles.introRoot}>
        <p className={styles.introCard}>{hostJoustSurfaceCopy.introDescription}</p>
      </div>
    );
  }

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
  const lastShot = joustView?.lastShot ?? null;

  const dispatch = (actionType: string): void => {
    onDispatchAction(actionType, {});
  };

  return (
    <TakeoverCanvas
      rail={rail}
      clock={clock}
      counter={
        joustView === null ? null : (
          <>
            <span className={styles.counter}>
              {hostJoustSurfaceCopy.shotCounter(joustView.shotIndex + 1, joustView.shotsPerTurn)}
            </span>
            <ShotHistory shots={joustView.shots} shotsPerTurn={joustView.shotsPerTurn} />
            <span className={styles.counter}>
              {standingCount === 0
                ? hostJoustSurfaceCopy.emptyRackLabel
                : hostJoustSurfaceCopy.standingLabel(standingCount, joustView.lineup.length)}
            </span>
            {pendingPoints !== null && (
              <span className={styles.counterPending}>
                {hostJoustSurfaceCopy.pendingChip(pendingPoints)}
              </span>
            )}
          </>
        )
      }
      actions={
        <>
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
          {/* The escape hatches stay on the canvas, not in the override dock:
              skipping a pull and resetting the turn are the host's ordinary
              moves here, and AGENTS.md §11 never lets them leave. */}
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={!canAct || !isAimingPhase}
            onClick={(): void => {
              dispatch("skipShot");
            }}
          >
            {hostJoustSurfaceCopy.skipShotButtonLabel}
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={!canAct}
            onClick={(): void => {
              dispatch("resetTurn");
            }}
          >
            {hostJoustSurfaceCopy.resetTurnButtonLabel}
          </button>
          <span className={styles.hint}>
            {isAimingPhase
              ? canAct
                ? hostJoustSurfaceCopy.aimingHint
                : hostJoustSurfaceCopy.aimingLockedHint
              : isResolved
                ? hostJoustSurfaceCopy.replayingHint
                : hostJoustSurfaceCopy.turnOverLabel}
          </span>
        </>
      }
      readout={
        joustView === null ? null : (
          <>
            {lastShot !== null && (isResolved || isDone) && (
              <ShotResultCard shot={lastShot} nameByPlayerId={nameByPlayerId} />
            )}
            <RunningTotals
              pendingPointsByTeamId={joustView.pendingPointsByTeamId}
              activeTurnTeamId={joustView.activeTurnTeamId}
              teamNameByTeamId={teamNameByTeamId}
            />
          </>
        )
      }
    >
      {joustView === null || arena === null ? (
        <p className={styles.waitingNote}>{hostJoustSurfaceCopy.waitingArenaLabel}</p>
      ) : (
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
          <LanePlate arenaName={arena.name} shooterName={shooter?.name ?? null} />
        </div>
      )}
    </TakeoverCanvas>
  );
};
