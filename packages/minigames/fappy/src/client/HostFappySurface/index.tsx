import { useEffect } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { FappyMinigameHostView, FappyMinigameLeg } from "@wingnight/shared";
import { RunningTotals } from "@wingnight/surface";

import { useHeldLeg, type LegHold } from "../useHeldLeg/index.js";
import { formatRelayClock, useRelayClock } from "../useRelayClock/index.js";
import { Corridor } from "./Corridor/index.js";
import { LegHistory } from "./LegHistory/index.js";
import { RelayClock } from "./RelayClock/index.js";
import { hostFappySurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// Before the view arrives there is no leg to hold.
const EMPTY_LEG_VIEW = { legIndex: 0, legsPerTurn: 1, legs: [] };

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
      hostFappySurfaceCopy.noAssignedTeamLabel
    );
  }

  return activeTeamName ?? hostFappySurfaceCopy.noAssignedTeamLabel;
};

const resolvePlayerName = (leg: FappyMinigameLeg | null | undefined): string | null => {
  return leg?.player?.name ?? null;
};

const isRelayOver = (view: FappyMinigameHostView): boolean => {
  return view.phase === "finished" || view.phase === "timedOut";
};

const FinishCard = ({ view, elapsedMs }: { view: FappyMinigameHostView; elapsedMs: number | null }): JSX.Element => {
  const isTimedOut = view.phase === "timedOut";

  return (
    <div className={styles.finishCard} data-fappy-finish={view.phase}>
      <p className={`${styles.finishTitle}${isTimedOut ? ` ${styles.finishTitleTimedOut}` : ""}`}>
        {isTimedOut ? hostFappySurfaceCopy.timedOutTitle : hostFappySurfaceCopy.finishedTitle}
      </p>
      <span className={styles.finishTime}>
        {isTimedOut
          ? hostFappySurfaceCopy.progressLine(view.totalGatesCleared, view.legsPerTurn * view.gatesPerLeg)
          : hostFappySurfaceCopy.finishTime(formatRelayClock(elapsedMs ?? 0))}
      </span>
      <span className={styles.finishPoints}>{hostFappySurfaceCopy.finishPoints(view.points ?? 0)}</span>
    </div>
  );
};

const resolveHint = (view: FappyMinigameHostView, canAct: boolean, hold: LegHold | null): string => {
  const legIndex = Math.min(view.legIndex, view.legsPerTurn - 1);
  const leg = view.legs[legIndex];
  const waitingName = resolvePlayerName(view.legs[legIndex + 1] ?? null);

  if (hold?.kind === "handoff") {
    return hostFappySurfaceCopy.handoffHint(
      resolvePlayerName(view.legs[hold.legIndex] ?? null),
      resolvePlayerName(leg ?? null)
    );
  }

  if (view.phase === "ready") {
    if (!canAct) {
      return hostFappySurfaceCopy.readyLockedHint;
    }

    return leg !== undefined && leg.attempt > 0
      ? hostFappySurfaceCopy.respawnHint(leg.checkpointGate)
      : hostFappySurfaceCopy.readyHint(resolvePlayerName(leg ?? null), waitingName);
  }

  if (view.phase === "flying") {
    return hostFappySurfaceCopy.flyingHint(waitingName);
  }

  return view.phase === "timedOut" ? hostFappySurfaceCopy.timedOutHint : hostFappySurfaceCopy.finishedHint;
};

export const HostFappySurface = ({
  phase,
  minigameHostView,
  activeTeamName,
  teamNameByTeamId,
  canDispatchAction,
  onDispatchAction,
  serverOrigin
}: MinigameHostRendererProps): JSX.Element => {
  const fappyView = minigameHostView?.minigame === "FAPPY" ? minigameHostView : null;
  const resolvedActiveTeamName = resolveActiveTeamName({
    minigameHostView,
    teamNameByTeamId,
    activeTeamName
  });
  const isPlayPhase = phase === "play";
  const canAct = canDispatchAction && fappyView !== null;
  const elapsedMs = useRelayClock({
    startedAtMs: fappyView?.startedAtMs ?? null,
    endedAtMs: fappyView?.timedOutAtMs ?? fappyView?.finishedAtMs ?? null
  });
  const isLive = fappyView !== null && (fappyView.phase === "ready" || fappyView.phase === "flying");
  const isPastLimit =
    fappyView !== null && elapsedMs !== null && elapsedMs >= fappyView.limitSeconds * 1000;
  const currentLeg =
    fappyView === null ? null : (fappyView.legs[Math.min(fappyView.legIndex, fappyView.legsPerTurn - 1)] ?? null);
  // The corridor lingers on a cleared leg while the handoff plays; the deck
  // is already on the next one, which is the leg the room is asking about.
  const { shownLegIndex, hold } = useHeldLeg(fappyView ?? EMPTY_LEG_VIEW);

  const dispatch = (actionType: string): void => {
    onDispatchAction(actionType, {});
  };

  // The tablet's clock says the limit has passed; tell the server, which
  // checks it against its own clock before ending the relay.
  useEffect(() => {
    if (canAct && isLive && isPastLimit) {
      onDispatchAction("timeOut", {});
    }
  }, [canAct, isLive, isPastLimit]);

  return (
    <div className={styles.container}>
      <div className={styles.rail}>
        <span className={styles.railTitle}>{hostFappySurfaceCopy.railTitle}</span>
        <span className={styles.railTeam}>
          <span className={styles.railTeamDot} aria-hidden="true" />
          {hostFappySurfaceCopy.teamPrefix} {resolvedActiveTeamName}
        </span>
        {isPlayPhase && fappyView !== null && <RelayClock view={fappyView} elapsedMs={elapsedMs} />}
      </div>
      {!isPlayPhase && (
        <p className={styles.introCard}>{hostFappySurfaceCopy.introDescription}</p>
      )}
      {isPlayPhase && fappyView !== null && (
        <div className={styles.playArea}>
          <div className={styles.arenaColumn}>
            <Corridor
              view={fappyView}
              canAct={canAct}
              serverOrigin={serverOrigin}
              onDispatchAction={onDispatchAction}
              hold={hold}
              legIndex={shownLegIndex}
            />
            <p className={styles.arenaHint}>{resolveHint(fappyView, canAct, hold)}</p>
          </div>
          <aside className={styles.deck}>
            <div className={styles.legCard}>
              <span className={styles.legCounter}>
                {hostFappySurfaceCopy.legCounter(
                  Math.min(fappyView.legIndex + 1, fappyView.legsPerTurn),
                  fappyView.legsPerTurn
                )}
              </span>
              <p className={styles.flyingName}>
                {hostFappySurfaceCopy.flyingLabel(resolvePlayerName(currentLeg))}
              </p>
              <div className={styles.legMeta}>
                <span>
                  {hostFappySurfaceCopy.progressLine(
                    fappyView.totalGatesCleared,
                    fappyView.legsPerTurn * fappyView.gatesPerLeg
                  )}
                </span>
                {currentLeg !== null && currentLeg.crashes > 0 && (
                  <span data-fappy-crashes={currentLeg.crashes}>
                    {hostFappySurfaceCopy.crashesChip(currentLeg.crashes)}
                  </span>
                )}
              </div>
            </div>
            {isRelayOver(fappyView) && <FinishCard view={fappyView} elapsedMs={elapsedMs} />}
            <div className={styles.deckRows}>
              <button
                className={styles.deckRowButton}
                type="button"
                disabled={!canAct || !isLive}
                onClick={(): void => {
                  dispatch("skipLeg");
                }}
              >
                {hostFappySurfaceCopy.skipLegButtonLabel}
              </button>
              <button
                className={styles.deckRowButton}
                type="button"
                disabled={!canAct}
                onClick={(): void => {
                  dispatch("resetTurn");
                }}
              >
                {hostFappySurfaceCopy.resetTurnButtonLabel}
              </button>
            </div>
            <LegHistory
              legs={fappyView.legs}
              activeLegIndex={isRelayOver(fappyView) ? null : fappyView.legIndex}
            />
            <RunningTotals
              pendingPointsByTeamId={fappyView.pendingPointsByTeamId}
              activeTurnTeamId={fappyView.activeTurnTeamId}
              teamNameByTeamId={teamNameByTeamId}
              note={hostFappySurfaceCopy.parLine(fappyView.parSeconds)}
            />
          </aside>
        </div>
      )}
    </div>
  );
};
