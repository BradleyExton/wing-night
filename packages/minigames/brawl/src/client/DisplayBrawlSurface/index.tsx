import { useMemo, useRef, type ReactNode } from "react";
import type { MinigameDisplayRendererProps, MinigameHandset } from "@wingnight/minigames-core";
import type { BrawlMinigameDisplayView } from "@wingnight/shared";
import { NeonMarquee, ResultPlaque } from "@wingnight/surface";

import { MIRROR_HOLD_SLACK_MS } from "../beats/index.js";
import { TV_CAMERA_FIT } from "../BrawlScene/camera/index.js";
import { BrawlScene, type BrawlSceneHandle } from "../BrawlScene/index.js";
import { resolveGoonsBanked } from "../goonsTally/index.js";
import { resolveViewCourse, useBrawlBlock } from "../useBrawlBlock/index.js";
import { useBrawlMirror } from "../useBrawlMirror/index.js";
import { useBrawlSounds } from "../useBrawlSounds/index.js";
import { useHeldBlock, type BlockHold } from "../useHeldBlock/index.js";
import { useHeartCallout } from "../useHeartCallout/index.js";
import { useHenFigure } from "../useHenFigure/index.js";
import { BeatCallout } from "./BeatCallout/index.js";
import { HeartCallout } from "./HeartCallout/index.js";
import { MarqueeReadout } from "./MarqueeReadout/index.js";
import { WaveMeter } from "./WaveMeter/index.js";
import { displayBrawlSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

const BrawlIntro = (): JSX.Element => (
  <div className={styles.container}>
    <h2 className={styles.introTitle}>{displayBrawlSurfaceCopy.title}</h2>
    <p className={styles.introDescription}>{displayBrawlSurfaceCopy.introDescription}</p>
  </div>
);

// The team's result once it is through: the house `<ResultPlaque>` (DESIGN.md §2.2E). `silent`,
// because the street's own board has just rung the last beat and a sting on top is a second voice.
// The running totals are not here: standings are the results screens' job, never mid-round.
const FinishPlaque = ({ view }: { view: BrawlMinigameDisplayView }): JSX.Element => (
  <div className={styles.resultOverlay} data-brawl-result="finished">
    <ResultPlaque
      tone={(view.points ?? 0) > 0 ? "hit" : "neutral"}
      silent
      title={displayBrawlSurfaceCopy.finishedTitle}
      detail={displayBrawlSurfaceCopy.finishedBlurb(view.goonsDown, view.goonsTotal)}
      points={displayBrawlSurfaceCopy.points(view.points ?? 0)}
    />
  </div>
);

const resolveStatusLine = (view: BrawlMinigameDisplayView, playerName: string | null, hold: BlockHold | null): string => {
  if (hold !== null) {
    return displayBrawlSurfaceCopy.heldPrompt(playerName);
  }

  if (view.phase === "finished") {
    return displayBrawlSurfaceCopy.finishedPrompt;
  }

  return view.phase === "running"
    ? displayBrawlSurfaceCopy.runningPrompt(playerName)
    : displayBrawlSurfaceCopy.readyPrompt(playerName);
};

type PlayBodyProps = {
  view: BrawlMinigameDisplayView;
  activeTeamName: string | null;
  clock: ReactNode;
  clockLine: ReactNode;
  serverOrigin: string | null;
  handset: MinigameHandset;
};

const BrawlPlayBody = ({ view, activeTeamName, clock, clockLine, serverOrigin, handset }: PlayBodyProps): JSX.Element => {
  const sceneRef = useRef<BrawlSceneHandle>(null);
  // Written by the mirror's paint loop: the hearts left, the worth down and the wave strip.
  const heartsRef = useRef<HTMLSpanElement>(null);
  const tallyRef = useRef<HTMLSpanElement>(null);
  const waveMeterRef = useRef<HTMLDivElement>(null);
  // A block stays on the wall while its ending plays, a little longer than the tablet holds it,
  // because the replay here runs behind; once the team is through the last block stays for good.
  const { shownBlockIndex, hold } = useHeldBlock(view, MIRROR_HOLD_SLACK_MS);
  const viewBlock = view.blocks[shownBlockIndex] ?? null;
  const { block, relay } = useBrawlBlock({ view, blockIndex: shownBlockIndex, serverOrigin });
  const hen = useHenFigure({ figure: viewBlock?.player ?? null, activeTurnTeamId: view.activeTurnTeamId, serverOrigin });
  const { courseSeed, blocksPerTurn } = view;
  const heartBought = viewBlock?.heartBought ?? false;
  // The referee's own course for the block on the wall, bought heart and all, so a wall that
  // missed the block re-runs it from the hearts the server did.
  const course = useMemo(() => {
    return resolveViewCourse({ courseSeed, blocksPerTurn }, shownBlockIndex, heartBought);
  }, [courseSeed, blocksPerTurn, shownBlockIndex, heartBought]);
  const goonsBanked = resolveGoonsBanked(view.blocks, shownBlockIndex, view.heartPrice);
  const isFinished = view.phase === "finished";
  // "Caitlin bought a heart", for a couple of seconds once her bought block is on the wall.
  const isHeartCalloutUp = useHeartCallout(viewBlock, hold === null && !isFinished);
  // The TV is the room's speaker, so the street's whole soundboard hangs off this one surface.
  const { onMirrorEvent } = useBrawlSounds({ serverOrigin });

  useBrawlMirror({
    viewBlock,
    block,
    course,
    sceneRef,
    heartsRef,
    tallyRef,
    waveMeterRef,
    goonsBanked,
    goonsTotal: view.goonsTotal,
    onEvent: onMirrorEvent
  });

  return (
    <div className={styles.stage}>
      <NeonMarquee
        title={displayBrawlSurfaceCopy.title}
        teamName={activeTeamName}
        readout={
          <MarqueeReadout
            view={view}
            shownBlockIndex={shownBlockIndex}
            goonsBanked={goonsBanked}
            heartsRef={heartsRef}
            tallyRef={tallyRef}
          />
        }
        clock={clock}
        clockLine={clockLine}
      />
      <div className={styles.arenaArea} data-brawl-display-arena>
        <div key={shownBlockIndex} className={styles.blockEnter}>
          {/* The room's camera, not the tablet's: the same left edge, widened to the arena, so
              every goon from the right is on the wall before it is on the tablet and the shouting
              is the team's (docs/minigames/brawl-spec.md §3). */}
          <BrawlScene
            ref={sceneRef}
            block={block}
            hen={hen}
            sceneId="display-brawl"
            label={displayBrawlSurfaceCopy.sceneLabel(hen.playerName)}
            cameraFit={TV_CAMERA_FIT}
            relay={relay}
          />
        </div>
        <WaveMeter key={`meter-${shownBlockIndex}`} ref={waveMeterRef} block={block} hidden={hold !== null || isFinished} />
        {hold !== null && (
          <BeatCallout hold={hold} nextName={view.blocks[hold.blockIndex + 1]?.player?.name ?? null} handset={handset} />
        )}
        {isHeartCalloutUp && <HeartCallout playerName={viewBlock?.player?.name ?? null} heartPrice={view.heartPrice} />}
        {isFinished && hold === null && <FinishPlaque view={view} />}
      </div>
      <p className={styles.statusLine}>{resolveStatusLine(view, viewBlock?.player?.name ?? null, hold)}</p>
    </div>
  );
};

// BRAWL's display surface (docs/minigames/brawl-spec.md §0.7): the house `<NeonMarquee>` with the
// shell's `clock` and `clockLine` seated and the block's live counts as its readout, over the
// street drawn through the room's wider camera — the tablet's block re-run from its own input log
// (`useBrawlMirror`), with the wave meter over the sky and each ending's callout over the pavement.
export const DisplayBrawlSurface = ({
  phase,
  minigameDisplayView,
  activeTeamName,
  clock,
  clockLine,
  serverOrigin,
  handset
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
    <BrawlPlayBody
      view={brawlView}
      activeTeamName={activeTeamName}
      clock={clock}
      clockLine={clockLine}
      serverOrigin={serverOrigin}
      handset={handset}
    />
  );
};
