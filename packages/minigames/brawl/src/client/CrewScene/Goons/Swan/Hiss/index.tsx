import type { BrawlGoonPalette } from "../../palette.js";
import { resolveHonkBeat, roundUnit } from "../../rig/index.js";
import * as styles from "./styles.js";

/** How many waves each line of the hiss carries: a wriggle, not a honk's straight blast. */
const WAVES = 3;

/**
 * The swan's telegraph, drawn: a swan does not honk, it hisses. Three wriggling lines fan out of
 * the open bill from (`x`, `y`) along `degrees` (0 straight ahead, negative up), throbbing out on
 * the honk's own beat so the room reads the two the same way, and the "!" over the head is the
 * goon's, drawn not lettered. The root carries `data-brawl-goon-honk` like every telegraph, so
 * whatever counts honks counts this, and `data-brawl-goon-hiss` so a spec can tell them apart.
 */
export const Hiss = ({
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
  const reach = resolveHonkBeat(tick) === 0 ? 1 : 1.3;
  const amplitude = roundUnit(0.26 * size);
  const start = roundUnit(0.7 * size);
  const length = roundUnit((1.2 + 1.5 * reach) * size);
  const step = roundUnit(length / (WAVES * 2));
  const wriggle = ((): string => {
    const parts = [`M ${start} 0`];

    for (let index = 0; index < WAVES * 2; index += 1) {
      const from = start + step * index;
      const crest = index % 2 === 0 ? -amplitude : amplitude;

      parts.push(`Q ${roundUnit(from + step / 2)} ${crest} ${roundUnit(from + step)} 0`);
    }

    return parts.join(" ");
  })();

  return (
    <g data-brawl-goon-honk data-brawl-goon-hiss>
      {[-24, 0, 24].map((spread) => (
        <path
          key={spread}
          className={`${palette.mark} ${styles.lines}`}
          transform={`translate(${roundUnit(x)} ${roundUnit(y)}) rotate(${roundUnit(degrees + spread)})`}
          d={wriggle}
        />
      ))}
      <g transform={`translate(${roundUnit(bangX)} ${roundUnit(bangY)}) scale(${roundUnit(size)})`}>
        <path className={`${palette.chain} ${palette.stroke} ${styles.bang}`} d="M -0.45 -2.6 L 0.45 -2.6 L 0.25 -0.75 L -0.25 -0.75 Z" />
        <circle className={`${palette.chain} ${palette.stroke} ${styles.bang}`} cx={0} cy={-0.1} r={0.36} />
      </g>
    </g>
  );
};
