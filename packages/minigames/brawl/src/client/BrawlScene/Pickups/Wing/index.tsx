import { BRAWL_WORLD } from "@wingnight/shared";

import type { BrawlGoonPalette } from "../../Goons/palette.js";
import { resolveDrawTick, resolveLimbPath, roundUnit, type Point } from "../../Goons/rig/index.js";
import * as styles from "./styles.js";

/** How tall the wing is, bone tip to the sauce's underside, in world units: drawn at world scale, no box. */
export const WING_ART_HEIGHT = 6.5;

/** The bob's period, in ticks: a slow float, and the glint's, quicker, so the two never line up. */
const BOB_TICKS = 48;
const GLINT_TICKS = 36;

// SCHLONIC's wing (`SchlonicScene/Wing`) at a radius of three, in world units about its own
// centre: a fat lobe of meat canted off the bone the way a drumette sits, the bone running up out
// of its shoulder to two knuckles, and the glaze up the lit side. The one thing on the street that
// is not a bird and not street, which is why it is this shape: "grab this" has to separate from
// "peck that" by silhouette alone.
// The bone is longer than SCHLONIC's, and the lobe leaner: at this size on a dark street the
// original proportions read as a ball with two eyes, and a wing is a drumstick before it is anything.
const LOBE = { cx: 0.5, cy: 0.5, rx: 2.6, ry: 1.9, angle: -30 };
/** How far the lobe hangs below the drawing's centre, so the wing can be sat on the pavement. */
const LOBE_BOTTOM = 2.6;
const BONE_FROM: Point = { x: -0.7, y: -0.3 };
const BONE_TO: Point = { x: -3.4, y: -2.9 };
const BONE_BEND: Point = { x: -2, y: -1.6 };
const KNUCKLES: Point[] = [
  { x: -3.05, y: -3.26 },
  { x: -3.75, y: -2.54 }
];
const KNUCKLE_RADIUS = 0.55;
const GLOSS = { cx: -0.5, cy: -0.45, rx: 1, ry: 0.45 };
const GLINT: Point = { x: 2.4, y: -1 };
const SPARK = "M 0 -1 Q 0 0 1 0 Q 0 0 0 1 Q 0 0 -1 0 Q 0 0 0 -1 Z";

/**
 * A chicken wing dropped on the pavement: the house currency (SCHLONIC's score-and-health), lying
 * where a goon worth two went down, waiting to be walked over for a heart. `x` is where along the
 * block, `y` its height above the ground line (nought on the pavement), in the sim's own units.
 * It floats a little and a glint flares over the sauce on the sim's tick, so the room spots it
 * among the goons before the holder does — both screens draw the same bob from the same tick.
 */
export const Wing = ({ x, y, tick, palette }: { x: number; y: number; tick: number; palette: BrawlGoonPalette }): JSX.Element => {
  const { sauce, sauceGloss, bone, boneShade } = palette;
  const drawTick = resolveDrawTick(tick);
  const lift = roundUnit(0.4 + 0.4 * Math.sin((2 * Math.PI * drawTick) / BOB_TICKS));
  const flare = roundUnit(0.5 + 0.5 * Math.sin((2 * Math.PI * drawTick) / GLINT_TICKS + 1));
  const outline = `${palette.stroke} ${styles.outline}`;
  const footX = Number.isFinite(x) ? roundUnit(x) : 0;
  const footY = roundUnit(BRAWL_WORLD.groundY - (Number.isFinite(y) ? y : 0));

  return (
    <g className={styles.root} data-brawl-pickup="wing" transform={`translate(${footX} ${footY})`}>
      <ellipse className={palette.shadow} cx={0} cy={0} rx={roundUnit(2.6 - lift * 0.5)} ry={0.6} />
      <g transform={`translate(0 ${roundUnit(-(LOBE_BOTTOM + lift))})`}>
        <path className={boneShade} transform="translate(0.3 0.3)" d={resolveLimbPath(BONE_FROM, BONE_BEND, BONE_TO, 1, 0.8)} />
        <path className={`${bone} ${outline}`} d={resolveLimbPath(BONE_FROM, BONE_BEND, BONE_TO, 1, 0.8)} />
        {KNUCKLES.map((knuckle) => (
          <circle key={`${knuckle.x}:${knuckle.y}`} className={`${bone} ${palette.stroke} ${styles.knuckle}`} cx={knuckle.x} cy={knuckle.y} r={KNUCKLE_RADIUS} />
        ))}
        <ellipse className={`${sauce} ${outline}`} cx={LOBE.cx} cy={LOBE.cy} rx={LOBE.rx} ry={LOBE.ry} transform={`rotate(${LOBE.angle} ${LOBE.cx} ${LOBE.cy})`} />
        <ellipse
          className={`${sauceGloss} ${styles.gloss}`}
          cx={GLOSS.cx}
          cy={GLOSS.cy}
          rx={GLOSS.rx}
          ry={GLOSS.ry}
          transform={`rotate(${LOBE.angle} ${GLOSS.cx} ${GLOSS.cy})`}
        />
        <path className={palette.stars} transform={`translate(${GLINT.x} ${GLINT.y}) scale(${roundUnit(0.3 + flare * 0.9)})`} d={SPARK} />
      </g>
    </g>
  );
};
