import * as styles from "./styles.js";

// chain-loop b (metal Tail), ported from the harness's metal-kit.js: a
// morning-star flail hanging off the spiky tail's middle blade on three
// links. Steel is the team's chrome with an ink edge, because an ink chain off
// the body vanishes on the dark TV; no link is a ring round a dark hole (a
// flat link carries only a slit), and the ball is ONE outline with six fat
// cones, so it reads as spiked steel and never as a sparkler.
//
// The ball is the harness's `spikeBall` written out (r 4.6, cones 4.2 proud at
// a 20° half-angle, one pointing straight back).
const SPIKE_BALL =
  "M 9.72 39.23 L 14.2 40.8 L 9.72 42.37 A 4.6 4.6 0 0 1 8.92 43.76 L 8.92 43.76 L 9.8 48.42 L 6.2 45.33 A 4.6 4.6 0 0 1 4.6 45.33 L 4.6 45.33 L 1 48.42 L 1.88 43.76 A 4.6 4.6 0 0 1 1.08 42.37 L 1.08 42.37 L -3.4 40.8 L 1.08 39.23 A 4.6 4.6 0 0 1 1.88 37.84 L 1.88 37.84 L 1 33.18 L 4.6 36.27 A 4.6 4.6 0 0 1 6.2 36.27 L 6.2 36.27 L 9.8 33.18 L 8.92 37.84 A 4.6 4.6 0 0 1 9.72 39.23 Z";

// A flat link: a long stadium with only a slit along it.
const FlatLink = ({ transform }: { transform: string }): JSX.Element => (
  <g transform={transform}>
    <rect className={styles.steel} x={-3.8} y={-1.7} width={7.6} height={3.4} rx={1.7} />
    <rect className={styles.inkFill} x={-1.9} y={-0.4} width={3.8} height={0.8} rx={0.4} />
  </g>
);

// Its one style is `team`, so the drawing reads nothing from its context.
export const ChainLoopB = (): JSX.Element => {
  return (
    <g>
      <rect
        className={styles.steel}
        transform="translate(5.8 32) rotate(105)"
        x={-3}
        y={-0.9}
        width={6}
        height={1.8}
        rx={0.9}
      />
      <FlatLink transform="translate(6.6 28.6) rotate(105)" />
      <FlatLink transform="translate(5.2 35.6) rotate(105)" />
      <path className={styles.spikedSteel} d={SPIKE_BALL} />
    </g>
  );
};
