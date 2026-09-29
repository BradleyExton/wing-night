import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { SchlonicFrame, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD, createSchlonicRunStart, resolveSchlonicHazardX } from "@wingnight/shared";

import type { RunnerFigure } from "../resolveRunnerFigure/index.js";
import { isRunnerAirborne } from "../runnerClearance/index.js";
import { Backdrop, paintBackdropScroll, type BackdropRefs } from "./Backdrop/index.js";
import { Burst, paintBurst } from "./Burst/index.js";
import { TABLET_CAMERA_FIT, resolveCamera, type SchlonicCameraFit } from "./camera/index.js";
import { FallPunchline } from "./FallPunchline/index.js";
import { Ghost, paintGhost, type GhostRefs } from "./Ghost/index.js";
import { Ground } from "./Ground/index.js";
import { Rider, paintRider, type RiderRefs } from "./Rider/index.js";
import { resolveRiderPlacement } from "./riderPlacement/index.js";
import { resolveRunnerCurl } from "./runnerPose/index.js";
import { FIRST_LEG, SetPieces, type SchlonicLeg } from "./SetPieces/index.js";
import { shakeElement } from "./shake/index.js";
import * as styles from "./styles.js";
import { usePunchline } from "./usePunchline/index.js";
import { WipeoutPunchline } from "./WipeoutPunchline/index.js";
import { ZoneProps } from "./ZoneProps/index.js";

export type SchlonicSceneHandle = {
  /** The live frame, and the ghost's frame on the same tick when the round has a run to beat. */
  paint: (frame: SchlonicFrame, ghostFrame?: SchlonicFrame | null) => void;
  // The two beats a surface plays over a settled frame, `progress` 0 → 1: the post crossed, and
  // the run that ended where it went wrong — played as its punchline (`punchlineTimeline/`),
  // which for a fall needs the handful the terminal frame no longer carries. The ghost's frame
  // comes with them, because the surface may hold the beat in a scene mounted after the run
  // (the tablet keys its scene on the run it shows) and a scene keeps no ghost of its own.
  paintCleared: (frame: SchlonicFrame, progress: number, ghostFrame?: SchlonicFrame | null) => void;
  paintWipeout: (frame: SchlonicFrame, progress: number, ghostFrame?: SchlonicFrame | null, wingsLost?: number) => void;
  /** The whole picture flinches: a hit, opposite the impact. A browser without the API does nothing. */
  shake: () => void;
};

export type SchlonicSceneProps = {
  zone: SchlonicZone;
  runner: RunnerFigure;
  sceneId: string;
  label: string;
  /**
   * How much of the world this surface sees, and how it sits in its box. The tablet's 16:9
   * box by default; the TV passes a wider, filling camera so the room sees further ahead of
   * the runner than the tablet holder does (`camera/index.ts`).
   */
  cameraFit?: SchlonicCameraFit;
  /**
   * The round's best run so far, as a figure: the ghost the runner races. Drawn behind the
   * runner, at half strength, wherever its own replay has got to on the same tick — ahead or
   * behind, in the picture or off it. Null until someone has cleared the zone.
   */
  ghost?: RunnerFigure | null;
  /** Which leg of the street the zone is: the shop stands on the first, the hotel on the last. */
  leg?: SchlonicLeg;
};

type Box = { width: number; height: number };

// The runner's scale and stance live with the rider's placement (`riderPlacement/`), which the
// ghost is placed by too: the same hen on the same board, by the same rule.

/** How far either side of the runner a swaying crowd member is still moved: past both cameras' edges. */
const MOVER_WINDOW = 260;
/** How long after a hit the bird keeps flashing, in ticks — the sim's own mercy window. */
const FLASH_TICKS = SCHLONIC_WORLD.invulnerableTicks;
/** Flashes per second while it lasts. */
const FLASH_HZ = 8;

/**
 * One world both surfaces draw, each through its own camera. The zone is SVG in world units,
 * built once and scrolled by a transform; the runner is the player's own cast hen (§2.8) on a
 * skateboard, placed in it every frame — rolling, flipping the board, grinding or bailing. Nothing here is
 * React-driven per frame — the owner paints frames through the handle from its own loop, so the
 * scene re-renders only when the zone, the runner or the box it fills changes, which is what
 * keeps a costume head's halo filter rasterised once.
 */
export const SchlonicScene = forwardRef<SchlonicSceneHandle, SchlonicSceneProps>(
  ({ zone, runner, sceneId, label, cameraFit = TABLET_CAMERA_FIT, ghost = null, leg = FIRST_LEG }, ref): JSX.Element => {
    const frameRef = useRef<HTMLDivElement>(null);
    // The box a filling camera measures itself against; null until the first measurement (and
    // for good on a server render), when the camera falls back to its floor width.
    const [box, setBox] = useState<Box | null>(null);
    const camera = resolveCamera(cameraFit, box);
    const zoneLayerRef = useRef<SVGGElement>(null);
    const backdropRef = useRef<BackdropRefs | null>(null);
    const riderRef = useRef<RiderRefs>(null);
    const ghostRefs = useRef<GhostRefs | null>(null);
    const ghostCurlRef = useRef(0);
    const cameraRef = useRef(camera);

    cameraRef.current = camera;
    const burstRef = useRef<SVGGElement>(null);
    const propRefs = useRef(new Map<number, SVGGElement>());
    const hiddenProps = useRef(new Set<number>());
    const movedProps = useRef(new Set<number>());
    const curlRef = useRef(0);
    const zoneRef = useRef(zone);
    const ids = { label: `${sceneId}-label` };

    zoneRef.current = zone;

    const registerProp = (index: number, element: SVGGElement | null): void => {
      if (element === null) {
        propRefs.current.delete(index);
        return;
      }

      propRefs.current.set(index, element);
    };

    // Only the props that changed hands this frame are touched: a zone carries a couple of
    // hundred wings and the loop runs sixty times a second.
    const paintProps = (frame: SchlonicFrame): void => {
      if (hiddenProps.current.size > frame.takenProps.length) {
        // A replay went back to the start (a reset, a rewound mirror): put everything back.
        for (const index of hiddenProps.current) {
          propRefs.current.get(index)?.setAttribute("opacity", "1");
        }

        hiddenProps.current.clear();
      }

      for (const index of frame.takenProps) {
        if (hiddenProps.current.has(index)) {
          continue;
        }

        propRefs.current.get(index)?.setAttribute("opacity", "0");
        hiddenProps.current.add(index);
      }
    };

    // The crowd that sways is moved off its spot every frame, by the same rule the sim hits it
    // by: a translate on the prop's own group, so the drawing never re-renders. Only the ones
    // near the runner are touched; the rest are off both cameras.
    const paintMovers = (frame: SchlonicFrame): void => {
      for (const prop of zoneRef.current.props) {
        if (prop.kind !== "hazard" || Math.abs(prop.x - frame.x) > MOVER_WINDOW) {
          continue;
        }

        const offset = resolveSchlonicHazardX(prop, frame.tick) - prop.x;

        if (offset !== 0 || movedProps.current.has(prop.index)) {
          propRefs.current.get(prop.index)?.setAttribute("transform", `translate(${offset} 0)`);
          movedProps.current.add(prop.index);
        }
      }
    };

    const paintScroll = (frame: SchlonicFrame): void => {
      const scrollX = frame.x - SCHLONIC_WORLD.runnerX;

      zoneLayerRef.current?.setAttribute("transform", `translate(${-scrollX} 0)`);
      paintBackdropScroll(backdropRef.current, scrollX);
    };

    const paintRunner = (frame: SchlonicFrame, extra: { curl: number; sink: number }): void => {
      const placement = resolveRiderPlacement({
        zone: zoneRef.current,
        frame,
        screenX: SCHLONIC_WORLD.runnerX,
        curl: extra.curl,
        sink: extra.sink
      });
      const lastHit = frame.hits[frame.hits.length - 1] ?? -FLASH_TICKS * 2;
      const sinceHit = frame.tick - lastHit;
      const isFlashing = sinceHit >= 0 && sinceHit < FLASH_TICKS;
      const flashOpacity =
        isFlashing && Math.floor((sinceHit / SCHLONIC_WORLD.tickHz) * FLASH_HZ * 2) % 2 === 1 ? 0.25 : 1;
      const group = riderRef.current?.hen ?? null;

      paintRider(riderRef.current, placement, { hen: flashOpacity, board: 1 });
      // The runner writes where it is and what its feet are on, every frame, so a harness reads
      // the sim's own numbers rather than reverse-engineering them out of a transform (the JOUST
      // and FAPPY convention — see `data-champ-top`).
      group?.setAttribute("data-schlonic-x", `${Math.round(frame.x * 10) / 10}`);
      group?.setAttribute("data-schlonic-grounded", frame.grounded ? "true" : "false");
      group?.setAttribute("data-schlonic-grinding", placement.grinding ? "true" : "false");
      group?.setAttribute("data-schlonic-board-roll", `${Math.round(placement.boardRoll)}`);
      group?.setAttribute("data-schlonic-bailing", placement.bail === null ? "false" : "true");
      group?.setAttribute("data-schlonic-held-wings", `${frame.wings}`);
    };

    const paintGhostFrame = (ghostFrame: SchlonicFrame | null, frame: SchlonicFrame): void => {
      ghostCurlRef.current = paintGhost({
        refs: ghostRefs.current,
        ghostFrame,
        frame,
        camera: cameraRef.current,
        zone: zoneRef.current,
        curl: ghostCurlRef.current
      });
    };

    // A beat that ends badly ends on a joke; the hook moves the runner, the burst and the
    // eater through it, and puts them back on the next paint.
    const punchline = usePunchline({
      frameRef,
      riderRef,
      burstRef,
      zoneRef,
      cameraRef
    });

    const paint = (frame: SchlonicFrame, ghostFrame: SchlonicFrame | null = null): void => {
      punchline.clear();
      curlRef.current = resolveRunnerCurl(isRunnerAirborne(zoneRef.current, frame), curlRef.current);
      paintScroll(frame);
      paintProps(frame);
      paintMovers(frame);
      paintGhostFrame(ghostFrame, frame);
      paintRunner(frame, { curl: curlRef.current, sink: 0 });
      paintBurst(burstRef.current, frame);
    };

    // The post: the rider ollies on the spot while the room reads the tally.
    const paintCleared = (
      frame: SchlonicFrame,
      progress: number,
      ghostFrame: SchlonicFrame | null = null
    ): void => {
      const hop = Math.abs(Math.sin(progress * Math.PI * 3)) * 6;

      paintScroll(frame);
      paintProps(frame);
      paintMovers(frame);
      paintGhostFrame(ghostFrame, frame);
      paintRunner(frame, { curl: 0, sink: -hop });
      burstRef.current?.setAttribute("opacity", "0");
    };

    // It went wrong, and the picture tells the joke before the card tells the verdict.
    const paintWipeout = (
      frame: SchlonicFrame,
      progress: number,
      ghostFrame: SchlonicFrame | null = null,
      wingsLost = 0
    ): void => {
      paintScroll(frame);
      paintProps(frame);
      paintMovers(frame);
      paintGhostFrame(ghostFrame, frame);
      punchline.paint(frame, progress, wingsLost);
    };

    const shake = (): void => {
      shakeElement(frameRef.current);
    };

    useImperativeHandle(ref, () => ({ paint, paintCleared, paintWipeout, shake }));

    const goalGroundY = useMemo(() => {
      return zone.heights[Math.floor(zone.goalX / SCHLONIC_WORLD.sampleStep)] ?? SCHLONIC_WORLD.groundBaseY;
    }, [zone]);

    // The rest pose, before any loop has run: the bird on the start line. Without this the
    // drawing sits at the top-left until the first frame.
    useLayoutEffect(() => {
      hiddenProps.current.clear();
      movedProps.current.clear();
      curlRef.current = 0;
      ghostCurlRef.current = 0;
      paint(createSchlonicRunStart(zoneRef.current));
    }, [sceneId, zone, runner, ghost]);

    // A filling camera follows its box: the viewBox is re-derived on every resize so the
    // world is never stretched, only shown wider or narrower.
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
        data-schlonic-scene={sceneId}
        data-schlonic-camera={cameraFit.kind}
      >
        <div
          className={cameraFit.kind === "fill" ? styles.sceneFill : styles.sceneFixed}
          role="img"
          aria-labelledby={ids.label}
        >
          <span id={ids.label} className={styles.label}>
            {label}
          </span>
          <svg
            className={styles.world}
            viewBox={`${camera.x} ${camera.y} ${camera.width} ${camera.height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <Backdrop ref={backdropRef} zoneLength={zone.goalX} camera={camera} />
            <g ref={zoneLayerRef} data-schlonic-zone>
              <SetPieces zone={zone} goalGroundY={goalGroundY} leg={leg} />
              <Ground zone={zone} camera={camera} />
              <ZoneProps zone={zone} registerProp={registerProp} goalGroundY={goalGroundY} />
              <WipeoutPunchline ref={punchline.wipeoutRef} />
            </g>
            <Burst ref={burstRef} />
            {ghost !== null && <Ghost ref={ghostRefs} figure={ghost} />}
            {/* The hen and its board, clipped at a trench's lip while the fall's joke plays. */}
            <g ref={punchline.runnerClipRef}>
              <Rider ref={riderRef} figure={runner} isRunner />
            </g>
            <FallPunchline ref={punchline.fallRef} clipId={punchline.trenchClipId} camera={camera} />
          </svg>
        </div>
      </div>
    );
  }
);

SchlonicScene.displayName = "SchlonicScene";
