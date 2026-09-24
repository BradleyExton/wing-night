import type { JoustShotGhost } from "@wingnight/shared";
import { JOUST_WORLD } from "@wingnight/shared";

import { joustPalette } from "../palette.js";

export type ShotGhostProps = {
  ghost: JoustShotGhost;
  // The light ink of the kind that flew it, so a teammate reading the ghost can tell a Log's
  // arc from a Pencil's. Null draws it in the Standard's.
  ink: string | null;
};

/**
 * The last shot, left on the lane for the next teammate: its arc as a dotted line, and a ring
 * where the band was pulled to. Without it every shooter on a team starts blind; with it the
 * second shot is an adjustment and the third is a plan.
 */
export const ShotGhost = ({ ghost, ink }: ShotGhostProps): JSX.Element | null => {
  if (ghost.path.length < 2) {
    return null;
  }

  const { anchor, pullRadius } = JOUST_WORLD;
  const stroke = ink ?? joustPalette.shooterLight;
  const pulledTo = {
    x: anchor.x + ghost.aim.x * pullRadius,
    y: anchor.y + ghost.aim.y * pullRadius
  };

  return (
    <g data-joust-ghost data-joust-ghost-kind={ghost.shooterId} opacity={0.55}>
      <polyline
        points={ghost.path.map((at) => `${at.x},${at.y}`).join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth={0.7}
        strokeDasharray="1.2 1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={pulledTo.x}
        cy={pulledTo.y}
        r={2.2}
        fill="none"
        stroke={stroke}
        strokeWidth={0.6}
        strokeDasharray="0.9 0.9"
      />
    </g>
  );
};
