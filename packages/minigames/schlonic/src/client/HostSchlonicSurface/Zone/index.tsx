import { useMemo, useRef, type RefObject } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { SchlonicMinigameHostView } from "@wingnight/shared";
import { resolveSchlonicZone } from "@wingnight/shared";

import { resolveRunPlayerName } from "../../resolveRunPlayerName/index.js";
import { SchlonicScene, type SchlonicSceneHandle } from "../../SchlonicScene/index.js";
import type { RunHold } from "../../useHeldRun/index.js";
import { useRunnerFigure } from "../../useRunnerFigure/index.js";
import { useSchlonicRunner } from "../../useSchlonicRunner/index.js";
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
  tallyRef
}: ZoneProps): JSX.Element => {
  const sceneRef = useRef<SchlonicSceneHandle>(null);
  const run = view.runs[runIndex] ?? null;
  const zone = useMemo(() => {
    return resolveSchlonicZone({ seed: view.zoneSeed, chunks: view.zoneChunks });
  }, [view.zoneSeed, view.zoneChunks]);
  const runner = useRunnerFigure({
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
    tallyRef,
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
        />
      </div>
      {hold?.kind === "handoff" && <HandoffCallout nextName={resolveRunPlayerName(nextRun)} />}
    </div>
  );
};
