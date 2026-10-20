import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// suede-sleeve a (country Sleeve), ported from the harness's country-kit.js:
// the whole wing in ink, the strongest read in the render. Ink only (the
// white wing read as an egg).
export const SuedeSleeveA = ({ context }: OutfitItemProps): JSX.Element => {
  return (
    <g>
      <path className={`${styles.styleFill[context.style ?? "ink"]} ${styles.inkEdge}`} d={context.shapes.wing} />
    </g>
  );
};
