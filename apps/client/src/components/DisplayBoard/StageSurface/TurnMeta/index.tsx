import { displayBoardCopy } from "../../copy";
import * as styles from "./styles";

type TurnMetaProps = {
  activeTeamName: string;
};

export const TurnMeta = ({ activeTeamName }: TurnMetaProps): JSX.Element => {
  return (
    <div className={styles.turnMeta}>
      <p className={styles.turnLabel}>{displayBoardCopy.activeTeamLabel}</p>
      <p className={styles.turnValue}>{displayBoardCopy.activeTeamValue(activeTeamName)}</p>
    </div>
  );
};
