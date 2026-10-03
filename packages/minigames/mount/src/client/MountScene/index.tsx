import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import type { MountPile, MountPlayerFigure, MountState, MountVec } from "@wingnight/shared";

import type { HenFigure } from "../resolveHenFigure/index.js";
import { Backdrop } from "./Backdrop/index.js";
import { FALLBACK_ASPECT, TABLET_CAMERA_FIT, resolveViewBox, type MountCameraFit } from "./camera/index.js";
import { Climber, type ClimberHandle } from "./Climber/index.js";
import { mountSceneCopy } from "./copy.js";
import { Goose } from "./Goose/index.js";
import { HighLine, type HighLineHandle } from "./HighLine/index.js";
import { LimbHandles, type LimbHandlesHandle } from "./LimbHandles/index.js";
import { PileHens } from "./PileHens/index.js";
import { Plinth } from "./Plinth/index.js";
import { createScenePainter, type ScenePainter } from "./scenePainter/index.js";
import * as styles from "./styles.js";

export type MountSceneHandle = {
  /** A live state: the climber where the sim has it, the handles, the camera, the harness's numbers. */
  paint: (state: MountState) => void;
  /** The mount beat over the terminal state, `progress` 0 → 1: the line jumps to the crown. */
  paintMount: (state: MountState, progress: number) => void;
  /** The stuck beat: the clock ran out and the hen stays where she is. */
  paintStuck: (state: MountState, progress: number) => void;
  /** The pile alone, nobody climbing: between turns and once the team is through. */
  paintPile: () => void;
  /** The whole picture flinches: a hen hitting the floor. */
  shake: () => void;
  /** While any finger is down the close-up stops following, so a held finger stays put in the world. */
  holdCamera: (held: boolean) => void;
  /** A pointer's client position as a world point, through the scene's own camera. */
  toWorld: (clientX: number, clientY: number) => MountVec | null;
};

export type MountSceneProps = {
  surface: "host" | "display";
  /** The pile the climb is climbing: the view's, or the one a replay started on. */
  pile: MountPile;
  figures: Record<string, MountPlayerFigure>;
  /** The climber as the cast draws them (`resolveHenFigure`). */
  climber: HenFigure;
  serverOrigin: string | null;
  label: string;
  cameraFit?: MountCameraFit;
};

type Box = { width: number; height: number };

const resolveHolderName = (pile: MountPile, figures: Record<string, MountPlayerFigure>): string => {
  const { playerId } = pile.highLine;

  if (playerId === null) {
    return mountSceneCopy.gooseHolder;
  }

  return figures[playerId]?.name ?? mountSceneCopy.unknownHolder;
};

/**
 * One climb both surfaces draw, each through its own camera (spec §0.5): the waterfront at dusk,
 * the plinth and the round's goose, every hen stuck on the pile, the live climber as a ragdoll,
 * the high line, and the four limb handles. Nothing here is React-driven per frame: the owner
 * paints states through the handle from its own loop (`useMountRunner`, `useMountMirror`).
 */
export const MountScene = forwardRef<MountSceneHandle, MountSceneProps>(
  ({ surface, pile, figures, climber, serverOrigin, label, cameraFit = TABLET_CAMERA_FIT }, ref): JSX.Element => {
    const frameRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const climberRef = useRef<ClimberHandle>(null);
    const handlesRef = useRef<LimbHandlesHandle>(null);
    const lineRef = useRef<HighLineHandle>(null);
    const arrowRef = useRef<HTMLParagraphElement>(null);
    const [box, setBox] = useState<Box | null>(null);
    const aspect = box === null || box.height <= 0 ? FALLBACK_ASPECT[cameraFit.kind] : box.width / box.height;
    const painterRef = useRef<ScenePainter | null>(null);

    painterRef.current ??= createScenePainter(cameraFit, {
      frame: frameRef,
      svg: svgRef,
      climber: climberRef,
      handles: handlesRef,
      line: lineRef,
      arrow: arrowRef
    });

    const painter = painterRef.current;

    painter.setContext({ aspect, pile, climberName: climber.playerName ?? mountSceneCopy.unknownHolder });

    useImperativeHandle(ref, () => painter.handle, [painter]);

    // The pile alone before any loop has painted, so the first frame is never empty.
    useLayoutEffect(() => {
      painter.handle.paintPile();
    }, [painter]);

    // Whenever the box or the pile changes, the last picture is painted again through the camera
    // the new box or pile calls for.
    useLayoutEffect(() => {
      painter.repaint();
    }, [painter, aspect, pile]);

    // The camera follows its box: the viewBox is re-derived on every resize so nothing is ever
    // stretched, only shown wider or narrower.
    useLayoutEffect(() => {
      const frame = frameRef.current;

      if (frame === null || typeof ResizeObserver === "undefined") {
        return undefined;
      }

      const measure = (): void => {
        const width = frame.offsetWidth;
        const height = frame.offsetHeight;

        setBox((current) => (current !== null && current.width === width && current.height === height ? current : { width, height }));
      };
      const observer = new ResizeObserver(measure);

      measure();
      observer.observe(frame);

      return (): void => {
        observer.disconnect();
      };
    }, []);

    return (
      <div
        ref={frameRef}
        className={styles.frame}
        data-mount-scene={surface}
        data-mount-pile-count={pile.hens.length}
        data-mount-high-line={Math.round(pile.highLine.height)}
        data-mount-line-holder={pile.highLine.playerId ?? "goose"}
      >
        <div className={styles.scene} role="img" aria-labelledby={`mount-scene-${surface}-label`}>
          <span id={`mount-scene-${surface}-label`} className={styles.label}>
            {label}
          </span>
          <svg
            ref={svgRef}
            className={styles.world}
            viewBox={resolveViewBox(painter.camera())}
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <Backdrop />
            <Plinth />
            <Goose stance={pile.goose} />
            <PileHens pile={pile} figures={figures} serverOrigin={serverOrigin} />
            <HighLine ref={lineRef} line={pile.highLine} holderName={resolveHolderName(pile, figures)} />
            <Climber ref={climberRef} figure={climber} />
            <LimbHandles ref={handlesRef} variant={surface} />
          </svg>
          {surface === "host" && <p ref={arrowRef} className={styles.lineArrow} data-mount-line-arrow data-hidden="true" />}
        </div>
      </div>
    );
  }
);

MountScene.displayName = "MountScene";
