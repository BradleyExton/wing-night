import type { OutfitItemProps } from "../../context/index.js";
import { frontEdge } from "../../paths/countryKit/index.js";
import * as styles from "./styles.js";

// fringed-vest b (country Top), ported from the harness's country-kit.js: an
// ink vest, two fronts to y 47 with a straight orange gap between them. The
// fringe hangs only off the left (wing-side) front's hem, where it shows on
// the orange: four square strands, long at the ends and short in the middle
// (7/4/4/7), so it dips in a V and never repeats a's flat comb.
//
// The fronts start at `head.shoulders` and the right one runs down the body's
// front edge, so they are built here; the strands are the harness's `rect`s
// written out.
const STRANDS =
  "M 43.8 46.6 H 45.6 V 54 H 43.8 Z M 46.8 46.6 H 48.6 V 51 H 46.8 Z M 49 46.6 H 50.8 V 51 H 49 Z M 51.8 46.6 H 53.6 V 54 H 51.8 Z";

export const FringedVestB = ({ context }: OutfitItemProps): JSX.Element => {
  const s = context.head.shoulders;
  const left = `M 48.5 ${s} L 53.6 ${s} L 53.6 47 L 43.6 47 C 46.4 44.4 47.8 41 48.5 ${s} Z`;
  const right = `M 56 ${s} ${frontEdge(s, 47, 0.6)} L 56 47 Z`;

  return (
    <g>
      <path className={styles.styleFill[context.style ?? "ink"]} d={`${left} ${right} ${STRANDS}`} />
    </g>
  );
};
