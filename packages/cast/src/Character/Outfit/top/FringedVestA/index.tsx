import type { OutfitItemProps } from "../../context/index.js";
import { frontEdge } from "../../paths/countryKit/index.js";
import * as styles from "./styles.js";

// fringed-vest a (country Top), ported from the harness's country-kit.js: an
// ink vest, two fronts with an orange gap between them, open all the way from
// the neck and widening to the hem at y 49. Square-ended fringe strands with
// gaps hang off each front's hem, never across the gap (a row of pointed
// tongues reads as teeth at 76px).
//
// The fronts start at `head.shoulders` and the right one runs down the body's
// front edge, so they are built here; the strands are the harness's `rect`s
// written out.
const STRANDS =
  "M 41.9 48.6 H 43.3 V 54 H 41.9 Z M 44.5 48.6 H 45.9 V 54 H 44.5 Z M 47.1 48.6 H 48.5 V 54 H 47.1 Z M 49.7 48.6 H 51.1 V 54 H 49.7 Z M 52.3 48.6 H 53.7 V 54 H 52.3 Z M 60.1 48.6 H 61.5 V 54 H 60.1 Z M 62.7 48.6 H 64.1 V 54 H 62.7 Z M 65.3 48.6 H 66.7 V 54 H 65.3 Z";

export const FringedVestA = ({ context }: OutfitItemProps): JSX.Element => {
  const s = context.head.shoulders;
  const left = `M 48.5 ${s} L 56.2 ${s} L 54.5 49 L 42 49 C 45.5 46 47.8 42 48.5 ${s} Z`;
  const right = `M 57.8 ${s} ${frontEdge(s, 49)} L 59.5 49 Z`;

  return (
    <g>
      <path className={styles.styleFill[context.style ?? "ink"]} d={`${left} ${right} ${STRANDS}`} />
    </g>
  );
};
