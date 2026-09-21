import { SCHLONIC_WORLD } from "@wingnight/shared";

import { schlonicPalette } from "../palette.js";

/**
 * The collectible: a sauced party wing, drawn centred on the origin so a caller places it with a
 * transform of its own.
 *
 * It is the one thing in the zone that is NOT a schlong, and that is the whole reason it looks
 * like this. Everything else standing on the shore is one silhouette read three ways (§2.11), so
 * the room has half a second to tell "grab this" from "avoid that" as an arc goes past — and the
 * only separation that survives at that speed is shape. A fat lobe of meat on a pale bone shares
 * no outline with anything else out there, and it is what the night is called.
 *
 * Sized off the sim's own `wingRadius`, so what the room reaches for is the hitbox rather than a
 * guess at it. Every wing in the zone is identical on purpose: a collectible line reads as a line
 * because the eye can stop resolving it after the first one.
 */
const RADIUS = SCHLONIC_WORLD.wingRadius;

// The meat, canted off the bone the way a drumette actually sits.
const LOBE = {
  x: RADIUS * 0.13,
  y: RADIUS * 0.15,
  rx: RADIUS * 0.86,
  ry: RADIUS * 0.71,
  angle: -30
};

// The bone runs up out of the lobe's shoulder and ends in the two knuckles that are what make a
// bone read as a bone rather than as a stick.
const BONE_FROM = { x: -RADIUS * 0.1, y: -RADIUS * 0.1 };
const BONE_TO = { x: -RADIUS * 0.78, y: -RADIUS * 0.78 };
const KNUCKLE_RADIUS = RADIUS * 0.2;
const KNUCKLE_SPREAD = RADIUS * 0.15;

const BONE_ANGLE = Math.atan2(BONE_TO.y - BONE_FROM.y, BONE_TO.x - BONE_FROM.x);
const KNUCKLES = [1, -1].map((side) => ({
  side,
  x: BONE_TO.x + Math.cos(BONE_ANGLE + Math.PI / 2) * KNUCKLE_SPREAD * side,
  y: BONE_TO.y + Math.sin(BONE_ANGLE + Math.PI / 2) * KNUCKLE_SPREAD * side
}));

const OUTLINE_WIDTH = 0.42;

export const Wing = ({ scale = 1 }: { scale?: number }): JSX.Element => (
  <g transform={`scale(${scale})`}>
    {/* The bone goes down first, so the meat sits over it and the joint comes out of the lobe. */}
    <g>
      <line
        x1={BONE_FROM.x}
        y1={BONE_FROM.y}
        x2={BONE_TO.x}
        y2={BONE_TO.y}
        stroke={schlonicPalette.wingBoneDark}
        strokeWidth={KNUCKLE_RADIUS * 1.9}
        strokeLinecap="round"
      />
      <line
        x1={BONE_FROM.x}
        y1={BONE_FROM.y}
        x2={BONE_TO.x}
        y2={BONE_TO.y}
        stroke={schlonicPalette.wingBone}
        strokeWidth={KNUCKLE_RADIUS * 1.25}
        strokeLinecap="round"
      />
      {KNUCKLES.map((knuckle) => (
        <circle
          key={knuckle.side}
          cx={knuckle.x}
          cy={knuckle.y}
          r={KNUCKLE_RADIUS}
          fill={schlonicPalette.wingBone}
          stroke={schlonicPalette.wingBoneDark}
          strokeWidth={OUTLINE_WIDTH * 0.7}
        />
      ))}
    </g>
    <ellipse
      cx={LOBE.x}
      cy={LOBE.y}
      rx={LOBE.rx}
      ry={LOBE.ry}
      transform={`rotate(${LOBE.angle} ${LOBE.x} ${LOBE.y})`}
      fill={schlonicPalette.wing}
      stroke={schlonicPalette.wingDark}
      strokeWidth={OUTLINE_WIDTH}
    />
    {/* The glaze catching the morning sun, up the lit side — the same side the cast's gloss is on. */}
    <ellipse
      cx={LOBE.x - RADIUS * 0.3}
      cy={LOBE.y - RADIUS * 0.34}
      rx={RADIUS * 0.33}
      ry={RADIUS * 0.17}
      transform={`rotate(${LOBE.angle} ${LOBE.x - RADIUS * 0.3} ${LOBE.y - RADIUS * 0.34})`}
      fill={schlonicPalette.wingGloss}
      opacity={0.75}
    />
  </g>
);
