import { SpiritCatcher } from "@wingnight/scenery";
import { MOUNT_WORLD } from "@wingnight/shared";

import { DUSK_SPIRIT_CATCHER, mountDusk } from "../palette.js";

// Far enough either way that no camera, however far the room's zooms out, finds an edge.
const REACH = 6000;
// The bay's far shore, a hen and a half above the floor: the horizon the pile rises out of.
const HORIZON_Y = -54;
// The Spirit Catcher on the far shore behind the plinth, a hazed silhouette so the goose and every
// hen in front of it still win the eye (DESIGN.md §2.11).
const SPIRIT_CATCHER = { x: 150, halfSpan: 64 } as const;
// The glints the dusk lays on the water: short dashes, in rows.
const GLINTS: readonly (readonly [number, number, number])[] = [
  [-260, -44, 26],
  [-120, -30, 18],
  [40, -46, 30],
  [210, -24, 22],
  [330, -40, 16],
  [-380, -18, 20],
  [460, -32, 24]
];
// The boardwalk's planks: a seam every this many units along the floor.
const PLANK = 18;

/**
 * Barrie's waterfront at dusk, in world units: the bay out to the far shore, the Spirit Catcher
 * on it, and the boardwalk the climb starts from. Static: drawn once, and the camera moves over it.
 */
export const Backdrop = (): JSX.Element => (
  <g data-mount-backdrop aria-hidden="true">
    <rect x={-REACH} y={HORIZON_Y - 6} width={REACH * 2} height={8} fill={mountDusk.shore} />
    <g opacity={0.55}>
      <SpiritCatcher
        x={SPIRIT_CATCHER.x}
        baseY={HORIZON_Y}
        halfSpan={SPIRIT_CATCHER.halfSpan}
        palette={DUSK_SPIRIT_CATCHER}
      />
    </g>
    <rect x={-REACH} y={HORIZON_Y} width={REACH * 2} height={-HORIZON_Y} fill={mountDusk.water} />
    {GLINTS.map(([x, y, length]) => (
      <line key={`${x}:${y}`} x1={x} y1={y} x2={x + length} y2={y} stroke={mountDusk.glint} strokeWidth={1.4} strokeLinecap="round" />
    ))}
    <rect x={-REACH} y={MOUNT_WORLD.floorY} width={REACH * 2} height={400} fill={mountDusk.ground} />
    <line
      x1={-REACH}
      y1={MOUNT_WORLD.floorY}
      x2={REACH}
      y2={MOUNT_WORLD.floorY}
      stroke={mountDusk.groundEdge}
      strokeWidth={1.5}
    />
    <line
      x1={-REACH}
      y1={MOUNT_WORLD.floorY + 6}
      x2={REACH}
      y2={MOUNT_WORLD.floorY + 6}
      stroke={mountDusk.plank}
      strokeWidth={0.8}
      strokeDasharray={`${PLANK - 1} 1`}
    />
  </g>
);
