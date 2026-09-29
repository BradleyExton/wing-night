import type { SchlonicProp, SchlonicZone } from "@wingnight/shared";
import { resolveSchlonicGroundY } from "@wingnight/shared";

import { schlonicPalette } from "../../palette.js";
import { GroundShadow } from "../GroundShadow/index.js";

/** The bar's own thickness, and its edge: thick enough to read as a tube from the sofa. */
const TUBE = 1.2;
const EDGE = 0.5;
const POST = 0.85;
/** How far each end of the bar turns down past the level run, the way a real handrail's does. */
const END_DROP = 2.6;
const END_TURN = 2.2;
/**
 * Where the posts stand, as shares along the rail: near its start, and two more spaced down it,
 * none at the far end — one of the crowd waits under that end (`world/index.ts`), and a post stood
 * in it would read as part of it.
 */
const POST_SHARES = [0.04, 0.38, 0.7] as const;

/**
 * A grind rail (DESIGN.md §2.11): a long straight galvanised handrail on three posts, the kind
 * that runs down every set of steps on Dunlop Street. The level top from `x` to `toX` at `y` is
 * exactly what the sim catches a falling board on; the ends turn down past it the way a real
 * rail's do. Pale steel with a sunlit top and a near-black edge — the only long straight line in
 * the zone, so it reads as metal to land on and never as one more pink thing to avoid.
 */
export const Rail = ({ prop, zone }: { prop: SchlonicProp; zone: SchlonicZone }): JSX.Element => {
  const toX = prop.toX ?? prop.x;
  const length = toX - prop.x;
  // The tube hangs from the rail's top, so the top of its edge is the line the board lands on.
  const tubeY = prop.y + (TUBE + EDGE) / 2;
  const tube = `M ${prop.x} ${tubeY + END_DROP} Q ${prop.x} ${tubeY} ${prop.x + END_TURN} ${tubeY} L ${toX - END_TURN} ${tubeY} Q ${toX} ${tubeY} ${toX} ${tubeY + END_DROP}`;
  const posts = POST_SHARES.map((share) => {
    const x = prop.x + length * share;

    return { x, groundY: resolveSchlonicGroundY(zone, x) };
  });

  return (
    <g data-schlonic-rail={prop.index}>
      {posts.map((post) => (
        <GroundShadow key={`shadow-${post.x}`} x={post.x} y={post.groundY} radius={1.6} />
      ))}
      <g strokeLinecap="butt">
        {posts.map((post) => (
          <g key={post.x}>
            <line x1={post.x} x2={post.x} y1={tubeY} y2={post.groundY} stroke={schlonicPalette.steelInk} strokeWidth={POST + EDGE} />
            <line x1={post.x} x2={post.x} y1={tubeY} y2={post.groundY - 0.2} stroke={schlonicPalette.steel} strokeWidth={POST} />
            <rect x={post.x - 1.1} y={post.groundY - 0.6} width={2.2} height={0.7} rx={0.2} fill={schlonicPalette.steelInk} />
          </g>
        ))}
      </g>
      <path d={tube} fill="none" stroke={schlonicPalette.steelInk} strokeWidth={TUBE + EDGE} strokeLinecap="round" strokeLinejoin="round" />
      <path d={tube} fill="none" stroke={schlonicPalette.steel} strokeWidth={TUBE} strokeLinecap="round" strokeLinejoin="round" />
      <line
        x1={prop.x + END_TURN}
        x2={toX - END_TURN}
        y1={tubeY - TUBE * 0.22}
        y2={tubeY - TUBE * 0.22}
        stroke={schlonicPalette.steelLight}
        strokeWidth={TUBE * 0.3}
        strokeLinecap="round"
      />
    </g>
  );
};
