import type { JoustVec2 } from "@wingnight/shared";
import { JOUST_PIN_FOOT_RADIUS } from "@wingnight/shared";

import { joustPalette } from "../palette.js";

export type GroundShadowProps = {
  // The foot body's centre: the shadow lies on whatever that foot is standing on.
  foot: JoustVec2;
};

/**
 * The pool of shade under a standing bird. Pure depth cue — it has no body and the integrator
 * never sees it — but it is what makes a bird on a shelf read as standing ON it rather than
 * floating in front of it, and a row on the sand read as a row rather than a strip of stickers.
 */
export const GroundShadow = ({ foot }: GroundShadowProps): JSX.Element => {
  return (
    <ellipse
      cx={foot.x}
      cy={foot.y + JOUST_PIN_FOOT_RADIUS}
      rx={4.6}
      ry={1.1}
      fill={joustPalette.shadow}
      opacity={0.3}
      data-joust-shadow
    />
  );
};
