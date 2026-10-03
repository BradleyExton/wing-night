import { useRef, type ReactNode } from "react";
import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import type { MountMinigameDisplayView } from "@wingnight/shared";
import { NeonMarquee, ResultPlaque } from "@wingnight/surface";

import { MIRROR_HOLD_SLACK_MS } from "../beats/index.js";
import { TV_CAMERA_FIT } from "../MountScene/camera/index.js";
import { MountScene, type MountSceneHandle } from "../MountScene/index.js";
import { useClimberFigure } from "../useClimberFigure/index.js";
import { useHeldClimb, type ClimbHold } from "../useHeldClimb/index.js";
import { useMountMirror } from "../useMountMirror/index.js";
import { useMountSounds } from "../useMountSounds/index.js";
import { BeatCallout } from "./BeatCallout/index.js";
import { MarqueeReadout } from "./MarqueeReadout/index.js";
import { displayMountSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

const MountIntro = (): JSX.Element => (
  <div className={styles.container}>
    <h2 className={styles.introTitle}>{displayMountSurfaceCopy.title}</h2>
    <p className={styles.introDescription}>{displayMountSurfaceCopy.introDescription}</p>
  </div>
);

const resolveHolderName = (view: MountMinigameDisplayView): string => {
  const { playerId } = view.pile.highLine;

  return playerId === null
    ? displayMountSurfaceCopy.gooseHolder
    : (view.figures[playerId]?.name ?? displayMountSurfaceCopy.unknownHolder);
};

// The team's result once it is through: the house `<ResultPlaque>` (DESIGN.md §2.2E), silent,
// because the last climb's beat has just rung. Standings are the results screens' job.
const FinishPlaque = ({ view }: { view: MountMinigameDisplayView }): JSX.Element => {
  const mounted = view.climbs.filter((climb) => climb.result?.outcome === "mounted").length;

  return (
    <div className={styles.resultOverlay} data-mount-result="finished">
      <ResultPlaque
        tone={(view.points ?? 0) > 0 ? "hit" : "neutral"}
        silent
        title={displayMountSurfaceCopy.finishedTitle}
        detail={displayMountSurfaceCopy.finishedBlurb(mounted, view.climbsPerTurn)}
        points={displayMountSurfaceCopy.points(view.points ?? 0)}
      />
    </div>
  );
};

const resolveStatusLine = (view: MountMinigameDisplayView, playerName: string | null, hold: ClimbHold | null): string => {
  if (hold !== null) {
    return displayMountSurfaceCopy.heldPrompt(playerName);
  }

  if (view.phase === "finished") {
    return displayMountSurfaceCopy.finishedPrompt;
  }

  return view.phase === "running"
    ? displayMountSurfaceCopy.runningPrompt(playerName)
    : displayMountSurfaceCopy.readyPrompt(playerName, view.pile.highLine.height);
};

type PlayBodyProps = {
  view: MountMinigameDisplayView;
  activeTeamName: string | null;
  clock: ReactNode;
  clockLine: ReactNode;
  serverOrigin: string | null;
};

const MountPlayBody = ({ view, activeTeamName, clock, clockLine, serverOrigin }: PlayBodyProps): JSX.Element => {
  const sceneRef = useRef<MountSceneHandle>(null);
  // Written by the mirror's paint loop: the climb's clock.
  const clockRef = useRef<HTMLSpanElement>(null);
  // A climb stays on the wall while its ending plays, a little longer than the tablet holds it,
  // because the replay here runs behind; once the team is through the last climb stays for good.
  const { shownClimbIndex, hold } = useHeldClimb(view, MIRROR_HOLD_SLACK_MS);
  const viewClimb = view.climbs[shownClimbIndex] ?? null;
  const climber = useClimberFigure(viewClimb?.player ?? null, view.activeTurnTeamId, serverOrigin);
  const isFinished = view.phase === "finished";
  // The TV is the room's speaker, so the climb's whole soundboard hangs off this one surface.
  const { onEvent } = useMountSounds({ serverOrigin });
  const mirror = useMountMirror({
    viewClimb,
    pile: view.pile,
    rules: view.rules,
    activeTurnTeamId: view.activeTurnTeamId,
    sceneRef,
    clockRef,
    onEvent
  });

  return (
    <div className={styles.stage}>
      <NeonMarquee
        title={displayMountSurfaceCopy.title}
        teamName={activeTeamName}
        readout={
          <MarqueeReadout view={view} shownClimbIndex={shownClimbIndex} holderName={resolveHolderName(view)} clockRef={clockRef} />
        }
        clock={clock}
        clockLine={clockLine}
      />
      <div className={styles.arenaArea} data-mount-display-arena>
        {/* The room's camera, not the tablet's: the whole pile and the line at once, so the room
            sees the holds the climber cannot and calls them (spec §3). */}
        <MountScene
          ref={sceneRef}
          surface="display"
          pile={mirror.pile}
          figures={view.figures}
          climber={climber}
          serverOrigin={serverOrigin}
          label={displayMountSurfaceCopy.sceneLabel(climber.playerName)}
          cameraFit={TV_CAMERA_FIT}
        />
        {hold !== null && <BeatCallout hold={hold} nextName={view.climbs[hold.climbIndex + 1]?.player?.name ?? null} />}
        {isFinished && hold === null && <FinishPlaque view={view} />}
      </div>
      <p className={styles.statusLine}>{resolveStatusLine(view, viewClimb?.player?.name ?? null, hold)}</p>
    </div>
  );
};

// Mount Your Hens' display surface (spec §0.5): the house `<NeonMarquee>` with the shell's `clock`
// and `clockLine` seated and the climb's live counts as its readout, over the whole pile drawn
// through the room's fit-all camera — the tablet's climb re-run from its own input log
// (`useMountMirror`), each ending's callout over the boardwalk, and the plaque once the team is through.
export const DisplayMountSurface = ({
  phase,
  minigameDisplayView,
  activeTeamName,
  clock,
  clockLine,
  serverOrigin
}: MinigameDisplayRendererProps): JSX.Element => {
  const mountView = minigameDisplayView?.minigame === "MOUNT" ? minigameDisplayView : null;

  if (phase !== "play") {
    return <MountIntro />;
  }

  if (mountView === null) {
    return (
      <div className={styles.stage}>
        <NeonMarquee title={displayMountSurfaceCopy.title} teamName={activeTeamName} clock={clock} clockLine={clockLine} />
        <div className={styles.container}>
          <p className={styles.hint}>{displayMountSurfaceCopy.waitingLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <MountPlayBody view={mountView} activeTeamName={activeTeamName} clock={clock} clockLine={clockLine} serverOrigin={serverOrigin} />
  );
};
