import { useMemo, useRef } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { FappyMinigameHostView } from "@wingnight/shared";
import { resolveFappyGates } from "@wingnight/shared";

import { FappyScene, type FappySceneHandle } from "../../FappyScene/index.js";
import { resolveLegBird } from "../../resolveLegBird/index.js";
import { useFappyRunner } from "../../useFappyRunner/index.js";
import type { LegHold } from "../../useHeldLeg/index.js";
import { corridorCopy } from "./copy.js";
import * as styles from "./styles.js";

type CorridorProps = {
  view: FappyMinigameHostView;
  canAct: boolean;
  serverOrigin: string | null;
  onDispatchAction: MinigameHostRendererProps["onDispatchAction"];
  hold: LegHold | null;
  legIndex: number;
};

// The beat between legs, over the corridor: whose tablet it is now. The
// finger that just landed is still on the glass, so the arena is dead for
// the beat and the name is the only thing to read.
const HandoffCallout = ({ nextName }: { nextName: string | null }): JSX.Element => (
  <div className={styles.handoffOverlay} data-fappy-handoff="host">
    <span className={styles.handoffLead}>{corridorCopy.handoffCalloutLead}</span>
    <span className={styles.handoffName}>{corridorCopy.handoffCalloutName(nextName)}</span>
  </div>
);

// The flap surface and the loop behind it. Split from the deck so the
// runner's refs and the scene live together, keyed on the leg in hand — or
// on the leg just cleared while the handoff plays out.
export const Corridor = ({
  view,
  canAct,
  serverOrigin,
  onDispatchAction,
  hold,
  legIndex
}: CorridorProps): JSX.Element => {
  const sceneRef = useRef<FappySceneHandle>(null);
  const leg = view.legs[legIndex] ?? null;
  const gates = useMemo(() => {
    return leg === null
      ? []
      : resolveFappyGates({ seed: leg.seed, legIndex: leg.legIndex, gatesPerLeg: view.gatesPerLeg });
  }, [leg, view.gatesPerLeg]);
  const bird = resolveLegBird({
    figure: leg?.player ?? null,
    activeTurnTeamId: view.activeTurnTeamId,
    serverOrigin
  });
  // Who stands on the landing cliff: the next leg's player, or nobody on the last leg.
  const nextLeg = view.legs[legIndex + 1] ?? null;
  const waitingBird =
    nextLeg === null
      ? null
      : resolveLegBird({ figure: nextLeg.player, activeTurnTeamId: view.activeTurnTeamId, serverOrigin });
  const isLive = view.phase === "ready" || view.phase === "flying";
  const isArmed = canAct && isLive && hold === null;
  const { flap } = useFappyRunner({
    leg,
    gatesPerLeg: view.gatesPerLeg,
    canAct: isArmed,
    sceneRef,
    onFlap: (tick): void => {
      onDispatchAction("flap", { tick });
    },
    onEndLeg: (): void => {
      onDispatchAction("endLeg", {});
    }
  });

  return (
    <div
      className={`${styles.container} ${isArmed ? styles.containerArmed : styles.containerLocked}`}
      data-fappy-arena
      onPointerDown={(event): void => {
        event.preventDefault();
        flap();
      }}
    >
      <div key={legIndex} className={styles.legEnter}>
        <FappyScene
          ref={sceneRef}
          gates={gates}
          gatesPerLeg={view.gatesPerLeg}
          bird={bird}
          waitingBird={waitingBird}
          sceneId="host-fappy"
          label={corridorCopy.sceneLabel(bird.playerName)}
        />
      </div>
      {hold?.kind === "handoff" && <HandoffCallout nextName={waitingBird?.playerName ?? null} />}
    </div>
  );
};
