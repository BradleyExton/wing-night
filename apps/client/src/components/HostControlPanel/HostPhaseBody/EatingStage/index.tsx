import { MUSIC_VOLUME_DEFAULT, SFX_VOLUME_DEFAULT } from "@wingnight/shared";

import { ControlDeck } from "../ControlDeck";
import { DeviceModeSurface } from "../../DeviceModeSurface";
import { selectDeviceModeRounds } from "../../DeviceModeSurface/selectDeviceModeRounds";
import { StageHero } from "../StageHero";
import { MusicControlsSurface } from "../../MusicControlsSurface";
import { PlayersSurface } from "../../PlayersSurface";
import { TimerControlsSurface } from "../../TimerControlsSurface";
import { hostControlPanelCopy } from "../../copy";
import { selectHostTeamMaps } from "../../selectHostTeamMaps";
import { createMinigameHandlers } from "../../setupHandlers";
import { useNowTickMs } from "../../useNowTickMs";
import { useTimesUpChime } from "../../useTimesUpChime";
import { useHostHandlers } from "../../../../context/HostHandlersContext";
import { useHostRoomState } from "../../../../context/RoomStateContext";
import { resolveRemainingTimerSeconds } from "../../../../utils/resolveRemainingTimerSeconds";
import { isTimerTimeUp, isTimerUrgent } from "../../../../utils/timerUrgency";
import * as styles from "./styles";

export const EatingStage = (): JSX.Element => {
  const roomState = useHostRoomState();
  const handlers = useHostHandlers();
  const { assignedTeamByPlayerId, teamNameByTeamId, teamThemeByTeamId } =
    selectHostTeamMaps(roomState);
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
  // The `!isPaused` is this surface's own and stays here: a clock the host has
  // deliberately paused on zero has not called time on anybody.
  const isTimeUp =
    timer !== null && !timer.isPaused && isTimerTimeUp(remainingSeconds);
  const isUrgent = isTimerUrgent(remainingSeconds);
  const totalDurationSeconds =
    timer !== null ? Math.max(timer.durationMs / 1000, 1) : 1;
  const heatPercent = Math.max(
    0,
    Math.min(100, (remainingSeconds / totalDurationSeconds) * 100)
  );
  const timerClassName = `${styles.timer} ${
    isTimeUp ? styles.timerTimeUp : isUrgent ? styles.timerUrgent : ""
  }`;

  useTimesUpChime(timer === null ? null : remainingSeconds);

  return (
    <>
      <StageHero glowClassName={styles.glowEating}>
        <span className={isTimeUp ? styles.eyebrowTimeUp : styles.eyebrow}>
          {isTimeUp
            ? hostControlPanelCopy.timerTimesUpLabel
            : hostControlPanelCopy.timerRemainingLabel}
        </span>
        <p className={timerClassName}>
          {hostControlPanelCopy.timerValue(remainingSeconds)}
        </p>
        <div className={styles.heatTrack}>
          <div
            className={styles.heatTrackFill}
            ref={styles.applyHeatTrackFillWidth(heatPercent)}
          />
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
          teamThemeByTeamId={teamThemeByTeamId}
          teamNameByTeamId={teamNameByTeamId}
          wingParticipationByPlayerId={wingParticipationByPlayerId}
          activeRoundTeamId={activeRoundTeamId}
          activeRoundTeamName={activeRoundTeamName}
          participationDisabled={participationDisabled}
          onSetWingParticipation={handleWingParticipationChange}
        />
        <DeviceModeSurface
          rounds={selectDeviceModeRounds(roomState)}
          lockedDeviceMode={roomState?.contestantTurn?.deviceMode ?? null}
          onSetRoundDeviceMode={handlers.onSetRoundDeviceMode}
        />
        <TimerControlsSurface
          timer={timer}
          onPauseTimer={handlers.onPauseTimer}
          onResumeTimer={handlers.onResumeTimer}
          onExtendTimer={handlers.onExtendTimer}
        />
        {/* The eating playlist plays under the wings, so its transport sits on
            the phase that plays it, the rule SETUP and the briefing follow. */}
        <MusicControlsSurface
          musicPlayback={roomState?.musicPlayback ?? null}
          musicVolume={roomState?.musicVolume ?? MUSIC_VOLUME_DEFAULT}
          sfxVolume={roomState?.sfxVolume ?? SFX_VOLUME_DEFAULT}
          onPauseMusic={handlers.onPauseMusic}
          onResumeMusic={handlers.onResumeMusic}
          onSkipMusicTrack={handlers.onSkipMusicTrack}
          onPreviousMusicTrack={handlers.onPreviousMusicTrack}
          onSetMusicVolume={handlers.onSetMusicVolume}
          onSetSfxVolume={handlers.onSetSfxVolume}
        />
      </ControlDeck>
    </>
  );
};
