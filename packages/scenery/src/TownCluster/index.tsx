/** The walls, the shadow side of each slab, and the glass the lit floors are painted in. */
export type TownClusterPalette = {
  wall: string;
  wallDark: string;
  glass: string;
};

/** A slab of windows, cheap: two columns of lit floors rather than a grid of rectangles. */
const TowerWindows = ({
  x,
  y,
  width,
  height,
  glass
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  glass: string;
}): JSX.Element => (
  <g fill={glass} opacity={0.5}>
    {Array.from({ length: Math.max(1, Math.floor(height / 3)) }, (_unused, floor) => (
      <rect key={floor} x={x + 0.8} y={y + 1.6 + floor * 3} width={width - 1.6} height={1.2} />
    ))}
  </g>
);

/**
 * Downtown across the west end of the bay: the waterfront slabs, the stepped block of City Hall
 * and a spire behind them. Hazed to one colour, because it is a skyline, not a level.
 */
export const TownCluster = ({
  x,
  baseY,
  palette
}: {
  x: number;
  baseY: number;
  palette: TownClusterPalette;
}): JSX.Element => {
  const towers = [
    { offset: 0, width: 5, height: 15 },
    { offset: 6.5, width: 4.5, height: 21 },
    { offset: 12, width: 6, height: 12 }
  ];

  return (
    <g data-scenery-town>
      {/* A church spire, furthest back and palest. */}
      <g fill={palette.wall} opacity={0.55}>
        <rect x={x + 33} y={baseY - 11} width={3.4} height={11} />
        <path d={`M ${x + 32.2} ${baseY - 11} L ${x + 34.7} ${baseY - 19} L ${x + 37.2} ${baseY - 11} Z`} />
      </g>
      {towers.map((tower) => (
        <g key={tower.offset}>
          <rect
            x={x + tower.offset}
            y={baseY - tower.height}
            width={tower.width}
            height={tower.height}
            fill={palette.wall}
          />
          <rect
            x={x + tower.offset}
            y={baseY - tower.height}
            width={1.2}
            height={tower.height}
            fill={palette.wallDark}
            opacity={0.6}
          />
          <TowerWindows
            x={x + tower.offset}
            y={baseY - tower.height}
            width={tower.width}
            height={tower.height}
            glass={palette.glass}
          />
        </g>
      ))}
      {/* City Hall: a long block that steps up once, which is how the room knows it from a condo. */}
      <g>
        <rect x={x + 19} y={baseY - 7} width={13} height={7} fill={palette.wall} />
        <rect x={x + 19} y={baseY - 11.5} width={5.5} height={4.5} fill={palette.wall} />
        <rect x={x + 19} y={baseY - 11.5} width={5.5} height={1} fill={palette.wallDark} />
        <TowerWindows x={x + 19} y={baseY - 7} width={13} height={7} glass={palette.glass} />
      </g>
    </g>
  );
};
