import { useMemo, useRef, type ReactNode } from "react";
import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import { NeonMarquee } from "@wingnight/surface";
import type { FappyMinigameDisplayView, FappyMinigameLeg } from "@wingnight/shared";
import { resolveFappyGates } from "@wingnight/shared";

import { MIRROR_HOLD_SLACK_MS } from "../beats/index.js";
import { FappyScene, type FappySceneHandle } from "../FappyScene/index.js";
import { PaceTrack } from "../PaceTrack/index.js";
import { RelayLineup } from "../RelayLineup/index.js";
import { resolveFinishClock, type FinishClock } from "../pressure/index.js";
import { resolveLegBird } from "../resolveLegBird/index.js";
import { useFappyMirror } from "../useFappyMirror/index.js";
import { useFappySounds } from "../useFappySounds/index.js";
import { useHeldLeg, type LegHold } from "../useHeldLeg/index.js";
import { formatRelayClock, formatRelayClockSeconds, useRelayClock } from "../useRelayClock/index.js";
import { MarqueeReadout } from "./MarqueeReadout/index.js";
import { displayFappySurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

const FappyIntro = (): JSX.Element => {
  return (
    <div className={styles.container}>
      <h2 className={styles.introTitle}>{displayFappySurfaceCopy.introTitle}</h2>
      <p className={styles.introDescription}>{displayFappySurfaceCopy.introDescription}</p>
    </div>
  );
};

const ResultPlaque = ({
  view,
  finishClock
}: {
  view: FappyMinigameDisplayView;
  finishClock: FinishClock;
}): JSX.Element => {
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
              : displayFappySurfaceCopy.finishedBlurb(formatRelayClock(finishClock.elapsedMs ?? 0))}
          </p>
          {/* The clock on the plaque is the SCORED time, so when a forgiven
              leg put seconds in it the room is told which seconds. */}
          {finishClock.penaltyMs > 0 && (
            <p className={styles.resultPenalty} data-fappy-penalty="display">
              {displayFappySurfaceCopy.penaltyLine(
                formatRelayClockSeconds(finishClock.penaltyMs),
                finishClock.skippedLegs
              )}
            </p>
          )}
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
  // Two clocks, deliberately. `elapsedMs` is the wall the room watches tick and
  // the one every live cue (the urgency colour, the soundboard's heartbeat, the
  // pace strip) is timed against. `finishClock` is what the relay SCORED, which
  // is the wall plus the penalty for every forgiven leg — the only honest
  // number to leave on the screen once the points are on the board.
  const finishClock = resolveFinishClock(view, elapsedMs);
  const shownElapsedMs = isOver ? finishClock.elapsedMs : elapsedMs;

  // The TV is the room's speaker, so FAPPY's whole soundboard hangs off this one surface.
  const handleFappySound = useFappySounds({ view, hold, elapsedMs });

  useFappyMirror({ leg, gatesPerLeg: view.gatesPerLeg, sceneRef, onEvent: handleFappySound });

  return (
    <div className={styles.stage}>
      <NeonMarquee
        title={displayFappySurfaceCopy.title}
        teamName={activeTeamName}
        readout={
          <MarqueeReadout
            view={view}
            shownLegIndex={legIndex}
            elapsedMs={elapsedMs}
            shownElapsedMs={shownElapsedMs}
            isOver={isOver}
          />
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
      {/* The race, as a race: the team's own bird placed by the course it has
          cleared and a ghost hen placed by the clock, both running at the par
          tick. Ahead or behind stops being arithmetic off two counters and
          becomes which face is in front. */}
      <PaceTrack view={view} elapsedMs={elapsedMs} bird={bird} />
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
        {isOver && hold === null && <ResultPlaque view={view} finishClock={finishClock} />}
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
