import { useMemo, useRef } from "react";
import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import type { FappyMinigameDisplayView, FappyMinigameLeg } from "@wingnight/shared";
import { resolveFappyGates } from "@wingnight/shared";

import { FappyScene, type FappySceneHandle } from "../FappyScene/index.js";
import { resolveLegBird } from "../resolveLegBird/index.js";
import { useFappyMirror } from "../useFappyMirror/index.js";
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

const ResultPlaque = ({ leg }: { leg: FappyMinigameLeg }): JSX.Element | null => {
  if (leg.outcome === null) {
    return null;
  }

  const isCleared = leg.outcome === "cleared";

  return (
    <div className={styles.resultOverlay} data-fappy-result={leg.outcome}>
      <div className={`${styles.resultPlaque}${isCleared ? "" : ` ${styles.resultPlaqueCrash}`}`}>
        <div>
          <p className={`${styles.resultTitle}${isCleared ? "" : ` ${styles.resultTitleCrash}`}`}>
            {displayFappySurfaceCopy.outcomeTitle(leg.outcome)}
          </p>
          <p className={styles.resultBlurb}>{displayFappySurfaceCopy.outcomeBlurb(leg.outcome)}</p>
        </div>
        {leg.gatesCleared > 0 && (
          <span className={styles.resultGates}>
            {displayFappySurfaceCopy.outcomeGates(leg.gatesCleared)}
          </span>
        )}
      </div>
    </div>
  );
};

const resolveStatusLine = (
  view: FappyMinigameDisplayView,
  leg: FappyMinigameLeg | null,
  playerName: string | null
): string => {
  if (view.phase === "done") {
    return displayFappySurfaceCopy.donePrompt;
  }

  if (view.phase === "flying") {
    return displayFappySurfaceCopy.flyingPrompt(playerName);
  }

  if (view.phase === "landed" && leg?.outcome) {
    return displayFappySurfaceCopy.outcomeTitle(leg.outcome);
  }

  return displayFappySurfaceCopy.readyPrompt(playerName);
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
  const pendingPoints =
    view.activeTurnTeamId === null ? 0 : (view.pendingPointsByTeamId[view.activeTurnTeamId] ?? 0);

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
          <span className={styles.marqueePending}>
            {displayFappySurfaceCopy.pendingPoints(pendingPoints)}
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
        {leg !== null && leg.status === "landed" && <ResultPlaque leg={leg} />}
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
