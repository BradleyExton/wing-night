import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import type { BrawlBlock, BrawlFrame } from "@wingnight/shared";
import { createBrawlRunStart } from "@wingnight/shared";

import type { HenFigure } from "../resolveHenFigure/index.js";
import type { BrawlRelay } from "../useBrawlBlock/index.js";
import { Sky, Street, paintSky, resolveBrawlSetting } from "./Backdrop/index.js";
import { BayLift, paintBayLift, type BayLiftRefs } from "./BayLift/index.js";
import { resolveClearedBeat, resolveKoBeat, resolveTimeoutBeat } from "./beatTimeline/index.js";
import { Bell, paintBell } from "./Bell/index.js";
import { TABLET_CAMERA_FIT, resolveCamera, resolveViewBox, type BrawlCameraFit } from "./camera/index.js";
import { DunkSplash, paintDunkSplash, resolveDunkSplash } from "./DunkSplash/index.js";
import { GoArrow, paintGo } from "./GoArrow/index.js";
import { GoonLayer, type GoonLayerHandle } from "./GoonLayer/index.js";
import { Hen, paintHen, type HenRefs } from "./Hen/index.js";
import { isHenPecking, resolveHenOpacity, resolveHenPose } from "./henPose/index.js";
import { PickupLayer, type PickupLayerHandle } from "./PickupLayer/index.js";
import { NEXT_MATE_PAST_HANDOFF, RelayMates, placeMate, type RelayMatesRefs } from "./RelayMates/index.js";
import { shakeElement } from "./shake/index.js";
import * as styles from "./styles.js";

export type BrawlSceneHandle = {
  /** The live frame: the street scrolled to its camera, the goons, the hen in her pose, the GO arrow. */
  paint: (frame: BrawlFrame) => void;
  // The three endings a surface plays over a block's terminal frame, `progress` 0 → 1
  // (`beatTimeline/`): the handoff, the bay, and the bell.
  paintCleared: (frame: BrawlFrame, progress: number) => void;
  paintKo: (frame: BrawlFrame, progress: number) => void;
  paintTimeout: (frame: BrawlFrame, progress: number) => void;
  /** The whole picture flinches: a hit on the hen. A browser without the API does nothing. */
  shake: () => void;
};

export type BrawlSceneProps = {
  block: BrawlBlock;
  /** The block's player as the cast draws them (`resolveHenFigure`). */
  hen: HenFigure;
  sceneId: string;
  label: string;
  /**
   * How much of the street this surface sees around the sim's camera. The tablet's own 160×90
   * box by default; the TV passes a filling camera so the room sees more street than the holder.
   */
  cameraFit?: BrawlCameraFit;
  /** The teammates either side of the block, stood at the start line and at the handoff. */
  relay?: BrawlRelay;
};

type Box = { width: number; height: number };

const NO_RELAY: BrawlRelay = { last: null, next: null };

const setIfChanged = (element: Element | null, name: string, value: string): void => {
  if (element !== null && element.getAttribute(name) !== value) {
    element.setAttribute(name, value);
  }
};

/**
 * One street both surfaces draw, each through its own camera (docs/minigames/brawl-spec.md §0.8).
 * The block is SVG in world units, built once and scrolled by the sim's own camera; the hen is the
 * player's own cast hen, the goons the street's own drawings. Nothing here is React-driven per
 * frame: the owner paints frames through the handle from its own loop, and the only React work
 * after mount is the goons layer redrawing a goon whose picture changed.
 */
export const BrawlScene = forwardRef<BrawlSceneHandle, BrawlSceneProps>(
  ({ block, hen, sceneId, label, cameraFit = TABLET_CAMERA_FIT, relay = NO_RELAY }, ref): JSX.Element => {
    const frameRef = useRef<HTMLDivElement>(null);
    // The box a filling camera measures itself against; null until the first measurement.
    const [box, setBox] = useState<Box | null>(null);
    const camera = resolveCamera(cameraFit, box);
    const cameraRef = useRef(camera);
    const blockRef = useRef(block);
    const relayRef = useRef(relay);
    const worldRef = useRef<SVGGElement>(null);
    const skyRef = useRef<SVGGElement>(null);
    const henRef = useRef<HenRefs>(null);
    const goonsRef = useRef<GoonLayerHandle>(null);
    const pickupsRef = useRef<PickupLayerHandle>(null);
    const dunkRef = useRef<SVGGElement>(null);
    const matesRef = useRef<RelayMatesRefs>(null);
    const goRef = useRef<SVGGElement>(null);
    const bellRef = useRef<SVGGElement>(null);
    const bayRef = useRef<BayLiftRefs>(null);
    // Whether a beat has moved anything a live frame does not: the next paint puts it back.
    const beatDirtyRef = useRef(false);

    cameraRef.current = camera;
    blockRef.current = block;
    relayRef.current = relay;

    const mateX = (): number | null => {
      return relayRef.current.next === null ? null : blockRef.current.handoffX + NEXT_MATE_PAST_HANDOFF;
    };

    // The street under the sim's camera, and the camera's own numbers on the scene for a harness.
    const paintStreet = (frame: BrawlFrame): void => {
      worldRef.current?.setAttribute("transform", `translate(${Math.round(-frame.cameraX * 100) / 100} 0)`);
      paintSky(skyRef.current, frame.cameraX);
      pickupsRef.current?.paint(frame);
      paintDunkSplash(dunkRef.current, resolveDunkSplash(frame, blockRef.current.hazard?.kind ?? null));
      goonsRef.current?.paint(frame);
      setIfChanged(frameRef.current, "data-brawl-camera-x", `${Math.round(frame.cameraX)}`);
      setIfChanged(frameRef.current, "data-brawl-wave", `${frame.waveIndex}`);
      setIfChanged(frameRef.current, "data-brawl-locked", frame.cameraLocked ? "true" : "false");
    };

    const clearBeat = (): void => {
      if (!beatDirtyRef.current) {
        return;
      }

      beatDirtyRef.current = false;
      paintBell(bellRef.current, cameraRef.current, null);
      paintBayLift(bayRef.current, 0, null, 0);

      const x = mateX();

      if (x !== null) {
        placeMate(matesRef.current?.next ?? null, x, -1);
      }
    };

    const startBeat = (frame: BrawlFrame): void => {
      beatDirtyRef.current = true;
      paintStreet(frame);
      paintGo(goRef.current, false);
    };

    const paint = (frame: BrawlFrame): void => {
      clearBeat();
      paintStreet(frame);
      paintHen(henRef.current, {
        x: frame.x,
        facing: frame.facing,
        pose: resolveHenPose(frame),
        opacity: resolveHenOpacity(frame),
        pecking: isHenPecking(frame)
      });
      paintGo(goRef.current, !frame.cameraLocked && frame.outcome === null);
      // Every peck the sim took moves this on, so a harness can count pecks a beak's flash would miss.
      setIfChanged(frameRef.current, "data-brawl-peck-until", `${frame.peckUntilTick}`);
    };

    const paintCleared = (frame: BrawlFrame, progress: number): void => {
      const x = mateX();
      const beat = resolveClearedBeat(frame.x, x, progress);

      startBeat(frame);
      paintHen(henRef.current, {
        x: beat.henX,
        facing: beat.facing,
        pose: beat.pose,
        opacity: 1,
        pecking: beat.pose === "peck"
      });

      if (x !== null) {
        placeMate(matesRef.current?.next ?? null, x, beat.mateFacing);
      }
    };

    const paintKo = (frame: BrawlFrame, progress: number): void => {
      const beat = resolveKoBeat(frame.x, progress);
      const bottomY = cameraRef.current.y + cameraRef.current.height;

      startBeat(frame);
      paintHen(henRef.current, {
        x: frame.x,
        facing: frame.facing,
        pose: "ko",
        opacity: 1,
        pecking: false,
        lift: beat.henLift
      });
      paintBayLift(bayRef.current, frame.x, beat, bottomY);
    };

    const paintTimeout = (frame: BrawlFrame, progress: number): void => {
      const beat = resolveTimeoutBeat(frame.facing, progress);

      startBeat(frame);
      paintHen(henRef.current, {
        x: frame.x,
        facing: frame.facing,
        pose: beat.pose,
        opacity: 1,
        pecking: false,
        tilt: beat.tilt
      });
      paintBell(bellRef.current, cameraRef.current, progress);
    };

    const shake = (): void => {
      shakeElement(frameRef.current);
    };

    useImperativeHandle(ref, () => ({ paint, paintCleared, paintKo, paintTimeout, shake }));

    // The rest pose, before any loop has run: the hen on the start line, the camera on wave one.
    useLayoutEffect(() => {
      beatDirtyRef.current = true;
      paint(createBrawlRunStart(blockRef.current));
    }, [sceneId, block, hen, relay]);

    // A filling camera follows its box: the viewBox is re-derived on every resize so the street
    // is never stretched, only shown wider or narrower.
    useLayoutEffect(() => {
      const frame = frameRef.current;

      if (cameraFit.kind !== "fill" || frame === null || typeof ResizeObserver === "undefined") {
        return undefined;
      }

      const measure = (): void => {
        const rect = frame.getBoundingClientRect();

        setBox((current) => {
          return current !== null && current.width === rect.width && current.height === rect.height
            ? current
            : { width: rect.width, height: rect.height };
        });
      };
      const observer = new ResizeObserver(measure);

      measure();
      observer.observe(frame);

      return (): void => {
        observer.disconnect();
      };
    }, [cameraFit.kind]);

    return (
      <div
        ref={frameRef}
        className={styles.frame}
        data-brawl-scene={sceneId}
        data-brawl-camera={cameraFit.kind}
        data-brawl-block={block.index}
      >
        <div className={cameraFit.kind === "fill" ? styles.sceneFill : styles.sceneFixed} role="img" aria-labelledby={`${sceneId}-label`}>
          <span id={`${sceneId}-label`} className={styles.label}>
            {label}
          </span>
          <svg className={styles.world} viewBox={resolveViewBox(camera)} preserveAspectRatio="none" aria-hidden="true">
            <Sky ref={skyRef} setting={resolveBrawlSetting(block.index)} />
            <g ref={worldRef} data-brawl-world>
              <Street block={block} />
              <RelayMates ref={matesRef} block={block} relay={relay} />
              <PickupLayer ref={pickupsRef} />
              <DunkSplash ref={dunkRef} kind={block.hazard?.kind ?? null} />
              <GoonLayer ref={goonsRef} />
              <Hen ref={henRef} figure={hen} />
              <BayLift ref={bayRef} />
            </g>
            <GoArrow ref={goRef} camera={camera} />
            <Bell ref={bellRef} />
          </svg>
        </div>
      </div>
    );
  }
);

BrawlScene.displayName = "BrawlScene";
