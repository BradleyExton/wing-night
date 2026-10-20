import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// feather-boa b (disco Tail), ported from the harness's disco-kit.js: flung.
// The boa caught on the high sickle's tip mid-twirl, its start hidden at the
// tip so only ONE free end shows, streaming straight back off the top of the
// tail in a wave, its tip flicking down: the diva's toss, background all
// round it. a sags across the tail and hangs; b flies out behind it.
//
// a's fluff (12.5 and 9.6, a dot every 5.5) on a slimmer rope (6.6 and 3.8).
const BOA = "M 17 1.5 C 15 -2.5 10 -1 8 3 C 6 7 3 8.5 0.5 11 C -2 13.5 -2 18 -0.5 23";

export const FeatherBoaB = ({ context }: OutfitItemProps): JSX.Element => {
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
