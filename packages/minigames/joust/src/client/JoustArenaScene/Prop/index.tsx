import type { JoustObstacle, JoustObstacleKind } from "@wingnight/shared";

import { joustPalette } from "../palette.js";

/** What a lane that names no kind is furnished with: the one thing every beach has. */
const DEFAULT_KIND: JoustObstacleKind = "umbrella";

type Box = { x: number; y: number; width: number; height: number };

const OUTLINE = 0.5;

/** A beach umbrella: a striped canopy across the whole width, on a pole down the middle. */
const Umbrella = ({ x, y, width, height }: Box): JSX.Element => {
  const canopyDepth = height * 0.38;
  const cx = x + width / 2;
  const rim = y + canopyDepth;

  return (
    <g>
      <rect x={cx - 0.45} y={rim - 1} width={0.9} height={height - canopyDepth + 1} fill={joustPalette.propDark} />
      <path
        d={`M${x} ${rim} Q${cx} ${y - canopyDepth * 0.6} ${x + width} ${rim} Z`}
        fill={joustPalette.propCanvas}
        stroke={joustPalette.propDark}
        strokeWidth={OUTLINE}
        strokeLinejoin="round"
      />
      <path
        d={`M${cx} ${y} L${x + width * 0.28} ${rim} L${x + width * 0.4} ${rim} Z M${cx} ${y} L${x + width * 0.6} ${rim} L${x + width * 0.72} ${rim} Z`}
        fill={joustPalette.propStripe}
        opacity={0.85}
      />
    </g>
  );
};

/** A Muskoka chair side-on, facing the slingshot: the slanted back, the wide arm, the low seat. */
const MuskokaChair = ({ x, y, width, height }: Box): JSX.Element => {
  const stroke = { stroke: joustPalette.propRedDark, strokeWidth: OUTLINE, strokeLinejoin: "round" as const };

  return (
    <g fill={joustPalette.propRed}>
      <path
        d={`M${x + width * 0.62} ${y} L${x + width * 0.86} ${y + height * 0.04} L${x + width} ${y + height * 0.72} L${x + width * 0.76} ${y + height * 0.72} Z`}
        {...stroke}
      />
      <rect x={x + width * 0.14} y={y + height * 0.5} width={width * 0.66} height={height * 0.13} {...stroke} />
      <rect x={x} y={y + height * 0.36} width={width * 0.84} height={height * 0.1} {...stroke} />
      <rect x={x + width * 0.14} y={y + height * 0.6} width={width * 0.12} height={height * 0.4} {...stroke} />
      <rect x={x + width * 0.74} y={y + height * 0.6} width={width * 0.12} height={height * 0.4} {...stroke} />
    </g>
  );
};

/**
 * A canoe pulled up on the sand, side-on: a red hull whose keel curves down to the belly and
 * whose ends rise to points above a flat gunwale, with two thwarts across it.
 */
const Canoe = ({ x, y, width, height }: Box): JSX.Element => {
  const gunwale = y + height * 0.36;
  const tipInset = width * 0.07;

  return (
    <g>
      <path
        d={`M${x} ${y} Q${x + width * 0.5} ${y + height * 1.55} ${x + width} ${y} L${x + width - tipInset} ${gunwale} L${x + tipInset} ${gunwale} Z`}
        fill={joustPalette.propHull}
        stroke={joustPalette.propRedDark}
        strokeWidth={OUTLINE}
        strokeLinejoin="round"
      />
      <line
        x1={x + tipInset}
        y1={gunwale}
        x2={x + width - tipInset}
        y2={gunwale}
        stroke={joustPalette.propStripe}
        strokeWidth={0.5}
        opacity={0.6}
      />
      {[0.32, 0.68].map((share) => (
        <rect
          key={share}
          x={x + width * share - 0.35}
          y={gunwale}
          width={0.7}
          height={height * 0.32}
          fill={joustPalette.propRedDark}
          opacity={0.8}
        />
      ))}
    </g>
  );
};

/** The chip truck: a cream box on two wheels, a serving hatch under a striped awning. */
const ChipTruck = ({ x, y, width, height }: Box): JSX.Element => {
  const wheelRadius = height * 0.11;
  const bodyTop = y + height * 0.12;
  const bodyBottom = y + height - wheelRadius;
  const hatchX = x + width * 0.42;

  return (
    <g>
      <rect
        x={x}
        y={bodyTop}
        width={width}
        height={bodyBottom - bodyTop}
        rx={0.8}
        fill={joustPalette.propCream}
        stroke={joustPalette.propDark}
        strokeWidth={OUTLINE}
      />
      <rect x={hatchX} y={bodyTop + height * 0.18} width={width * 0.46} height={height * 0.3} fill={joustPalette.propDark} opacity={0.85} />
      <rect x={hatchX - width * 0.06} y={y} width={width * 0.62} height={height * 0.16} fill={joustPalette.propRed} stroke={joustPalette.propRedDark} strokeWidth={OUTLINE} />
      {[0.18, 0.42, 0.66].map((share) => (
        <rect key={share} x={hatchX - width * 0.06 + width * 0.62 * share} y={y} width={width * 0.09} height={height * 0.16} fill={joustPalette.propStripe} />
      ))}
      <rect x={x + width * 0.08} y={bodyTop + height * 0.2} width={width * 0.22} height={height * 0.2} rx={0.4} fill={joustPalette.propStripe} opacity={0.6} />
      {[0.24, 0.76].map((share) => (
        <circle key={share} cx={x + width * share} cy={y + height - wheelRadius} r={wheelRadius} fill={joustPalette.propTyre} stroke={joustPalette.propDark} strokeWidth={OUTLINE} />
      ))}
    </g>
  );
};

/**
 * A mast planted in the sand, a pennant off the top of it. The pennant streams back toward the
 * slingshot — the wind is off the bay — which also keeps it inside the world when the mast is
 * planted at the lane's far end.
 */
const Mast = ({ x, y, width, height }: Box): JSX.Element => {
  const cx = x + width / 2;
  const poleWidth = Math.max(0.8, width * 0.6);
  const hoist = cx - poleWidth / 2;

  return (
    <g>
      <rect x={cx - poleWidth / 2} y={y} width={poleWidth} height={height} rx={poleWidth / 2} fill={joustPalette.propWhite} stroke={joustPalette.propDark} strokeWidth={OUTLINE} />
      {/* A long swallow-tailed pennant, so the pole reads as a mast and not a spear. */}
      <path
        d={`M${hoist} ${y + 1.2} L${hoist - 7.5} ${y + 2.4} L${hoist - 5.6} ${y + 3.6} L${hoist - 7.5} ${y + 4.8} L${hoist} ${y + 6} Z`}
        fill={joustPalette.propRed}
        stroke={joustPalette.propRedDark}
        strokeWidth={OUTLINE}
        strokeLinejoin="round"
      />
      <rect x={x} y={y + height - 1.4} width={width} height={1.4} fill={joustPalette.propDark} />
    </g>
  );
};

/** A lifeguard chair: two braced legs, a seat up top, and the back rest facing the water. */
const LifeguardChair = ({ x, y, width, height }: Box): JSX.Element => {
  const legWidth = Math.max(0.9, width * 0.16);
  const seatY = y + height * 0.34;
  const stroke = { stroke: joustPalette.propDark, strokeWidth: OUTLINE, strokeLinejoin: "round" as const };

  return (
    <g fill={joustPalette.propWhite}>
      <path
        d={`M${x + legWidth / 2} ${seatY} L${x + width - legWidth / 2} ${y + height} M${x + width - legWidth / 2} ${seatY} L${x + legWidth / 2} ${y + height}`}
        fill="none"
        stroke={joustPalette.propDark}
        strokeWidth={0.6}
      />
      <rect x={x} y={seatY} width={legWidth} height={height - (seatY - y)} {...stroke} />
      <rect x={x + width - legWidth} y={seatY} width={legWidth} height={height - (seatY - y)} {...stroke} />
      <rect x={x - 0.3} y={seatY - 1.2} width={width + 0.6} height={1.4} {...stroke} />
      <rect x={x + width - legWidth - 0.2} y={y} width={legWidth + 0.4} height={seatY - y} {...stroke} />
      <rect x={x + width - legWidth - 0.2} y={y + height * 0.08} width={legWidth + 0.4} height={height * 0.06} fill={joustPalette.propRed} />
    </g>
  );
};

const DRAWINGS: Record<JoustObstacleKind, (box: Box) => JSX.Element> = {
  umbrella: Umbrella,
  "muskoka-chair": MuskokaChair,
  canoe: Canoe,
  "chip-truck": ChipTruck,
  mast: Mast,
  "lifeguard-chair": LifeguardChair
};

/**
 * What an obstacle looks like: the furniture of a Barrie beach, each drawing fitted to the
 * rectangle the integrator collides against so what the room sees hit is what the shot hit.
 * Skin only — `kind` never reaches the physics, and a pack that names none gets an umbrella.
 */
export const Prop = ({ obstacle }: { obstacle: JoustObstacle }): JSX.Element => {
  const kind = obstacle.kind ?? DEFAULT_KIND;
  const Drawing = DRAWINGS[kind];

  return (
    <g data-joust-prop={kind}>
      <Drawing x={obstacle.x} y={obstacle.y} width={obstacle.width} height={obstacle.height} />
    </g>
  );
};
