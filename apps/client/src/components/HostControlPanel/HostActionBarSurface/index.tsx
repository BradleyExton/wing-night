import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

type HostActionBarSurfaceProps = {
  onNextPhase?: () => void;
};

export const HostActionBarSurface = ({
  onNextPhase
}: HostActionBarSurfaceProps): JSX.Element => {
  return (
    <div className={styles.controlsRow}>
      <button
        className={styles.primaryButton}
        type="button"
        onClick={onNextPhase}
        disabled={onNextPhase === undefined}
      >
        {hostControlPanelCopy.nextPhaseButtonLabel}
      </button>
    </div>
  );
};
