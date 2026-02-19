import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

type HostActionBarSurfaceProps = {
  onNextPhase?: () => void;
  nextPhaseDisabled: boolean;
};

export const HostActionBarSurface = ({
  onNextPhase,
  nextPhaseDisabled
}: HostActionBarSurfaceProps): JSX.Element => {
  return (
    <div className={styles.controlsRow}>
      <button
        className={styles.primaryButton}
        type="button"
        onClick={onNextPhase}
        disabled={nextPhaseDisabled}
      >
        {hostControlPanelCopy.nextPhaseButtonLabel}
      </button>
    </div>
  );
};
