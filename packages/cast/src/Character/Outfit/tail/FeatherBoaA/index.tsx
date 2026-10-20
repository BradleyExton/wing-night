import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// feather-boa a (disco Tail), ported from the harness's disco-kit.js: slung.
// One fat boa comes out from behind the bird's back (its end tucked behind
// the body, so no knob there), sags in a swag back to the low sickle, curves
// over it and falls down the outside as ONE long loose end, like a scarf
// thrown over a shoulder. Never a loop or a round end-tuft (two tufts are
// eyes).
//
// The harness's `boaStroke`: a cased rope (7 in ink, 4.4 in colour) whose edge
// is lumped by a much wider dotted stroke (12.5 and 9.6, a round dot every
// 5.5), so the edge scallops into fluff at 76px.
const BOA = "M 33.5 31 C 26 34 15 31 10 16 C 4 20 1 30 3.5 42";

export const FeatherBoaA = ({ context }: OutfitItemProps): JSX.Element => {
  const colour = styles.styleStroke[context.style ?? "white"];

  return (
    <g>
      <path className={styles.ropeCasing} d={BOA} />
      <path className={styles.fluffCasing} d={BOA} />
      <path className={`${colour} ${styles.rope}`} d={BOA} />
      <path className={`${colour} ${styles.fluff}`} d={BOA} />
    </g>
  );
};
