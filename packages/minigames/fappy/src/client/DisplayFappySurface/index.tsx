import { useMemo, useRef, type ReactNode } from "react";
import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import { NeonMarquee } from "@wingnight/surface";
import type { FappyMinigameDisplayView, FappyMinigameLeg } from "@wingnight/shared";
import { resolveFappyGates } from "@wingnight/shared";

import { MIRROR_HOLD_SLACK_MS } from "../beats/index.js";
import { FappyScene, type FappySceneHandle } from "../FappyScene/index.js";
import { RelayLineup } from "../RelayLineup/index.js";
import { resolveLegBird } from "../resolveLegBird/index.js";
import { useFappyMirror } from "../useFappyMirror/index.js";
import { useHeldLeg, type LegHold } from "../useHeldLeg/index.js";
import { formatRelayClock, useRelayClock } from "../useRelayClock/index.js";
import { displayFappySurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// The clock turns to heat with this much of the limit left.
const URGENT_REMAINING_MS = 15_000;

const FappyIntro = (): JSX.Element => {
  return (
    <div className={styles.container}>
      <h2 className={styles.introTitle}>{displayFappySurfaceCopy.introTitle}</h2>
      <p className={styles.introDescription}>{displayFappySurfaceCopy.introDescription}</p>
    </div>
  );
};

const ResultPlaque = ({ view, elapsedMs }: { view: FappyMinigameDisplayView; elapsedMs: number | null }): JSX.Element => {
  const isTimedOut = view.phase === "timedOut";

  return (
    <div className={styles.resultOverlay} data-fappy-result={view.phase}>
      <div className={`${styles.resultPlaque}${isTimedOut ? ` ${styles.resultPlaqueTimedOut}` : ""}`}>
        <div>
          <p className={`${styles.resultTitle}${isTimedOut ? ` ${styles.resultTitleTimedOut}` : ""}`}>
            {isTimedOut ? displayFappySurfaceCopy.timedOutTitle : displayFappySurfaceCopy.finishedTitle}
          </p>
          <p className={styles.resultBlurb}>
            {isTimedOut
              ? displayFappySurfaceCopy.timedOutBlurb(
                  view.totalGatesCleared,
                  view.legsPerTurn * view.gatesPerLeg
                )
              : displayFappySurfaceCopy.finishedBlurb(formatRelayClock(elapsedMs ?? 0))}
          </p>
        </div>
        <span className={styles.resultPoints}>{displayFappySurfaceCopy.points(view.points ?? 0)}</span>
      </div>
    </div>
  );
};

// The beat between legs, on the wall: whose tablet it is now, big enough to
// read from the sofa, over the landing the room just watched.
const HandoffCallout = ({
  nextName,
  onDeckName
}: {
  nextName: string | null;
  onDeckName: string | null;
}): JSX.Element => (
  <div className={styles.handoffOverlay} data-fappy-handoff="display">
    <div className={styles.handoffCard}>
      <span className={styles.handoffName}>{displayFappySurfaceCopy.handoffCalloutName(nextName)}</span>
      <span className={styles.handoffLine}>{displayFappySurfaceCopy.handoffCalloutLine}</span>
      {/* And who is up after them, so the room gets the next one moving.
          Nothing at all when there is nobody after. */}
      {onDeckName !== null && (
        <span className={styles.handoffThen} data-fappy-on-deck="display">
          {displayFappySurfaceCopy.handoffCalloutThen(onDeckName)}
        </span>
      )}
    </div>
  </div>
);

const resolveStatusLine = (
  view: FappyMinigameDisplayView,
  leg: FappyMinigameLeg | null,
  playerName: string | null,
  waitingName: string | null,
  onDeckName: string | null,
  hold: LegHold | null
): string => {
  if (hold?.kind === "handoff") {
    return displayFappySurfaceCopy.handoffPrompt(playerName, waitingName);
  }

  if (view.phase === "finished") {
    return displayFappySurfaceCopy.finishedPrompt;
  }

  if (view.phase === "timedOut") {
    return displayFappySurfaceCopy.timedOutPrompt;
  }

  if (view.phase === "flying") {
    return displayFappySurfaceCopy.flyingPrompt(playerName, waitingName, onDeckName);
  }

  if (leg !== null && leg.attempt > 0) {
    return displayFappySurfaceCopy.respawnPrompt(playerName, waitingName, onDeckName);
  }

  return displayFappySurfaceCopy.readyPrompt(playerName, waitingName, onDeckName);
};

const FappyPlayBody = ({
  view,
  activeTeamName,
  clock,
  clockLine,
  serverOrigin
}: {
  view: FappyMinigameDisplayView;
  activeTeamName: string | null;
  clock: ReactNode;
  clockLine: ReactNode;
  serverOrigin: string | null;
}): JSX.Element => {
  const sceneRef = useRef<FappySceneHandle>(null);
  // A cleared leg stays on the wall while its landing and the handoff play,
  // a little longer than the tablet holds it, because the replay here runs
  // behind; once the relay is over the last leg stays for good.
  const { shownLegIndex: legIndex, hold } = useHeldLeg(view, MIRROR_HOLD_SLACK_MS);
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
  // Who is up after the handoff; null on the last two legs.
  const onDeckName = view.legs[legIndex + 2]?.player?.name ?? null;
  const elapsedMs = useRelayClock({
    startedAtMs: view.startedAtMs,
    endedAtMs: view.timedOutAtMs ?? view.finishedAtMs
  });
  const isOver = view.phase === "finished" || view.phase === "timedOut";
  const remainingMs = view.limitSeconds * 1000 - (elapsedMs ?? 0);
  const clockClassName =
    elapsedMs !== null && !isOver && remainingMs <= URGENT_REMAINING_MS
      ? styles.marqueeClockUrgent
      : elapsedMs !== null && elapsedMs > view.parSeconds * 1000
        ? styles.marqueeClockPastPar
        : "";

  useFappyMirror({ leg, gatesPerLeg: view.gatesPerLeg, sceneRef });

  return (
    <div className={styles.stage}>
      <NeonMarquee
        title={displayFappySurfaceCopy.title}
        teamName={activeTeamName}
        readout={
          <>
            <span className={styles.marqueeLeg}>
              {displayFappySurfaceCopy.legCounter(legIndex + 1, view.legsPerTurn)}
            </span>
            <span className={styles.marqueeGates}>
              {displayFappySurfaceCopy.gatesCounter(
                view.totalGatesCleared,
                view.legsPerTurn * view.gatesPerLeg
              )}
            </span>
            {/* The relay clock is the LEG's and FAPPY's own; the shell's
                `clock` and `clockLine` are the room's, and FAPPY is
                `timerKey: null` so they draw nothing and cost nothing. */}
            <span className={`${styles.marqueeClock} ${clockClassName}`} data-fappy-clock>
              {elapsedMs === null ? displayFappySurfaceCopy.clockIdle : formatRelayClock(elapsedMs)}
            </span>
          </>
        }
        clock={clock}
        clockLine={clockLine}
      />
      {/* The relay's running order, at sofa size, under the sign (step 2).
          The tablet carries the same strip on its chrome row — one component,
          two font-sizes — so the room and the player read one picture.

          It lights the HELD leg, not the live one: while the handoff beat
          plays, this screen's marquee still says "Leg 1" and its callout is
          still naming who to hand to, so a strip already lit on leg 2 would
          be the only thing on the wall that had moved on. The tablet's strip
          is on the live leg for the opposite reason — its holder has the
          tablet in hand and is asking what is next. */}
      <RelayLineup
        legs={view.legs}
        activeLegIndex={isOver ? null : legIndex}
        activeTurnTeamId={view.activeTurnTeamId}
        serverOrigin={serverOrigin}
        surface="wall"
      />
      <div className={styles.arenaArea}>
        <div key={legIndex} className={styles.legEnter}>
          <FappyScene
            ref={sceneRef}
            gates={gates}
            gatesPerLeg={view.gatesPerLeg}
            bird={bird}
            waitingBird={waitingBird}
            sceneId="display-fappy"
            label={displayFappySurfaceCopy.sceneLabel(bird.playerName)}
          />
        </div>
        {hold?.kind === "handoff" && (
          <HandoffCallout nextName={waitingBird?.playerName ?? null} onDeckName={onDeckName} />
        )}
        {isOver && hold === null && <ResultPlaque view={view} elapsedMs={elapsedMs} />}
      </div>
      <p className={styles.statusLine}>
        {resolveStatusLine(view, leg, bird.playerName, waitingBird?.playerName ?? null, onDeckName, hold)}
      </p>
    </div>
  );
};

export const DisplayFappySurface = ({
  phase,
  minigameDisplayView,
  activeTeamName,
  clock,
  clockLine,
  serverOrigin
}: MinigameDisplayRendererProps): JSX.Element => {
  const fappyView = minigameDisplayView?.minigame === "FAPPY" ? minigameDisplayView : null;

  if (phase !== "play") {
    return <FappyIntro />;
  }

  if (fappyView === null) {
    return (
      <div className={styles.container}>
        <p className={styles.hint}>{displayFappySurfaceCopy.waitingLabel}</p>
      </div>
    );
  }

  return (
    <FappyPlayBody
      view={fappyView}
      activeTeamName={activeTeamName}
      clock={clock}
      clockLine={clockLine}
      serverOrigin={serverOrigin}
    />
  );
};
