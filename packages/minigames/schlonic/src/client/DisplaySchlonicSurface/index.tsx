import { useMemo, useRef, type ReactNode } from "react";
import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import { NeonMarquee, ResultPlaque } from "@wingnight/surface";
import type { SchlonicMinigameDisplayView, SchlonicMinigameRun } from "@wingnight/shared";
import { resolveSchlonicZone } from "@wingnight/shared";

import { MIRROR_HOLD_SLACK_MS } from "../beats/index.js";
import { SchlonicScene, type SchlonicSceneHandle } from "../SchlonicScene/index.js";
import { useHeldRun, type RunHold } from "../useHeldRun/index.js";
import { useRunnerFigure } from "../useRunnerFigure/index.js";
import { useSchlonicMirror } from "../useSchlonicMirror/index.js";
import { displaySchlonicSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

const resolvePlayerName = (run: SchlonicMinigameRun | null | undefined): string | null => {
  return run?.player?.name ?? null;
};

const SchlonicIntro = (): JSX.Element => (
  <div className={styles.container}>
    <h2 className={styles.introTitle}>{displaySchlonicSurfaceCopy.title}</h2>
    <p className={styles.introDescription}>{displaySchlonicSurfaceCopy.introDescription}</p>
  </div>
);

// The beat over a run that just ended: how it went, and — when the tablet is changing hands —
// who takes it. One card, the house `<ResultPlaque>` (DESIGN.md §2.2E), with who is next under
// its rule. A skipped run has no ending to show, so on a handoff the card is only the name, and
// on a finish there is no card at all: the points plaque follows.
const HoldPlaque = ({ hold, nextName }: { hold: RunHold; nextName: string | null }): JSX.Element | null => {
  const { outcome } = hold;
  const showsNext = hold.kind === "handoff";

  // A skipped run is not a wipeout: the card names who is next and says nothing about how it
  // went — and a skipped run that hands nothing on has no card at all.
  if (outcome === "skipped") {
    if (!showsNext) {
      return null;
    }

    return (
      <div className={styles.resultOverlay} data-schlonic-outcome={hold.outcome}>
        <ResultPlaque
          tone="neutral"
          kicker={displaySchlonicSurfaceCopy.handoffCalloutLine}
          title={displaySchlonicSurfaceCopy.handoffCalloutName(nextName)}
        />
      </div>
    );
  }

  const handoff = showsNext ? (
    <div className={styles.handoff} data-schlonic-handoff="display">
      <span className={styles.handoffName}>
        {displaySchlonicSurfaceCopy.handoffCalloutName(nextName)}
      </span>
      <span className={styles.handoffLine}>{displaySchlonicSurfaceCopy.handoffCalloutLine}</span>
    </div>
  ) : null;

  return (
    <div className={styles.resultOverlay} data-schlonic-outcome={hold.outcome}>
      <ResultPlaque
        tone={outcome === "cleared" ? "hit" : "miss"}
        title={displaySchlonicSurfaceCopy.outcomeTitle(outcome)}
        detail={displaySchlonicSurfaceCopy.outcomeBlurb(outcome, hold.wings)}
      >
        {handoff}
      </ResultPlaque>
    </div>
  );
};

const FinishPlaque = ({ view }: { view: SchlonicMinigameDisplayView }): JSX.Element => (
  <div className={styles.resultOverlay} data-schlonic-result="finished">
    <ResultPlaque
      tone={(view.points ?? 0) > 0 ? "hit" : "neutral"}
      title={displaySchlonicSurfaceCopy.finishedTitle}
      detail={displaySchlonicSurfaceCopy.finishedBlurb(view.wingsBanked, view.wingsPar)}
      points={displaySchlonicSurfaceCopy.points(view.points ?? 0)}
    />
  </div>
);

const resolveStatusLine = (
  view: SchlonicMinigameDisplayView,
  playerName: string | null,
  hold: RunHold | null
): string => {
  if (hold?.kind === "handoff") {
    return displaySchlonicSurfaceCopy.handoffPrompt(playerName);
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
  // Written by the mirror's paint loop: the wings the runner on the wall is holding.
  const tallyRef = useRef<HTMLSpanElement>(null);
  // A run stays on the wall while how it ended plays out, a little longer than the tablet holds
  // it, because the replay here runs behind; once the team is through the last run stays for good.
  const { shownRunIndex, hold } = useHeldRun(view, MIRROR_HOLD_SLACK_MS);
  const run = view.runs[shownRunIndex] ?? null;
  const zone = useMemo(() => {
    return resolveSchlonicZone({ seed: view.zoneSeed, chunks: view.zoneChunks });
  }, [view.zoneSeed, view.zoneChunks]);
  const runner = useRunnerFigure({
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
    sceneRef,
    tallyRef
  });

  return (
    <div className={styles.stage}>
      <NeonMarquee
        title={displaySchlonicSurfaceCopy.title}
        teamName={activeTeamName}
        readout={
          <>
            <span>{displaySchlonicSurfaceCopy.runCounter(shownRunIndex + 1, view.runsPerTurn)}</span>
            <span ref={tallyRef} className={styles.marqueeInHand} data-schlonic-in-hand>
              {displaySchlonicSurfaceCopy.inHandOnTheLine}
            </span>
            <span>{displaySchlonicSurfaceCopy.inHandLabel}</span>
            <span className={styles.marqueeWings} data-schlonic-wings>
              {displaySchlonicSurfaceCopy.wingsCounter(view.wingsBanked, view.wingsPar)}
            </span>
            <span>{displaySchlonicSurfaceCopy.bankedLabel}</span>
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
        <span className={styles.venuePlaque} data-schlonic-venue>
          {displaySchlonicSurfaceCopy.zoneName}
        </span>
        {hold !== null && <HoldPlaque hold={hold} nextName={resolvePlayerName(nextRun)} />}
        {isFinished && hold === null && <FinishPlaque view={view} />}
      </div>
      <p className={styles.statusLine}>{resolveStatusLine(view, runner.playerName, hold)}</p>
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
