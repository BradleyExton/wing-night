import type { JoustVec2 } from "@wingnight/shared";

import { joustPalette } from "../../palette.js";
import { pointsTagCopy } from "./copy.js";

// What a shelf pays, painted on its own plank.
export const PointsTag = ({ at, points }: { at: JoustVec2; points: number }): JSX.Element => {
  return (
    <text
      x={at.x}
      y={at.y}
      textAnchor="middle"
      fontSize={3.2}
      fontWeight={800}
      fill={joustPalette.burst}
      stroke={joustPalette.postDark}
      strokeWidth={0.5}
      paintOrder="stroke"
      data-joust-perch-points={points}
    >
      {pointsTagCopy.label(points)}
    </text>
  );
};
