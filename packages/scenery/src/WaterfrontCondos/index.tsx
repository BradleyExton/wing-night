/**
 * The cream of the towers, their shadow side, the blue glass of the balcony stacks, and the
 * podium roofs. The towers are their own slots rather than the town's `wall`: they are the one
 * cream thing on a skyline of hazed slabs, and that cream is half of how the room knows them.
 */
export type WaterfrontCondosPalette = {
  tower: string;
  towerDark: string;
  towerGlass: string;
  roof: string;
};

const PODIUM_TOP = 4.6;
const FLOORS = 15;

type TowerShape = { left: number; front: number; side: number; top: number };

/** The left tower, set back and a little shorter; the right one, standing forward and taller. */
const TOWERS: readonly TowerShape[] = [
  { left: 2, front: 9.6, side: 3.2, top: 34.2 },
  { left: 18.4, front: 10.2, side: 3.6, top: 37.4 }
];

/** One tower: the cream face and its shadow side, the glass stacks, the slabs, the stepped crown. */
const Tower = ({ tower, palette }: { tower: TowerShape; palette: WaterfrontCondosPalette }): JSX.Element => {
  const { left, front, side, top } = tower;
  const corner = left + front;
  const floorHeight = (top - PODIUM_TOP) / FLOORS;
  const stacks = [
    { x: left, width: 3 },
    { x: left + front / 2 - 0.55, width: 1.1 },
    { x: corner - 2.4, width: 3.9 }
  ];

  return (
    <g>
      <rect x={left} y={-top} width={front} height={top - PODIUM_TOP} fill={palette.tower} />
      <rect x={corner} y={-top} width={side} height={top - PODIUM_TOP} fill={palette.towerDark} />
      {stacks.map((stack) => (
        <rect key={stack.x} x={stack.x} y={-top + 1} width={stack.width} height={top - PODIUM_TOP - 1} fill={palette.towerGlass} />
      ))}
      {/* A balcony slab across every stack on every floor, so the glass reads as balconies, not a stripe. */}
      <g fill={palette.tower}>
        {Array.from({ length: FLOORS }, (_unused, floor) =>
          stacks.map((stack) => (
            <rect
              key={`${floor}-${stack.x}`}
              x={stack.x - 0.15}
              y={-top + 1 + (floor + 0.7) * floorHeight}
              width={stack.width + 0.3}
              height={0.3}
            />
          ))
        )}
      </g>
      {/* The crown: a cornice band, then the penthouse stepped in from it. */}
      <rect x={left - 0.3} y={-top - 0.3} width={front + side + 0.6} height={1.3} fill={palette.tower} />
      <rect x={left + 1.4} y={-top - 2.4} width={front - 1.6} height={2.1} fill={palette.tower} />
      <rect x={corner - 0.2} y={-top - 2.4} width={side - 1} height={2.1} fill={palette.towerDark} />
      <rect x={left + 3} y={-top - 3.4} width={3.4} height={1} fill={palette.roof} />
    </g>
  );
};

/**
 * The twin towers on the waterfront at the foot of Bayfield: traced off an aerial photograph
 * looking north up the bay (waterfront-condos). Two cream slabs of about fifteen storeys, each
 * roughly three times as tall as it is wide, standing side by side on a low podium that steps
 * down once toward the lake, the left one a storey or two shorter. Every corner is a stack of
 * blue-glass balconies running the full height, which is what the room knows them by from across
 * the bay — cream towers with blue edges — and each is crowned by a stepped penthouse box.
 *
 * Built to be stood small (the town bank, a dusk skyline, a corridor's far wall), so it is a
 * handful of solid slabs: the front face, a narrower shadow side, a glass stack down each
 * corner and one down the middle, and the balcony slabs across the stacks as cream bands. Left
 * out on purpose: every window in the cream (the middle strip stands for all of them), the
 * lobby's pavilion roof between the towers, the podium's own windows and terraces, the
 * rooftop plant, and the perspective the photograph is taken in — this is an elevation.
 *
 * `scale` sizes it: at 1 it is 40 wide and 40.8 tall, in the caller's world units.
 */
export const WaterfrontCondos = ({
  x,
  baseY,
  palette,
  scale = 1
}: {
  x: number;
  baseY: number;
  palette: WaterfrontCondosPalette;
  scale?: number;
}): JSX.Element => (
  <g data-scenery-condos transform={`translate(${x} ${baseY}) scale(${scale})`}>
    {/* The podium, stepping down once toward the water. */}
    <rect x={0} y={-PODIUM_TOP} width={34} height={PODIUM_TOP} fill={palette.towerDark} />
    <rect x={-0.3} y={-PODIUM_TOP - 0.6} width={34.6} height={0.8} fill={palette.roof} />
    <rect x={33} y={-2.8} width={7} height={2.8} fill={palette.towerDark} />
    <rect x={33} y={-3.3} width={7.2} height={0.7} fill={palette.roof} />
    {TOWERS.map((tower) => (
      <Tower key={tower.left} tower={tower} palette={palette} />
    ))}
  </g>
);
