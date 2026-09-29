import { forwardRef, useImperativeHandle, useRef } from "react";
import type { SchlonicFrame, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import type { RunnerFigure } from "../../resolveRunnerFigure/index.js";
import { isRunnerAirborne } from "../../runnerClearance/index.js";
import type { SchlonicCamera } from "../camera/index.js";
import { Rider, paintRider, type RiderRefs } from "../Rider/index.js";
import { resolveRiderPlacement } from "../riderPlacement/index.js";
import { resolveRunnerCurl } from "../runnerPose/index.js";
import * as styles from "./styles.js";

/** The ghost is a shadow of a run, not a runner: never solid, never in front. */
const GHOST_OPACITY = 0.5;
/** How far outside the camera the ghost may be before it is not drawn at all. */
const GHOST_MARGIN = 20;
/** The ghost's name tag hangs this far above its head, in world units. */
const GHOST_TAG_RISE = 13;

export type GhostRefs = {
  group: SVGGElement | null;
  tag: SVGTextElement | null;
  rider: RiderRefs | null;
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

/**
 * The ghost stands where its own replay has got to, measured off the live runner: the zone
 * scrolls with the live run, so the ghost's place on screen is the runner's plus the gap
 * between the two. Hidden on the line (two riders on one spot is a smudge) and once it is
 * further off the camera than the margin. It is placed by the runner's own rule
 * (`resolveRiderPlacement`) — board, kickflip, grind and bail — so it is the same rider. Returns
 * the curl to carry to the next frame.
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

  const nextCurl = resolveRunnerCurl(isRunnerAirborne(zone, ghostFrame), curl);

  paintRider(refs?.rider ?? null, resolveRiderPlacement({ zone, frame: ghostFrame, screenX, curl: nextCurl }), {
    hen: 1,
    board: 1
  });
  refs?.tag?.setAttribute("transform", `translate(${screenX} ${ghostFrame.y - GHOST_TAG_RISE})`);

  return nextCurl;
};

/**
 * The run to beat, drawn behind the runner: the best run's own bird on its own board, at half
 * strength, its name over its head so the room knows whose pace this is. Placed every frame by
 * `paintGhost` through the refs; nothing here is React-driven per frame.
 */
export const Ghost = forwardRef<GhostRefs, { figure: RunnerFigure }>(({ figure }, ref): JSX.Element => {
  const group = useRef<SVGGElement>(null);
  const tag = useRef<SVGTextElement>(null);
  const rider = useRef<RiderRefs>(null);

  useImperativeHandle(ref, () => ({ group: group.current, tag: tag.current, rider: rider.current }));

  return (
    <g ref={group} className={figure.fillClassName} opacity={0} data-schlonic-ghost aria-hidden="true">
      <text ref={tag} className={styles.tag} x={0} y={0} textAnchor="middle">
        {figure.playerName ?? ""}
      </text>
      <Rider ref={rider} figure={figure} isRunner={false} />
    </g>
  );
});

Ghost.displayName = "Ghost";
