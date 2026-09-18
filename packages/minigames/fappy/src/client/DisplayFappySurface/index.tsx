import { useMemo, useRef } from "react";
import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import type { FappyMinigameDisplayView, FappyMinigameLeg } from "@wingnight/shared";
import { resolveFappyGates } from "@wingnight/shared";

import { FappyScene, type FappySceneHandle } from "../FappyScene/index.js";
import { resolveLegBird } from "../resolveLegBird/index.js";
import { useFappyMirror } from "../useFappyMirror/index.js";
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

const resolveStatusLine = (
  view: FappyMinigameDisplayView,
  leg: FappyMinigameLeg | null,
  playerName: string | null
): string => {
  if (view.phase === "finished") {
    return displayFappySurfaceCopy.finishedPrompt;
  }

  if (view.phase === "timedOut") {
    return displayFappySurfaceCopy.timedOutPrompt;
  }

  if (view.phase === "flying") {
    return displayFappySurfaceCopy.flyingPrompt(playerName);
  }

  if (leg !== null && leg.attempt > 0) {
    return displayFappySurfaceCopy.respawnPrompt(playerName);
  }

  return view.legIndex > 0
    ? displayFappySurfaceCopy.handoffPrompt(playerName)
    : displayFappySurfaceCopy.readyPrompt(playerName);
};

const FappyPlayBody = ({
  view,
  activeTeamName,
  players,
  teams,
  serverOrigin
}: {
  view: FappyMinigameDisplayView;
  activeTeamName: string | null;
  players: MinigameDisplayRendererProps["players"];
  teams: MinigameDisplayRendererProps["teams"];
  serverOrigin: string | null;
}): JSX.Element => {
  const sceneRef = useRef<FappySceneHandle>(null);
  // Once the relay is over the last leg stays on the wall.
  const legIndex = Math.min(view.legIndex, view.legsPerTurn - 1);
  const leg = view.legs[legIndex] ?? null;
  const gates = useMemo(() => {
    return leg === null
      ? []
      : resolveFappyGates({ seed: leg.seed, legIndex: leg.legIndex, gatesPerLeg: view.gatesPerLeg });
  }, [leg, view.gatesPerLeg]);
  const bird = resolveLegBird({
    leg,
    activeTurnTeamId: view.activeTurnTeamId,
    players,
    teams,
    serverOrigin
  });
  const elapsedMs = useRelayClock({
    startedAtMs: view.startedAtMs,
    endedAtMs: view.timedOutAtMs ?? view.finishedAtMs
  });
  const isOver = view.phase === "finished" || view.phase === "timedOut";
  const isHandoff = view.phase === "ready" && view.legIndex > 0 && leg?.attempt === 0;
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
      <header className={styles.marquee}>
        <h2 className={styles.marqueeTeamName}>{activeTeamName ?? ""}</h2>
        <span className={styles.marqueeTitle}>{displayFappySurfaceCopy.title}</span>
        <div className={styles.marqueeMeta}>
          <span className={styles.marqueeLeg}>
            {displayFappySurfaceCopy.legCounter(legIndex + 1, view.legsPerTurn)}
          </span>
          <span className={styles.marqueeGates}>
            {displayFappySurfaceCopy.gatesCounter(
              view.totalGatesCleared,
              view.legsPerTurn * view.gatesPerLeg
            )}
          </span>
          <span className={`${styles.marqueeClock} ${clockClassName}`} data-fappy-clock>
            {elapsedMs === null ? displayFappySurfaceCopy.clockIdle : formatRelayClock(elapsedMs)}
          </span>
        </div>
      </header>
      <div className={styles.arenaArea}>
        <FappyScene
          ref={sceneRef}
          gates={gates}
          bird={bird}
          sceneId="display-fappy"
          label={displayFappySurfaceCopy.sceneLabel(bird.playerName)}
        />
        {isHandoff && (
          <div className={styles.resultOverlay} data-fappy-handoff>
            <span className={styles.handoffPlaque}>{displayFappySurfaceCopy.handoffPrompt(bird.playerName)}</span>
          </div>
        )}
        {isOver && <ResultPlaque view={view} elapsedMs={elapsedMs} />}
      </div>
      <p className={styles.statusLine}>{resolveStatusLine(view, leg, bird.playerName)}</p>
    </div>
  );
};

export const DisplayFappySurface = ({
  phase,
  minigameDisplayView,
  activeTeamName,
  serverOrigin,
  players,
  teams
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
      players={players}
      teams={teams}
      serverOrigin={serverOrigin}
    />
  );
};
