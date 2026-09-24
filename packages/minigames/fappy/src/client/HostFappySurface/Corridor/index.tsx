import { useMemo, useRef, useState } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { FappyMinigameHostView } from "@wingnight/shared";
import { resolveFappyGates } from "@wingnight/shared";

import { FappyScene, type FappySceneHandle } from "../../FappyScene/index.js";
import { resolveLegBird } from "../../resolveLegBird/index.js";
import { useFappyRunner } from "../../useFappyRunner/index.js";
import type { LegHold } from "../../useHeldLeg/index.js";
import { LegPoster } from "./LegPoster/index.js";
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
const HandoffCallout = ({
  nextName,
  onDeckName
}: {
  nextName: string | null;
  onDeckName: string | null;
}): JSX.Element => (
  <div className={styles.handoffOverlay} data-fappy-handoff="host">
    <span className={styles.handoffLead}>{corridorCopy.handoffCalloutLead}</span>
    <span className={styles.handoffName}>{corridorCopy.handoffCalloutName(nextName)}</span>
    {/* Who to get standing up while the tablet is still in the air. Nothing
        at all when there is nobody after — the relay must not promise a
        player it does not have. */}
    {onDeckName !== null && (
      <span className={styles.handoffThen} data-fappy-on-deck="host">
        {corridorCopy.handoffCalloutThen(onDeckName)}
      </span>
    )}
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
  // The leg after the one waiting on the cliff, for the callout's second line.
  const onDeckName = view.legs[legIndex + 2]?.player?.name ?? null;
  const isLive = view.phase === "ready" || view.phase === "flying";
  const isArmed = canAct && isLive && hold === null;
  // The poster goes on the first flap, not on the server's echo of it: the
  // attempt is the key, so a crash (which bumps `attempt`) brings it back and
  // a landing (which bumps the leg) brings the next player's.
  const [launchedAttemptKey, setLaunchedAttemptKey] = useState<string | null>(null);
  const attemptKey = `${legIndex}:${leg?.attempt ?? 0}`;
  const isPosterUp =
    leg !== null && view.phase === "ready" && hold === null && launchedAttemptKey !== attemptKey;
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

        if (isArmed) {
          setLaunchedAttemptKey(attemptKey);
        }

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
      {isPosterUp && <LegPoster bird={bird} isRespawn={(leg?.attempt ?? 0) > 0} />}
      {hold?.kind === "handoff" && (
        <HandoffCallout nextName={waitingBird?.playerName ?? null} onDeckName={onDeckName} />
      )}
    </div>
  );
};
