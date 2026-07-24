import type { SerializableValue } from "@wingnight/minigames-core";
import type { MinigameHostView, MinigameType, RoomState } from "@wingnight/shared";

import { MinigameSurface } from "../../MinigameSurface";
import { hostControlPanelCopy } from "../../copy";
import { useNowTickMs } from "../../useNowTickMs";
import { useTimesUpChime } from "../../useTimesUpChime";
import { resolveRemainingTimerSeconds } from "../../../../utils/resolveRemainingTimerSeconds";
import * as styles from "./styles";

const URGENT_THRESHOLD_SECONDS = 10;

type MinigamePlayTakeoverProps = {
  minigameType: MinigameType | null;
  minigameHostView: MinigameHostView | null;
  activeRoundTeamId: string | null;
  activeRoundTeamName: string;
  teamNameByTeamId: Map<string, string>;
  canDispatchMinigameAction: boolean;
  timer: RoomState["timer"];
  onDispatchMinigameAction: (
    actionType: string,
    actionPayload: SerializableValue
  ) => void;
};

export const MinigamePlayTakeover = ({
  minigameType,
  minigameHostView,
  activeRoundTeamId,
  activeRoundTeamName,
  teamNameByTeamId,
  canDispatchMinigameAction,
  timer,
  onDispatchMinigameAction
}: MinigamePlayTakeoverProps): JSX.Element => {
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
        onDispatchAction={onDispatchMinigameAction}
      />
    </div>
  );
};
