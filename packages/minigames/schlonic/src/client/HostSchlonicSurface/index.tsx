import { useMemo, useRef } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { SchlonicMinigameHostView, SchlonicMinigameRun } from "@wingnight/shared";
import { resolveSchlonicZone } from "@wingnight/shared";

import { resolveRunnerFigure } from "../resolveRunnerFigure/index.js";
import { SchlonicScene, type SchlonicSceneHandle } from "../SchlonicScene/index.js";
import { useHeldRun, type RunHold } from "../useHeldRun/index.js";
import { useSchlonicRunner } from "../useSchlonicRunner/index.js";
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

const resolvePlayerName = (run: SchlonicMinigameRun | null | undefined): string | null => {
  return run?.player?.name ?? null;
};

const HandoffCallout = ({ nextName }: { nextName: string | null }): JSX.Element => (
  <div className={styles.handoffOverlay} data-schlonic-handoff="host">
    <span className={styles.handoffLead}>{hostSchlonicSurfaceCopy.handoffCalloutLead}</span>
    <span className={styles.handoffName}>
      {hostSchlonicSurfaceCopy.handoffCalloutName(nextName)}
    </span>
  </div>
);

const RunHistory = ({ view }: { view: SchlonicMinigameHostView }): JSX.Element => (
  <div className={styles.historyRow}>
    <span className={styles.historyTitle}>{hostSchlonicSurfaceCopy.historyTitle}</span>
    {view.runs.map((run) => (
      <span
        key={run.runIndex}
        className={`${styles.historyEntry}${
          run.runIndex === view.runIndex ? ` ${styles.historyEntryActive}` : ""
        }`}
        data-schlonic-history={run.runIndex}
      >
        <span>{resolvePlayerName(run) ?? hostSchlonicSurfaceCopy.historyPending}</span>
        <span>
          {run.status === "done"
            ? hostSchlonicSurfaceCopy.runOutcome(run.result?.outcome ?? null, run.result?.wings ?? 0)
            : hostSchlonicSurfaceCopy.historyPending}
        </span>
      </span>
    ))}
  </div>
);

const RunningTotals = ({
  view,
  teamNameByTeamId
}: {
  view: SchlonicMinigameHostView;
  teamNameByTeamId: Map<string, string>;
}): JSX.Element => (
  <div className={styles.totalsCard}>
    <span className={styles.totalsTitle}>{hostSchlonicSurfaceCopy.totalsTitle}</span>
    {Object.keys(view.pendingPointsByTeamId).map((teamId) => (
      <div
        key={teamId}
        className={`${styles.totalsRow}${
          teamId === view.activeTurnTeamId ? ` ${styles.totalsRowActive}` : ""
        }`}
      >
        <span>{teamNameByTeamId.get(teamId) ?? teamId}</span>
        <span className={styles.totalsPoints}>
          {hostSchlonicSurfaceCopy.totalsPoints(view.pendingPointsByTeamId[teamId] ?? 0)}
        </span>
      </div>
    ))}
    <span className={styles.totalsNote}>{hostSchlonicSurfaceCopy.parLine(view.wingsPar)}</span>
  </div>
);

type ZoneProps = {
  view: SchlonicMinigameHostView;
  canAct: boolean;
  serverOrigin: string | null;
  onDispatchAction: MinigameHostRendererProps["onDispatchAction"];
  hold: RunHold | null;
  runIndex: number;
};

// The jump surface and the loop behind it. Split from the deck so the runner's refs and the
// scene live together, keyed on the run in hand — or on the run just ended while the beat plays.
const Zone = ({ view, canAct, serverOrigin, onDispatchAction, hold, runIndex }: ZoneProps): JSX.Element => {
  const sceneRef = useRef<SchlonicSceneHandle>(null);
  const run = view.runs[runIndex] ?? null;
  const zone = useMemo(() => {
    return resolveSchlonicZone({ seed: view.zoneSeed, chunks: view.zoneChunks });
  }, [view.zoneSeed, view.zoneChunks]);
  const runner = resolveRunnerFigure({
    figure: run?.player ?? null,
    activeTurnTeamId: view.activeTurnTeamId,
    serverOrigin
  });
  const nextRun = view.runs[runIndex + 1] ?? null;
  const isLive = view.phase === "ready" || view.phase === "running";
  const isArmed = canAct && isLive && hold === null;
  const { press, release } = useSchlonicRunner({
    run,
    zone,
    canAct: isArmed,
    sceneRef,
    onPress: (tick): void => {
      onDispatchAction("press", { tick });
    },
    onRelease: (tick): void => {
      onDispatchAction("release", { tick });
    },
    onEndRun: (): void => {
      onDispatchAction("endRun", {});
    }
  });

  return (
    <div
      className={`${styles.arenaFrame} ${isArmed ? styles.arenaFrameArmed : styles.arenaFrameLocked}`}
      data-schlonic-arena
      onPointerDown={(event): void => {
        event.preventDefault();
        press();
      }}
      onPointerUp={(): void => {
        release();
      }}
      onPointerCancel={(): void => {
        release();
      }}
      onPointerLeave={(): void => {
        release();
      }}
    >
      <div key={runIndex} className={styles.runEnter}>
        <SchlonicScene
          ref={sceneRef}
          zone={zone}
          runner={runner}
          sceneId="host-schlonic"
          label={hostSchlonicSurfaceCopy.sceneLabel(runner.playerName)}
        />
      </div>
      <div className={styles.jumpLegend} data-schlonic-jump-legend>
        <span className={styles.jumpLegendLabel}>{hostSchlonicSurfaceCopy.jumpPadLabel}</span>
        <span className={styles.jumpLegendHint}>{hostSchlonicSurfaceCopy.jumpPadHint}</span>
      </div>
      {hold?.kind === "handoff" && <HandoffCallout nextName={resolvePlayerName(nextRun)} />}
    </div>
  );
};

const resolveHint = (
  view: SchlonicMinigameHostView,
  canAct: boolean,
  hold: RunHold | null
): string => {
  const runIndex = Math.min(view.runIndex, view.runsPerTurn - 1);

  if (hold?.kind === "handoff") {
    return hostSchlonicSurfaceCopy.handoffHint(
      resolvePlayerName(view.runs[hold.runIndex] ?? null),
      resolvePlayerName(view.runs[runIndex] ?? null)
    );
  }

  if (view.phase === "finished") {
    return hostSchlonicSurfaceCopy.finishedHint;
  }

  if (view.phase === "running") {
    return hostSchlonicSurfaceCopy.runningHint;
  }

  return canAct
    ? hostSchlonicSurfaceCopy.readyHint(resolvePlayerName(view.runs[runIndex] ?? null))
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
                {hostSchlonicSurfaceCopy.runningLabel(resolvePlayerName(currentRun))}
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
            <RunHistory view={schlonicView} />
            <RunningTotals view={schlonicView} teamNameByTeamId={teamNameByTeamId} />
          </aside>
        </div>
      )}
    </div>
  );
};
