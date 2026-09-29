import { forwardRef, useImperativeHandle, useRef } from "react";
import { CHARACTER_FOOT, CharacterFigure } from "@wingnight/cast";
import type { SchlonicFrame, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import type { RunnerFigure } from "../../resolveRunnerFigure/index.js";
import type { SchlonicCamera } from "../camera/index.js";
import { resolveRunnerCurl, resolveRunnerPose, resolveRunnerSlope } from "../runnerPose/index.js";
import * as styles from "./styles.js";

/** The ghost is a shadow of a run, not a runner: never solid, never in front. */
const GHOST_OPACITY = 0.5;
/** How far outside the camera the ghost may be before it is not drawn at all. */
const GHOST_MARGIN = 20;
/** The ghost's name tag hangs this far above its head, in world units. */
const GHOST_TAG_RISE = 11;

export type GhostRefs = {
  group: SVGGElement | null;
  tuck: SVGGElement | null;
};

export type GhostPaintInput = {
  refs: GhostRefs | null;
  /** The ghost's own replay on the live run's tick, or null with no run to beat. */
  ghostFrame: SchlonicFrame | null;
  /** The live frame the zone is scrolled to. */
  frame: SchlonicFrame;
  camera: SchlonicCamera;
  zone: SchlonicZone;
  /** The ghost's own curl, carried between frames by the caller. */
  curl: number;
};

/** The runner's own scale and stance, shared so the ghost is drawn as the same bird. */
export const RUNNER_SCALE = 0.18;
export const TUCK_DROP = 2.5;
export const TUCK_SHRINK = 0.12;

/**
 * The ghost stands where its own replay has got to, measured off the live runner: the zone
 * scrolls with the live run, so the ghost's place on screen is the runner's plus the gap
 * between the two. Hidden on the line (two hens on one spot is a smudge) and once it is
 * further off the camera than the margin. Returns the curl to carry to the next frame.
 */
export const paintGhost = ({ refs, ghostFrame, frame, camera, zone, curl }: GhostPaintInput): number => {
  const group = refs?.group ?? null;

  if (group === null) {
    return curl;
  }

  const screenX = ghostFrame === null ? 0 : SCHLONIC_WORLD.runnerX + (ghostFrame.x - frame.x);
  const isShown =
    ghostFrame !== null &&
    ghostFrame.tick > 0 &&
    screenX > camera.x - GHOST_MARGIN &&
    screenX < camera.x + camera.width + GHOST_MARGIN;

  group.setAttribute("opacity", isShown ? `${GHOST_OPACITY}` : "0");
  group.setAttribute("data-schlonic-ghost-x", ghostFrame === null ? "" : `${Math.round(ghostFrame.x * 10) / 10}`);
  group.setAttribute("data-schlonic-ghost-shown", isShown ? "true" : "false");

  if (ghostFrame === null || !isShown) {
    return curl;
  }

  const nextCurl = resolveRunnerCurl(ghostFrame.grounded, curl);
  const pose = resolveRunnerPose({
    x: ghostFrame.x,
    grounded: ghostFrame.grounded,
    slope: resolveRunnerSlope(zone, ghostFrame),
    curl: nextCurl
  });

  group.setAttribute("transform", `translate(${screenX} ${ghostFrame.y - pose.bob})`);
  refs?.tuck?.setAttribute(
    "transform",
    `rotate(${pose.angle}) translate(0 ${SCHLONIC_WORLD.runnerRadius + pose.tuck * TUCK_DROP}) scale(${
      RUNNER_SCALE * (1 - pose.tuck * TUCK_SHRINK)
    }) translate(${-CHARACTER_FOOT.x} ${-CHARACTER_FOOT.y})`
  );

  return nextCurl;
};

/**
 * The run to beat, drawn behind the runner: the best run's own bird, at half strength, its
 * name over its head so the room knows whose pace this is. Placed every frame by `paintGhost`
 * through the refs; nothing here is React-driven per frame.
 */
export const Ghost = forwardRef<GhostRefs, { figure: RunnerFigure }>(({ figure }, ref): JSX.Element => {
  const group = useRef<SVGGElement>(null);
  const tuck = useRef<SVGGElement>(null);

  useImperativeHandle(ref, () => ({ group: group.current, tuck: tuck.current }));

  return (
    <g ref={group} className={figure.fillClassName} opacity={0} data-schlonic-ghost aria-hidden="true">
      <text className={styles.tag} x={0} y={-GHOST_TAG_RISE} textAnchor="middle">
        {figure.playerName ?? ""}
      </text>
      <g ref={tuck}>
        <CharacterFigure
          appearance={figure.appearance}
          apparel={figure.apparel}
          silhouette={figure.silhouette}
          pose="walk"
        />
      </g>
    </g>
  );
});

Ghost.displayName = "Ghost";
