import { Clank } from "../Clank/index.js";
import { GOOSE_ART_HEIGHT } from "../GooseFigure/index.js";
import { Honk } from "../Honk/index.js";
import type { BrawlGoonPalette } from "../palette.js";
import {
  resolveGoonPlacement,
  resolveLimbPath,
  resolveReach,
  resolveWalkFrame,
  rotatePoint,
  roundUnit,
  type GoonProps,
  type Point
} from "../rig/index.js";
import { Stars } from "../Stars/index.js";
import { resolveHelmetPose, type HelmetPose } from "./pose/index.js";
import { Shell } from "./Shell/index.js";
import * as styles from "./styles.js";

/** The helmet goose is the goose, drawn to the goose's height; the helmet rides above the crown. */
export const HELMET_ART_HEIGHT = GOOSE_ART_HEIGHT;

// The goose rig's joints and shapes (`../GooseFigure`), repeated here because the figure draws a
// pose table of its own and wears a helmet the goose does not: Barrie has one goose across
// games, and this is the same bird in a helmet. If the goose's geometry is ever exported, this is
// the copy to delete.
const NECK_BASE: Point = { x: 2.2, y: -5.6 };
const SHOULDER: Point = { x: 1.1, y: -5.3 };
const HIP_NEAR: Point = { x: 0.8, y: -2.6 };
const HIP_FAR: Point = { x: -0.6, y: -2.6 };
const BODY_MIDDLE_Y = -4.5;
const ON_BACK_DROP = 2;
const BODY = "M -3.2 -1.2 Q -3.6 -4.4 0 -4.6 Q 2.6 -4.6 3.2 -2.6 L 3.6 -1.4 Q 2.4 0 0 -0.4 Q -2.4 0 -3.2 -1.2 Z";
const BACK = "M -3 -1.6 Q -3.2 -4 0 -4.3 Q 1.6 -4.3 2.4 -3.4 Q 0.6 -3.2 -1.6 -2.2 Z";
const TAIL = "M -3.2 -1.2 L -4.8 -2.8 L -3.4 -3.2 Z";
const WING = "M 0 0 Q -2.4 -1.6 -4.8 -0.6 L -3.8 0 L -4.4 0.6 L -3.2 0.6 L -3.6 1.2 Q -1.4 1.3 0 0 Z";
const CHIN = "M -1.05 0.2 Q -0.85 1.05 0.15 1.02 Q 0.6 0.75 0.2 0.3 Q -0.35 -0.05 -1.05 0.2 Z";
const BILL_ROOT: Point = { x: 0.9, y: 0.15 };
const BILL_TIP: Point = { x: 3.1, y: 0 };
const UPPER_BILL = "M 0.9 -0.65 L 3.1 0 L 0.9 0.15 Z";
const LOWER_BILL = "M 0.9 0.15 L 2.9 0.15 L 0.9 0.75 Z";
const EYE: Point = { x: 0.3, y: -0.4 };
/** The middle of the cage, in the head's own units: where a peck bounces off it. */
const CAGE_MIDDLE: Point = { x: 2.6, y: 0.25 };
/** Where the knocked-off helmet lies: behind the rolled-over body, upside down on the street. */
const HELMET_OFF: Point = { x: -8.2, y: -1.3 };
const HELMET_OFF_DEGREES = 160;

const Leg = ({ hip, foot, palette }: { hip: Point; foot: Point; palette: BrawlGoonPalette }): JSX.Element => (
  <path
    className={`${palette.legs} ${styles.leg}`}
    d={`M ${hip.x} ${hip.y} L ${foot.x} ${roundUnit(foot.y - 0.3)} M ${roundUnit(foot.x - 0.6)} ${foot.y} L ${roundUnit(foot.x + 1)} ${foot.y}`}
  />
);

const Eye = ({ pose, palette }: { pose: HelmetPose; palette: BrawlGoonPalette }): JSX.Element => {
  if (pose.eye === "out") {
    return (
      <path
        className={`${palette.mark} ${styles.mark}`}
        d={`M ${EYE.x - 0.4} ${EYE.y - 0.4} L ${EYE.x + 0.4} ${EYE.y + 0.4} M ${EYE.x - 0.4} ${EYE.y + 0.4} L ${EYE.x + 0.4} ${EYE.y - 0.4}`}
      />
    );
  }

  if (pose.eye === "shut") {
    return <path className={`${palette.mark} ${styles.mark}`} d={`M ${EYE.x - 0.4} ${EYE.y} L ${EYE.x + 0.4} ${EYE.y + 0.1}`} />;
  }

  return <circle className={palette.eye} cx={EYE.x} cy={EYE.y} r={0.34} />;
};

/**
 * The goose in a hockey helmet: the Barrie goose with its head down and a cage over its bill, so
 * a peck clanks off it — until it honks. Two modes the room must read from a couch: ARMOURED
 * (walking in, closing, reeling from a clank) with the head driven low and the cage down, and
 * OPEN (the honk, the lunge, the slump after) with the head up and the cage flipped over the
 * dome, the bill bare. Knocked out, the helmet lies beside it. Stood on its foot point and scaled
 * to its box (`BRAWL_WORLD.goons.helmet`, a goose's, via `HELMET_ART_HEIGHT`).
 */
export const Helmet = ({ x, y, facing, state, tick, palette, clank = null }: GoonProps): JSX.Element => {
  const pose = resolveHelmetPose(state, resolveWalkFrame(tick));
  const outline = `${palette.stroke} ${styles.outline}`;
  const rimmed = `${palette.rim} ${styles.outline}`;
  const billOutline = `${palette.stroke} ${styles.bill}`;
  const base = pose === null ? NECK_BASE : rotatePoint(NECK_BASE, pose.tilt);
  const head = pose === null ? base : resolveReach(base, pose.reach, pose.neck);
  const bend = pose === null ? base : resolveReach(base, pose.reach * 0.55, pose.neck - 28);
  const bill = pose === null ? BILL_TIP : rotatePoint(BILL_TIP, pose.bill);
  const shoulder = pose === null ? SHOULDER : rotatePoint(SHOULDER, pose.tilt);
  const rolled = (point: Point): Point =>
    pose?.onBack === true ? { x: -point.x, y: roundUnit(2 * BODY_MIDDLE_Y - point.y + ON_BACK_DROP) } : point;
  const daze = rolled(head);
  const cage = pose === null ? CAGE_MIDDLE : rotatePoint(CAGE_MIDDLE, pose.bill);

  return (
    <g
      className={styles.root}
      data-brawl-goon-kind="helmet"
      data-brawl-goon-state={state}
      data-brawl-goon-guard={pose === null ? undefined : pose.cage}
      transform={resolveGoonPlacement({ x, y, facing, kind: "helmet", artHeight: HELMET_ART_HEIGHT })}
    >
      {pose !== null && (
        <g>
          <ellipse className={palette.shadow} cx={0} cy={0} rx={pose.onBack ? 5 : 3.8} ry={0.7} />
          <g transform={pose.onBack ? `translate(0 ${ON_BACK_DROP}) rotate(180 0 ${BODY_MIDDLE_Y})` : undefined}>
            <g className={styles.farLeg}>
              <Leg hip={rotatePoint(HIP_FAR, pose.tilt)} foot={pose.far} palette={palette} />
            </g>
            <g transform={`rotate(${pose.tilt}) translate(0 -2)`}>
              <path className={`${palette.neck} ${rimmed}`} d={TAIL} />
              <path className={`${palette.feather} ${outline}`} d={BODY} />
              <path className={palette.featherDark} d={BACK} />
            </g>
            <Leg hip={rotatePoint(HIP_NEAR, pose.tilt)} foot={pose.near} palette={palette} />
            <path className={`${palette.neck} ${rimmed}`} d={resolveLimbPath(base, bend, head, 1.7, 1.2)} />
            <g transform={`translate(${head.x} ${head.y}) rotate(${pose.bill})`}>
              <ellipse className={`${palette.neck} ${rimmed}`} cx={0} cy={0} rx={1.3} ry={1.05} />
              <path className={palette.plumage} d={CHIN} />
              <g transform={`rotate(${-pose.gape} ${BILL_ROOT.x} ${BILL_ROOT.y})`}>
                <path className={`${palette.beak} ${billOutline}`} d={UPPER_BILL} />
              </g>
              <g transform={`rotate(${roundUnit(pose.gape * 0.6)} ${BILL_ROOT.x} ${BILL_ROOT.y})`}>
                <path className={`${palette.beak} ${billOutline}`} d={LOWER_BILL} />
              </g>
              <Eye pose={pose} palette={palette} />
              {pose.cage !== "off" && <Shell cage={pose.cage} palette={palette} />}
            </g>
            {pose.wing > 0 && (
              <g transform={`translate(${shoulder.x} ${shoulder.y}) rotate(${roundUnit(pose.wing + pose.tilt)})`}>
                <path className={`${palette.featherDark} ${outline}`} d={WING} />
              </g>
            )}
          </g>
          {pose.cage === "off" && (
            <g data-brawl-helmet-off transform={`translate(${HELMET_OFF.x} ${HELMET_OFF.y}) rotate(${HELMET_OFF_DEGREES})`}>
              <Shell cage="down" palette={palette} />
            </g>
          )}
          {state === "telegraph" && (
            <Honk x={head.x + bill.x} y={head.y + bill.y} degrees={pose.bill} size={1} bangX={head.x - 0.4} bangY={head.y - 2.6} tick={tick} palette={palette} />
          )}
          {(state === "stunned" || state === "ko") && (
            <Stars
              cx={daze.x}
              cy={roundUnit(daze.y - (pose.onBack ? 2.2 : 2.4))}
              rx={pose.onBack ? 2.6 : 2.1}
              ry={0.7}
              count={pose.onBack ? 4 : 3}
              size={0.6}
              tick={tick}
              palette={palette}
            />
          )}
          {clank !== null && pose.cage !== "off" && <Clank x={head.x + cage.x} y={head.y + cage.y} tick={clank} palette={palette} />}
        </g>
      )}
    </g>
  );
};
