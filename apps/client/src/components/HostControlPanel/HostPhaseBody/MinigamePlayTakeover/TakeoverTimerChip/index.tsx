import { useHostRoomState } from "../../../../../context/RoomStateContext";
import { resolveRemainingTimerSeconds } from "../../../../../utils/resolveRemainingTimerSeconds";
import { isTimerTimeUp, isTimerUrgent } from "../../../../../utils/timerUrgency";
import { hostControlPanelCopy } from "../../../copy";
import { useNowTickMs } from "../../../useNowTickMs";
import { useTimesUpChime } from "../../../useTimesUpChime";
import * as styles from "./styles";

// Its OWN component, and that is the whole point of it: `useNowTickMs` fires
// four times a second for as long as a minigame is on the tablet, and while
// the chip lived in the takeover it dragged the entire minigame surface — the
// joust arena, the easel, the schlonic zone — through a render each tick, on
// top of every server snapshot. Now the tick re-renders a chip.
export const TakeoverTimerChip = (): JSX.Element | null => {
  const roomState = useHostRoomState();
  const timer = roomState?.timer ?? null;
  const nowTimestampMs = useNowTickMs();
  const remainingSeconds =
    timer === null ? null : resolveRemainingTimerSeconds(timer, nowTimestampMs);
  const isTimeUp = remainingSeconds !== null && isTimerTimeUp(remainingSeconds);
  const isUrgent = remainingSeconds !== null && isTimerUrgent(remainingSeconds);
  const timerChipClassName = isTimeUp
    ? styles.timerChipTimeUp
    : isUrgent
      ? styles.timerChipUrgent
      : styles.timerChip;

  useTimesUpChime(remainingSeconds);

  if (remainingSeconds === null) {
    return null;
  }

  return (
    <div className={timerChipClassName}>
      {isTimeUp
        ? hostControlPanelCopy.timerTimesUpLabel
        : hostControlPanelCopy.timerValue(remainingSeconds)}
    </div>
  );
};
