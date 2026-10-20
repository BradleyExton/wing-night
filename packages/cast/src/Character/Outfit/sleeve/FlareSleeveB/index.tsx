import type { OutfitItemProps } from "../../context/index.js";
import { BELL, BELL_CUFF, BELL_HEM } from "../../paths/discoKit/index.js";
import * as styles from "./styles.js";

// flare-sleeve b (disco Sleeve), ported from the harness's disco-kit.js: the
// white trumpet. A white bell flares back out of the wing along its axis, past
// the back tip, with an ink hem line inside its mouth. Only a silhouette
// change says bell (a value change inside the outline reads as plumage), and
// the bell is light because it flares out over the dark floor. In the team
// style the sleeve melts into the body, so an ink cuff band along the bell's
// joint keeps the bell a bell and not a paper cup.
export const FlareSleeveB = ({ context }: OutfitItemProps): JSX.Element => {
  const style = context.style ?? "ink";

  return (
    <g>
      <path className={`${styles.styleFill[style]} ${styles.inkEdge}`} d={context.shapes.wing} />
      <path className={`${styles.whiteFill} ${styles.inkEdge}`} d={BELL} />
      {style === "team" ? <path className={styles.cuff} d={BELL_CUFF} /> : null}
      <path className={styles.hem} d={BELL_HEM} />
    </g>
  );
};
