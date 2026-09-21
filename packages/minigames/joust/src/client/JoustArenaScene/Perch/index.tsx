import type { JoustPerch } from "@wingnight/shared";
import {
  JOUST_LEG_RADIUS,
  JOUST_PERCH_THICKNESS,
  JOUST_WORLD,
  isGroundPerch,
  resolveJoustPerchPoints,
  resolvePerchBoxes
} from "@wingnight/shared";

import type { JoustSceneLeg } from "../../resolveJoustScene/index.js";
import { joustPalette } from "../palette.js";
import { LegTimber } from "./LegTimber/index.js";
import { PerchShade } from "./PerchShade/index.js";
import { PointsTag } from "./PointsTag/index.js";
import { Rubble } from "./Rubble/index.js";
import { plankPath } from "./plankPath/index.js";

export type PerchProps = {
  perch: JoustPerch;
  // This perch's legs as the frame has them: two while it stands or folds, none once it is rubble
  // or if it never had any (a slab hung so low it sits on the sand).
  legs: JoustSceneLeg[];
  isRubble: boolean;
  // The band is drawn hard enough to fold this tower, so its legs are ringed as the target they
  // are. Set by the scene off the pull, because only the scene knows how far the band is back.
  isAimTarget?: boolean;
};

/**
 * A leg's authored height — floor to the underside of its own slab. The tilt a frame shows has to
 * be measured against the leg's REST height, not its current one, or a leg folding flat reads as
 * barely leaning at all.
 */
const legRestHeight = (perch: JoustPerch): number => {
  return JOUST_WORLD.floorY - JOUST_LEG_RADIUS - (perch.y + JOUST_PERCH_THICKNESS + JOUST_LEG_RADIUS);
};

/**
 * The timber a shelf of players is standing on, drawn from the SAME bodies the integrator moves:
 * each leg is the capsule between its foot and its top, and the slab is a plank laid across the
 * two tops. So when a shot folds the frame, the plank comes down with it on the TV — nothing
 * here is a second opinion about where the tower is.
 *
 * Fallen towers stay in the lane as rubble: plank flat on the sand, legs splayed under it.
 */
export const Perch = ({
  perch,
  legs,
  isRubble,
  isAimTarget = false
}: PerchProps): JSX.Element | null => {
  if (isGroundPerch(perch)) {
    return null;
  }

  if (isRubble) {
    return <Rubble perch={perch} />;
  }

  const points = resolveJoustPerchPoints(perch);
  const [nearLeg, farLeg] = legs;

  // A slab too low for legs is a wall on the sand: the static boxes, as ever.
  if (nearLeg === undefined || farLeg === undefined) {
    return (
      <g data-joust-perch>
        <PerchShade perch={perch} />
        {resolvePerchBoxes(perch).map((box, index) => (
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
      </g>
    );
  }

  // The plank overhangs the leg tops by the slab's own margin, the way it was authored.
  const overhang = nearLeg.top.x - perch.x;
  const spanX = farLeg.top.x - nearLeg.top.x;
  const spanY = farLeg.top.y - nearLeg.top.y;
  const span = Math.sqrt(spanX * spanX + spanY * spanY) || 1;
  const unitX = spanX / span;
  const unitY = spanY / span;
  const plankFrom = {
    x: nearLeg.top.x - unitX * overhang,
    y: nearLeg.top.y - unitY * overhang - JOUST_LEG_RADIUS
  };
  const plankTo = {
    x: farLeg.top.x + unitX * overhang,
    y: farLeg.top.y + unitY * overhang - JOUST_LEG_RADIUS
  };
  const tagAt = {
    x: (plankFrom.x + plankTo.x) / 2,
    y: (plankFrom.y + plankTo.y) / 2 - 1.2
  };

  return (
    <g data-joust-perch>
      <PerchShade perch={perch} />
      {legs.map((leg, index) => (
        <LegTimber
          key={index}
          leg={leg}
          height={legRestHeight(perch)}
          isAimTarget={isAimTarget}
        />
      ))}
      <path
        d={plankPath(plankFrom, plankTo)}
        fill={joustPalette.post}
        stroke={joustPalette.postDark}
        strokeWidth={0.5}
        strokeLinejoin="round"
      />
      {/* A grain line along the shelf, so a plank reads as a plank and not a bar of colour. */}
      <line
        x1={plankFrom.x + 1}
        y1={plankFrom.y - 1.6}
        x2={plankTo.x - 1}
        y2={plankTo.y - 1.6}
        stroke={joustPalette.postDark}
        strokeWidth={0.4}
        strokeDasharray="2 2.4"
        opacity={0.7}
      />
      {points > 1 && <PointsTag at={tagAt} points={points} />}
    </g>
  );
};
