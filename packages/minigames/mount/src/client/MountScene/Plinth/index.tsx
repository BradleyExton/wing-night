import { MOUNT_WORLD } from "@wingnight/shared";

import { mountDusk } from "../palette.js";

const { halfWidth, height, edgeRadius } = MOUNT_WORLD.plinth;
// The sim's plinth is three capsules (top and two sides) of `edgeRadius`; its outside is a
// rounded block that far beyond their centrelines, and this is that block.
const LEFT = -halfWidth - edgeRadius;
const TOP = -height - edgeRadius;
const WIDTH = (halfWidth + edgeRadius) * 2;

/**
 * The plinth the goose stands on, drawn from the sim's own numbers so its edges are exactly where
 * a hen can hook a beak: a block of dark stone with a lit lip and two courses of joints.
 */
export const Plinth = (): JSX.Element => (
  <g data-mount-plinth aria-hidden="true">
    <ellipse cx={0} cy={MOUNT_WORLD.floorY + 1} rx={halfWidth + 18} ry={3.5} fill={mountDusk.shadow} />
    <rect x={LEFT} y={TOP} width={WIDTH} height={-TOP} rx={edgeRadius} fill={mountDusk.stone} />
    <rect x={LEFT + 4} y={TOP + 14} width={WIDTH - 8} height={-TOP - 14} fill={mountDusk.stoneDark} opacity={0.55} />
    <line x1={LEFT + 3} y1={TOP + 14} x2={-LEFT - 3} y2={TOP + 14} stroke={mountDusk.stoneEdge} strokeWidth={1} />
    <line x1={LEFT + 3} y1={TOP + 38} x2={-LEFT - 3} y2={TOP + 38} stroke={mountDusk.stoneEdge} strokeWidth={0.8} opacity={0.6} />
    <rect x={LEFT} y={TOP} width={WIDTH} height={3} rx={1.5} fill={mountDusk.stoneEdge} />
  </g>
);
