import type { JoustPerch, JoustVec2 } from "@wingnight/shared";
import {
  JOUST_LEG_RADIUS,
  JOUST_PERCH_THICKNESS,
  JOUST_TOWER_TOPPLE_TILT,
  JOUST_WORLD,
  isGroundPerch,
  resolveJoustLeanTilt,
  resolveJoustPerchPoints,
  resolvePerchBoxes
} from "@wingnight/shared";

import type { JoustSceneLeg } from "../../resolveJoustScene/index.js";
import { joustPalette } from "../palette.js";
import { perchCopy } from "./copy.js";
import * as styles from "./styles.js";

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
 * How hard a leg is being shoved, 0 to 1, where 1 is the lean it folds at. The integrator lets a
 * leg lean and spring back (`LEG_RECOVERY_TILT`), and that recovery is only about three world
 * units of sway — invisible from a couch. So a stressed leg is OVERDRAWN rather than moved: the
 * timber stays exactly where the frame puts it, and the strain is painted on top of it.
 *
 * This is the whole point of the effect. A shot that clips a leg and does not fold it currently
 * looks identical to a clean miss, so nobody learns the legs are hittable.
 */
const resolveLegStress = (leg: JoustSceneLeg, height: number): number => {
  if (height <= 0) {
    return 0;
  }

  return Math.min(1, resolveJoustLeanTilt(leg.foot, leg.top, height) / JOUST_TOWER_TOPPLE_TILT);
};

/** Below this the leg is just breathing; painting it would strobe the lane all game. */
const LEG_STRESS_THRESHOLD = 0.08;

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
/**
 * One leg of a standing tower: the timber itself, the ring that marks it as a target while the
 * band is drawn hard enough to fold it, and the strain painted over it when a shot is leaning on
 * it. The timber line is unchanged — everything added here sits behind or on top of it, so the
 * rule that this component is never a second opinion about where the tower is still holds.
 */
const LegTimber = ({
  leg,
  height,
  isAimTarget
}: {
  leg: JoustSceneLeg;
  height: number;
  isAimTarget: boolean;
}): JSX.Element => {
  const stress = resolveLegStress(leg, height);

  return (
    <g>
      {isAimTarget && (
        <line
          x1={leg.foot.x}
          y1={leg.foot.y}
          x2={leg.top.x}
          y2={leg.top.y}
          stroke={joustPalette.burst}
          strokeWidth={JOUST_LEG_RADIUS * 2 + 2.6}
          strokeLinecap="round"
          strokeDasharray="2.2 2.4"
          opacity={0.55}
          data-joust-leg-target
        />
      )}
      <line
        x1={leg.foot.x}
        y1={leg.foot.y}
        x2={leg.top.x}
        y2={leg.top.y}
        stroke={joustPalette.postDark}
        strokeWidth={JOUST_LEG_RADIUS * 2}
        strokeLinecap="round"
        data-joust-leg
      />
      {stress > LEG_STRESS_THRESHOLD && (
        <g className={styles.strain} data-joust-leg-strain={stress.toFixed(2)}>
          <line
            x1={leg.foot.x}
            y1={leg.foot.y}
            x2={leg.top.x}
            y2={leg.top.y}
            stroke={joustPalette.burst}
            strokeWidth={JOUST_LEG_RADIUS * 2 + stress * 1.8}
            strokeLinecap="round"
            opacity={0.35 + stress * 0.55}
          />
          {/* Grit shaken loose at the foot: the part of the strain that reads from a couch. */}
          <circle
            cx={leg.foot.x - 2.4}
            cy={leg.foot.y + 0.6}
            r={1 + stress * 1.8}
            fill={joustPalette.sand}
            stroke={joustPalette.sandDark}
            strokeWidth={0.4}
            opacity={0.3 + stress * 0.5}
          />
          <circle
            cx={leg.foot.x + 2.6}
            cy={leg.foot.y + 0.2}
            r={0.8 + stress * 1.5}
            fill={joustPalette.sand}
            stroke={joustPalette.sandDark}
            strokeWidth={0.4}
            opacity={0.25 + stress * 0.5}
          />
        </g>
      )}
    </g>
  );
};

export const Perch = ({
  perch,
  legs,
  isRubble,
  isAimTarget = false
}: PerchProps): JSX.Element | null => {
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
