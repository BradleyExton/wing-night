import type { MinigameHostRendererProps } from "@wingnight/minigames-core";

import { hostGeoSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

const NO_ASSIGNED_TEAM_LABEL = "No assigned team";

export const HostGeoSurface = ({
  activeTeamName,
  minigameHostView,
  teamNameByTeamId
}: MinigameHostRendererProps): JSX.Element => {
  const resolvedTeamName =
    minigameHostView?.activeTurnTeamId === null || minigameHostView?.activeTurnTeamId === undefined
      ? (activeTeamName ?? NO_ASSIGNED_TEAM_LABEL)
      : (teamNameByTeamId.get(minigameHostView.activeTurnTeamId) ?? NO_ASSIGNED_TEAM_LABEL);

  return (
    <div className={styles.container}>
      <p className={styles.description}>{hostGeoSurfaceCopy.description}</p>
      <div className={styles.card}>
        <p className={styles.metaLabel}>{hostGeoSurfaceCopy.statusLabel}</p>
        <p className={styles.metaValue}>{hostGeoSurfaceCopy.statusValue}</p>
      </div>
      <div className={styles.card}>
        <p className={styles.metaLabel}>Turn</p>
        <p className={styles.metaValue}>{hostGeoSurfaceCopy.activeTeamLabel(resolvedTeamName)}</p>
      </div>
    </div>
  );
};
