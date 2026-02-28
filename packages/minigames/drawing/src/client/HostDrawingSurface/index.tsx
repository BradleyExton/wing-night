import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import { resolveUnsupportedActiveTeamName } from "@wingnight/minigames-core";

import { hostDrawingSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

const NO_ASSIGNED_TEAM_LABEL = "No assigned team";

export const HostDrawingSurface = ({
  activeTeamName,
  minigameHostView,
  teamNameByTeamId
}: MinigameHostRendererProps): JSX.Element => {
  const resolvedTeamName = resolveUnsupportedActiveTeamName({
    activeTeamName,
    minigameHostView,
    teamNameByTeamId,
    fallbackLabel: NO_ASSIGNED_TEAM_LABEL
  });

  return (
    <div className={styles.container}>
      <p className={styles.description}>{hostDrawingSurfaceCopy.description}</p>
      <div className={styles.card}>
        <p className={styles.metaLabel}>{hostDrawingSurfaceCopy.statusLabel}</p>
        <p className={styles.metaValue}>{hostDrawingSurfaceCopy.statusValue}</p>
      </div>
      <div className={styles.card}>
        <p className={styles.metaLabel}>Turn</p>
        <p className={styles.metaValue}>
          {hostDrawingSurfaceCopy.activeTeamLabel(resolvedTeamName)}
        </p>
      </div>
    </div>
  );
};
