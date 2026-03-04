import * as styles from "./styles";

type HostActionBarSurfaceProps = {
  onNextPhase?: () => void;
  nextPhaseDisabled: boolean;
  primaryButtonLabel: string;
};

export const HostActionBarSurface = ({
  onNextPhase,
  nextPhaseDisabled,
  primaryButtonLabel
}: HostActionBarSurfaceProps): JSX.Element => {
  return (
    <div className={styles.controlsRow}>
      <button
        className={styles.primaryButton}
        type="button"
        onClick={onNextPhase}
        disabled={nextPhaseDisabled}
      >
        {primaryButtonLabel}
      </button>
    </div>
  );
};
