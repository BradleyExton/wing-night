import { Honk } from "../Honk/index.js";
import type { BrawlGoonPalette } from "../palette.js";
import {
  resolveDrawTick,
  resolveGoonPlacement,
  resolveHonkBeat,
  resolveLimbPath,
  resolveWalkFrame,
  rotatePoint,
  roundUnit,
  type GoonProps,
  type Point
} from "../rig/index.js";
import { Stars } from "../Stars/index.js";
import { resolveRaccoonPose, type RaccoonPose } from "./pose/index.js";
import * as styles from "./styles.js";

/** How tall the raccoon is drawn, feet to the top of its raised tail, in its own units. */
export const RACCOON_ART_HEIGHT = 9.4;

// In drawing units, feet on the origin, facing right: the point the body tilts about, the four
// leg roots, the neck and the tail's root.
const HIPS: Point = { x: -0.4, y: -2.6 };
const BACK_NEAR: Point = { x: -1.8, y: -3 };
const BACK_FAR: Point = { x: -2.6, y: -3 };
const FRONT_NEAR: Point = { x: 1.8, y: -3 };
const FRONT_FAR: Point = { x: 1.1, y: -3 };
const NECK: Point = { x: 3.4, y: -5 };
const TAIL_ROOT: Point = { x: -3, y: -4.4 };
const BODY_MIDDLE_Y = -4.2;
const ON_BACK_DROP = 1.6;

// A humped back, a low belly; the head is drawn about its own centre facing right — ears, the
// bandit mask across the eyes, the pale muzzle and the black nose.
const BODY = "M -3.4 -3.6 Q -3.6 -6.2 -0.6 -6.3 Q 2.2 -6.3 3 -4.6 Q 3.2 -2.6 1.4 -2.3 L -2.2 -2.3 Q -3.4 -2.4 -3.4 -3.6 Z";
const HEAD = "M -1.4 -0.2 Q -1.2 -2 0.2 -1.8 Q 1.4 -1.6 1.8 -0.4 L 3 0.2 Q 3.2 0.7 2.7 0.9 L 1 1.2 Q -1 1.4 -1.4 -0.2 Z";
const EARS = "M -1 -1.4 L -0.9 -2.8 L 0 -1.8 Z M 0.3 -1.8 L 0.8 -2.9 L 1.1 -1.5 Z";
const MASK = "M -0.9 -0.9 Q 0.6 -1.3 2.1 -0.3 L 2 0.35 Q 0.6 -0.15 -0.7 0.3 Z";
const MUZZLE = "M 1.5 0.25 L 2.8 0.4 Q 2.95 0.85 2.5 0.95 L 1.1 1.15 Z";
const JAW = "M 1.2 1 L 2.7 0.95 L 1.3 1.9 Z";
const EYE: Point = { x: 0.9, y: -0.45 };

const Leg = ({ root, foot, palette, outline }: { root: Point; foot: Point; palette: BrawlGoonPalette; outline: string }): JSX.Element => {
  const bend = { x: roundUnit((root.x + foot.x) / 2 + 0.2), y: roundUnit((root.y + foot.y) / 2) };

  return <path className={`${palette.furDark} ${outline}`} d={resolveLimbPath(root, bend, foot, 1, 0.8)} />;
};

// The ringed tail: a fat curve from the root to the tip, three dark bands across it and a dark tip.
const Tail = ({ tip, palette, outline }: { tip: Point; palette: BrawlGoonPalette; outline: string }): JSX.Element => {
  const bend = { x: roundUnit(TAIL_ROOT.x - 2.4), y: roundUnit((TAIL_ROOT.y + tip.y) / 2) };
  const along = (share: number): Point => ({
    x: roundUnit((1 - share) ** 2 * TAIL_ROOT.x + 2 * (1 - share) * share * bend.x + share ** 2 * tip.x),
    y: roundUnit((1 - share) ** 2 * TAIL_ROOT.y + 2 * (1 - share) * share * bend.y + share ** 2 * tip.y)
  });

  return (
    <g>
      <path className={`${palette.fur} ${outline}`} d={resolveLimbPath(TAIL_ROOT, bend, tip, 1.5, 1.3)} />
      {[0.42, 0.66, 0.9].map((share) => {
        const from = along(share - 0.06);
        const to = along(share + 0.06);

        return <path key={share} className={palette.furDark} d={resolveLimbPath(from, to, to, 1.35, 1.3)} />;
      })}
    </g>
  );
};

const Eye = ({ pose, palette }: { pose: RaccoonPose; palette: BrawlGoonPalette }): JSX.Element => {
  if (pose.eye === "out") {
    return (
      <path
        className={`${palette.mark} ${styles.mark}`}
        d={`M ${EYE.x - 0.35} ${EYE.y - 0.35} L ${EYE.x + 0.35} ${EYE.y + 0.35} M ${EYE.x - 0.35} ${EYE.y + 0.35} L ${EYE.x + 0.35} ${EYE.y - 0.35}`}
      />
    );
  }

  if (pose.eye === "shut") {
    return <path className={`${palette.mark} ${styles.mark}`} d={`M ${EYE.x - 0.35} ${EYE.y} L ${EYE.x + 0.35} ${EYE.y + 0.1}`} />;
  }

  return (
    <g>
      <circle className={palette.eye} cx={EYE.x} cy={EYE.y} r={0.38} />
      <circle className={palette.pupil} cx={EYE.x + 0.12} cy={EYE.y} r={0.18} />
    </g>
  );
};

/**
 * A raccoon out of the bins behind the Queen's: worth two geese, and the one that charges. It trots
 * in on diagonal pairs (two frames on the sim's tick), drops into a crouch with its tail bolt
 * upright before it goes, then comes in flat out with its jaws open. Stood on its foot point and
 * scaled to the sim's raccoon box (`BRAWL_WORLD.goons.raccoon`, via `RACCOON_ART_HEIGHT`).
 */
export const Raccoon = ({ x, y, facing, state, tick, palette }: GoonProps): JSX.Element => {
  const pose = resolveRaccoonPose(state, resolveWalkFrame(tick));
  const outline = `${palette.stroke} ${styles.outline}`;
  // The crouch quivers on the honk's beat: a raccoon about to go does not hold still.
  const quiver = state === "telegraph" ? (resolveHonkBeat(tick) === 0 ? -0.15 : 0.15) : 0;
  const placed = (point: Point, tilt: number, drop: number): Point => {
    const turned = rotatePoint(point, tilt, HIPS);

    return { x: roundUnit(turned.x + quiver), y: roundUnit(turned.y + drop) };
  };

  return (
    <g
      className={styles.root}
      data-brawl-goon-kind="raccoon"
      data-brawl-goon-state={state}
      transform={resolveGoonPlacement({ x, y, facing, kind: "raccoon", artHeight: RACCOON_ART_HEIGHT })}
    >
      {pose !== null && (
        <g>
          <ellipse className={palette.shadow} cx={0} cy={0} rx={pose.onBack ? 5.4 : 4.6} ry={0.7} />
          <g transform={pose.onBack ? `translate(0 ${ON_BACK_DROP}) rotate(180 0 ${BODY_MIDDLE_Y})` : undefined}>
            <g className={styles.farLeg}>
              <Leg root={placed(BACK_FAR, pose.tilt, pose.drop)} foot={pose.backFar} palette={palette} outline={outline} />
              <Leg root={placed(FRONT_FAR, pose.tilt, pose.drop)} foot={pose.frontFar} palette={palette} outline={outline} />
            </g>
            <g transform={`translate(${quiver} ${pose.drop}) rotate(${pose.tilt} ${HIPS.x} ${HIPS.y})`}>
              <Tail tip={pose.tail} palette={palette} outline={outline} />
              <path className={`${palette.fur} ${outline}`} d={BODY} />
            </g>
            <Leg root={placed(BACK_NEAR, pose.tilt, pose.drop)} foot={pose.backNear} palette={palette} outline={outline} />
            <Leg root={placed(FRONT_NEAR, pose.tilt, pose.drop)} foot={pose.frontNear} palette={palette} outline={outline} />
            <g
              transform={`translate(${placed(NECK, pose.tilt, pose.drop).x} ${placed(NECK, pose.tilt, pose.drop).y}) rotate(${
                pose.head + pose.tilt
              })`}
            >
              <path className={`${palette.fur} ${outline}`} d={EARS} />
              {pose.mouth && <path className={`${palette.mask} ${outline}`} d={JAW} />}
              <path className={`${palette.fur} ${outline}`} d={HEAD} />
              <path className={palette.plumage} d={MUZZLE} />
              <path className={palette.mask} d={MASK} />
              <circle className={palette.mask} cx={3} cy={0.5} r={0.32} />
              <Eye pose={pose} palette={palette} />
            </g>
          </g>
          {state === "telegraph" && (
            <Honk x={6.2} y={-4.4} degrees={-8} size={0.8} bangX={3.6 + quiver} bangY={-8.4} tick={resolveDrawTick(tick)} palette={palette} />
          )}
          {(state === "stunned" || state === "ko") && (
            <Stars
              cx={pose.onBack ? -2.4 : 2.4}
              cy={pose.onBack ? -3.4 : -8.6}
              rx={2.2}
              ry={0.7}
              count={pose.onBack ? 4 : 3}
              size={0.6}
              tick={tick}
              palette={palette}
            />
          )}
        </g>
      )}
    </g>
  );
};
