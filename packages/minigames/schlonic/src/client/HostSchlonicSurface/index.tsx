import { useRef } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { SchlonicMinigameHostView } from "@wingnight/shared";
import { RunningTotals, TakeoverCanvas } from "@wingnight/surface";

import { resolveRunPlayerName } from "../resolveRunPlayerName/index.js";
import { useHeldRun, type RunHold } from "../useHeldRun/index.js";
import { RunHistory } from "./RunHistory/index.js";
import { Zone } from "./Zone/index.js";
import { hostSchlonicSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// Before the view arrives there is no run to hold.
const EMPTY_RUN_VIEW = { runIndex: 0, runsPerTurn: 1, runs: [] };

// The one line under the buttons, or nothing. A running bird's holder is not reading, and the
// handoff is announced by the callout over the zone, so neither beat gets a sentence here.
const resolveHint = (
  view: SchlonicMinigameHostView,
  canAct: boolean,
  hold: RunHold | null
): string | null => {
  if (hold !== null) {
    return null;
  }

  if (view.phase === "finished") {
    return hostSchlonicSurfaceCopy.finishedHint;
  }

  if (view.phase === "running") {
    return null;
  }

  const runIndex = Math.min(view.runIndex, view.runsPerTurn - 1);

  return canAct
    ? hostSchlonicSurfaceCopy.readyHint(resolveRunPlayerName(view.runs[runIndex] ?? null))
    : hostSchlonicSurfaceCopy.readyLockedHint;
};

// SCHLONIC's host surface. At play it is a `<TakeoverCanvas>`
// (docs/takeover-layout-api.md §3, §5): the zone is evenly spread scenery — a
// bay, a shoreline and a skyline — so a chip in one corner costs a corner of
// Barrie rather than a word. Its chrome is the slots §5 names and no more: the
// counts in `counter`, the escape hatches and the one hint in `actions`, and
// the run list and running totals in `readout` — but only while a run's ending
// is on screen or once the team is through. Bottom-right is where the ground
// band scrolls in, and a card there during a run hid the next hazard until it
// was under the hen.
//
// Nothing rides in the body. JOUST puts the lane's name on a plate over its
// top-left sky, and FAPPY could not because its bird is pinned at 20% of the
// scene's width; SCHLONIC's runner is pinned at 46 of the world's 160 units —
// 28.75%, which at 1229px of canvas is 353px in, against a plate that reaches
// 303px — and it climbs. A held jump is worth ~27 world units and a springboard
// ~81 of the world's 90, so the hen crosses the top-left sky on any decent
// bounce. So who is running is a chip in the chrome row, and every pixel of
// the zone stays jump surface.
//
// It renders no rail and no team chip of its own — `rail` arrives filled with
// the shell's `<HostMiniRail />`, which already says the round, the sauce and
// whose turn it is. It writes no z-index, no `isolate` and no dock gutter
// either; the layout owns all three.
export const HostSchlonicSurface = ({
  phase,
  minigameHostView,
  teamNameByTeamId,
  rail,
  clock,
  canDispatchAction,
  onDispatchAction,
  serverOrigin
}: MinigameHostRendererProps): JSX.Element => {
  const schlonicView = minigameHostView?.minigame === "SCHLONIC" ? minigameHostView : null;
  const canAct = canDispatchAction && schlonicView !== null;
  const isLive =
    schlonicView !== null && (schlonicView.phase === "ready" || schlonicView.phase === "running");
  const isFinished = schlonicView?.phase === "finished";
  // The zone lingers on the run just ended while the handoff plays; the chrome
  // row is already on the next one, which is the run the room is asking about.
  const { shownRunIndex, hold } = useHeldRun(schlonicView ?? EMPTY_RUN_VIEW);
  // Written by the runner's paint loop, sixty times a second: the wings in hand.
  const tallyRef = useRef<HTMLSpanElement>(null);
  const currentRun =
    schlonicView === null
      ? null
      : (schlonicView.runs[Math.min(schlonicView.runIndex, schlonicView.runsPerTurn - 1)] ?? null);
  const currentRunnerName = isFinished ? null : resolveRunPlayerName(currentRun);
  const hint = schlonicView === null ? null : resolveHint(schlonicView, canAct, hold);
  // The run list and the round's totals come out only when there is something
  // to read off them and nothing to dodge under them.
  const showsReadout = schlonicView !== null && (hold !== null || isFinished);

  const dispatch = (actionType: string): void => {
    onDispatchAction(actionType, {});
  };

  // Every hook above runs on both beats: the intro is a panel in the host's own
  // control deck rather than a takeover — `rail` and `clock` are both null on
  // it — so a full-bleed zone there would be nonsense and it gets the briefing
  // note instead.
  if (phase !== "play") {
    return (
      <div className={styles.introRoot}>
        <p className={styles.introCard}>{hostSchlonicSurfaceCopy.introDescription}</p>
      </div>
    );
  }

  return (
    <TakeoverCanvas
      rail={rail}
      clock={clock}
      counter={
        schlonicView === null ? null : (
          <>
            <span className={styles.counter}>
              <span>
                {hostSchlonicSurfaceCopy.runCounter(
                  Math.min(schlonicView.runIndex + 1, schlonicView.runsPerTurn),
                  schlonicView.runsPerTurn
                )}
              </span>
              {currentRunnerName !== null && (
                <span className={styles.counterName} data-schlonic-runner-name>
                  {currentRunnerName}
                </span>
              )}
            </span>
            {/* The one number the tablet holder should feel: wings are the
                score AND the health bar (DESIGN.md §2.11), which is why both
                surfaces put this in their chrome and why it is gold. The big
                figure is what the bird is holding now; the pair beside it is
                what the team has banked against par. */}
            <span className={styles.counterWings}>
              <span ref={tallyRef} className={styles.counterInHand} data-schlonic-in-hand>
              {hostSchlonicSurfaceCopy.inHandOnTheLine}
            </span>
              <span className={styles.counterWingsLabel}>
                {hostSchlonicSurfaceCopy.inHandLabel}
              </span>
              <span className={styles.counterBanked} data-schlonic-wings>
                {hostSchlonicSurfaceCopy.wingsTally(schlonicView.wingsBanked, schlonicView.wingsPar)}
              </span>
              <span className={styles.counterWingsLabel}>
                {hostSchlonicSurfaceCopy.bankedLabel}
              </span>
            </span>
          </>
        )
      }
      actions={
        schlonicView === null ? null : (
          <>
            {/* The escape hatches stay on the canvas, not in the override dock:
                skipping a run and resetting the turn are the host's ordinary
                moves here, and AGENTS.md §11 never lets them leave. */}
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={!canAct || !isLive}
              onClick={(): void => {
                dispatch("skipRun");
              }}
            >
              {hostSchlonicSurfaceCopy.skipRunButtonLabel}
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={!canAct}
              onClick={(): void => {
                dispatch("resetTurn");
              }}
            >
              {hostSchlonicSurfaceCopy.resetTurnButtonLabel}
            </button>
            {hint !== null && (
              <span className={styles.hint} data-schlonic-hint>
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
              <div className={styles.finishCard} data-schlonic-finish="finished">
                <p className={styles.finishTitle}>{hostSchlonicSurfaceCopy.finishedTitle}</p>
                <span className={styles.finishPoints}>
                  {hostSchlonicSurfaceCopy.finishPoints(schlonicView.points ?? 0)}
                </span>
              </div>
            )}
            <RunHistory runs={schlonicView.runs} activeRunIndex={schlonicView.runIndex} />
            {isFinished && (
              <RunningTotals
                pendingPointsByTeamId={schlonicView.pendingPointsByTeamId}
                activeTurnTeamId={schlonicView.activeTurnTeamId}
                teamNameByTeamId={teamNameByTeamId}
                note={hostSchlonicSurfaceCopy.parLine(schlonicView.wingsPar)}
              />
            )}
          </>
        )
      }
    >
      {schlonicView === null ? (
        <p className={styles.waitingNote}>{hostSchlonicSurfaceCopy.waitingZoneLabel}</p>
      ) : (
        <Zone
          view={schlonicView}
          canAct={canAct}
          serverOrigin={serverOrigin}
          onDispatchAction={onDispatchAction}
          hold={hold}
          runIndex={shownRunIndex}
          tallyRef={tallyRef}
        />
      )}
    </TakeoverCanvas>
  );
};
