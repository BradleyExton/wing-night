import {
  JOUST_LEG_RADIUS,
  JOUST_TOWER_TOPPLE_TILT,
  resolveJoustLeanTilt
} from "@wingnight/shared";

import type { JoustSceneLeg } from "../../../resolveJoustScene/index.js";
import { joustPalette } from "../../palette.js";
import * as styles from "./styles.js";

/** Below this the leg is just breathing; painting it would strobe the lane all game. */
const LEG_STRESS_THRESHOLD = 0.08;

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

/**
 * One leg of a standing tower: the timber itself, the ring that marks it as a target while the
 * band is drawn hard enough to fold it, and the strain painted over it when a shot is leaning on
 * it. The timber line is unchanged — everything added here sits behind or on top of it, so the
 * rule that this component is never a second opinion about where the tower is still holds.
 */
export const LegTimber = ({
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
