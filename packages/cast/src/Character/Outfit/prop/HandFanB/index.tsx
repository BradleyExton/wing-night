import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// hand-fan b (disco Prop), ported from the harness's disco-show.js: the
// black-lacquer folding fan, riveted at the wing tip and held up and
// fluttered across the back like a performer's, never pointed forward at the
// face. A solid leaf from radius 3 to 14 opened 140 degrees on the cyan wing
// and back, six pleat lines, a rim of seven rounded scallops standing 1.5
// proud, and two ink guard sticks along its edges running a unit past the rim.
// Solid, because a hollow leaf on bare sticks read as an eggshell with a
// toothed edge. The rivet sits 1.5 lower than Gate 1's so the scallops clear
// the head box at rest.
//
// The shapes are the harness's `fanLeaf(FAN)`, `fanPleats(FAN)` and its two
// guards, written out.
const LEAF =
  "M 23.68 48.47 L 13.34 44.71 A 2.58 2.58 0 0 1 15.78 40.5 A 2.58 2.58 0 0 1 19.5 37.38 A 2.58 2.58 0 0 1 24.07 35.71 A 2.58 2.58 0 0 1 28.93 35.71 A 2.58 2.58 0 0 1 33.5 37.38 A 2.58 2.58 0 0 1 37.22 40.5 A 2.58 2.58 0 0 1 39.66 44.71 L 29.32 48.47 A 3 3 0 0 0 23.68 48.47 Z";

const PLEATS =
  "M 22.67 46.29 L 17.31 41.79 M 24 45.17 L 20.5 39.11 M 25.63 44.58 L 24.42 37.68 M 27.37 44.58 L 28.58 37.68 M 29 45.17 L 32.5 39.11 M 30.33 46.29 L 35.69 41.79";

const GUARDS = "M 26.5 49.5 L 12.4 44.37 M 26.5 49.5 L 40.6 44.37";

export const HandFanB = ({ context }: OutfitItemProps): JSX.Element => {
  const style = context.style ?? "ink";

  return (
    <g>
      <path className={`${styles.styleFill[style]} ${styles.leafEdge}`} d={LEAF} />
      <path className={style === "ink" ? styles.pleatsOnInk : styles.pleatsOnLight} d={PLEATS} />
      <path className={styles.guards} d={GUARDS} />
    </g>
  );
};
