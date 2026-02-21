import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";

import { displayGeoSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

export const DisplayGeoSurface = (_props: MinigameDisplayRendererProps): JSX.Element => {
  return (
    <div className={styles.container}>
      <p className={styles.description}>{displayGeoSurfaceCopy.description}</p>
      <div className={styles.card}>
        <p className={styles.metaLabel}>{displayGeoSurfaceCopy.statusLabel}</p>
        <p className={styles.metaValue}>{displayGeoSurfaceCopy.statusValue}</p>
      </div>
    </div>
  );
};
