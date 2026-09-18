import { useHostRoomState } from "../../../../context/RoomStateContext";
import { resolveRemainingTimerSeconds } from "../../../../utils/resolveRemainingTimerSeconds";
import { hostControlPanelCopy } from "../../copy";
import { MinigameSurface } from "../../MinigameSurface";
import { useMinigameHostContext } from "../../useMinigameHostContext";
import { useNowTickMs } from "../../useNowTickMs";
import { useTimesUpChime } from "../../useTimesUpChime";
import * as styles from "./styles";

const URGENT_THRESHOLD_SECONDS = 10;

export const MinigamePlayTakeover = (): JSX.Element => {
  const roomState = useHostRoomState();
  const {
    teamNameByTeamId,
    minigameType,
    minigameHostView,
    activeRoundTeamId,
    activeRoundTeamName,
    canDispatchMinigameAction,
    handleDispatchMinigameAction
  } = useMinigameHostContext("minigame_play");

  const timer = roomState?.timer ?? null;
  const nowTimestampMs = useNowTickMs();
  const remainingSeconds =
    timer === null ? null : resolveRemainingTimerSeconds(timer, nowTimestampMs);
  const isTimeUp = remainingSeconds !== null && remainingSeconds <= 0;
  const isUrgent =
    remainingSeconds !== null && remainingSeconds <= URGENT_THRESHOLD_SECONDS;
  const timerChipClassName = isTimeUp
    ? styles.timerChipTimeUp
    : isUrgent
      ? styles.timerChipUrgent
      : styles.timerChip;

  useTimesUpChime(remainingSeconds);

  return (
    <div className={styles.container}>
      {remainingSeconds !== null && (
        <div className={timerChipClassName}>
          {isTimeUp
            ? hostControlPanelCopy.timerTimesUpLabel
            : hostControlPanelCopy.timerValue(remainingSeconds)}
        </div>
      )}
      <MinigameSurface
        phase="play"
        minigameType={minigameType}
        minigameHostView={minigameHostView}
        activeTeamName={activeRoundTeamId === null ? null : activeRoundTeamName}
        teamNameByTeamId={teamNameByTeamId}
        canDispatchAction={canDispatchMinigameAction}
        onDispatchAction={handleDispatchMinigameAction}
      />
    </div>
  );
};
