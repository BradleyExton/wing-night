import { useEffect, useState } from "react";
import type { Player, RoomState } from "@wingnight/shared";

import { ControlDeck } from "../ControlDeck";
import { StageHero } from "../StageHero";
import { PlayersSurface } from "../../PlayersSurface";
import { TimerControlsSurface } from "../../TimerControlsSurface";
import { hostControlPanelCopy } from "../../copy";
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

type EatingStageProps = {
  roomState: RoomState | null;
  players: Player[];
  assignedTeamByPlayerId: Map<string, string>;
  teamNameByTeamId: Map<string, string>;
  wingParticipationByPlayerId: Record<string, boolean>;
  activeRoundTeamId: string | null;
  activeRoundTeamName: string;
  participationDisabled: boolean;
  timer: RoomState["timer"];
  showOverridesButton: boolean;
  overridesShowBadge: boolean;
  onOpenOverrides: () => void;
  onSetWingParticipation: (playerId: string, didEat: boolean) => void;
  onPauseTimer?: () => void;
  onResumeTimer?: () => void;
  onExtendTimer?: (additionalSeconds: number) => void;
};

export const EatingStage = ({
  roomState,
  players,
  assignedTeamByPlayerId,
  teamNameByTeamId,
  wingParticipationByPlayerId,
  activeRoundTeamId,
  activeRoundTeamName,
  participationDisabled,
  timer,
  showOverridesButton,
  overridesShowBadge,
  onOpenOverrides,
  onSetWingParticipation,
  onPauseTimer,
  onResumeTimer,
  onExtendTimer
}: EatingStageProps): JSX.Element => {
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
      <StageHero
        roomState={roomState}
        teamNameByTeamId={teamNameByTeamId}
        glowClassName={styles.glowEating}
      >
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
      <ControlDeck
        showOverridesButton={showOverridesButton}
        overridesShowBadge={overridesShowBadge}
        onOpenOverrides={onOpenOverrides}
      >
        <PlayersSurface
          mode="eating"
          players={players}
          assignedTeamByPlayerId={assignedTeamByPlayerId}
          teamNameByTeamId={teamNameByTeamId}
          wingParticipationByPlayerId={wingParticipationByPlayerId}
          activeRoundTeamId={activeRoundTeamId}
          activeRoundTeamName={activeRoundTeamName}
          participationDisabled={participationDisabled}
          onSetWingParticipation={onSetWingParticipation}
        />
        <TimerControlsSurface
          timer={timer}
          onPauseTimer={onPauseTimer}
          onResumeTimer={onResumeTimer}
          onExtendTimer={onExtendTimer}
        />
      </ControlDeck>
    </>
  );
};
