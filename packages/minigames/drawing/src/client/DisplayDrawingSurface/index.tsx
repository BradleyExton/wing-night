import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";

import { displayDrawingSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

export const DisplayDrawingSurface = (
  _props: MinigameDisplayRendererProps
): JSX.Element => {
  return (
    <div className={styles.container}>
      <p className={styles.description}>{displayDrawingSurfaceCopy.description}</p>
      <div className={styles.card}>
        <p className={styles.metaLabel}>{displayDrawingSurfaceCopy.statusLabel}</p>
        <p className={styles.metaValue}>{displayDrawingSurfaceCopy.statusValue}</p>
      </div>
    </div>
  );
};
