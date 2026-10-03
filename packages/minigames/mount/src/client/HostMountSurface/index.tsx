import { useRef } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import { resolveMountClimbTicks, type MountMinigameHostView } from "@wingnight/shared";
import { RunningTotals, TakeoverCanvas, useVerdictDispatch } from "@wingnight/surface";

import { formatClimbClock } from "../climbClock/index.js";
import { useHeldClimb, type ClimbHold } from "../useHeldClimb/index.js";
import { useMountSounds } from "../useMountSounds/index.js";
import { Arena } from "./Arena/index.js";
import { ClimbHistory } from "./ClimbHistory/index.js";
import { hostMountSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// Before the view arrives there is no climb to hold, and nothing yet to be through.
const EMPTY_CLIMB_VIEW = { climbIndex: 0, climbsPerTurn: 1, climbs: [], pointsSoFar: 0 };

const currentPlayerName = (view: MountMinigameHostView): string | null => {
  return view.climbs[Math.min(view.climbIndex, view.climbsPerTurn - 1)]?.player?.name ?? null;
};

const resolveHolderName = (view: MountMinigameHostView): string => {
  const { playerId } = view.pile.highLine;

  if (playerId === null) {
    return hostMountSurfaceCopy.gooseHolder;
  }

  return view.figures[playerId]?.name ?? hostMountSurfaceCopy.unknownHolder;
};

// The one line under the buttons, or nothing. A climber's hands are busy, and the handoff is
// announced by the callout over the climb, so neither beat gets a sentence here.
const resolveHint = (view: MountMinigameHostView, canAct: boolean, hold: ClimbHold | null, solo: boolean): string | null => {
  if (hold !== null) {
    return null;
  }

  if (view.phase === "finished") {
    return solo ? null : hostMountSurfaceCopy.finishedHint;
  }

  if (view.phase === "running") {
    return null;
  }

  return canAct ? hostMountSurfaceCopy.readyHint(currentPlayerName(view)) : hostMountSurfaceCopy.readyLockedHint;
};

// Mount Your Hens' host surface (docs/minigames/mount-your-hens-spec.md §0.5). At play it is a
// `<TakeoverCanvas>`: the climb is evenly spread scenery. Its chrome is the slots the layout names
// and no more: the climb, whose it is, the clock and the line in `counter`; the escape hatches and
// the one hint in `actions`; the climb list and running totals in `readout`, only while a climb's
// ending is on screen or once the team is through.
//
// It renders no rail and no team chip of its own — `rail` arrives filled with the shell's
// `<HostMiniRail />` — and writes no z-index, no `isolate` and no dock gutter.
export const HostMountSurface = ({
  phase,
  minigameHostView,
  teamNameByTeamId,
  rail,
  clock,
  canDispatchAction,
  onDispatchAction,
  serverOrigin,
  solo = false
}: MinigameHostRendererProps): JSX.Element => {
  const mountView = minigameHostView?.minigame === "MOUNT" ? minigameHostView : null;
  const canAct = canDispatchAction && mountView !== null;
  const isLive = mountView !== null && (mountView.phase === "ready" || mountView.phase === "running");
  const isFinished = mountView?.phase === "finished";
  // The arena lingers on the climb just ended while its beat plays; the chrome is already on the
  // next one, which is the climb the room is asking about.
  const { shownClimbIndex, hold } = useHeldClimb(mountView ?? EMPTY_CLIMB_VIEW);
  // On the night the TV is the speaker and the tablet is quiet. Solo, the tablet is the room.
  const { onEvent } = useMountSounds({ serverOrigin, isSpeaker: solo });
  // Written by the runner's paint loop, sixty times a second.
  const clockRef = useRef<HTMLSpanElement>(null);
  const hint = mountView === null ? null : resolveHint(mountView, canAct, hold, solo);
  const playerName = mountView === null || isFinished ? null : currentPlayerName(mountView);
  const showsReadout = mountView !== null && (hold !== null || isFinished);
  const { dispatchVerdict, isSettling } = useVerdictDispatch(onDispatchAction);
  const climbInHand = mountView?.climbs[mountView.climbIndex] ?? null;
  const startingTicks =
    mountView === null ? 0 : (climbInHand?.climbTicks ?? resolveMountClimbTicks(mountView.rules, mountView.pile.hens.length));

  // Every hook above runs on both beats: the intro is a panel in the host's own control deck
  // rather than a takeover — `rail` and `clock` are both null on it — so it gets the briefing.
  if (phase !== "play") {
    return (
      <div className={styles.introRoot}>
        <p className={styles.introCard}>{hostMountSurfaceCopy.introDescription}</p>
      </div>
    );
  }

  return (
    <TakeoverCanvas
      rail={rail}
      clock={clock}
      counter={
        mountView === null ? null : (
          <>
            <span className={styles.counter}>
              <span>
                {hostMountSurfaceCopy.climbCounter(
                  Math.min(mountView.climbIndex + 1, mountView.climbsPerTurn),
                  mountView.climbsPerTurn
                )}
              </span>
              {playerName !== null && (
                <span className={styles.counterName} data-mount-climb-name>
                  {playerName}
                </span>
              )}
            </span>
            {!isFinished && (
              <span className={styles.counterClock}>
                <span ref={clockRef} className={styles.clockDigits} data-mount-clock={startingTicks} data-last-ten="false">
                  {formatClimbClock(startingTicks)}
                </span>
                <span className={styles.counterLabel}>{hostMountSurfaceCopy.clockLabel}</span>
              </span>
            )}
            <span className={styles.counterLine} data-mount-line-chip>
              <span className={styles.counterLineValue}>
                {hostMountSurfaceCopy.lineHolder(resolveHolderName(mountView), mountView.pile.highLine.height)}
              </span>
              <span className={styles.counterLabel}>{hostMountSurfaceCopy.lineLabel}</span>
            </span>
          </>
        )
      }
      actions={
        mountView === null ? null : (
          <>
            {/* The escape hatches stay on the canvas: skipping a climb and resetting the turn are
                the host's ordinary moves here (AGENTS.md §11). Solo there is nobody to skip for. */}
            {!solo && (
              <button
                className={styles.secondaryButton}
                type="button"
                // Not during a beat: the arena still shows the climb just ended, and a tap there
                // would skip the NEXT player's climb before they had the tablet.
                disabled={!canAct || !isLive || hold !== null || isSettling}
                onClick={(): void => {
                  dispatchVerdict("skipClimb", {
                    ...(mountView.activeTurnTeamId === null ? {} : { teamId: mountView.activeTurnTeamId }),
                    climbIndex: mountView.climbIndex
                  });
                }}
              >
                {hostMountSurfaceCopy.skipClimbButtonLabel}
              </button>
            )}
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={!canAct}
              onClick={(): void => {
                onDispatchAction("resetTurn", {});
              }}
            >
              {solo ? hostMountSurfaceCopy.restartButtonLabel : hostMountSurfaceCopy.resetTurnButtonLabel}
            </button>
            {hint !== null && (
              <span className={styles.hint} data-mount-hint>
                {hint}
              </span>
            )}
          </>
        )
      }
      readout={
        !showsReadout ? null : (
          <>
            {isFinished && (
              <div className={styles.finishCard} data-mount-finish="finished">
                <p className={styles.finishTitle}>{hostMountSurfaceCopy.finishedTitle}</p>
                <span className={styles.finishPoints}>{hostMountSurfaceCopy.finishPoints(mountView.points ?? 0)}</span>
              </div>
            )}
            <ClimbHistory climbs={mountView.climbs} activeClimbIndex={mountView.climbIndex} />
            {isFinished && (
              <RunningTotals
                pendingPointsByTeamId={mountView.pendingPointsByTeamId}
                activeTurnTeamId={mountView.activeTurnTeamId}
                teamNameByTeamId={teamNameByTeamId}
                note={hostMountSurfaceCopy.totalLine(mountView.climbsPerTurn)}
              />
            )}
          </>
        )
      }
    >
      {mountView === null ? (
        <p className={styles.waitingNote}>{hostMountSurfaceCopy.waitingLabel}</p>
      ) : (
        <Arena
          view={mountView}
          canAct={canAct}
          serverOrigin={serverOrigin}
          onDispatchAction={onDispatchAction}
          hold={hold}
          climbIndex={shownClimbIndex}
          clockRef={clockRef}
          onRunnerEvent={solo ? onEvent : undefined}
        />
      )}
    </TakeoverCanvas>
  );
};
