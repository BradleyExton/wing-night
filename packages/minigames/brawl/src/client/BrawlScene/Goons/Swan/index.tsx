import type { BrawlGoonPalette } from "../palette.js";
import { resolveGoonPlacement, resolveReach, resolveWalkFrame, rotatePoint, roundUnit, type GoonProps, type Point } from "../rig/index.js";
import { Stars } from "../Stars/index.js";
import { Hiss } from "./Hiss/index.js";
import { resolveSwanPose, type NeckSegment, type SwanPose } from "./pose/index.js";
import * as styles from "./styles.js";

/** How tall the swan is drawn, feet to crown, in its own units; a placement scales it to the sim's box. */
export const SWAN_ART_HEIGHT = 15.4;

// The rig's joints, standing, in drawing units: where the neck grows from the breast, where the
// wings hang, the hips, and the middle of the hull the KO roll turns about.
const NECK_BASE: Point = { x: 3.4, y: -6 };
const SHOULDER: Point = { x: 0.6, y: -6.2 };
const HIP_NEAR: Point = { x: 0.6, y: -2.8 };
const HIP_FAR: Point = { x: -0.8, y: -2.8 };
const BODY_MIDDLE_Y = -4.4;
const ON_BACK_DROP = 0.6;

// A mute swan's hull: deep-breasted, the tail cocked up at the back, and the folded wings an arch
// over the back (the "busking" shape is this arch raised). Bigger than the goose in every line.
const BODY = "M -5.6 -3.2 Q -6.4 -5.8 -3 -6.4 Q 0.4 -7 3.4 -6 Q 5.2 -5 4.8 -3.2 L 4.2 -1.9 Q 0 -1 -4.2 -1.9 Q -5.4 -2.2 -5.6 -3.2 Z";
const BELLY_SHADE = "M -4.2 -1.9 Q 0 -1 4.2 -1.9 Q 0 -2.9 -4.2 -1.9 Z";
const TAIL = "M -5.4 -3.6 L -7.8 -4.8 L -6.4 -6.2 L -4.6 -5.6 Z";
const WING_FOLDED = "M -4.8 -5 Q -2.2 -8.8 2.4 -6.7 Q 3.2 -6.3 3.6 -5.8 Q 0.6 -6.3 -2.4 -5.7 L -3.4 -6.1 L -4.1 -5.3 Z";
// A wing lifted off the back, hung from the shoulder and sweeping back with a feathered edge.
const WING_RAISED = "M 0 0 Q -3.4 -2.6 -7.6 -1.4 L -6.2 -0.2 L -7 1 L -5.2 1 L -5.8 2.2 Q -2.2 2.4 0 0 Z";
// The head about its own centre facing right: the black face patch running back from the bill to
// the eye, the knob on the bill's root, and the two mandibles.
const LORES = "M 0.5 -0.5 L 1.45 -0.78 L 1.5 0.38 L 0.72 0.22 Z";
const KNOB: Point = { x: 1.42, y: -0.74 };
const BILL_ROOT: Point = { x: 1.3, y: 0.2 };
const BILL_TIP: Point = { x: 3.7, y: 0 };
const UPPER_BILL = "M 1.3 -0.6 L 3.7 -0.05 L 1.3 0.2 Z";
const LOWER_BILL = "M 1.3 0.2 L 3.5 0.2 L 1.3 0.85 Z";
const EYE: Point = { x: 0.45, y: -0.35 };

/** The bend of a neck segment: its chord's middle pushed off it by `bow`, positive backward. */
const resolveBow = (from: Point, to: Point, bow: number): Point => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;

  return { x: roundUnit((from.x + to.x) / 2 + (dy / length) * bow), y: roundUnit((from.y + to.y) / 2 - (dx / length) * bow) };
};

/**
 * The neck as ONE filled outline through both segments — base to the mid joint to the head — so
 * no seam shows where the two meet. Each side runs the two quadratics, the widths taper
 * `widths[0]` at the base to `widths[2]` at the head.
 */
const resolveNeckPath = (nodes: [Point, Point, Point], bends: [Point, Point], widths: [number, number, number]): string => {
  const direction = (from: Point, to: Point): Point => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;

    return { x: -dy / length, y: dx / length };
  };
  const lowerNormal = direction(nodes[0], nodes[1]);
  const upperNormal = direction(nodes[1], nodes[2]);
  const jointNormal = ((): Point => {
    const sum = { x: lowerNormal.x + upperNormal.x, y: lowerNormal.y + upperNormal.y };
    const length = Math.hypot(sum.x, sum.y) || 1;

    return { x: sum.x / length, y: sum.y / length };
  })();
  const nodeNormals: [Point, Point, Point] = [lowerNormal, jointNormal, upperNormal];
  const bendNormals: [Point, Point] = [lowerNormal, upperNormal];
  const side = (point: Point, normal: Point, half: number, sign: number): string =>
    `${roundUnit(point.x + sign * normal.x * half)} ${roundUnit(point.y + sign * normal.y * half)}`;
  const node = (index: 0 | 1 | 2, sign: number): string => side(nodes[index], nodeNormals[index], widths[index] / 2, sign);
  const bend = (index: 0 | 1, sign: number): string =>
    side(bends[index], bendNormals[index], (widths[index] + (index === 0 ? widths[1] : widths[2])) / 4, sign);

  return `M ${node(0, 1)} Q ${bend(0, 1)} ${node(1, 1)} Q ${bend(1, 1)} ${node(2, 1)} L ${node(2, -1)} Q ${bend(1, -1)} ${node(1, -1)} Q ${bend(0, -1)} ${node(0, -1)} Z`;
};

const reachSegment = (from: Point, segment: NeckSegment): Point => resolveReach(from, segment.length, segment.degrees);

const Leg = ({ hip, foot, legs }: { hip: Point; foot: Point; legs: string }): JSX.Element => (
  <path
    className={`${legs} ${styles.leg}`}
    d={`M ${hip.x} ${hip.y} L ${foot.x} ${roundUnit(foot.y - 0.3)} M ${roundUnit(foot.x - 0.9)} ${foot.y} L ${roundUnit(foot.x + 1.3)} ${foot.y}`}
  />
);

// A black eye in a white head, so the marks over it are the goon's dark outline colour rather than
// its white mark: a lid for the wary stalk, a line when shut, a cross when it is out.
const Eye = ({ pose, palette }: { pose: SwanPose; palette: BrawlGoonPalette }): JSX.Element => {
  const ink = `${palette.stroke} ${styles.mark}`;

  if (pose.eye === "out") {
    return <path className={ink} d={`M ${EYE.x - 0.4} ${EYE.y - 0.4} L ${EYE.x + 0.4} ${EYE.y + 0.4} M ${EYE.x - 0.4} ${EYE.y + 0.4} L ${EYE.x + 0.4} ${EYE.y - 0.4}`} />;
  }

  if (pose.eye === "shut") {
    return <path className={ink} d={`M ${EYE.x - 0.4} ${EYE.y} L ${EYE.x + 0.4} ${EYE.y + 0.1}`} />;
  }

  return (
    <g>
      <circle className={palette.pupil} cx={EYE.x} cy={EYE.y} r={0.3} />
      {pose.eye === "wary" && <path className={ink} d={`M ${EYE.x - 0.5} ${EYE.y - 0.4} L ${EYE.x + 0.5} ${EYE.y - 0.1}`} />}
      {pose.brow && <path className={ink} d={`M ${EYE.x - 0.55} ${EYE.y - 0.75} L ${EYE.x + 0.5} ${EYE.y - 0.4}`} />}
    </g>
  );
};

/**
 * A mute swan off Kempenfelt Bay: the one goon that only ever comes from behind, and the one a
 * turn alone answers. White where the goose is grey, a head taller, the neck a two-segment S the
 * pose bends: it waddles in slow (two frames on the sim's tick), hisses with the neck drawn back
 * and the wings half up, lunges with the neck straight out — and, faced, `stalk`s: stands tall
 * and still on one foot and waits. Stood on its foot point and scaled to the swan's box
 * (`BRAWL_WORLD.goons.swan`, via `SWAN_ART_HEIGHT`).
 */
export const Swan = ({ x, y, facing, state, tick, palette }: GoonProps): JSX.Element => {
  const pose = resolveSwanPose(state, resolveWalkFrame(tick));
  const legs = palette.swanLegs;
  const outline = `${palette.stroke} ${styles.outline}`;
  const base = pose === null ? NECK_BASE : rotatePoint(NECK_BASE, pose.tilt);
  const mid = pose === null ? base : reachSegment(base, pose.lower);
  const head = pose === null ? mid : reachSegment(mid, pose.upper);
  const bill = pose === null ? BILL_TIP : rotatePoint(BILL_TIP, pose.bill);
  const shoulder = pose === null ? SHOULDER : rotatePoint(SHOULDER, pose.tilt);
  const rolled = (point: Point): Point =>
    pose?.onBack === true ? { x: -point.x, y: roundUnit(2 * BODY_MIDDLE_Y - point.y + ON_BACK_DROP) } : point;
  const daze = rolled(head);

  return (
    <g
      className={styles.root}
      data-brawl-goon-kind="swan"
      data-brawl-goon-state={state}
      transform={resolveGoonPlacement({ x, y, facing, kind: "swan", artHeight: SWAN_ART_HEIGHT })}
    >
      {pose !== null && (
        <g>
          <ellipse className={palette.shadow} cx={0} cy={0} rx={pose.onBack ? 7 : 5.4} ry={0.8} />
          <g transform={pose.onBack ? `translate(0 ${ON_BACK_DROP}) rotate(180 0 ${BODY_MIDDLE_Y})` : undefined}>
            <g className={styles.farLeg}>
              <Leg hip={rotatePoint(HIP_FAR, pose.tilt)} foot={pose.far} legs={legs} />
            </g>
            {pose.wing > 0 && (
              <g className={styles.farWing} transform={`translate(${shoulder.x} ${shoulder.y}) rotate(${roundUnit(pose.wing - 14 + pose.tilt)})`}>
                <path className={`${palette.plumage} ${outline}`} d={WING_RAISED} />
              </g>
            )}
            <g transform={`rotate(${pose.tilt})`}>
              <path className={`${palette.plumage} ${outline}`} d={TAIL} />
              <path className={`${palette.plumage} ${outline}`} d={BODY} />
              <path className={`${palette.fur} ${styles.shade}`} d={BELLY_SHADE} />
              {pose.wing === 0 && <path className={`${palette.plumage} ${outline}`} d={WING_FOLDED} />}
            </g>
            <Leg hip={rotatePoint(HIP_NEAR, pose.tilt)} foot={pose.near} legs={legs} />
            <path
              className={`${palette.plumage} ${outline}`}
              d={resolveNeckPath([base, mid, head], [resolveBow(base, mid, pose.lower.bow), resolveBow(mid, head, pose.upper.bow)], [2.4, 1.8, 1.4])}
            />
            <g transform={`translate(${head.x} ${head.y}) rotate(${pose.bill})`}>
              <ellipse className={`${palette.plumage} ${outline}`} cx={0} cy={0} rx={1.45} ry={1.15} />
              <path className={palette.neck} d={LORES} />
              <g transform={`rotate(${-pose.gape} ${BILL_ROOT.x} ${BILL_ROOT.y})`}>
                <path className={`${palette.beak} ${palette.stroke} ${styles.bill}`} d={UPPER_BILL} />
                <circle className={palette.neck} cx={KNOB.x} cy={KNOB.y} r={0.42} />
              </g>
              <g transform={`rotate(${roundUnit(pose.gape * 0.6)} ${BILL_ROOT.x} ${BILL_ROOT.y})`}>
                <path className={`${palette.beak} ${palette.stroke} ${styles.bill}`} d={LOWER_BILL} />
              </g>
              <Eye pose={pose} palette={palette} />
            </g>
            {pose.wing > 0 && (
              <g transform={`translate(${shoulder.x} ${shoulder.y}) rotate(${roundUnit(pose.wing + pose.tilt)})`}>
                <path className={`${palette.plumage} ${outline}`} d={WING_RAISED} />
              </g>
            )}
          </g>
          {state === "telegraph" && (
            <Hiss x={head.x + bill.x} y={head.y + bill.y} degrees={pose.bill} size={1.1} bangX={head.x - 0.4} bangY={head.y - 2} tick={tick} palette={palette} />
          )}
          {(state === "stunned" || state === "ko") && (
            <Stars
              cx={daze.x}
              cy={roundUnit(daze.y - (pose.onBack ? 2.4 : 2))}
              rx={2.6}
              ry={0.8}
              count={pose.onBack ? 4 : 3}
              size={0.7}
              tick={tick}
              palette={palette}
            />
          )}
        </g>
      )}
    </g>
  );
};
