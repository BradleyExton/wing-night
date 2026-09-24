import { useEffect } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { FappyMinigameHostView, FappyMinigameLeg } from "@wingnight/shared";
import { RunningTotals, TakeoverCanvas } from "@wingnight/surface";

import { RelayLineup } from "../RelayLineup/index.js";
import {
  resolveFinishClock,
  resolveRelayChase,
  type FinishClock
} from "../pressure/index.js";
import { useHeldLeg, type LegHold } from "../useHeldLeg/index.js";
import { formatRelayClock, formatRelayClockSeconds, useRelayClock } from "../useRelayClock/index.js";
import { Corridor } from "./Corridor/index.js";
import { PointsMeter } from "./PointsMeter/index.js";
import { RelayClock } from "./RelayClock/index.js";
import { hostFappySurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// Before the view arrives there is no leg to hold.
const EMPTY_LEG_VIEW = { legIndex: 0, legsPerTurn: 1, legs: [] };

const resolvePlayerName = (leg: FappyMinigameLeg | null | undefined): string | null => {
  return leg?.player?.name ?? null;
};

const isRelayOver = (view: FappyMinigameHostView): boolean => {
  return view.phase === "finished" || view.phase === "timedOut";
};

const FinishCard = ({
  view,
  finishClock
}: {
  view: FappyMinigameHostView;
  finishClock: FinishClock;
}): JSX.Element => {
  const isTimedOut = view.phase === "timedOut";

  return (
    <div className={styles.finishCard} data-fappy-finish={view.phase}>
      <p className={`${styles.finishTitle}${isTimedOut ? ` ${styles.finishTitleTimedOut}` : ""}`}>
        {isTimedOut ? hostFappySurfaceCopy.timedOutTitle : hostFappySurfaceCopy.finishedTitle}
      </p>
      <span className={styles.finishTime}>
        {isTimedOut
          ? hostFappySurfaceCopy.progressLine(view.totalGatesCleared, view.legsPerTurn * view.gatesPerLeg)
          : hostFappySurfaceCopy.finishTime(formatRelayClock(finishClock.elapsedMs ?? 0))}
      </span>
      {/* The time above is the SCORED one, so a host who watched 0:38 run past
          is told where the rest of it came from rather than left to guess. */}
      {finishClock.penaltyMs > 0 && (
        <span className={styles.finishPenalty} data-fappy-penalty="host">
          {hostFappySurfaceCopy.penaltyLine(
            formatRelayClockSeconds(finishClock.penaltyMs),
            finishClock.skippedLegs
          )}
        </span>
      )}
      <span className={styles.finishPoints}>{hostFappySurfaceCopy.finishPoints(view.points ?? 0)}</span>
    </div>
  );
};

// The line under the running totals: the slowest finish that still tops the
// best rival this round, or par when even that would not do it. The par line
// when there is nobody to chase yet.
const resolveTotalsNote = (
  view: FappyMinigameHostView,
  teamNameByTeamId: Map<string, string>
): string => {
  const chase = resolveRelayChase(view);

  if (chase === null || view.phase === "finished" || view.phase === "timedOut") {
    return hostFappySurfaceCopy.parLine(view.parSeconds);
  }

  const rivalName = teamNameByTeamId.get(chase.teamId) ?? null;

  return chase.timeToBeatMs === null
    ? hostFappySurfaceCopy.beatPar(rivalName)
    : hostFappySurfaceCopy.timeToBeat(formatRelayClockSeconds(chase.timeToBeatMs), rivalName);
};

const resolveHint = (view: FappyMinigameHostView, canAct: boolean, hold: LegHold | null): string => {
  const legIndex = Math.min(view.legIndex, view.legsPerTurn - 1);
  const leg = view.legs[legIndex];
  const waitingName = resolvePlayerName(view.legs[legIndex + 1] ?? null);
  // Who is up AFTER the handoff. Named so the room can start moving before
  // the tablet reaches them; null on the last two legs, where there is
  // nobody after and the sentence would be a lie.
  const onDeckName = resolvePlayerName(view.legs[legIndex + 2] ?? null);

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
      ? hostFappySurfaceCopy.respawnHint(leg.checkpointGate, onDeckName)
      : hostFappySurfaceCopy.readyHint(resolvePlayerName(leg ?? null), waitingName, onDeckName);
  }

  if (view.phase === "flying") {
    return hostFappySurfaceCopy.flyingHint(waitingName, onDeckName);
  }

  return view.phase === "timedOut" ? hostFappySurfaceCopy.timedOutHint : hostFappySurfaceCopy.finishedHint;
};

// FAPPY's host surface. At play it is a `<TakeoverCanvas>`
// (docs/takeover-layout-api.md §3, §5): the corridor is evenly spread scenery,
// so a chip in one corner costs a corner of desert rather than a word, and the
// 330px control deck this file used to grow — which cost the corridor 342px of
// the tablet — is gone. Its contents went to the slots §5 names: the counts,
// the leg chips and the relay clock to `counter`, the escape hatches and the
// hint to `actions`, the finish card and the running totals to `readout`.
//
// It renders no rail and no team chip of its own — `rail` arrives filled with
// the shell's `<HostMiniRail />`, which already says the round, the sauce and
// whose turn it is — which is why the `resolveActiveTeamName` helper that all
// nine host surfaces had copied is no longer here. It writes no z-index, no
// `isolate` and no dock gutter either; the layout owns all three.
export const HostFappySurface = ({
  phase,
  minigameHostView,
  teamNameByTeamId,
  rail,
  clock,
  canDispatchAction,
  onDispatchAction,
  serverOrigin
}: MinigameHostRendererProps): JSX.Element => {
  const fappyView = minigameHostView?.minigame === "FAPPY" ? minigameHostView : null;
  const canAct = canDispatchAction && fappyView !== null;
  const elapsedMs = useRelayClock({
    startedAtMs: fappyView?.startedAtMs ?? null,
    endedAtMs: fappyView?.timedOutAtMs ?? fappyView?.finishedAtMs ?? null
  });
  // The wall the host watches, and what the relay actually scored — the two
  // part company the moment a leg is forgiven (`resolveFinishClock`).
  const finishClock = fappyView === null ? null : resolveFinishClock(fappyView, elapsedMs);
  const isLive = fappyView !== null && (fappyView.phase === "ready" || fappyView.phase === "flying");
  const isPastLimit =
    fappyView !== null && elapsedMs !== null && elapsedMs >= fappyView.limitSeconds * 1000;
  const currentLeg =
    fappyView === null ? null : (fappyView.legs[Math.min(fappyView.legIndex, fappyView.legsPerTurn - 1)] ?? null);
  // The corridor lingers on a cleared leg while the handoff plays; the chrome
  // row is already on the next one, which is the leg the room is asking about.
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

  // Every hook above runs on both beats: the intro is a panel in the host's own
  // control deck rather than a takeover — `rail` and `clock` are both null on
  // it — so a full-bleed corridor there would be nonsense and it gets the
  // briefing note instead.
  if (phase !== "play") {
    return (
      <div className={styles.introRoot}>
        <p className={styles.introCard}>{hostFappySurfaceCopy.introDescription}</p>
      </div>
    );
  }

  return (
    <TakeoverCanvas
      rail={rail}
      clock={clock}
      counter={
        fappyView === null ? null : (
          <>
            <span className={styles.counter}>
              {hostFappySurfaceCopy.legCounter(
                Math.min(fappyView.legIndex + 1, fappyView.legsPerTurn),
                fappyView.legsPerTurn
              )}
            </span>
            <span className={styles.counterName}>
              {hostFappySurfaceCopy.flyingLabel(resolvePlayerName(currentLeg))}
            </span>
            {/* The relay's running order as faces (step 1): who has flown,
                who is flying, and — the fact the room could not find before —
                whose tablet it is next. */}
            <RelayLineup
              legs={fappyView.legs}
              activeLegIndex={isRelayOver(fappyView) ? null : fappyView.legIndex}
              activeTurnTeamId={fappyView.activeTurnTeamId}
              serverOrigin={serverOrigin}
              surface="tablet"
            />
            <span className={styles.counter}>
              {hostFappySurfaceCopy.progressLine(
                fappyView.totalGatesCleared,
                fappyView.legsPerTurn * fappyView.gatesPerLeg
              )}
            </span>
            {/* FAPPY's own clock, not the shell's: `timerKey` is null for this
                game, so the `clock` slot stays empty and takes no width, and
                the relay clock is a count the host reads without acting on
                it — which is what the `counter` slot is for (§4). */}
            <RelayClock
              view={fappyView}
              elapsedMs={isRelayOver(fappyView) ? (finishClock?.elapsedMs ?? elapsedMs) : elapsedMs}
            />
            {/* What the clock beside it is spending. */}
            <PointsMeter view={fappyView} elapsedMs={elapsedMs} />
          </>
        )
      }
      actions={
        fappyView === null ? null : (
          <>
            {/* The escape hatches stay on the canvas, not in the override dock:
                skipping a leg and resetting the turn are the host's ordinary
                moves here, and AGENTS.md §11 never lets them leave. */}
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={!canAct || !isLive}
              onClick={(): void => {
                dispatch("skipLeg");
              }}
            >
              {hostFappySurfaceCopy.skipLegButtonLabel}
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={!canAct}
              onClick={(): void => {
                dispatch("resetTurn");
              }}
            >
              {hostFappySurfaceCopy.resetTurnButtonLabel}
            </button>
            <span className={styles.hint}>{resolveHint(fappyView, canAct, hold)}</span>
          </>
        )
      }
      readout={
        fappyView === null ? null : (
          <>
            {isRelayOver(fappyView) && finishClock !== null && (
              <FinishCard view={fappyView} finishClock={finishClock} />
            )}
            <RunningTotals
              pendingPointsByTeamId={fappyView.pendingPointsByTeamId}
              activeTurnTeamId={fappyView.activeTurnTeamId}
              teamNameByTeamId={teamNameByTeamId}
              note={resolveTotalsNote(fappyView, teamNameByTeamId)}
            />
          </>
        )
      }
    >
      {fappyView === null ? (
        <p className={styles.waitingNote}>{hostFappySurfaceCopy.waitingRelayLabel}</p>
      ) : (
        <Corridor
          view={fappyView}
          canAct={canAct}
          serverOrigin={serverOrigin}
          onDispatchAction={onDispatchAction}
          hold={hold}
          legIndex={shownLegIndex}
        />
      )}
    </TakeoverCanvas>
  );
};
