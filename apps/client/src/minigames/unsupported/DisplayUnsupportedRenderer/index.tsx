import { displayBoardCopy } from "../../../components/DisplayBoard/copy";
import type { DisplayTakeoverRendererProps } from "../../registry";
import * as styles from "./styles";

export const DisplayUnsupportedRenderer = ({
  phaseLabel,
  minigameId,
  activeTeamName
}: DisplayTakeoverRendererProps): JSX.Element => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.phaseBadge}>{phaseLabel}</p>
        <h1 className={styles.heading}>{displayBoardCopy.minigameSectionTitle}</h1>
      </header>

      <section className={styles.body}>
        <p className={styles.description}>
          {displayBoardCopy.minigameUnsupportedLabel(minigameId)}
        </p>
        <p className={styles.description}>
          {displayBoardCopy.minigameUnsupportedDescription}
        </p>
        {activeTeamName !== null && (
          <div className={styles.contextCard}>
            <p className={styles.contextLabel}>{displayBoardCopy.activeTeamLabel}</p>
            <p className={styles.contextValue}>
              {displayBoardCopy.activeTeamValue(activeTeamName)}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
