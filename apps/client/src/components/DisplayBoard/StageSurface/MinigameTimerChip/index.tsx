import { isTimerTimeUp, isTimerUrgent } from "../../../../utils/timerUrgency";
import { displayBoardCopy } from "../../copy";
import * as styles from "./styles";

type MinigameTimerChipProps = {
  remainingSeconds: number | null;
};

export type MinigameTimerChipState = "calm" | "urgent" | "time_up";

// The TV's turn clock. A pure presenter — the countdown is `useMinigameCountdown`'s
// and the room's, which is why T5.1 refused to merge it with the host's
// context-reading chip. Its voice is `useMinigameClockSound`, next door,
// driven by the same seconds and composed beside it by `MinigameStageBody`.
//
// It returns `null` for a room with no clock rather than leaving the decision
// to its caller, so the surfaces downstream can hold it in a plain flex cell
// and let an empty slot cost nothing (docs/takeover-layout-api.md §6).
//
// Three states, and the state is on the element (`data-minigame-timer-chip`)
// because the e2e suite reads it there: the copy in the pill is the copy
// module's to retune. Under ten seconds the digits are the bare seconds —
// "9", not "00:09" — because that is how a room counts a clock down, and at
// that size the leading zeros would be the biggest nothing on the TV.
//
// `key={remainingSeconds}` while urgent: a fresh element per tick is what
// restarts the once-per-second beat (`styles.timerChipUrgent`) from the top
// on every digit, instead of a free-running pulse the digits drift against.
export const MinigameTimerChip = ({
  remainingSeconds
}: MinigameTimerChipProps): JSX.Element | null => {
  if (remainingSeconds === null) {
    return null;
  }

  const state = resolveMinigameTimerChipState(remainingSeconds);

  if (state === "time_up") {
    return (
      <div className={styles.timerChipTimeUp} data-minigame-timer-chip={state}>
        {displayBoardCopy.minigameTimesUpLabel}
      </div>
    );
  }

  if (state === "urgent") {
    return (
      <div
        key={remainingSeconds}
        className={styles.timerChipUrgent}
        data-minigame-timer-chip={state}
      >
        {displayBoardCopy.minigameTimerUrgentValue(remainingSeconds)}
      </div>
    );
  }

  return (
    <div className={styles.timerChip} data-minigame-timer-chip={state}>
      {displayBoardCopy.minigameTimerValue(remainingSeconds)}
    </div>
  );
};

export const resolveMinigameTimerChipState = (
  remainingSeconds: number
): MinigameTimerChipState => {
  if (isTimerTimeUp(remainingSeconds)) {
    return "time_up";
  }

  return isTimerUrgent(remainingSeconds) ? "urgent" : "calm";
};
