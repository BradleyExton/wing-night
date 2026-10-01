import type { BrawlGoonPalette } from "../palette.js";
import { resolveHonkBeat, roundUnit } from "../rig/index.js";
import * as styles from "./styles.js";

/**
 * The telegraph, drawn: three throbbing lines fanning out of an open bill, and a "!" over the
 * goon's head — the beat the room reads and shouts "BEHIND YOU" at. The lines fan from
 * (`x`, `y`) along `degrees` (0 is straight ahead, negative is up), in the goon's own units;
 * `size` scales the whole honk, so the boss's is the same drawing, bigger. The "!" is drawn, not
 * lettered, so no copy reaches a scene primitive.
 */
export const Honk = ({
  x,
  y,
  degrees,
  size,
  bangX,
  bangY,
  tick,
  palette
}: {
  x: number;
  y: number;
  degrees: number;
  size: number;
  bangX: number;
  bangY: number;
  tick: number;
  palette: BrawlGoonPalette;
}): JSX.Element => {
  const reach = resolveHonkBeat(tick) === 0 ? 1 : 1.35;
  const lines = [-28, 0, 28].map((spread) => {
    const angle = ((degrees + spread) * Math.PI) / 180;
    const from = 0.6 * size;
    const to = (0.6 + 1.1 * reach) * size;

    return `M ${roundUnit(x + from * Math.cos(angle))} ${roundUnit(y + from * Math.sin(angle))} L ${roundUnit(
      x + to * Math.cos(angle)
    )} ${roundUnit(y + to * Math.sin(angle))}`;
  });

  return (
    <g data-brawl-goon-honk>
      <path className={`${palette.mark} ${styles.lines}`} d={lines.join(" ")} />
      <g transform={`translate(${roundUnit(bangX)} ${roundUnit(bangY)}) scale(${roundUnit(size)})`}>
        <path className={`${palette.chain} ${palette.stroke} ${styles.bang}`} d="M -0.45 -2.6 L 0.45 -2.6 L 0.25 -0.75 L -0.25 -0.75 Z" />
        <circle className={`${palette.chain} ${palette.stroke} ${styles.bang}`} cx={0} cy={-0.1} r={0.36} />
      </g>
    </g>
  );
};
