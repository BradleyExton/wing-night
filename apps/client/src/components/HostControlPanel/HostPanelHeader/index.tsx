import { Phase, type RoomState } from "@wingnight/shared";

import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

type HostPanelHeaderProps = {
  roomState: RoomState | null;
  teamNameByTeamId: Map<string, string>;
};

export const HostPanelHeader = ({
  roomState,
  teamNameByTeamId
}: HostPanelHeaderProps): JSX.Element => {
  const phase = roomState?.phase ?? null;
  const isTurnContextPhase =
    phase === Phase.EATING ||
    phase === Phase.MINIGAME_INTRO ||
    phase === Phase.MINIGAME_PLAY;

  const phaseTitle =
    phase === null
      ? hostControlPanelCopy.headerWaitingTitle
      : hostControlPanelCopy.compactPhaseLabel(phase);
  const phaseDescription =
    phase === null
      ? hostControlPanelCopy.headerWaitingDescription
      : hostControlPanelCopy.headerPhaseDescription(phase);

  const currentRound = roomState?.currentRound ?? 0;
  const totalRounds = roomState?.totalRounds ?? 0;
  const roundLabel =
    currentRound > 0 && totalRounds > 0
      ? hostControlPanelCopy.compactRoundProgressLabel(currentRound, totalRounds)
      : hostControlPanelCopy.headerPreGameLabel;
  const roundIntroSauce =
    phase === Phase.ROUND_INTRO ? (roomState?.currentRoundConfig?.sauce ?? null) : null;
  const roundIntroMinigame =
    phase === Phase.ROUND_INTRO
      ? (roomState?.currentRoundConfig?.minigame ?? null)
      : null;

  const turnOrderCount = roomState?.turnOrderTeamIds.length ?? 0;
  const roundTurnCursor = roomState?.roundTurnCursor ?? -1;
  const hasValidTurnProgress =
    isTurnContextPhase &&
    roundTurnCursor >= 0 &&
    turnOrderCount > 0 &&
    roundTurnCursor < turnOrderCount;
  const turnProgressLabel = isTurnContextPhase && hasValidTurnProgress
    ? hostControlPanelCopy.turnProgressLabel(roundTurnCursor + 1, turnOrderCount)
    : null;

  const activeTeamId = selectActiveTeamId(roomState);
  const activeTeamName =
    isTurnContextPhase && activeTeamId !== null
      ? (teamNameByTeamId.get(activeTeamId) ?? hostControlPanelCopy.noAssignedTeamLabel)
      : isTurnContextPhase
        ? hostControlPanelCopy.noAssignedTeamLabel
        : null;

  return (
    <header className={styles.container}>
      <p className={styles.kicker}>{hostControlPanelCopy.headerKickerLabel}</p>
      <h1 className={styles.heading}>{phaseTitle}</h1>
      <p className={styles.subtext}>{phaseDescription}</p>

      <div className={styles.contextRow}>
        <ContextPill
          label={hostControlPanelCopy.headerRoundContextTitle}
          value={roundLabel}
        />
        {roundIntroSauce !== null && (
          <ContextPill
            label={hostControlPanelCopy.headerSauceContextTitle}
            value={roundIntroSauce}
          />
        )}
        {roundIntroMinigame !== null && (
          <ContextPill
            label={hostControlPanelCopy.headerMinigameContextTitle}
            value={roundIntroMinigame}
          />
        )}
        {turnProgressLabel !== null && (
          <ContextPill
            label={hostControlPanelCopy.headerTurnContextTitle}
            value={turnProgressLabel}
          />
        )}
        {activeTeamName !== null && (
          <ContextPill
            label={hostControlPanelCopy.headerActiveTeamContextTitle}
            value={activeTeamName}
          />
        )}
      </div>
    </header>
  );
};

type ContextPillProps = {
  label: string;
  value: string;
};

const ContextPill = ({ label, value }: ContextPillProps): JSX.Element => {
  return (
    <p className={styles.contextPill}>
      <span className={styles.contextLabel}>{label}</span>
      <span className={styles.contextValue}>{value}</span>
    </p>
  );
};

const selectActiveTeamId = (roomState: RoomState | null): string | null => {
  if (!roomState) {
    return null;
  }

  if (roomState.phase === Phase.MINIGAME_PLAY) {
    return roomState.activeTurnTeamId ?? roomState.activeRoundTeamId;
  }

  if (roomState.phase === Phase.EATING || roomState.phase === Phase.MINIGAME_INTRO) {
    return roomState.activeRoundTeamId;
  }

  return null;
};
