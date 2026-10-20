import type { OutfitItemProps } from "../../context/index.js";
import * as styles from "./styles.js";

// leather-sleeve a (metal Sleeve), ported from the harness's metal-kit.js:
// the whole wing in ink, mitered like the spiky body. Nothing else: on the
// chrome bird the value change is the item.
export const LeatherSleeveA = ({ context }: OutfitItemProps): JSX.Element => {
  return (
    <path
      className={`${styles.styleFill[context.style ?? "ink"]} ${styles.inkEdgeMitered}`}
      d={context.shapes.wing}
    />
  );
};
