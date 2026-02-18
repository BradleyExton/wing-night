import { displayBoardCopy } from "../../copy";
import * as styles from "./styles";

type FallbackStageBodyProps = {
  phaseLabel: string;
  hasRoomState: boolean;
};

export const FallbackStageBody = ({
  phaseLabel,
  hasRoomState
}: FallbackStageBodyProps): JSX.Element => {
  return (
    <>
      <h2 className={styles.title}>{displayBoardCopy.phaseContextTitle(phaseLabel)}</h2>
      <p className={styles.fallbackText}>
        {hasRoomState ? displayBoardCopy.roundFallbackLabel : displayBoardCopy.waitingForStateLabel}
      </p>
    </>
  );
};
