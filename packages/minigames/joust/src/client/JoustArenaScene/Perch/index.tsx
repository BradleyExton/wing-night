import type { JoustPerch } from "@wingnight/shared";
import { JOUST_WORLD, isGroundPerch, resolvePerchBoxes } from "@wingnight/shared";

import { joustPalette } from "../palette.js";

export type PerchProps = {
  perch: JoustPerch;
};

/**
 * The timber a shelf of players is standing on. Drawn straight from the same boxes the integrator
 * collides against, so what looks like a leg IS a leg — the shot that clips one stops there, which
 * is the whole reason a lane with structures is harder than a lane without.
 */
export const Perch = ({ perch }: PerchProps): JSX.Element | null => {
  if (isGroundPerch(perch)) {
    return null;
  }

  const boxes = resolvePerchBoxes(perch);

  return (
    <g data-joust-perch>
      {/* Its shade on the sand: no box, no edge, just what tells the eye the tower has weight. */}
      <ellipse
        cx={perch.x + perch.width / 2}
        cy={JOUST_WORLD.floorY + 0.8}
        rx={perch.width / 2 + 1.5}
        ry={1.4}
        fill={joustPalette.shadow}
        opacity={0.3}
      />
      {boxes.map((box, index) => (
        <rect
          key={index}
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          rx={0.6}
          fill={index === 0 ? joustPalette.post : joustPalette.postDark}
          stroke={joustPalette.postDark}
          strokeWidth={0.5}
        />
      ))}
      {/* A grain line along the shelf, so a plank reads as a plank and not a bar of colour. */}
      <line
        x1={perch.x + 1}
        y1={perch.y + 1.4}
        x2={perch.x + perch.width - 1}
        y2={perch.y + 1.4}
        stroke={joustPalette.postDark}
        strokeWidth={0.4}
        strokeDasharray="2 2.4"
        opacity={0.7}
      />
    </g>
  );
};
