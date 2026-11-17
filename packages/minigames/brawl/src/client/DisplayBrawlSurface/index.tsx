import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import type { BrawlMinigameDisplayView } from "@wingnight/shared";
import { NeonMarquee, ResultPlaque } from "@wingnight/surface";

import { CrewScene } from "../CrewScene/index.js";
import { resolveLiveBanked, resolveShownBlock } from "../shownBlock/index.js";
import { useCrewFrame } from "../useCrewFrame/index.js";
import { displayBrawlSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

const BrawlIntro = (): JSX.Element => (
  <div className={styles.container}>
    <h2 className={styles.introTitle}>{displayBrawlSurfaceCopy.title}</h2>
    <p className={styles.introDescription}>{displayBrawlSurfaceCopy.introDescription}</p>
  </div>
);

type PlayBodyProps = Pick<MinigameDisplayRendererProps, "activeTeamName" | "clock" | "clockLine" | "serverOrigin"> & {
  view: BrawlMinigameDisplayView;
};

/** What the line under the street says: who the room is waiting on, the wave, or how it ended. */
const resolveStatusLine = (view: BrawlMinigameDisplayView, wave: number | null, waves: number, isWalkingOn: boolean): string => {
  if (view.phase === "finished") {
    return displayBrawlSurfaceCopy.finishedPrompt;
  }

  const inHand = view.blocks[view.blockIndex];

  if (view.phase === "running" && wave !== null) {
    return isWalkingOn ? displayBrawlSurfaceCopy.walkOn : displayBrawlSurfaceCopy.running(wave + 1, waves);
  }

  if (view.blockIndex === 0) {
    const out = new Set((inHand?.crew ?? []).map((member) => member.player?.playerId));

    return displayBrawlSurfaceCopy.steppingOut(
      out.size,
      view.roster.filter((figure) => !out.has(figure.playerId)).map((figure) => figure.name)
    );
  }

  return displayBrawlSurfaceCopy.nextBlock(view.blocks[view.blockIndex - 1]?.outcome ?? null);
};

const BrawlPlayBody = ({ view, activeTeamName, clock, clockLine, serverOrigin }: PlayBodyProps): JSX.Element => {
  const shown = resolveShownBlock(view);
  const { frame, layout } = useCrewFrame(shown, view);
  const isFinished = view.phase === "finished";
  const banked = resolveLiveBanked(view, shown, frame?.banked ?? null);
  const isLive = shown?.status === "running" && frame !== null;

  return (
    <div className={styles.stage}>
      <NeonMarquee
        title={displayBrawlSurfaceCopy.title}
        teamName={activeTeamName}
        readout={
          <span className={styles.readout}>
            <span>{displayBrawlSurfaceCopy.blockCounter(Math.min(view.blockIndex + 1, view.blocksPerTurn), view.blocksPerTurn)}</span>
            <span className={styles.tally} data-brawl-banked={banked} data-brawl-total={view.total}>
              {displayBrawlSurfaceCopy.tally(banked, view.total)}
            </span>
            <span className={styles.tallyLabel}>{displayBrawlSurfaceCopy.tallyLabel}</span>
          </span>
        }
        clock={clock}
        clockLine={clockLine}
      />
      <div className={styles.arenaArea} data-brawl-display-arena>
        {frame !== null && layout !== null && shown !== null ? (
          <CrewScene
            frame={frame}
            layout={layout}
            crew={shown.crew}
            activeTurnTeamId={view.activeTurnTeamId}
            serverOrigin={serverOrigin}
            label={displayBrawlSurfaceCopy.sceneLabel}
            fit="cover"
          />
        ) : (
          <div className={styles.container}>
            <p className={styles.hint}>{displayBrawlSurfaceCopy.waitingStreetLabel}</p>
          </div>
        )}
        {isFinished && (
          <div className={styles.resultOverlay} data-brawl-result="finished">
            <ResultPlaque
              tone={(view.points ?? 0) > 0 ? "hit" : "neutral"}
              title={displayBrawlSurfaceCopy.finishedTitle}
              detail={displayBrawlSurfaceCopy.finishedBlurb(view.banked, view.total)}
              points={displayBrawlSurfaceCopy.points(view.points ?? 0)}
            />
          </div>
        )}
      </div>
      <p className={styles.statusLine} data-brawl-status>
        {resolveStatusLine(view, isLive ? frame.waveIndex : null, layout?.waves.length ?? 0, isLive && !frame.cameraLocked)}
      </p>
    </div>
  );
};

// BRAWL's display surface, INTERIM (docs/minigames/brawl-crew-spec.md §0.7, §0.10): the house
// `<NeonMarquee>` over the crew's street, drawn from the server's latest frame and stepped on here
// between frames (`useCrewFrame`). The crew strip, the wave meter and each ending's callout are
// step 5's; this says the same things in one line under the street.
export const DisplayBrawlSurface = ({
  phase,
  minigameDisplayView,
  activeTeamName,
  clock,
  clockLine,
  serverOrigin
}: MinigameDisplayRendererProps): JSX.Element => {
  const brawlView = minigameDisplayView?.minigame === "BRAWL" ? minigameDisplayView : null;

  if (phase !== "play") {
    return <BrawlIntro />;
  }

  if (brawlView === null) {
    return (
      <div className={styles.stage}>
        <NeonMarquee title={displayBrawlSurfaceCopy.title} teamName={activeTeamName} clock={clock} clockLine={clockLine} />
        <div className={styles.container}>
          <p className={styles.hint}>{displayBrawlSurfaceCopy.waitingStreetLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <BrawlPlayBody view={brawlView} activeTeamName={activeTeamName} clock={clock} clockLine={clockLine} serverOrigin={serverOrigin} />
  );
};
