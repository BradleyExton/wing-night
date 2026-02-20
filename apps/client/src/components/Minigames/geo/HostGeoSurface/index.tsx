import { hostControlPanelCopy } from "../../../HostControlPanel/copy";
import type { MinigameHostRendererProps } from "../../types";
import { hostGeoSurfaceCopy } from "./copy";
import * as styles from "./styles";

const resolveActiveTeamName = ({
  minigameHostView,
  teamNameByTeamId,
  activeTeamName
}: Pick<
  MinigameHostRendererProps,
  "minigameHostView" | "teamNameByTeamId" | "activeTeamName"
>): string => {
  if (minigameHostView?.activeTurnTeamId) {
    return (
      teamNameByTeamId.get(minigameHostView.activeTurnTeamId) ??
      hostControlPanelCopy.noAssignedTeamLabel
    );
  }

  return activeTeamName ?? hostControlPanelCopy.noAssignedTeamLabel;
};

export const HostGeoSurface = ({
  phase,
  minigameHostView,
  activeTeamName,
  teamNameByTeamId
}: MinigameHostRendererProps): JSX.Element => {
  const resolvedActiveTeamName = resolveActiveTeamName({
    minigameHostView,
    teamNameByTeamId,
    activeTeamName
  });

  return (
    <div className={styles.container}>
      <div>
        <p className={styles.description}>
          {phase === "play"
            ? hostGeoSurfaceCopy.playDescription
            : hostGeoSurfaceCopy.introDescription}
        </p>
        <div className={styles.meta}>
          <div className={styles.metaBlock}>
            <p className={styles.metaLabel}>{hostControlPanelCopy.activeRoundTeamTitle}</p>
            <p className={styles.metaValue}>
              {hostGeoSurfaceCopy.activeTeamLabel(resolvedActiveTeamName)}
            </p>
          </div>
          <div className={styles.metaBlock}>
            <p className={styles.metaLabel}>{hostGeoSurfaceCopy.statusLabel}</p>
            <p className={styles.metaValue}>{hostGeoSurfaceCopy.statusValue}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
