import { commonCopy } from "../../../../copy/common";
import { displayBoardCopy } from "../../copy";
import * as styles from "./styles";

type StageContextHeaderProps = {
  roundMetaLabel: string;
  phaseLabel: string;
  activeTeamName: string | null;
};

export const StageContextHeader = ({
  roundMetaLabel,
  phaseLabel,
  activeTeamName
}: StageContextHeaderProps): JSX.Element => {
  return (
    <div className={styles.root}>
      <div className={styles.brandCluster}>
        <img
          className={styles.brandMark}
          src={commonCopy.brandMarkPath}
          alt={commonCopy.brandMarkAlt}
        />
      </div>
      <div className={styles.contextPillRow}>
        <p className={styles.contextPill}>
          {displayBoardCopy.stageContextPhaseLabel(phaseLabel)}
        </p>
        <p className={styles.contextPill}>
          {displayBoardCopy.stageContextRoundLabel(roundMetaLabel)}
        </p>
        {activeTeamName !== null && (
          <p className={`${styles.contextPill} ${styles.contextPillTeam}`}>
            {displayBoardCopy.stageContextTeamLabel(activeTeamName)}
          </p>
        )}
      </div>
    </div>
  );
};
