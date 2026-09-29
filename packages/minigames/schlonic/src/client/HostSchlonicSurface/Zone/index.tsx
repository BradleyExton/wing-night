import { useRef, type RefObject } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { SchlonicMinigameHostView } from "@wingnight/shared";

import type { SchlonicMirrorEventHandler } from "../../mirrorEvents/index.js";
import { resolveRunPlayerName } from "../../resolveRunPlayerName/index.js";
import { SchlonicScene, type SchlonicSceneHandle } from "../../SchlonicScene/index.js";
import type { RunHold } from "../../useHeldRun/index.js";
import { useRunnerFigure } from "../../useRunnerFigure/index.js";
import { useSchlonicRunner } from "../../useSchlonicRunner/index.js";
import { useSchlonicStreet } from "../../useSchlonicStreet/index.js";
import { zoneCopy } from "./copy.js";
import * as styles from "./styles.js";

type ZoneProps = {
  view: SchlonicMinigameHostView;
  canAct: boolean;
  serverOrigin: string | null;
  onDispatchAction: MinigameHostRendererProps["onDispatchAction"];
  hold: RunHold | null;
  runIndex: number;
  /** The chrome's wings-in-hand figure, which the paint loop writes into. */
  tallyRef: RefObject<HTMLElement>;
  /** The run's sound events, for a zone that is its own speaker; absent on the night. */
  onRunnerEvent?: SchlonicMirrorEventHandler;
};

const HandoffCallout = ({ nextName }: { nextName: string | null }): JSX.Element => (
  <div className={styles.handoffOverlay} data-schlonic-handoff="host">
    <span className={styles.handoffLead}>{zoneCopy.handoffCalloutLead}</span>
    <span className={styles.handoffName}>{zoneCopy.handoffCalloutName(nextName)}</span>
  </div>
);

// The jump surface and the loop behind it, filling the takeover's body slot edge to edge. The
// runner's refs and the scene live together, keyed on the run in hand — or on the run just ended
// while the beat plays.
//
// Nothing floats in here but the handoff callout, which is the beat itself rather than chrome: a
// Canvas body may not draw its own chrome (docs/takeover-layout-api.md §5), and the JUMP legend
// that used to sit at `bottom-3 left-3` is now the layout's `actions` slot, which owns that
// corner.
export const Zone = ({
  view,
  canAct,
  serverOrigin,
  onDispatchAction,
  hold,
  runIndex,
  tallyRef,
  onRunnerEvent
}: ZoneProps): JSX.Element => {
  const sceneRef = useRef<SchlonicSceneHandle>(null);
  const run = view.runs[runIndex] ?? null;
  // The leg of the street this run is played on: run n is leg n of the course.
  const { zone, ghostLeg } = useSchlonicStreet(view, runIndex);
  const runner = useRunnerFigure({
    figure: run?.player ?? null,
    activeTurnTeamId: view.activeTurnTeamId,
    serverOrigin
  });
  // The leg to beat, as a figure — in its own team's colour, which is never this team's. A leg
  // the best turn skipped leaves this leg with nobody to race.
  const ghostFigure = useRunnerFigure({
    figure: ghostLeg?.player ?? null,
    activeTurnTeamId: view.bestTurn?.teamId ?? null,
    serverOrigin
  });
  const ghost = ghostLeg === null ? null : ghostFigure;
  const nextRun = view.runs[runIndex + 1] ?? null;
  const isLive = view.phase === "ready" || view.phase === "running";
  const isArmed = canAct && isLive && hold === null;
  const { press, release } = useSchlonicRunner({
    run,
    zone,
    canAct: isArmed,
    sceneRef,
    tallyRef,
    ghost: ghostLeg,
    onPress: (tick): void => {
      onDispatchAction("press", { tick });
    },
    onRelease: (tick): void => {
      onDispatchAction("release", { tick });
    },
    onEndRun: (): void => {
      onDispatchAction("endRun", {});
    },
    onEvent: onRunnerEvent
  });

  return (
    <div
      className={`${styles.container} ${isArmed ? styles.containerArmed : styles.containerLocked}`}
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
          label={zoneCopy.sceneLabel(runner.playerName)}
          ghost={ghost}
          leg={{ index: runIndex, count: view.runsPerTurn }}
        />
      </div>
      {hold?.kind === "handoff" && <HandoffCallout nextName={resolveRunPlayerName(nextRun)} />}
    </div>
  );
};
