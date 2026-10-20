import type { OutfitItemProps } from "../../context/index.js";
import { PUNCHED_POM, PUNCHED_POM_STICK } from "../../paths/popShow/index.js";
import * as styles from "./styles.js";

// pom-pom b (pop Prop), ported from the harness's pop-show.js: Sporty's cheer
// pom punched out front at breast height on its ink stick, half on the dark
// page in front of the breast, its top at y 41 (below the face line). A big
// fluffy white cloud of thirteen deep lobes, never a ring and never a dark
// centre. Its only style is white (pink on the pink body is 1.00:1).
export const PomPomB = ({ context }: OutfitItemProps): JSX.Element => {
  const body = styles.styleFill[context.style ?? "white"];

  return (
    <g>
      <path className={styles.stick} d={PUNCHED_POM_STICK} />
      <path className={`${body} ${styles.pomEdge}`} d={PUNCHED_POM} />
    </g>
  );
};
