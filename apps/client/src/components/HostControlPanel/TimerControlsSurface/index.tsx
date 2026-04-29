import { Pause, Play } from "lucide-react";
import { Phase, type RoomState } from "@wingnight/shared";

import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

type TimerControlsSurfaceProps = {
  timer: RoomState["timer"];
  onPauseTimer?: () => void;
  onResumeTimer?: () => void;
  onExtendTimer?: (additionalSeconds: number) => void;
};

export const TimerControlsSurface = ({
  timer,
  onPauseTimer,
  onResumeTimer,
  onExtendTimer
}: TimerControlsSurfaceProps): JSX.Element => {
  if (timer === null || timer.phase !== Phase.EATING) {
    return <></>;
  }

  const canPause = onPauseTimer !== undefined && !timer.isPaused;
  const canResume = onResumeTimer !== undefined && timer.isPaused;
  const canExtend = onExtendTimer !== undefined;
  const statusLabel = timer.isPaused
    ? hostControlPanelCopy.timerPausedLabel
    : hostControlPanelCopy.timerRunningLabel;
  const pauseResumeLabel = timer.isPaused
    ? hostControlPanelCopy.timerResumeButtonLabel
    : hostControlPanelCopy.timerPauseButtonLabel;
  const handlePauseResume = timer.isPaused ? onResumeTimer : onPauseTimer;
  const pauseResumeDisabled = timer.isPaused ? !canResume : !canPause;

  return (
    <section className={styles.group}>
      <div className={styles.groupHead}>
        <span>{hostControlPanelCopy.timerSectionTitle}</span>
        <span className={styles.groupCount}>{statusLabel}</span>
      </div>
      <div className={styles.controls}>
        <button
          className={styles.button}
          type="button"
          onClick={handlePauseResume}
          disabled={pauseResumeDisabled}
        >
          {timer.isPaused ? (
            <Play strokeWidth={2.4} className="h-[1.05rem] w-[1.05rem]" />
          ) : (
            <Pause strokeWidth={2.4} className="h-[1.05rem] w-[1.05rem]" />
          )}
          {pauseResumeLabel}
        </button>
        <button
          className={styles.button}
          type="button"
          onClick={(): void => {
            onExtendTimer?.(15);
          }}
          disabled={!canExtend}
        >
          {hostControlPanelCopy.timerExtendFifteenButtonLabel}
        </button>
        <button
          className={styles.button}
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
