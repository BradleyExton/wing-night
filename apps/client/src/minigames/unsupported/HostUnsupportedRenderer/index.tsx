import { hostControlPanelCopy } from "../../../components/HostControlPanel/copy";
import type { HostTakeoverRendererProps } from "../../registry";
import * as styles from "./styles";

export const HostUnsupportedRenderer = ({
  minigameId,
  activeRoundTeamName
}: HostTakeoverRendererProps): JSX.Element => {
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>{hostControlPanelCopy.minigameSectionTitle}</h2>
      <p className={styles.description}>
        {hostControlPanelCopy.minigameUnsupportedLabel(minigameId)}
      </p>
      <p className={styles.description}>{hostControlPanelCopy.minigameUnsupportedDescription}</p>
      <div className={styles.contextCard}>
        <p className={styles.contextLabel}>{hostControlPanelCopy.activeRoundTeamTitle}</p>
        <p className={styles.contextValue}>{activeRoundTeamName}</p>
      </div>
    </div>
  );
};
