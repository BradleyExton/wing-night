import type { BrawlGoonPalette } from "../palette.js";
import { resolveStarOrbit, roundUnit } from "../rig/index.js";
import * as styles from "./styles.js";

// A five-pointed star of radius one about the origin, point up, worked out once.
const STAR_PATH = ((): string => {
  const points = Array.from({ length: 10 }, (_, index) => {
    const radius = index % 2 === 0 ? 1 : 0.45;
    const angle = (Math.PI * index) / 5 - Math.PI / 2;

    return `${roundUnit(radius * Math.cos(angle))} ${roundUnit(radius * Math.sin(angle))}`;
  });

  return `M ${points.join(" L ")} Z`;
})();

/**
 * The cartoon daze: gold stars orbiting a goon's head, in the goon's own drawing units. A stunned
 * goon sees three, a KO'd one sees four on a wider ring; the orbit turns with the sim's tick so
 * the tablet and the TV see the same stars in the same places.
 */
export const Stars = ({
  cx,
  cy,
  rx,
  ry,
  count,
  size,
  tick,
  palette
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  count: number;
  size: number;
  tick: number;
  palette: BrawlGoonPalette;
}): JSX.Element => (
  <g data-brawl-goon-stars>
    {resolveStarOrbit({ cx, cy, rx, ry, count, tick }).map((star, index) => (
      <path
        key={index}
        className={`${palette.stars} ${palette.stroke} ${styles.star}`}
        transform={`translate(${star.x} ${star.y}) scale(${roundUnit(size * star.scale)})`}
        d={STAR_PATH}
      />
    ))}
  </g>
);
