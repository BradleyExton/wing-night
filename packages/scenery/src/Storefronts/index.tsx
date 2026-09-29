/**
 * The two brick colours a Dunlop Street front comes in (red and buff) with a shadow of each, the
 * white of the sills, the window glass, and the two colours an awning comes in.
 */
export type StorefrontsPalette = {
  brick: string;
  brickDark: string;
  buff: string;
  buffDark: string;
  trim: string;
  pane: string;
  awning: string;
  cornice: string;
};

/**
 * A run of downtown Dunlop Street: the two- and three-storey brick fronts the landmarks stand
 * between. Not traced off one building but off the street the photographs of the Queen's and
 * Souldiers were taken on — red or buff brick, a shop window and a door at the pavement under
 * an awning, two or three windows to a floor above, and a parapet that is different on every
 * front: a flat cornice, a raised centre, a pediment, or an arch. That variety along one
 * roofline is what says "main street" rather than "terrace".
 *
 * Solid shapes and nothing finer: no shop signs (a sign would say which shop, and these are
 * nobody), no glazing bars, no brick coursing, no fire escapes or rooftop units.
 *
 * `seed` picks every front's storeys, brick, parapet, windows and awning, deterministically, so
 * the tablet and the TV lay the same street and two runs of it side by side differ. Each front
 * is `frontWidth` wide; `count` of them stand left to right from `x`.
 */
export const STOREFRONTS = {
  frontWidth: 11,
  /** The tallest a front gets, pediment and all, at `scale` 1. */
  maxHeight: 18.6
} as const;

const GROUND = 6.4;
const STOREY = 4.8;

type Parapet = "flat" | "stepped" | "pediment" | "arched";
const PARAPETS: readonly Parapet[] = ["flat", "stepped", "pediment", "arched"];

/** A fixed hash of (seed, front, salt) into [0, 1): no Math.random, so every screen agrees. */
const roll = (seed: number, front: number, salt: number): number => {
  let hash = Math.imul(seed + 1, 73856093) ^ Math.imul(front + 1, 19349663) ^ Math.imul(salt + 1, 83492791);
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
};

type FrontShape = {
  storeys: number;
  buff: boolean;
  parapet: Parapet;
  windows: number;
  arched: boolean;
  awning: "awning" | "cornice" | null;
  striped: boolean;
  doorLeft: boolean;
};

/** Everything that varies about one front, rolled once from the seed. */
const resolveStorefront = (seed: number, front: number): FrontShape => ({
  storeys: roll(seed, front, 0) < 0.5 ? 2 : 3,
  buff: roll(seed, front, 1) < 0.45,
  parapet: PARAPETS[Math.floor(roll(seed, front, 2) * PARAPETS.length)] ?? "flat",
  windows: roll(seed, front, 3) < 0.5 ? 2 : 3,
  arched: roll(seed, front, 4) < 0.35,
  awning: roll(seed, front, 7) < 0.85 ? (roll(seed, front, 5) < 0.5 ? "awning" : "cornice") : null,
  striped: roll(seed, front, 6) < 0.4,
  doorLeft: roll(seed, front, 8) < 0.5
});

const Front = ({ left, shape, palette }: { left: number; shape: FrontShape; palette: StorefrontsPalette }): JSX.Element => {
  const width = STOREFRONTS.frontWidth;
  const height = GROUND + (shape.storeys - 1) * STOREY;
  const face = shape.buff ? palette.buff : palette.brick;
  const shade = shape.buff ? palette.buffDark : palette.brickDark;
  const windowWidth = shape.windows === 2 ? 2.6 : 2;
  const windowXs = shape.windows === 2 ? [3.3, 7.7] : [2.3, 5.5, 8.7];
  const shopX = shape.doorLeft ? left + 3.6 : left + 1;
  const doorX = shape.doorLeft ? left + 1 : left + 8;
  const awningFill = shape.awning === "awning" ? palette.awning : palette.cornice;
  const top = -height;

  return (
    <g>
      <rect x={left} y={top} width={width} height={height} fill={face} />
      <rect x={left} y={top} width={0.5} height={height} fill={shade} opacity={0.8} />
      {/* The parapet: the one thing no two neighbours agree on. */}
      {shape.parapet === "stepped" && <rect x={left + 3} y={top - 2.2} width={5} height={2.2} fill={face} />}
      {shape.parapet === "pediment" && (
        <path d={`M ${left + 1} ${top} L ${left + width / 2} ${top - 2.6} L ${left + width - 1} ${top} Z`} fill={face} />
      )}
      {shape.parapet === "arched" && (
        <path d={`M ${left + 1.4} ${top} Q ${left + width / 2} ${top - 3.4} ${left + width - 1.4} ${top} Z`} fill={face} />
      )}
      <rect x={left - 0.3} y={top - 0.4} width={width + 0.6} height={0.9} fill={shade} />
      {shape.parapet === "stepped" && <rect x={left + 2.7} y={top - 2.6} width={5.6} height={0.8} fill={shade} />}
      {/* The floors above the shop. */}
      {Array.from({ length: shape.storeys - 1 }, (_unused, floor) => {
        const windowTop = -GROUND - (floor + 1) * STOREY + 1.1;

        return windowXs.map((cx) => (
          <g key={`${floor}-${cx}`}>
            {shape.arched ? (
              <path
                d={`M ${left + cx - windowWidth / 2} ${windowTop + 3} L ${left + cx - windowWidth / 2} ${windowTop + 0.8} Q ${left + cx} ${windowTop - 0.6} ${left + cx + windowWidth / 2} ${windowTop + 0.8} L ${left + cx + windowWidth / 2} ${windowTop + 3} Z`}
                fill={palette.pane}
              />
            ) : (
              <>
                <rect x={left + cx - windowWidth / 2 - 0.2} y={windowTop - 0.5} width={windowWidth + 0.4} height={0.5} fill={shade} />
                <rect x={left + cx - windowWidth / 2} y={windowTop} width={windowWidth} height={3} fill={palette.pane} />
              </>
            )}
            <rect x={left + cx - windowWidth / 2 - 0.2} y={windowTop + 3} width={windowWidth + 0.4} height={0.4} fill={palette.trim} />
          </g>
        ));
      })}
      {/* The shop: a sign band, the window on its sill, the door, and the awning over them. */}
      <rect x={left + 0.5} y={-GROUND} width={width - 0.5} height={0.8} fill={shade} />
      <rect x={shopX} y={-5} width={6.4} height={3.9} fill={palette.pane} />
      <rect x={shopX - 0.2} y={-1.1} width={6.8} height={0.5} fill={palette.trim} />
      <rect x={doorX} y={-4.8} width={2} height={4.8} fill={palette.pane} />
      {shape.awning && (
        <g>
          <path d={`M ${left + 0.8} -5.6 L ${left + width - 0.8} -5.6 L ${left + width - 0.3} -3.8 L ${left + 0.3} -3.8 Z`} fill={awningFill} />
          {shape.striped && (
            <g fill={palette.trim}>
              {[1.9, 3.9, 5.9, 7.9].map((offset) => (
                <rect key={offset} x={left + offset} y={-5.6} width={1} height={1.8} />
              ))}
            </g>
          )}
          <rect x={left + 0.3} y={-3.8} width={width - 0.6} height={0.5} fill={awningFill} />
        </g>
      )}
    </g>
  );
};

export const Storefronts = ({
  x,
  baseY,
  palette,
  seed = 0,
  count = 3,
  scale = 1
}: {
  x: number;
  baseY: number;
  palette: StorefrontsPalette;
  seed?: number;
  count?: number;
  scale?: number;
}): JSX.Element => (
  <g data-scenery-storefronts transform={`translate(${x} ${baseY}) scale(${scale})`}>
    {Array.from({ length: count }, (_unused, front) => (
      <Front key={front} left={front * STOREFRONTS.frontWidth} shape={resolveStorefront(seed, front)} palette={palette} />
    ))}
  </g>
);
