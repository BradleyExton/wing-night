import { isTimerTimeUp, isTimerUrgent } from "../../../../utils/timerUrgency";
import * as styles from "./styles";

type MinigameTimerLineProps = {
  remainingSeconds: number | null;
  totalSeconds: number | null;
};

// The other half of `MinigameTimerChip`: the same seconds, drawn as the length
// of tube still lit in the marquee's track. A pure presenter, and like the
// chip it returns `null` for a room with no clock so the track it would have
// lit stays dark and costs nothing (docs/takeover-layout-api.md §6).
//
// A total the room does not know — the sandbox before its timer is armed —
// draws the line full rather than empty: a clock that has not started has
// spent nothing.
export const MinigameTimerLine = ({
  remainingSeconds,
  totalSeconds
}: MinigameTimerLineProps): JSX.Element | null => {
  if (remainingSeconds === null) {
    return null;
  }

  const isTimeUp = isTimerTimeUp(remainingSeconds);
  const litPercent =
    totalSeconds !== null && totalSeconds > 0
      ? Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100))
      : 100;

  return (
    <div
      className={isTimerUrgent(remainingSeconds) ? styles.litUrgent : styles.lit}
      ref={styles.applyLitWidth(isTimeUp ? 0 : litPercent)}
      aria-hidden
      data-minigame-timer-line
    >
      {!isTimeUp && <span className={styles.tip} />}
    </div>
  );
};
