import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { SchlonicMinigameHostView } from "@wingnight/shared";

import { resolveRunPlayerName } from "../resolveRunPlayerName/index.js";
import { useHeldRun, type RunHold } from "../useHeldRun/index.js";
import { RunHistory } from "./RunHistory/index.js";
import { RunningTotals } from "./RunningTotals/index.js";
import { Zone } from "./Zone/index.js";
import { hostSchlonicSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// Before the view arrives there is no run to hold.
const EMPTY_RUN_VIEW = { runIndex: 0, runsPerTurn: 1, runs: [] };

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
      hostSchlonicSurfaceCopy.noAssignedTeamLabel
    );
  }

  return activeTeamName ?? hostSchlonicSurfaceCopy.noAssignedTeamLabel;
};

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

export const HostSchlonicSurface = ({
  phase,
  minigameHostView,
  activeTeamName,
  teamNameByTeamId,
  canDispatchAction,
  onDispatchAction,
  serverOrigin
}: MinigameHostRendererProps): JSX.Element => {
  const schlonicView = minigameHostView?.minigame === "SCHLONIC" ? minigameHostView : null;
  const resolvedActiveTeamName = resolveActiveTeamName({
    minigameHostView,
    teamNameByTeamId,
    activeTeamName
  });
  const isPlayPhase = phase === "play";
  const canAct = canDispatchAction && schlonicView !== null;
  const isLive =
    schlonicView !== null && (schlonicView.phase === "ready" || schlonicView.phase === "running");
  const { shownRunIndex, hold } = useHeldRun(schlonicView ?? EMPTY_RUN_VIEW);
  const currentRun =
    schlonicView === null
      ? null
      : (schlonicView.runs[Math.min(schlonicView.runIndex, schlonicView.runsPerTurn - 1)] ?? null);

  const dispatch = (actionType: string): void => {
    onDispatchAction(actionType, {});
  };

  return (
    <div className={styles.container}>
      <div className={styles.rail}>
        <span className={styles.railTitle}>{hostSchlonicSurfaceCopy.railTitle}</span>
        <span className={styles.railTeam}>
          <span className={styles.railTeamDot} aria-hidden="true" />
          {hostSchlonicSurfaceCopy.teamPrefix} {resolvedActiveTeamName}
        </span>
        {isPlayPhase && schlonicView !== null && (
          <span className={styles.railWings} data-schlonic-wings>
            {hostSchlonicSurfaceCopy.wingsTally(schlonicView.wingsBanked, schlonicView.wingsPar)}
            <span className={styles.railWingsLabel}>{hostSchlonicSurfaceCopy.wingsLabel}</span>
          </span>
        )}
      </div>
      {!isPlayPhase && <p className={styles.introCard}>{hostSchlonicSurfaceCopy.introDescription}</p>}
      {isPlayPhase && schlonicView !== null && (
        <div className={styles.playArea}>
          <div className={styles.arenaColumn}>
            <Zone
              view={schlonicView}
              canAct={canAct}
              serverOrigin={serverOrigin}
              onDispatchAction={onDispatchAction}
              hold={hold}
              runIndex={shownRunIndex}
            />
            <p className={styles.arenaHint}>{resolveHint(schlonicView, canAct, hold)}</p>
          </div>
          <aside className={styles.deck}>
            <div className={styles.runCard}>
              <span className={styles.runCounter}>
                {hostSchlonicSurfaceCopy.runCounter(
                  Math.min(schlonicView.runIndex + 1, schlonicView.runsPerTurn),
                  schlonicView.runsPerTurn
                )}
              </span>
              <p className={styles.runningName}>
                {hostSchlonicSurfaceCopy.runningLabel(resolveRunPlayerName(currentRun))}
              </p>
              <div className={styles.runMeta}>
                <span>{hostSchlonicSurfaceCopy.bankedTitle}</span>
                <span>
                  {hostSchlonicSurfaceCopy.wingsTally(schlonicView.wingsBanked, schlonicView.wingsPar)}
                </span>
              </div>
            </div>
            {schlonicView.phase === "finished" && (
              <div className={styles.finishCard} data-schlonic-finish="finished">
                <p className={styles.finishTitle}>{hostSchlonicSurfaceCopy.finishedTitle}</p>
                <span className={styles.finishPoints}>
                  {hostSchlonicSurfaceCopy.finishPoints(schlonicView.points ?? 0)}
                </span>
              </div>
            )}
            <div className={styles.deckRows}>
              <button
                className={styles.deckRowButton}
                type="button"
                disabled={!canAct || !isLive}
                onClick={(): void => {
                  dispatch("skipRun");
                }}
              >
                {hostSchlonicSurfaceCopy.skipRunButtonLabel}
              </button>
              <button
                className={styles.deckRowButton}
                type="button"
                disabled={!canAct}
                onClick={(): void => {
                  dispatch("resetTurn");
                }}
              >
                {hostSchlonicSurfaceCopy.resetTurnButtonLabel}
              </button>
            </div>
            <RunHistory runs={schlonicView.runs} activeRunIndex={schlonicView.runIndex} />
            <RunningTotals
              pendingPointsByTeamId={schlonicView.pendingPointsByTeamId}
              activeTurnTeamId={schlonicView.activeTurnTeamId}
              teamNameByTeamId={teamNameByTeamId}
              note={hostSchlonicSurfaceCopy.parLine(schlonicView.wingsPar)}
            />
          </aside>
        </div>
      )}
    </div>
  );
};
