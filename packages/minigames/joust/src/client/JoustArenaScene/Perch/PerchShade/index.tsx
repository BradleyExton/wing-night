import type { JoustPerch } from "@wingnight/shared";
import { JOUST_WORLD } from "@wingnight/shared";

import { joustPalette } from "../../palette.js";

// The pool of shade a perch drops on the sand, whether it is still standing or lying in pieces.
export const PerchShade = ({ perch }: { perch: JoustPerch }): JSX.Element => (
  <ellipse
    cx={perch.x + perch.width / 2}
    cy={JOUST_WORLD.floorY + 0.8}
    rx={perch.width / 2 + 1.5}
    ry={1.4}
    fill={joustPalette.shadow}
    opacity={0.3}
  />
);
