import { useRef, type PointerEvent, type RefObject } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { MountInputSample, MountMinigameHostView } from "@wingnight/shared";

import type { MountDisplayEventHandler } from "../../mirrorEvents/index.js";
import { MountScene, type MountSceneHandle } from "../../MountScene/index.js";
import { useClimberFigure } from "../../useClimberFigure/index.js";
import type { ClimbHold } from "../../useHeldClimb/index.js";
import { useMountRunner, type MountStamp } from "../../useMountRunner/index.js";
import { arenaCopy } from "./copy.js";
import * as styles from "./styles.js";

type ArenaProps = {
  view: MountMinigameHostView;
  canAct: boolean;
  serverOrigin: string | null;
  onDispatchAction: MinigameHostRendererProps["onDispatchAction"];
  hold: ClimbHold | null;
  /** The climb to draw: the one in hand, or the one just ended while its beat plays. */
  climbIndex: number;
  /** The counter's clock, which the paint loop writes into. */
  clockRef: RefObject<HTMLElement>;
  /** The climb's sound events, for a tablet that is its own speaker; absent on the night. */
  onRunnerEvent?: MountDisplayEventHandler;
};

// The plugin envelope carries no team, so every turn action names its own (spec §0.5, as built).
const stamped = (stamp: MountStamp, samples?: MountInputSample[]): Record<string, string | number | MountInputSample[]> => ({
  ...(stamp.teamId === undefined ? {} : { teamId: stamp.teamId }),
  climbIndex: stamp.climbIndex,
  ...(samples === undefined ? {} : { samples })
});

const HandoffCallout = ({ nextName }: { nextName: string | null }): JSX.Element => (
  <div className={styles.handoffOverlay} data-mount-handoff-callout="host">
    <span className={styles.handoffLead}>{arenaCopy.handoffCalloutLead}</span>
    <span className={styles.handoffName}>{arenaCopy.handoffCalloutName(nextName)}</span>
  </div>
);

// The climb and the loop behind it, filling the takeover's body slot edge to edge, and the whole
// of it the pointer area (spec §0.5): a finger lands, takes the nearest free limb within reach,
// drags it, lifts. Pointers are tracked by id with capture, so two thumbs can hold two limbs.
export const Arena = ({
  view,
  canAct,
  serverOrigin,
  onDispatchAction,
  hold,
  climbIndex,
  clockRef,
  onRunnerEvent
}: ArenaProps): JSX.Element => {
  const sceneRef = useRef<MountSceneHandle>(null);
  const viewClimb = view.climbs[climbIndex] ?? null;
  const climber = useClimberFigure(viewClimb?.player ?? null, view.activeTurnTeamId, serverOrigin);
  const isLive = view.phase === "ready" || view.phase === "running";
  const isArmed = canAct && isLive && hold === null;
  const runner = useMountRunner({
    viewClimb,
    pile: view.pile,
    rules: view.rules,
    activeTurnTeamId: view.activeTurnTeamId,
    canAct: isArmed,
    sceneRef,
    clockRef,
    onLimb: (stamp, samples): void => {
      onDispatchAction("limb", stamped(stamp, samples));
    },
    onEndClimb: (stamp): void => {
      onDispatchAction("endClimb", stamped(stamp));
    },
    onEvent: onRunnerEvent
  });

  const toWorld = (event: PointerEvent<HTMLDivElement>): { x: number; y: number } | null => {
    return sceneRef.current?.toWorld(event.clientX, event.clientY) ?? null;
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    const point = toWorld(event);

    if (point === null || !runner.touchStart(event.pointerId, point)) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const point = toWorld(event);

    if (point !== null) {
      runner.touchMove(event.pointerId, point);
    }
  };

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>): void => {
    runner.touchEnd(event.pointerId);
  };

  return (
    <div
      className={`${styles.container}${isArmed ? "" : ` ${styles.containerLocked}`}`}
      data-mount-arena
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onLostPointerCapture={onPointerEnd}
    >
      <MountScene
        ref={sceneRef}
        surface="host"
        pile={runner.pile}
        figures={view.figures}
        climber={climber}
        serverOrigin={serverOrigin}
        label={arenaCopy.sceneLabel(climber.playerName)}
      />
      {hold?.kind === "handoff" && <HandoffCallout nextName={view.climbs[climbIndex + 1]?.player?.name ?? null} />}
    </div>
  );
};
