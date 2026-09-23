import { isTimerTimeUp, isTimerUrgent } from "../../../../utils/timerUrgency";
import { displayBoardCopy } from "../../copy";
import * as styles from "./styles";

type MinigameTimerChipProps = {
  remainingSeconds: number | null;
};

// The TV's turn clock. A pure presenter — the countdown is `useMinigameCountdown`'s
// and the room's, which is why T5.1 refused to merge it with the host's
// context-reading chip.
//
// It returns `null` for a room with no clock rather than leaving the decision
// to its caller, so the surfaces downstream can hold it in a plain flex cell
// and let an empty slot cost nothing (docs/takeover-layout-api.md §6).
export const MinigameTimerChip = ({
  remainingSeconds
}: MinigameTimerChipProps): JSX.Element | null => {
  if (remainingSeconds === null) {
    return null;
  }

  const isTimeUp = isTimerTimeUp(remainingSeconds);
  const isUrgent = isTimerUrgent(remainingSeconds);
  const chipClassName = isTimeUp
    ? styles.timerChipTimeUp
    : isUrgent
      ? styles.timerChipUrgent
      : styles.timerChip;

  return (
    <div className={chipClassName}>
      {isTimeUp
        ? displayBoardCopy.minigameTimesUpLabel
        : displayBoardCopy.minigameTimerValue(remainingSeconds)}
    </div>
  );
};
