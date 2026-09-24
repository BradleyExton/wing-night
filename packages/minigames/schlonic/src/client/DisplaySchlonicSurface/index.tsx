import { useMemo, useRef, type ReactNode } from "react";
import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import { NeonMarquee } from "@wingnight/surface";
import type { SchlonicMinigameDisplayView, SchlonicMinigameRun } from "@wingnight/shared";
import { resolveSchlonicZone } from "@wingnight/shared";

import { MIRROR_HOLD_SLACK_MS } from "../beats/index.js";
import { resolveRunnerFigure } from "../resolveRunnerFigure/index.js";
import { SchlonicScene, type SchlonicSceneHandle } from "../SchlonicScene/index.js";
import { useHeldRun, type RunHold } from "../useHeldRun/index.js";
import { useSchlonicMirror } from "../useSchlonicMirror/index.js";
import { displaySchlonicSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

const resolvePlayerName = (run: SchlonicMinigameRun | null | undefined): string | null => {
  return run?.player?.name ?? null;
};

const SchlonicIntro = (): JSX.Element => (
  <div className={styles.container}>
    <h2 className={styles.introTitle}>{displaySchlonicSurfaceCopy.introTitle}</h2>
    <p className={styles.introDescription}>{displaySchlonicSurfaceCopy.introDescription}</p>
  </div>
);

// How the run just ended, over the frame the room watched it end on.
const OutcomePlaque = ({ hold }: { hold: RunHold }): JSX.Element => {
  const isCleared = hold.outcome === "cleared";

  return (
    <div className={styles.resultOverlay} data-schlonic-outcome={hold.outcome}>
      <div className={styles.resultPlaque}>
        <div>
          <p className={`${styles.resultTitle}${isCleared ? "" : ` ${styles.resultTitleBad}`}`}>
            {displaySchlonicSurfaceCopy.outcomeTitle(hold.outcome)}
          </p>
          <p className={styles.resultBlurb}>
            {displaySchlonicSurfaceCopy.outcomeBlurb(hold.outcome, hold.wings)}
          </p>
        </div>
      </div>
    </div>
  );
};

const FinishPlaque = ({ view }: { view: SchlonicMinigameDisplayView }): JSX.Element => (
  <div className={styles.resultOverlay} data-schlonic-result="finished">
    <div className={styles.resultPlaque}>
      <div>
        <p className={styles.resultTitle}>{displaySchlonicSurfaceCopy.finishedTitle}</p>
        <p className={styles.resultBlurb}>
          {displaySchlonicSurfaceCopy.finishedBlurb(view.wingsBanked, view.wingsPar)}
        </p>
      </div>
      <span className={styles.resultPoints}>
        {displaySchlonicSurfaceCopy.points(view.points ?? 0)}
      </span>
    </div>
  </div>
);

const HandoffCallout = ({ nextName }: { nextName: string | null }): JSX.Element => (
  <div className={styles.handoffOverlay} data-schlonic-handoff="display">
    <div className={styles.handoffCard}>
      <span className={styles.handoffName}>
        {displaySchlonicSurfaceCopy.handoffCalloutName(nextName)}
      </span>
      <span className={styles.handoffLine}>{displaySchlonicSurfaceCopy.handoffCalloutLine}</span>
    </div>
  </div>
);

const resolveStatusLine = (
  view: SchlonicMinigameDisplayView,
  playerName: string | null,
  nextName: string | null,
  hold: RunHold | null
): string => {
  if (hold?.kind === "handoff") {
    return displaySchlonicSurfaceCopy.handoffPrompt(playerName, nextName);
  }

  if (view.phase === "finished") {
    return displaySchlonicSurfaceCopy.finishedPrompt;
  }

  if (view.phase === "running") {
    return displaySchlonicSurfaceCopy.runningPrompt(playerName);
  }

  return displaySchlonicSurfaceCopy.readyPrompt(playerName);
};

const SchlonicPlayBody = ({
  view,
  activeTeamName,
  clock,
  clockLine,
  serverOrigin
}: {
  view: SchlonicMinigameDisplayView;
  activeTeamName: string | null;
  clock: ReactNode;
  clockLine: ReactNode;
  serverOrigin: string | null;
}): JSX.Element => {
  const sceneRef = useRef<SchlonicSceneHandle>(null);
  // A run stays on the wall while how it ended plays out, a little longer than the tablet holds
  // it, because the replay here runs behind; once the team is through the last run stays for good.
  const { shownRunIndex, hold } = useHeldRun(view, MIRROR_HOLD_SLACK_MS);
  const run = view.runs[shownRunIndex] ?? null;
  const zone = useMemo(() => {
    return resolveSchlonicZone({ seed: view.zoneSeed, chunks: view.zoneChunks });
  }, [view.zoneSeed, view.zoneChunks]);
  const runner = resolveRunnerFigure({
    figure: run?.player ?? null,
    activeTurnTeamId: view.activeTurnTeamId,
    serverOrigin
  });
  const nextRun = view.runs[shownRunIndex + 1] ?? null;
  const isFinished = view.phase === "finished";

  useSchlonicMirror({
    run,
    zone,
    zoneSeed: view.zoneSeed,
    zoneChunks: view.zoneChunks,
    sceneRef
  });

  return (
    <div className={styles.stage}>
      <NeonMarquee
        title={displaySchlonicSurfaceCopy.zoneName}
        teamName={activeTeamName}
        readout={
          <>
            <span className={styles.marqueeRun}>
              {displaySchlonicSurfaceCopy.runCounter(shownRunIndex + 1, view.runsPerTurn)}
            </span>
            <span className={styles.marqueeWings} data-schlonic-wings>
              {displaySchlonicSurfaceCopy.wingsCounter(view.wingsBanked, view.wingsPar)}
            </span>
            <span className={styles.marqueeWingsLabel}>{displaySchlonicSurfaceCopy.wingsLabel}</span>
          </>
        }
        clock={clock}
        clockLine={clockLine}
      />
      <div className={styles.arenaArea}>
        <div key={shownRunIndex} className={styles.runEnter}>
          <SchlonicScene
            ref={sceneRef}
            zone={zone}
            runner={runner}
            sceneId="display-schlonic"
            label={displaySchlonicSurfaceCopy.sceneLabel(runner.playerName)}
          />
        </div>
        {hold !== null && <OutcomePlaque hold={hold} />}
        {hold?.kind === "handoff" && <HandoffCallout nextName={resolvePlayerName(nextRun)} />}
        {isFinished && hold === null && <FinishPlaque view={view} />}
      </div>
      <p className={styles.statusLine}>
        {resolveStatusLine(view, runner.playerName, resolvePlayerName(nextRun), hold)}
      </p>
    </div>
  );
};

export const DisplaySchlonicSurface = ({
  phase,
  minigameDisplayView,
  activeTeamName,
  clock,
  clockLine,
  serverOrigin
}: MinigameDisplayRendererProps): JSX.Element => {
  const schlonicView = minigameDisplayView?.minigame === "SCHLONIC" ? minigameDisplayView : null;

  if (phase !== "play") {
    return <SchlonicIntro />;
  }

  if (schlonicView === null) {
    return (
      <div className={styles.container}>
        <p className={styles.hint}>{displaySchlonicSurfaceCopy.waitingLabel}</p>
      </div>
    );
  }

  return (
    <SchlonicPlayBody
      view={schlonicView}
      activeTeamName={activeTeamName}
      clock={clock}
      clockLine={clockLine}
      serverOrigin={serverOrigin}
    />
  );
};
