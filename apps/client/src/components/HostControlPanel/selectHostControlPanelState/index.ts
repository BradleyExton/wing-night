import type { RoomState } from "@wingnight/shared";

import { hostControlPanelCopy } from "../copy";
import { resolveHostRenderMode } from "../resolveHostRenderMode";

type HostControlPanelStateSelectionOptions = {
  roomState: RoomState | null;
  teamNameByTeamId: Map<string, string>;
  onCreateTeam?: (name: string) => void;
  onAssignPlayer?: (playerId: string, teamId: string | null) => void;
  onSetWingParticipation?: (playerId: string, didEat: boolean) => void;
  onRecordTriviaAttempt?: (isCorrect: boolean) => void;
  onNextPhase?: () => void;
};

export type HostControlPanelStateSelection = {
  players: RoomState["players"];
  teams: RoomState["teams"];
  phase: RoomState["phase"] | null;
  fatalError: RoomState["fatalError"];
  hostMode: ReturnType<typeof resolveHostRenderMode>;
  minigameHostView: RoomState["minigameHostView"];
  isTriviaMinigamePlayPhase: boolean;
  wingParticipationByPlayerId: RoomState["wingParticipationByPlayerId"];
  activeRoundTeamId: RoomState["activeRoundTeamId"];
  activeRoundTeamName: string;
  currentTriviaPrompt: RoomState["currentTriviaPrompt"];
  activeTurnTeamId: RoomState["activeTurnTeamId"];
  setupMutationsDisabled: boolean;
  assignmentDisabled: boolean;
  participationDisabled: boolean;
  triviaAttemptDisabled: boolean;
  nextPhaseDisabled: boolean;
  phaseAdvanceHint: string | null;
};

const EMPTY_TEAMS: RoomState["teams"] = [];

export const selectHostControlPanelState = ({
  roomState,
  teamNameByTeamId,
  onCreateTeam,
  onAssignPlayer,
  onSetWingParticipation,
  onRecordTriviaAttempt,
  onNextPhase
}: HostControlPanelStateSelectionOptions): HostControlPanelStateSelection => {
  const players = roomState?.players ?? [];
  const teams = roomState?.teams ?? EMPTY_TEAMS;
  const phase = roomState?.phase ?? null;
  const fatalError = roomState?.fatalError ?? null;
  const hostMode = resolveHostRenderMode(phase);
  const minigameHostView = roomState?.minigameHostView ?? null;
  const isTriviaMinigamePlayPhase =
    hostMode === "minigame_play" && minigameHostView?.minigame === "TRIVIA";

  const wingParticipationByPlayerId = roomState?.wingParticipationByPlayerId ?? {};
  const activeRoundTeamId = roomState?.activeRoundTeamId ?? null;
  const activeRoundTeamName =
    activeRoundTeamId !== null
      ? (teamNameByTeamId.get(activeRoundTeamId) ??
        hostControlPanelCopy.noAssignedTeamLabel)
      : hostControlPanelCopy.noAssignedTeamLabel;
  const currentTriviaPrompt =
    minigameHostView?.currentPrompt ?? roomState?.currentTriviaPrompt ?? null;
  const activeTurnTeamId =
    minigameHostView?.activeTurnTeamId ?? roomState?.activeTurnTeamId ?? null;

  const setupMutationsDisabled = onCreateTeam === undefined || hostMode !== "setup";
  const assignmentDisabled = onAssignPlayer === undefined || hostMode !== "setup";
  const participationDisabled = onSetWingParticipation === undefined || hostMode !== "eating";
  const triviaAttemptDisabled =
    onRecordTriviaAttempt === undefined ||
    !isTriviaMinigamePlayPhase ||
    activeTurnTeamId === null ||
    currentTriviaPrompt === null ||
    (minigameHostView?.attemptsRemaining ?? 0) <= 0;
  const nextPhaseDisabled =
    onNextPhase === undefined || roomState?.canAdvancePhase !== true;

  return {
    players,
    teams,
    phase,
    fatalError,
    hostMode,
    minigameHostView,
    isTriviaMinigamePlayPhase,
    wingParticipationByPlayerId,
    activeRoundTeamId,
    activeRoundTeamName,
    currentTriviaPrompt,
    activeTurnTeamId,
    setupMutationsDisabled,
    assignmentDisabled,
    participationDisabled,
    triviaAttemptDisabled,
    nextPhaseDisabled,
    phaseAdvanceHint:
      phase !== null ? hostControlPanelCopy.phaseAdvanceHint(phase) : null
  };
};
