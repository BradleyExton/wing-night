import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// leather-sleeve b (metal Sleeve), ported from the harness's metal-kit.js: the
// batwing. The ink sleeve's trailing feathers become three long points with
// deep arches between them (apex near y 44), so the chrome body shows through
// each arch; every point ends ON the body, where ink reads, and the arch
// controls lean back so the points rake like a bat's finger tips. The stock
// wing is painted out in the body colour first so the arches show the body.
const BATWING =
  "M 47 35 C 38 29 24 33 20 44 C 19.4 48 19.8 53 21 57.4 C 23.6 39.5 29.4 41 30.6 59.4 C 32.8 39.5 38.6 41 39.8 58.6 C 40.6 52 42.4 50.4 45 51 C 49 46 51 40 47 35 Z";

export const LeatherSleeveB = ({ context }: OutfitItemProps): JSX.Element => {
  return (
    <g>
      <path className={styles.eraseWing} d={context.shapes.wing} />
      <path className={`${styles.styleFill[context.style ?? "ink"]} ${styles.inkEdgeMitered}`} d={BATWING} />
    </g>
  );
};
