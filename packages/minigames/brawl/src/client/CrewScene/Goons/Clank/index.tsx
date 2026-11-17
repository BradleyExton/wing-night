import type { BrawlGoonPalette } from "../palette.js";
import { resolveDrawTick, roundUnit } from "../rig/index.js";
import * as styles from "./styles.js";

/** How long a clank is on screen, in ticks: a fifth of a second, gone before the next peck lands. */
export const CLANK_TICKS = 12;

/** The four strokes fly out at these angles, degrees clockwise from straight ahead: up and both ways, since the beak can come from either side. */
const STROKE_DEGREES = [-150, -105, -75, -30];

// The jag: an uneven eight-point burst of radius one about the origin — comic-book "CLANK", drawn
// not lettered — worked out once. The alternating spikes are different lengths so it reads as a
// bang and not as a star, which already means "dazed" on this street.
const JAG_PATH = ((): string => {
  const spikes = [1, 0.42, 0.78, 0.38, 1, 0.4, 0.72, 0.44];
  const points = spikes.map((radius, index) => {
    const angle = (Math.PI * index) / 4 - Math.PI / 2 + 0.18;

    return `${roundUnit(radius * Math.cos(angle))} ${roundUnit(radius * Math.sin(angle))}`;
  });

  return `M ${points.join(" L ")} Z`;
})();

/**
 * A peck that bounced off the helmet, drawn: a burst of four short strokes flying off the point
 * of contact (`x`, `y`, in the scene's own units — the wirer hands it the beak's tip) and a small
 * jag of gold behind them, the whole thing growing and fading over `CLANK_TICKS`. `tick` is the
 * ticks SINCE the clank, not the sim's clock: the sim records the bounce's tick and the frame
 * hands in the difference, so the tablet and the TV draw the same spark at the same size. Past
 * `CLANK_TICKS` it draws nothing, and it never takes the pointer.
 */
export const Clank = ({ x, y, tick, palette }: { x: number; y: number; tick: number; palette: BrawlGoonPalette }): JSX.Element | null => {
  const age = resolveDrawTick(tick);

  if (age >= CLANK_TICKS) {
    return null;
  }

  const share = age / CLANK_TICKS;
  const reach = 1.5 + share * 2.2;
  const fade = roundUnit(1 - share * share);
  const cx = Number.isFinite(x) ? roundUnit(x) : 0;
  const cy = Number.isFinite(y) ? roundUnit(y) : 0;
  const strokes = STROKE_DEGREES.map((degrees) => {
    const angle = (degrees * Math.PI) / 180;
    const from = 0.9 * reach;
    const to = (0.9 + 1.1) * reach;

    return `M ${roundUnit(cx + from * Math.cos(angle))} ${roundUnit(cy + from * Math.sin(angle))} L ${roundUnit(cx + to * Math.cos(angle))} ${roundUnit(
      cy + to * Math.sin(angle)
    )}`;
  });

  return (
    <g data-brawl-goon-clank opacity={fade}>
      <path
        className={`${palette.stars} ${palette.stroke} ${styles.jag}`}
        transform={`translate(${cx} ${cy}) scale(${roundUnit(1.4 + share * 0.8)})`}
        d={JAG_PATH}
      />
      <path className={`${palette.mark} ${styles.strokes}`} d={strokes.join(" ")} />
    </g>
  );
};
