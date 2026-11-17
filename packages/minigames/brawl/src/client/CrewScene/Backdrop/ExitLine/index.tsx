import { brawlNight } from "../../palette.js";
import { STREET_BANDS } from "../layout/index.js";

/** The dashes of the chalk line, back of the band to front. */
const DASHES = [0, 1, 2, 3, 4, 5, 6, 7];

/**
 * The way out: a chalk line across the whole band at `exitX`, the line any hen still up has to
 * reach once the last wave is down. Chevrons chalked on the ground before it point the way, on
 * three lines of the band so a hen at any depth has one under her.
 */
export const ExitLine = ({ x }: { x: number }): JSX.Element => {
  const { bandBackY, bandFrontY } = STREET_BANDS;
  const top = bandBackY - 3;
  const dash = (bandFrontY + 4 - top) / DASHES.length;

  return (
    <g data-brawl-exit={x} aria-hidden="true">
      {DASHES.map((index) => (
        <rect key={index} x={x - 0.8} y={top + index * dash} width={1.6} height={dash * 0.62} fill={brawlNight.chalk} />
      ))}
      {[bandBackY + 4, (bandBackY + bandFrontY) / 2, bandFrontY - 4].map((y) => (
        <path
          key={y}
          d={`M ${x - 15} ${y - 3} l 4 3 l -4 3 M ${x - 9} ${y - 3} l 4 3 l -4 3`}
          fill="none"
          stroke={brawlNight.chalk}
          strokeWidth={0.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.7}
        />
      ))}
    </g>
  );
};
