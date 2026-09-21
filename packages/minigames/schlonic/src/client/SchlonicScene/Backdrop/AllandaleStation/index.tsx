import { schlonicPalette } from "../../palette.js";

/**
 * Allandale Station: the old brick stop on the water, gable and canopy, still standing at the
 * bottom of the hill it always stood at.
 */
export const AllandaleStation = ({ x, baseY }: { x: number; baseY: number }): JSX.Element => {
  const width = 25;
  const height = 8.5;

  return (
    <g data-schlonic-station>
      <rect x={x - 2} y={baseY - 0.6} width={width + 4} height={1.4} fill={schlonicPalette.dockDark} />
      <rect x={x} y={baseY - height} width={width} height={height} fill={schlonicPalette.brick} />
      <rect x={x} y={baseY - height} width={width} height={1} fill={schlonicPalette.brickDark} opacity={0.5} />
      {/* Hipped roof over the length, and the centre gable the platform side is known by. */}
      <path
        d={`M ${x - 2.2} ${baseY - height} L ${x + 4} ${baseY - height - 3.4} L ${x + width - 4} ${baseY - height - 3.4} L ${x + width + 2.2} ${baseY - height} Z`}
        fill={schlonicPalette.roof}
      />
      <path
        d={`M ${x + width / 2 - 4.4} ${baseY - height - 1.4} L ${x + width / 2} ${baseY - height - 5.6} L ${x + width / 2 + 4.4} ${baseY - height - 1.4} Z`}
        fill={schlonicPalette.roof}
      />
      <circle cx={x + width / 2} cy={baseY - height - 2.6} r={0.9} fill={schlonicPalette.townGlass} />
      {[3, 8, 13, 18].map((offset) => (
        <rect
          key={offset}
          x={x + offset}
          y={baseY - height + 2.4}
          width={2.6}
          height={4.4}
          rx={1.3}
          fill={schlonicPalette.townGlass}
          opacity={0.75}
        />
      ))}
      {/* The platform canopy, on its posts. */}
      <rect x={x - 3.4} y={baseY - 4.6} width={width + 7} height={0.9} fill={schlonicPalette.roof} />
      {[-2.4, width / 2, width + 2.4].map((offset) => (
        <rect key={offset} x={x + offset} y={baseY - 4.6} width={0.7} height={4} fill={schlonicPalette.roof} />
      ))}
    </g>
  );
};
