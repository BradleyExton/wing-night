import type { BrawlGoonState } from "@wingnight/shared";

import { Honk } from "../Honk/index.js";
import type { BrawlGoonPalette } from "../palette.js";
import { resolveLimbPath, resolveReach, resolveWalkFrame, rotatePoint, roundUnit, type Point } from "../rig/index.js";
import { Stars } from "../Stars/index.js";
import { resolveGoosePose, type GoosePose } from "./pose/index.js";
import * as styles from "./styles.js";

/** How tall the goose is drawn, feet to crown, in its own units; a placement scales it to the sim's box. */
export const GOOSE_ART_HEIGHT = 11.6;

// The rig's joints, standing, in drawing units: where the neck grows from, where the wing hangs,
// the hips, and the middle of the body the KO roll turns about.
const NECK_BASE: Point = { x: 2.2, y: -5.6 };
const SHOULDER: Point = { x: 1.1, y: -5.3 };
const HIP_NEAR: Point = { x: 0.8, y: -2.6 };
const HIP_FAR: Point = { x: -0.6, y: -2.6 };
const BODY_MIDDLE_Y = -4.5;
// How far the rolled-over goose drops so its back, not its middle, is on the street.
const ON_BACK_DROP = 2;

// The SCHLONIC goose's body (`ZoneProps/Crowd/Goose`), stood on longer legs: Barrie has one goose
// across games, and this is it with a rig in it.
const BODY = "M -3.2 -1.2 Q -3.6 -4.4 0 -4.6 Q 2.6 -4.6 3.2 -2.6 L 3.6 -1.4 Q 2.4 0 0 -0.4 Q -2.4 0 -3.2 -1.2 Z";
const BACK = "M -3 -1.6 Q -3.2 -4 0 -4.3 Q 1.6 -4.3 2.4 -3.4 Q 0.6 -3.2 -1.6 -2.2 Z";
const TAIL = "M -3.2 -1.2 L -4.8 -2.8 L -3.4 -3.2 Z";
// The wing lifted off the back, hung from the shoulder and sweeping back with a ragged edge.
const WING = "M 0 0 Q -2.4 -1.6 -4.8 -0.6 L -3.8 0 L -4.4 0.6 L -3.2 0.6 L -3.6 1.2 Q -1.4 1.3 0 0 Z";
// The head, drawn about its own centre facing right: the black head, the white chin strap
// wrapping the cheek under and behind the eye.
const CHIN = "M -1.05 0.2 Q -0.85 1.05 0.15 1.02 Q 0.6 0.75 0.2 0.3 Q -0.35 -0.05 -1.05 0.2 Z";
// The bill is drawn over the head from just inside its edge, and it is chunkier than SCHLONIC's
// static one: an outline eats a sliver this thin.
const BILL_ROOT: Point = { x: 0.9, y: 0.15 };
const BILL_TIP: Point = { x: 3.1, y: 0 };
const UPPER_BILL = "M 0.9 -0.65 L 3.1 0 L 0.9 0.15 Z";
const LOWER_BILL = "M 0.9 0.15 L 2.9 0.15 L 0.9 0.75 Z";
const EYE: Point = { x: 0.3, y: -0.4 };

type Variant = "goose" | "boss";

const Leg = ({ hip, foot, palette }: { hip: Point; foot: Point; palette: BrawlGoonPalette }): JSX.Element => (
  <path
    className={`${palette.legs} ${styles.leg}`}
    d={`M ${hip.x} ${hip.y} L ${foot.x} ${roundUnit(foot.y - 0.3)} M ${roundUnit(foot.x - 0.6)} ${foot.y} L ${roundUnit(
      foot.x + 1
    )} ${foot.y}`}
  />
);

// The eye a state looks out of: open, a slit while it slumps, crossed out when it is down. The
// boss's is the colour of a stop light and bigger, under a brow it never unknits.
const Eye = ({ pose, variant, palette }: { pose: GoosePose; variant: Variant; palette: BrawlGoonPalette }): JSX.Element => {
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

  if (variant === "boss") {
    return (
      <g>
        <circle className={palette.rage} cx={EYE.x} cy={EYE.y} r={0.48} />
        <path className={`${palette.mark} ${styles.mark}`} d={`M ${EYE.x - 0.7} ${EYE.y - 1} L ${EYE.x + 0.75} ${EYE.y - 0.45}`} />
      </g>
    );
  }

  return <circle className={palette.eye} cx={EYE.x} cy={EYE.y} r={0.34} />;
};

// The boss's chain: gold links slung round the base of its neck.
const Chain = ({ base, palette }: { base: Point; palette: BrawlGoonPalette }): JSX.Element => (
  <g>
    {[-0.9, -0.45, 0, 0.45, 0.9].map((offset) => (
      <circle
        key={offset}
        className={`${palette.chain} ${palette.stroke} ${styles.link}`}
        cx={roundUnit(base.x + offset)}
        cy={roundUnit(base.y + 0.9 - offset * offset * 0.5)}
        r={0.3}
      />
    ))}
  </g>
);

/**
 * The Barrie goose with a rig in it, in its own drawing units — feet on the origin, facing right —
 * for the goose and, bigger and angrier, the boss. The state picks the pose (`./pose`); the tick
 * picks the walk frame, the honk's throb and where the stars are on their orbit.
 */
export const GooseFigure = ({
  state,
  tick,
  palette,
  variant
}: {
  state: BrawlGoonState;
  tick: number;
  palette: BrawlGoonPalette;
  variant: Variant;
}): JSX.Element | null => {
  const pose = resolveGoosePose(state, resolveWalkFrame(tick));

  if (pose === null) {
    return null;
  }

  const base = rotatePoint(NECK_BASE, pose.tilt);
  const head = resolveReach(base, pose.reach, pose.neck);
  const bend = resolveReach(base, pose.reach * 0.55, pose.neck - 28);
  const bill = rotatePoint(BILL_TIP, pose.bill);
  const billTip = { x: head.x + bill.x, y: head.y + bill.y };
  const outline = `${palette.stroke} ${styles.outline}`;
  const rimmed = `${palette.rim} ${styles.outline}`;
  const billOutline = `${palette.stroke} ${styles.bill}`;
  const roll = pose.onBack ? `translate(0 ${ON_BACK_DROP}) rotate(180 0 ${BODY_MIDDLE_Y})` : undefined;
  const rolled = (point: Point): Point =>
    pose.onBack ? { x: -point.x, y: roundUnit(2 * BODY_MIDDLE_Y - point.y + ON_BACK_DROP) } : point;
  const daze = rolled(head);
  const honkScale = variant === "boss" ? 1.5 : 1;

  return (
    <g>
      <ellipse className={palette.shadow} cx={0} cy={0} rx={pose.onBack ? 5 : 3.8} ry={0.7} />
      <g transform={roll}>
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
        {variant === "boss" && <Chain base={base} palette={palette} />}
        <g transform={`translate(${head.x} ${head.y}) rotate(${pose.bill})`}>
          <ellipse className={`${palette.neck} ${rimmed}`} cx={0} cy={0} rx={1.3} ry={1.05} />
          <path className={palette.plumage} d={CHIN} />
          <g transform={`rotate(${-pose.gape} ${BILL_ROOT.x} ${BILL_ROOT.y})`}>
            <path className={`${palette.beak} ${billOutline}`} d={UPPER_BILL} />
          </g>
          <g transform={`rotate(${roundUnit(pose.gape * 0.6)} ${BILL_ROOT.x} ${BILL_ROOT.y})`}>
            <path className={`${palette.beak} ${billOutline}`} d={LOWER_BILL} />
          </g>
          <Eye pose={pose} variant={variant} palette={palette} />
        </g>
        {pose.wing > 0 && (
          <g transform={`translate(${rotatePoint(SHOULDER, pose.tilt).x} ${rotatePoint(SHOULDER, pose.tilt).y}) rotate(${pose.wing + pose.tilt})`}>
            <path className={`${palette.featherDark} ${outline}`} d={WING} />
          </g>
        )}
      </g>
      {state === "telegraph" && (
        <Honk
          x={billTip.x}
          y={billTip.y}
          degrees={pose.bill}
          size={honkScale}
          bangX={head.x - 0.4}
          bangY={head.y - 1.6}
          tick={tick}
          palette={palette}
        />
      )}
      {(state === "stunned" || state === "ko") && (
        <Stars
          cx={daze.x}
          cy={roundUnit(daze.y - (pose.onBack ? 2.2 : 1.8))}
          rx={pose.onBack ? 2.6 : 2.1}
          ry={0.7}
          count={pose.onBack ? 4 : 3}
          size={0.6}
          tick={tick}
          palette={palette}
        />
      )}
    </g>
  );
};
