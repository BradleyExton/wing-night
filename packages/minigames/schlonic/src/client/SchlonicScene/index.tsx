import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CHARACTER_FOOT, CharacterFigure } from "@wingnight/cast";
import type { SchlonicFrame, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD, createSchlonicRunStart, resolveSchlonicGroundSlope } from "@wingnight/shared";

import type { RunnerFigure } from "../resolveRunnerFigure/index.js";
import {
  Backdrop,
  CLOUD_PARALLAX,
  FAR_SHORE_PARALLAX,
  TOWN_PARALLAX,
  WATERFRONT_PARALLAX,
  type BackdropRefs
} from "./Backdrop/index.js";
import { TABLET_CAMERA_FIT, resolveCamera, type SchlonicCameraFit } from "./camera/index.js";
import { Ground } from "./Ground/index.js";
import { resolveRunnerCurl, resolveRunnerPose } from "./runnerPose/index.js";
import { Wing } from "./Wing/index.js";
import * as styles from "./styles.js";
import { ZoneProps } from "./ZoneProps/index.js";

export type SchlonicSceneHandle = {
  paint: (frame: SchlonicFrame) => void;
  // The two beats a surface plays over a settled frame, `progress` 0 → 1: the post crossed, and
  // the run that ended where it went wrong.
  paintCleared: (frame: SchlonicFrame, progress: number) => void;
  paintWipeout: (frame: SchlonicFrame, progress: number) => void;
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
};

type Box = { width: number; height: number };

/** The cast's 80×72 box at this much: a bird about thirteen world units tall. */
const RUNNER_SCALE = 0.18;
/**
 * The bird's drawn middle sits this far above its feet, so a tucked bird is pulled down onto the
 * hitbox's own centre and the spin turns on the spot instead of orbiting it.
 */
const TUCK_DROP = 2.5;
const TUCK_SHRINK = 0.12;

/** How long after a hit the bird keeps flashing, in ticks — the sim's own mercy window. */
const FLASH_TICKS = SCHLONIC_WORLD.invulnerableTicks;
/** Flashes per second while it lasts. */
const FLASH_HZ = 8;
/** A wing bursts out of the bird for this long after a hit. */
const BURST_TICKS = 34;
const BURST_WINGS = 6;
/** Thrown wings are a size down from the ones on the shore, and they tumble on the way out. */
const BURST_SCALE = 0.8;
const BURST_SPIN_DEGREES = 40;

/**
 * One world both surfaces draw, each through its own camera. The zone is SVG in world units,
 * built once and scrolled by a transform; the runner is the player's own cast hen (§2.8) placed
 * in it under a transform of its own, turned and tucked every frame. Nothing here is
 * React-driven per frame — the owner paints frames through the handle from its own loop, so the
 * scene re-renders only when the zone, the runner or the box it fills changes, which is what
 * keeps a costume head's halo filter rasterised once.
 */
export const SchlonicScene = forwardRef<SchlonicSceneHandle, SchlonicSceneProps>(
  ({ zone, runner, sceneId, label, cameraFit = TABLET_CAMERA_FIT }, ref): JSX.Element => {
    const frameRef = useRef<HTMLDivElement>(null);
    // The box a filling camera measures itself against; null until the first measurement (and
    // for good on a server render), when the camera falls back to its floor width.
    const [box, setBox] = useState<Box | null>(null);
    const camera = resolveCamera(cameraFit, box);
    const zoneLayerRef = useRef<SVGGElement>(null);
    const backdropRef = useRef<BackdropRefs | null>(null);
    const runnerGroupRef = useRef<SVGGElement>(null);
    const runnerTuckRef = useRef<SVGGElement>(null);
    const burstRef = useRef<SVGGElement>(null);
    const propRefs = useRef(new Map<number, SVGGElement>());
    const hiddenProps = useRef(new Set<number>());
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

    const paintScroll = (frame: SchlonicFrame): void => {
      const scrollX = frame.x - SCHLONIC_WORLD.runnerX;

      zoneLayerRef.current?.setAttribute("transform", `translate(${-scrollX} 0)`);
      backdropRef.current?.clouds?.setAttribute("transform", `translate(${-scrollX * CLOUD_PARALLAX} 0)`);
      backdropRef.current?.farShore?.setAttribute("transform", `translate(${-scrollX * FAR_SHORE_PARALLAX} 0)`);
      backdropRef.current?.town?.setAttribute("transform", `translate(${-scrollX * TOWN_PARALLAX} 0)`);
      backdropRef.current?.waterfront?.setAttribute(
        "transform",
        `translate(${-scrollX * WATERFRONT_PARALLAX} 0)`
      );
    };

    const paintRunner = (
      frame: SchlonicFrame,
      extra: { curl: number; fade: number; sink: number }
    ): void => {
      const pose = resolveRunnerPose({
        x: frame.x,
        grounded: frame.grounded,
        slope: resolveSchlonicGroundSlope(zoneRef.current, frame.x),
        curl: extra.curl
      });
      const lastHit = frame.hits[frame.hits.length - 1] ?? -FLASH_TICKS * 2;
      const sinceHit = frame.tick - lastHit;
      const isFlashing = sinceHit >= 0 && sinceHit < FLASH_TICKS;
      const flashOpacity =
        isFlashing && Math.floor((sinceHit / SCHLONIC_WORLD.tickHz) * FLASH_HZ * 2) % 2 === 1 ? 0.25 : 1;
      const group = runnerGroupRef.current;

      group?.setAttribute(
        "transform",
        `translate(${SCHLONIC_WORLD.runnerX} ${frame.y - pose.bob + extra.sink}) rotate(${pose.angle})`
      );
      group?.setAttribute("opacity", `${flashOpacity * extra.fade}`);
      // The runner writes where it is and whether its feet are down, every frame, so a harness
      // reads the sim's own numbers rather than reverse-engineering them out of a transform
      // (the JOUST and FAPPY convention — see `data-champ-top`).
      group?.setAttribute("data-schlonic-x", `${Math.round(frame.x * 10) / 10}`);
      group?.setAttribute("data-schlonic-grounded", frame.grounded ? "true" : "false");
      group?.setAttribute("data-schlonic-held-wings", `${frame.wings}`);

      runnerTuckRef.current?.setAttribute(
        "transform",
        `translate(0 ${SCHLONIC_WORLD.runnerRadius + pose.tuck * TUCK_DROP}) scale(${
          RUNNER_SCALE * (1 - pose.tuck * TUCK_SHRINK)
        }) translate(${-CHARACTER_FOOT.x} ${-CHARACTER_FOOT.y})`
      );
    };

    // The handful that leaves you when you take a hit: wings thrown up out of the bird and gone.
    // Decoration — the sim already took them, and none of these can be caught.
    const paintBurst = (frame: SchlonicFrame): void => {
      const burst = burstRef.current;

      if (burst === null) {
        return;
      }

      const lastHit = frame.hits[frame.hits.length - 1] ?? -BURST_TICKS * 2;
      const since = frame.tick - lastHit;

      if (since < 0 || since > BURST_TICKS) {
        burst.setAttribute("opacity", "0");
        return;
      }

      const along = since / BURST_TICKS;

      burst.setAttribute("opacity", `${1 - along}`);
      burst.setAttribute("transform", `translate(${SCHLONIC_WORLD.runnerX} ${frame.y})`);

      for (let index = 0; index < BURST_WINGS; index += 1) {
        const radians = (index / BURST_WINGS) * Math.PI * 2;
        const spread = along * 16;
        const x = Math.cos(radians) * spread;
        const y = Math.sin(radians) * spread - along * 6;

        // A wing is a whole drawing rather than one circle, so it is placed by transform — and
        // tumbling as it goes is free once it is a group.
        burst.children[index]?.setAttribute(
          "transform",
          `translate(${x} ${y}) rotate(${radians * BURST_SPIN_DEGREES})`
        );
      }
    };

    const paint = (frame: SchlonicFrame): void => {
      curlRef.current = resolveRunnerCurl(frame.grounded, curlRef.current);
      paintScroll(frame);
      paintProps(frame);
      paintRunner(frame, { curl: curlRef.current, fade: 1, sink: 0 });
      paintBurst(frame);
    };

    // The post: the bird hops on the spot while the room reads the tally.
    const paintCleared = (frame: SchlonicFrame, progress: number): void => {
      const hop = Math.abs(Math.sin(progress * Math.PI * 3)) * 6;

      paintScroll(frame);
      paintProps(frame);
      paintRunner(frame, { curl: 0, fade: 1, sink: -hop });
      burstRef.current?.setAttribute("opacity", "0");
    };

    // It went wrong: the bird drops out of the bottom of the zone and the room is left with the
    // ground it did not make.
    const paintWipeout = (frame: SchlonicFrame, progress: number): void => {
      paintScroll(frame);
      paintProps(frame);
      paintRunner(frame, {
        curl: 1,
        fade: Math.max(0, 1 - progress * 1.4),
        sink: progress * progress * 40
      });
      paintBurst(frame);
    };

    useImperativeHandle(ref, () => ({ paint, paintCleared, paintWipeout }));

    const goalGroundY = useMemo(() => {
      return zone.heights[Math.floor(zone.goalX / SCHLONIC_WORLD.sampleStep)] ?? SCHLONIC_WORLD.groundBaseY;
    }, [zone]);

    // The rest pose, before any loop has run: the bird on the start line. Without this the
    // drawing sits at the top-left until the first frame.
    useLayoutEffect(() => {
      hiddenProps.current.clear();
      curlRef.current = 0;
      paint(createSchlonicRunStart(zoneRef.current));
    }, [sceneId, zone, runner]);

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
              <Ground zone={zone} camera={camera} />
              <ZoneProps zone={zone} registerProp={registerProp} goalGroundY={goalGroundY} />
            </g>
            <g ref={burstRef} data-schlonic-burst opacity={0}>
              {Array.from({ length: BURST_WINGS }, (_unused, index) => (
                <g key={index}>
                  <Wing scale={BURST_SCALE} />
                </g>
              ))}
            </g>
            {/* The bird turns about the hitbox's own centre; the group inside it stands the cast
                on that centre and tucks it in. Two groups, because a spin and a stance are
                different transforms and neither should have to know about the other. */}
            <g ref={runnerGroupRef} className={runner.fillClassName} data-schlonic-runner>
              <g ref={runnerTuckRef}>
                <CharacterFigure
                  appearance={runner.appearance}
                  apparel={runner.apparel}
                  silhouette={runner.silhouette}
                  pose="walk"
                />
              </g>
            </g>
          </svg>
        </div>
      </div>
    );
  }
);

SchlonicScene.displayName = "SchlonicScene";
