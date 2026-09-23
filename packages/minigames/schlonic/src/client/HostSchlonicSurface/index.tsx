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

const resolveHint = (
  view: SchlonicMinigameHostView,
  canAct: boolean,
  hold: RunHold | null
): string => {
  const runIndex = Math.min(view.runIndex, view.runsPerTurn - 1);

  if (hold?.kind === "handoff") {
    return hostSchlonicSurfaceCopy.handoffHint(
      resolveRunPlayerName(view.runs[hold.runIndex] ?? null),
      resolveRunPlayerName(view.runs[runIndex] ?? null)
    );
  }

  if (view.phase === "finished") {
    return hostSchlonicSurfaceCopy.finishedHint;
  }

  if (view.phase === "running") {
    return hostSchlonicSurfaceCopy.runningHint;
  }

  return canAct
    ? hostSchlonicSurfaceCopy.readyHint(resolveRunPlayerName(view.runs[runIndex] ?? null))
    : hostSchlonicSurfaceCopy.readyLockedHint;
};

// SCHLONIC's host surface. At play it is a `<TakeoverCanvas>`
// (docs/takeover-layout-api.md §3, §5): the zone is evenly spread scenery — a
// bay, a shoreline and a skyline — so a chip in one corner costs a corner of
// Barrie rather than a word, and the 330px control deck this file used to grow
// — which cost the zone 342px of the tablet — is gone. Its contents went to
// the slots §5 names: the counts to `counter`, the escape hatches and the jump
// legend and the hint to `actions`, the run list and the running totals to
// `readout`.
//
// Nothing rides in the body. JOUST puts the lane's name on a plate over its
// top-left sky, and FAPPY could not because its bird is pinned at 20% of the
// scene's width; SCHLONIC's runner is pinned at 46 of the world's 160 units —
// 28.75%, which at 1229px of canvas is 353px in, against a plate that reaches
// 303px — and it climbs. A held jump is worth ~27 world units and a springboard
// ~81 of the world's 90, so the hen crosses the top-left sky on any decent
// bounce. So this surface follows FAPPY: who is running is a chip in the chrome
// row, and every pixel of the zone stays jump surface.
//
// It renders no rail and no team chip of its own — `rail` arrives filled with
// the shell's `<HostMiniRail />`, which already says the round, the sauce and
// whose turn it is — which is why the `resolveActiveTeamName` helper that all
// nine host surfaces had copied is no longer here. It writes no z-index, no
// `isolate` and no dock gutter either; the layout owns all three.
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
  // The zone lingers on the run just ended while the handoff plays; the chrome
  // row is already on the next one, which is the run the room is asking about.
  const { shownRunIndex, hold } = useHeldRun(schlonicView ?? EMPTY_RUN_VIEW);
  const currentRun =
    schlonicView === null
      ? null
      : (schlonicView.runs[Math.min(schlonicView.runIndex, schlonicView.runsPerTurn - 1)] ?? null);

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
              {hostSchlonicSurfaceCopy.runCounter(
                Math.min(schlonicView.runIndex + 1, schlonicView.runsPerTurn),
                schlonicView.runsPerTurn
              )}
            </span>
            <span className={styles.counterName}>
              {hostSchlonicSurfaceCopy.runningLabel(resolveRunPlayerName(currentRun))}
            </span>
            {/* The one number the tablet holder should feel: wings are the
                score AND the health bar (DESIGN.md §2.11), which is why both
                surfaces put this in their chrome and why it is gold. */}
            <span className={styles.counterWings} data-schlonic-wings>
              {hostSchlonicSurfaceCopy.wingsTally(schlonicView.wingsBanked, schlonicView.wingsPar)}
              <span className={styles.counterWingsLabel}>
                {hostSchlonicSurfaceCopy.wingsLabel}
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
            {/* The jump legend, out of the zone and into the slot that already
                owns this corner. It was the one piece of floating chrome a
                Canvas body may not draw (§5), and it was sitting at the actions
                row's own bottom-left inset — two chips in one place. It takes
                no pointer here: the layout hands one to controls, not to
                children, so the zone under it is still all jump surface. */}
            <span className={styles.jumpLegend} data-schlonic-jump-legend>
              <span className={styles.jumpLegendLabel}>
                {hostSchlonicSurfaceCopy.jumpPadLabel}
              </span>
              <span className={styles.jumpLegendHint}>
                {hostSchlonicSurfaceCopy.jumpPadHint}
              </span>
            </span>
            <span className={styles.hint}>{resolveHint(schlonicView, canAct, hold)}</span>
          </>
        )
      }
      readout={
        schlonicView === null ? null : (
          <>
            {schlonicView.phase === "finished" && (
              <div className={styles.finishCard} data-schlonic-finish="finished">
                <p className={styles.finishTitle}>{hostSchlonicSurfaceCopy.finishedTitle}</p>
                <span className={styles.finishPoints}>
                  {hostSchlonicSurfaceCopy.finishPoints(schlonicView.points ?? 0)}
                </span>
              </div>
            )}
            <RunHistory runs={schlonicView.runs} activeRunIndex={schlonicView.runIndex} />
            <RunningTotals
              pendingPointsByTeamId={schlonicView.pendingPointsByTeamId}
              activeTurnTeamId={schlonicView.activeTurnTeamId}
              teamNameByTeamId={teamNameByTeamId}
              note={hostSchlonicSurfaceCopy.parLine(schlonicView.wingsPar)}
            />
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
        />
      )}
    </TakeoverCanvas>
  );
};
