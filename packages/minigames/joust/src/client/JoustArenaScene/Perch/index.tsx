import type { JoustPerch, JoustVec2 } from "@wingnight/shared";
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
import { perchCopy } from "./copy.js";

export type PerchProps = {
  perch: JoustPerch;
  // This perch's legs as the frame has them: two while it stands or folds, none once it is rubble
  // or if it never had any (a slab hung so low it sits on the sand).
  legs: JoustSceneLeg[];
  isRubble: boolean;
};

/** How high a fallen plank's far end is propped, and how far a splayed leg reaches past the span. */
const RUBBLE_PROP_HEIGHT = 7;
const RUBBLE_LEG_SPLAY = 6;

/** A plank of `JOUST_PERCH_THICKNESS` laid along the segment between two points. */
const plankPath = (from: JoustVec2, to: JoustVec2): string => {
  const alongX = to.x - from.x;
  const alongY = to.y - from.y;
  const length = Math.sqrt(alongX * alongX + alongY * alongY) || 1;
  // The slab sits ON the leg tops, so it is offset upward along the plank's own normal.
  const normalX = (alongY / length) * JOUST_PERCH_THICKNESS;
  const normalY = (-alongX / length) * JOUST_PERCH_THICKNESS;

  return [
    `M${from.x} ${from.y}`,
    `L${to.x} ${to.y}`,
    `L${to.x + normalX} ${to.y + normalY}`,
    `L${from.x + normalX} ${from.y + normalY}`,
    "Z"
  ].join(" ");
};

const PointsTag = ({ at, points }: { at: JoustVec2; points: number }): JSX.Element => {
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
      {perchCopy.pointsTag(points)}
    </text>
  );
};

/**
 * The timber a shelf of players is standing on, drawn from the SAME bodies the integrator moves:
 * each leg is the capsule between its foot and its top, and the slab is a plank laid across the
 * two tops. So when a shot folds the frame, the plank comes down with it on the TV — nothing
 * here is a second opinion about where the tower is.
 *
 * Fallen towers stay in the lane as rubble: plank flat on the sand, legs splayed under it.
 */
export const Perch = ({ perch, legs, isRubble }: PerchProps): JSX.Element | null => {
  if (isGroundPerch(perch)) {
    return null;
  }

  const points = resolveJoustPerchPoints(perch);
  const shade = (
    <ellipse
      cx={perch.x + perch.width / 2}
      cy={JOUST_WORLD.floorY + 0.8}
      rx={perch.width / 2 + 1.5}
      ry={1.4}
      fill={joustPalette.shadow}
      opacity={0.3}
    />
  );

  if (isRubble) {
    // The plank is propped on one folded leg, so wreckage pokes up past the players lying on it
    // instead of vanishing under them; the other leg lies flat out the far side.
    const groundY = JOUST_WORLD.floorY - JOUST_LEG_RADIUS;
    const propX = perch.x + perch.width * 0.7;
    const propTop = { x: propX, y: JOUST_WORLD.floorY - RUBBLE_PROP_HEIGHT };

    return (
      <g data-joust-rubble>
        {shade}
        <line
          x1={perch.x + perch.width - 1}
          y1={groundY}
          x2={perch.x + perch.width + RUBBLE_LEG_SPLAY}
          y2={groundY - 1.4}
          stroke={joustPalette.postDark}
          strokeWidth={JOUST_LEG_RADIUS * 2}
          strokeLinecap="round"
        />
        <line
          x1={propX - RUBBLE_PROP_HEIGHT * 0.6}
          y1={groundY}
          x2={propTop.x}
          y2={propTop.y}
          stroke={joustPalette.postDark}
          strokeWidth={JOUST_LEG_RADIUS * 2}
          strokeLinecap="round"
        />
        <path
          d={plankPath({ x: perch.x, y: JOUST_WORLD.floorY }, { x: perch.x + perch.width, y: propTop.y - JOUST_LEG_RADIUS })}
          fill={joustPalette.post}
          stroke={joustPalette.postDark}
          strokeWidth={0.5}
          strokeLinejoin="round"
        />
      </g>
    );
  }

  const [nearLeg, farLeg] = legs;

  // A slab too low for legs is a wall on the sand: the static boxes, as ever.
  if (nearLeg === undefined || farLeg === undefined) {
    return (
      <g data-joust-perch>
        {shade}
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
      {shade}
      {legs.map((leg, index) => (
        <line
          key={index}
          x1={leg.foot.x}
          y1={leg.foot.y}
          x2={leg.top.x}
          y2={leg.top.y}
          stroke={joustPalette.postDark}
          strokeWidth={JOUST_LEG_RADIUS * 2}
          strokeLinecap="round"
          data-joust-leg
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
