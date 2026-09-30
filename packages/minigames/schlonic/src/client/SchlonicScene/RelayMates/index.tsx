import { CHARACTER_FOOT, CharacterFigure } from "@wingnight/cast";
import type { SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import type { RunnerFigure } from "../../resolveRunnerFigure/index.js";
import * as ghostStyles from "../Ghost/styles.js";
import { GroundShadow } from "../ZoneProps/GroundShadow/index.js";
import { RUNNER_SCALE, resolveLooseBoardTransform } from "../riderPlacement/index.js";
import { Skateboard } from "../Skateboard/index.js";
import type { SchlonicLeg } from "../SetPieces/index.js";

/**
 * Where the next rider waits: this far past the post, facing back down the street at whoever is
 * bringing it home — far enough that the two are face to face when the runner ollies on the
 * line, not stood in one another.
 */
export const NEXT_RIDER_PAST_POST = 14;
/** Where the last rider stands on the next leg: just behind the start line, the post they crossed. */
export const LAST_RIDER_AT = 26;
/** The parked board, beside the feet on the side away from the street ahead. */
const BOARD_BESIDE = 7;
/** The name hangs this far over the ground: the ghost's tag height, for a bird off its board. */
const TAG_RISE = 18;

const groundAt = (zone: SchlonicZone, x: number): number => {
  return zone.heights[Math.floor(x / SCHLONIC_WORLD.sampleStep)] ?? SCHLONIC_WORLD.groundBaseY;
};

/**
 * A teammate off their board on the sidewalk: the cast hen idling on its feet, its board parked
 * beside it, its name over its head in its team's colour. `facing` is 1 down the street and -1
 * back up it, at the rider coming in.
 */
const RelayMate = ({
  figure,
  x,
  groundY,
  facing,
  role
}: {
  figure: RunnerFigure;
  x: number;
  groundY: number;
  facing: 1 | -1;
  role: "next" | "last";
}): JSX.Element => (
  <g className={figure.fillClassName} data-schlonic-relay-mate={role} aria-hidden="true">
    <GroundShadow x={x} y={groundY} radius={6} />
    <g transform={resolveLooseBoardTransform(x - BOARD_BESIDE * facing, groundY, 0)}>
      <Skateboard />
    </g>
    <g
      transform={`translate(${x} ${groundY}) scale(${RUNNER_SCALE * facing} ${RUNNER_SCALE}) translate(${-CHARACTER_FOOT.x} ${-CHARACTER_FOOT.y})`}
    >
      <CharacterFigure
        appearance={figure.appearance}
        apparel={figure.apparel}
        silhouette={figure.silhouette}
        pose="idle"
      />
    </g>
    <text className={ghostStyles.tag} x={x} y={groundY - TAG_RISE} textAnchor="middle">
      {figure.playerName ?? ""}
    </text>
  </g>
);

/**
 * The relay, on the sidewalk: the next rider waiting just past the post of every leg but the
 * last, turned to face the one bringing it in, and the rider who just brought it in stood behind
 * the start line of the leg after — so a handoff is two teammates on one spot, not a cut to an
 * empty street.
 */
export const RelayMates = ({ zone, leg }: { zone: SchlonicZone; leg: SchlonicLeg }): JSX.Element => {
  const nextX = zone.goalX + NEXT_RIDER_PAST_POST;

  return (
    <g data-schlonic-relay-mates>
      {leg.index > 0 && leg.last !== undefined && leg.last !== null && (
        <RelayMate figure={leg.last} x={LAST_RIDER_AT} groundY={groundAt(zone, LAST_RIDER_AT)} facing={1} role="last" />
      )}
      {leg.index < leg.count - 1 && leg.next !== undefined && leg.next !== null && (
        <RelayMate figure={leg.next} x={nextX} groundY={groundAt(zone, nextX)} facing={-1} role="next" />
      )}
    </g>
  );
};
