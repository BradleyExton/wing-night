import type { BrawlGoonState } from "@wingnight/shared";

import { Honk } from "../Honk/index.js";
import type { BrawlGoonPalette } from "../palette.js";
import {
  resolveGoonPlacement,
  resolveWalkFrame,
  rotatePoint,
  roundUnit,
  type GoonProps,
  type Point
} from "../rig/index.js";
import { Stars } from "../Stars/index.js";
import * as styles from "./styles.js";

/** How tall the gull is drawn, feet to raised wing tip, in its own units; scaled to the sim's gull box. */
export const GULL_ART_HEIGHT = 7;

// In drawing units, feet on the origin, facing right: the body's middle, the shoulder both
// wings hang from, and the head.
const BODY: Point = { x: 0, y: -2.2 };
const SHOULDER: Point = { x: 0.3, y: -2.9 };
const HEAD: Point = { x: 2.3, y: -3.1 };
// How far the rolled-over gull drops so its back lies on the street.
const ON_BACK_DROP = 0.9;
const TAIL = "M -2.2 -2.5 L -3.9 -2.9 L -3.6 -1.7 L -2.2 -1.8 Z";
// The bill, hooked at the tip, with the red spot a herring gull has on it.
const BILL = "M 3.05 -3.45 L 4.5 -3.25 Q 4.8 -3.05 4.5 -2.8 L 3.05 -2.85 Z";

type GullPose = {
  /** The whole bird about its middle, degrees; positive tips the bill down. */
  tilt: number;
  /** Each wing's tip, in drawing units before the tilt. */
  near: Point;
  far: Point;
  /** Talons let down, the way a gull comes in for a chip. */
  talons: boolean;
  eye: "open" | "out";
  /** On its back on the street, wings splayed flat. */
  onBack: boolean;
};

const FLAP: [GullPose, GullPose] = [
  { tilt: 0, near: { x: -2.2, y: -7 }, far: { x: -0.6, y: -6.6 }, talons: false, eye: "open", onBack: false },
  { tilt: 4, near: { x: -2.6, y: 1.4 }, far: { x: -1, y: 0.8 }, talons: false, eye: "open", onBack: false }
];

const POSES: Record<Exclude<BrawlGoonState, "entering" | "approach" | "gone">, GullPose> = {
  // Hanging over the hen with both wings up in a wide V and the talons down: the hover before
  // the dive, held still so the room has a beat to see it.
  telegraph: { tilt: -10, near: { x: -3.6, y: -6.6 }, far: { x: 2, y: -6.8 }, talons: true, eye: "open", onBack: false },
  // The dive: bill first and steep, wings swept back flat along the body.
  attack: { tilt: 42, near: { x: -5.4, y: -3.4 }, far: { x: -5, y: -2.4 }, talons: false, eye: "open", onBack: false },
  // Pulling out of it: tipped back, wings half up, legs hanging.
  recover: { tilt: -14, near: { x: -3.8, y: -4.6 }, far: { x: -2.4, y: -4.2 }, talons: true, eye: "open", onBack: false },
  // Pecked out of the air: tumbling, one wing up and one down.
  stunned: { tilt: -32, near: { x: -1.2, y: -6.8 }, far: { x: 1.4, y: 1 }, talons: true, eye: "open", onBack: false },
  // Down: flat on its back on the street, wings out either side, feet in the air.
  ko: { tilt: 0, near: { x: -5.2, y: -2.6 }, far: { x: 4.6, y: -2.8 }, talons: true, eye: "out", onBack: true }
};

const resolveGullPose = (state: BrawlGoonState, frame: 0 | 1): GullPose | null => {
  if (state === "gone") {
    return null;
  }

  return state === "entering" || state === "approach" ? FLAP[frame] : POSES[state];
};

// A wing from the shoulder out to `tip`, `chord` deep at its broadest: a curved leading edge
// and a trailing edge bellied out behind it, the trailing side being whichever is further back.
const resolveWingPath = (from: Point, tip: Point, chord: number): string => {
  const dx = tip.x - from.x;
  const dy = tip.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  // Of the two sides of the span, the trailing one is the one further back — or, for a wing laid
  // along the body, the one underneath.
  const side = { x: dy / length, y: -dx / length };
  const flip = Math.abs(side.x) > 0.3 ? (side.x < 0 ? 1 : -1) : side.y > 0 ? 1 : -1;
  const nx = flip * side.x;
  const ny = flip * side.y;
  const at = (share: number, out: number): string =>
    `${roundUnit(from.x + dx * share + nx * out)} ${roundUnit(from.y + dy * share + ny * out)}`;

  return `M ${at(0, -0.2)} Q ${at(0.5, -0.5)} ${at(1, 0)} Q ${at(0.3, chord * 1.6)} ${at(0, chord)} Z`;
};

// One wing, with the black tip a herring gull's primaries have.
const Wing = ({ tip, palette, outline }: { tip: Point; palette: BrawlGoonPalette; outline: string }): JSX.Element => {
  const tipFrom = { x: roundUnit(SHOULDER.x + (tip.x - SHOULDER.x) * 0.66), y: roundUnit(SHOULDER.y + (tip.y - SHOULDER.y) * 0.66) };

  return (
    <g>
      <path className={`${palette.featherDark} ${outline}`} d={resolveWingPath(SHOULDER, tip, 1.7)} />
      <path className={`${palette.neck} ${palette.rim} ${styles.tip}`} d={resolveWingPath(tipFrom, tip, 0.4)} />
    </g>
  );
};

/**
 * A herring gull off the bay, the one goon that leaves the ground: it flaps in over the street
 * (a two-frame beat on the sim's tick), hangs over the hen with its wings up, then dives. Stood on
 * its foot point — `y` is how high it is flying — and scaled to the sim's gull box
 * (`BRAWL_WORLD.goons.gull`, via `GULL_ART_HEIGHT`).
 */
export const Gull = ({ x, y, facing, state, tick, palette }: GoonProps): JSX.Element => {
  const pose = resolveGullPose(state, resolveWalkFrame(tick));
  const outline = `${palette.stroke} ${styles.outline}`;

  return (
    <g
      className={styles.root}
      data-brawl-goon-kind="gull"
      data-brawl-goon-state={state}
      transform={resolveGoonPlacement({ x, y, facing, kind: "gull", artHeight: GULL_ART_HEIGHT })}
    >
      {pose !== null && (
        <g>
          <g transform={pose.onBack ? `translate(0 ${ON_BACK_DROP}) rotate(180 0 ${BODY.y})` : `rotate(${pose.tilt} ${BODY.x} ${BODY.y})`}>
            <Wing tip={pose.far} palette={palette} outline={outline} />
            {pose.talons && (
              <path
                className={`${palette.gullLegs} ${styles.leg}`}
                d="M -0.4 -1.3 L -0.2 0 M 0.5 -1.3 L 0.8 0 M -0.7 0 L 0.3 0 M 0.3 0 L 1.3 0"
              />
            )}
            <path className={`${palette.plumage} ${outline}`} d={TAIL} />
            <ellipse className={`${palette.plumage} ${outline}`} cx={BODY.x} cy={BODY.y} rx={2.6} ry={1.15} />
            <circle className={`${palette.plumage} ${outline}`} cx={HEAD.x} cy={HEAD.y} r={1} />
            <path className={`${palette.gullBeak} ${outline}`} d={BILL} />
            <circle className={palette.rage} cx={4.05} cy={-2.95} r={0.16} />
            {pose.eye === "out" ? (
              <path className={`${palette.stroke} ${styles.mark}`} d="M 2.2 -3.7 L 2.8 -3.1 M 2.2 -3.1 L 2.8 -3.7" />
            ) : (
              <circle className={palette.pupil} cx={2.55} cy={-3.35} r={0.22} />
            )}
            <Wing tip={pose.near} palette={palette} outline={outline} />
          </g>
          {state === "telegraph" && (
            <Honk
              x={rotatePoint({ x: 4.6, y: -3 }, pose.tilt, BODY).x}
              y={rotatePoint({ x: 4.6, y: -3 }, pose.tilt, BODY).y}
              degrees={pose.tilt}
              size={0.8}
              bangX={HEAD.x}
              bangY={-6.6}
              tick={tick}
              palette={palette}
            />
          )}
          {(state === "stunned" || state === "ko") && (
            <Stars
              cx={pose.onBack ? -1.6 : HEAD.x - 0.6}
              cy={pose.onBack ? -2.4 : -4.8}
              rx={pose.onBack ? 2.4 : 1.8}
              ry={0.6}
              count={pose.onBack ? 4 : 3}
              size={0.5}
              tick={tick}
              palette={palette}
            />
          )}
        </g>
      )}
    </g>
  );
};
