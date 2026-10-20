import type { OutfitItemProps } from "../../context/index.js";
import { SLUNG_GUITAR, SLUNG_NUT_BAR, SLUNG_PICKUP_BAR } from "../../paths/metalShow/index.js";
import * as styles from "./styles.js";

// flying-v b (metal Prop), ported from the harness's metal-show.js: variant
// a's slung Flying V, worn. An ember strap runs from the far prong up across
// the wing to the shoulder, just under the head box, and back down to the
// neck. The strap turns a white diagonal into a guitar someone is wearing;
// ember, not ink, because an ink line on the wing is lost among the wing's own
// feather lines. White or gold, never ink (strap outline and body fuse).
//
// The shapes are the harness's `guitarV({ ...SLUNG, strap })` written out; the
// strap is under the guitar.
const STRAP = "M 42.64 57.37 L 42 41.5 L 21.81 32.71";

export const FlyingVB = ({ context }: OutfitItemProps): JSX.Element => {
  const body = styles.styleFill[context.style ?? "white"];

  return (
    <g>
      <path className={styles.strapEdge} d={STRAP} />
      <path className={styles.strapBand} d={STRAP} />
      {SLUNG_GUITAR.map((d) => (
        <path key={`outline-${d}`} className={styles.mergedOutline} d={d} />
      ))}
      {SLUNG_GUITAR.map((d) => (
        <path key={`fill-${d}`} className={body} d={d} />
      ))}
      <path className={styles.inkFill} d={SLUNG_PICKUP_BAR} />
      <path className={styles.inkFill} d={SLUNG_NUT_BAR} />
    </g>
  );
};
