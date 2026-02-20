import type { MinigameDisplayRendererProps } from "../../types";
import { displayGeoSurfaceCopy } from "./copy";
import * as styles from "./styles";

export const DisplayGeoSurface = ({
  phase
}: MinigameDisplayRendererProps): JSX.Element => {
  return (
    <div className={styles.container}>
      <p className={styles.description}>
        {phase === "play"
          ? displayGeoSurfaceCopy.playDescription
          : displayGeoSurfaceCopy.introDescription}
      </p>
      <div className={styles.meta}>
        <p className={styles.metaLabel}>{displayGeoSurfaceCopy.statusLabel}</p>
        <p className={styles.metaValue}>{displayGeoSurfaceCopy.statusValue}</p>
      </div>
    </div>
  );
};
