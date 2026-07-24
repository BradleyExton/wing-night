import { useEffect, useState } from "react";

import { ControlDeck } from "../ControlDeck";
import { StageHero } from "../StageHero";
import { PlayersSurface } from "../../PlayersSurface";
import { TimerControlsSurface } from "../../TimerControlsSurface";
import { hostControlPanelCopy } from "../../copy";
import { selectHostTeamMaps } from "../../selectHostTeamMaps";
import { createMinigameHandlers } from "../../setupHandlers";
import { useHostHandlers } from "../../../../context/HostHandlersContext";
import { useHostRoomState } from "../../../../context/RoomStateContext";
import { resolveRemainingTimerSeconds } from "../../../../utils/resolveRemainingTimerSeconds";
import * as styles from "./styles";

const URGENT_THRESHOLD_SECONDS = 10;

const useNowTickMs = (): number => {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return (): void => {
      window.clearInterval(intervalId);
    };
  }, []);

  return now;
};

export const EatingStage = (): JSX.Element => {
  const roomState = useHostRoomState();
  const handlers = useHostHandlers();
  const { assignedTeamByPlayerId, teamNameByTeamId } = selectHostTeamMaps(roomState);
  const players = roomState?.players ?? [];
  const wingParticipationByPlayerId = roomState?.wingParticipationByPlayerId ?? {};
  const activeRoundTeamId = roomState?.activeRoundTeamId ?? null;
  const activeRoundTeamName =
    activeRoundTeamId !== null
      ? (teamNameByTeamId.get(activeRoundTeamId) ??
        hostControlPanelCopy.noAssignedTeamLabel)
      : hostControlPanelCopy.noAssignedTeamLabel;
  const participationDisabled = handlers.onSetWingParticipation === undefined;
  const timer = roomState?.timer ?? null;
  const { handleWingParticipationChange } = createMinigameHandlers({
    hostMode: "eating",
    minigameType: null,
    onDispatchMinigameAction: handlers.onDispatchMinigameAction,
    onSetWingParticipation: handlers.onSetWingParticipation
  });
  const nowTimestampMs = useNowTickMs();
  const remainingSeconds =
    timer !== null ? resolveRemainingTimerSeconds(timer, nowTimestampMs) : 0;
  const isUrgent = remainingSeconds <= URGENT_THRESHOLD_SECONDS;
  const totalDurationSeconds =
    timer !== null ? Math.max(timer.durationMs / 1000, 1) : 1;
  const heatPercent = Math.max(
    0,
    Math.min(100, (remainingSeconds / totalDurationSeconds) * 100)
  );
  const timerClassName = `${styles.timer} ${isUrgent ? styles.timerUrgent : ""}`;

  return (
    <>
      <StageHero glowClassName={styles.glowEating}>
        <span className={styles.eyebrow}>
          {hostControlPanelCopy.timerSectionTitle} ·{" "}
          {hostControlPanelCopy.timerRemainingLabel}
        </span>
        <p className={timerClassName}>
          {hostControlPanelCopy.timerValue(remainingSeconds)}
        </p>
        <div className={styles.heatTrack}>
          <div className={styles.heatTrackFill} style={{ width: `${heatPercent}%` }} />
        </div>
        <p className={styles.timerCap}>
          {hostControlPanelCopy.eatingParticipationDescription}
        </p>
      </StageHero>
      <ControlDeck>
        <PlayersSurface
          mode="eating"
          players={players}
          assignedTeamByPlayerId={assignedTeamByPlayerId}
          teamNameByTeamId={teamNameByTeamId}
          wingParticipationByPlayerId={wingParticipationByPlayerId}
          activeRoundTeamId={activeRoundTeamId}
          activeRoundTeamName={activeRoundTeamName}
          participationDisabled={participationDisabled}
          onSetWingParticipation={handleWingParticipationChange}
        />
        <TimerControlsSurface
          timer={timer}
          onPauseTimer={handlers.onPauseTimer}
          onResumeTimer={handlers.onResumeTimer}
          onExtendTimer={handlers.onExtendTimer}
        />
      </ControlDeck>
    </>
  );
};
