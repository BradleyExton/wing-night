import type { ClockCueName } from "../createClockSoundboard";
import { isTimerTimeUp, isTimerUrgent } from "../timerUrgency";

// What the TV's clock should SAY on a change of second, as opposed to what it
// shows. Pure, so the hook that plays it (`useMinigameClockSound`) is a ref
// and an effect and nothing else.
//
// Reads the same two predicates as the chip and the line
// (`utils/timerUrgency`), which is what keeps the tick on the same second the
// digits grow: retune the threshold there and the sound follows.
//
// `null` on the first reading, deliberately: a display that mounts — or
// refreshes — with seven seconds left says nothing until the next second,
// and one that mounts on a clock already at zero does not buzz a time's up
// the room already heard. A tick only ever counts DOWN: a host extending the
// clock from three seconds to eight moves the number up, and that is not a
// tick — the room hears nothing until the next real second.
export const resolveClockSoundCue = (
  previousRemainingSeconds: number | null,
  remainingSeconds: number | null
): ClockCueName | null => {
  if (remainingSeconds === null || previousRemainingSeconds === null) {
    return null;
  }

  if (remainingSeconds === previousRemainingSeconds) {
    return null;
  }

  if (isTimerTimeUp(remainingSeconds)) {
    return isTimerTimeUp(previousRemainingSeconds) ? null : "timesUp";
  }

  if (isTimerUrgent(remainingSeconds) && remainingSeconds < previousRemainingSeconds) {
    return "tick";
  }

  return null;
};
