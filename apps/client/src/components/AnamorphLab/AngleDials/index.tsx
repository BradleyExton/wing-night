import { clampPitch, type ViewAngle } from "../anamorphCloud";
import { anamorphLabCopy } from "../copy";
import * as styles from "../styles";

type AngleDialsProps = {
  viewAngle: ViewAngle;
  onViewAngleChange: (viewAngle: ViewAngle) => void;
};

const toDegrees = (radians: number): number => {
  return (radians * 180) / Math.PI;
};

const toRadians = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

export const AngleDials = ({
  viewAngle,
  onViewAngleChange
}: AngleDialsProps): JSX.Element => {
  return (
    <div className={styles.dialGrid}>
      <div className={styles.controlBlock}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>{anamorphLabCopy.yawLabel}</span>
          <span className={styles.controlValue}>{toDegrees(viewAngle.yaw).toFixed(1)}</span>
        </div>
        <input
          type="range"
          className={styles.slider}
          min={-180}
          max={180}
          step={0.1}
          value={toDegrees(viewAngle.yaw)}
          aria-label={anamorphLabCopy.yawLabel}
          onChange={(event): void => {
            onViewAngleChange({ ...viewAngle, yaw: toRadians(Number(event.target.value)) });
          }}
        />
      </div>
      <div className={styles.controlBlock}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>{anamorphLabCopy.pitchLabel}</span>
          <span className={styles.controlValue}>{toDegrees(viewAngle.pitch).toFixed(1)}</span>
        </div>
        <input
          type="range"
          className={styles.slider}
          min={-89}
          max={89}
          step={0.1}
          value={toDegrees(viewAngle.pitch)}
          aria-label={anamorphLabCopy.pitchLabel}
          onChange={(event): void => {
            onViewAngleChange({
              ...viewAngle,
              pitch: clampPitch(toRadians(Number(event.target.value)))
            });
          }}
        />
      </div>
    </div>
  );
};
