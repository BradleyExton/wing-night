import { Phase, type RoomState } from "@wingnight/shared";
import { useEffect, useState } from "react";

import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

type TimerControlsSurfaceProps = {
  isEatingPhase: boolean;
  timer: RoomState["timer"];
  onPauseTimer?: () => void;
  onResumeTimer?: () => void;
  onExtendTimer?: (additionalSeconds: number) => void;
};

export const TimerControlsSurface = ({
  isEatingPhase,
  timer,
  onPauseTimer,
  onResumeTimer,
  onExtendTimer
}: TimerControlsSurfaceProps): JSX.Element => {
  const [nowTimestampMs, setNowTimestampMs] = useState(() => Date.now());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNowTimestampMs(Date.now());
    }, 250);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  if (!isEatingPhase || timer === null || timer.phase !== Phase.EATING) {
    return <></>;
  }

  const remainingSeconds = timer.isPaused
    ? Math.max(0, Math.ceil(timer.remainingMs / 1000))
    : Math.max(0, Math.ceil((timer.endsAt - nowTimestampMs) / 1000));
  const canPause = onPauseTimer !== undefined && !timer.isPaused;
  const canResume = onResumeTimer !== undefined && timer.isPaused;
  const canExtend = onExtendTimer !== undefined;

  return (
    <section className={styles.card}>
      <h2 className={styles.sectionHeading}>{hostControlPanelCopy.timerSectionTitle}</h2>
      <div className={styles.statusRow}>
        <span className={styles.statusLabel}>
          {timer.isPaused
            ? hostControlPanelCopy.timerPausedLabel
            : hostControlPanelCopy.timerRunningLabel}
        </span>
      </div>
      <div className={styles.timerMeta}>
        <p className={styles.timerMetaLabel}>{hostControlPanelCopy.timerRemainingLabel}</p>
        <p className={styles.timerValue}>
          {hostControlPanelCopy.timerValue(remainingSeconds)}
        </p>
      </div>
      <div className={styles.actionRow}>
        <button
          className={styles.actionButton}
          type="button"
          onClick={onPauseTimer}
          disabled={!canPause}
        >
          {hostControlPanelCopy.timerPauseButtonLabel}
        </button>
        <button
          className={styles.actionButton}
          type="button"
          onClick={onResumeTimer}
          disabled={!canResume}
        >
          {hostControlPanelCopy.timerResumeButtonLabel}
        </button>
        <button
          className={styles.actionButton}
          type="button"
          onClick={(): void => {
            onExtendTimer?.(15);
          }}
          disabled={!canExtend}
        >
          {hostControlPanelCopy.timerExtendFifteenButtonLabel}
        </button>
        <button
          className={styles.actionButton}
          type="button"
          onClick={(): void => {
            onExtendTimer?.(30);
          }}
          disabled={!canExtend}
        >
          {hostControlPanelCopy.timerExtendThirtyButtonLabel}
        </button>
      </div>
    </section>
  );
};
