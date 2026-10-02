import { JOUST_LEG_RADIUS } from "@wingnight/shared";

import type { JoustSceneLeg } from "../../../resolveJoustScene/index.js";
import type { PerchSkinKind } from "../PerchSkin/index.js";
import { CondoFacade } from "./CondoFacade/index.js";
import { QueensFacade } from "./QueensFacade/index.js";
import { SouldiersFacade } from "./SouldiersFacade/index.js";

export { FACADE_LETTERING_MIN_WIDTH } from "./signage/index.js";

/** The box a façade is drawn in: its own top-left is (0, 0), y runs DOWN to the sand at `height`. */
export type FacadeBox = {
  width: number;
  height: number;
};

const LANDMARK_FACADES: Partial<Record<PerchSkinKind, (box: FacadeBox) => JSX.Element>> = {
  "queens-balcony": QueensFacade,
  "souldiers-roof": SouldiersFacade,
  "condo-balcony": CondoFacade
};

const round = (value: number): string => value.toFixed(3).replace(/\.?0+$/, "");

/**
 * The affine frame that hangs a façade off the LIVE legs. Local x runs along the span between
 * the two feet, local y runs from the near leg's top down to its foot, scaled so the leg's REST
 * height is one façade height — so when a shot folds the frame, the near leg's top drags the
 * whole building over with it and the wall shears exactly as far as the timber leans. Upright,
 * it is a plain translate to the plank's underside.
 *
 * The box is a leg radius wider than the span on each side and a leg radius taller at each end,
 * so the wall is flush with the legs' outer edges and reaches from the plank's underside to the
 * sand rather than stopping at the body centres.
 */
export const resolveFacadeFrame = (
  nearLeg: JoustSceneLeg,
  farLeg: JoustSceneLeg,
  restHeight: number
): { transform: string; box: FacadeBox } => {
  const spanX = farLeg.foot.x - nearLeg.foot.x;
  const spanY = farLeg.foot.y - nearLeg.foot.y;
  const span = Math.sqrt(spanX * spanX + spanY * spanY) || 1;
  const along = { x: spanX / span, y: spanY / span };
  const height = restHeight || 1;
  const down = {
    x: (nearLeg.foot.x - nearLeg.top.x) / height,
    y: (nearLeg.foot.y - nearLeg.top.y) / height
  };
  const radius = JOUST_LEG_RADIUS;
  const originX = nearLeg.foot.x - radius * along.x - (height + radius) * down.x;
  const originY = nearLeg.foot.y - radius * along.y - (height + radius) * down.y;

  return {
    transform: `matrix(${[along.x, along.y, down.x, down.y, originX, originY].map(round).join(" ")})`,
    box: { width: span + radius * 2, height: height + radius * 2 }
  };
};

/**
 * The building a landmark shelf is the top of, hung between its own two legs and folding with
 * them. Drawn BEHIND the timber, so the legs stay the pilasters at its corners and what the
 * shot hits is still the leg the integrator moved. The plank above is the balcony, roof or
 * parapet — that is the skin's trim, not this.
 */
export const Facade = ({
  skin,
  nearLeg,
  farLeg,
  restHeight
}: {
  skin: PerchSkinKind;
  nearLeg: JoustSceneLeg;
  farLeg: JoustSceneLeg;
  restHeight: number;
}): JSX.Element | null => {
  const Drawing = LANDMARK_FACADES[skin];

  if (Drawing === undefined) {
    return null;
  }

  const { transform, box } = resolveFacadeFrame(nearLeg, farLeg, restHeight);

  return (
    <g data-joust-perch-facade={skin} transform={transform}>
      <Drawing width={box.width} height={box.height} />
    </g>
  );
};
