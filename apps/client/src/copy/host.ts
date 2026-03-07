import { Phase, type MinigameType } from "@wingnight/shared";
import { formatClockSeconds, formatPhaseLabel } from "./formatters";

const COMPACT_ROSTER_EMPTY_LABEL = "No players assigned.";
const TEAM_ROSTER_EMPTY_LABEL = "No players assigned yet.";

type PrimaryActionContext = {
  hasNextRoundTurn: boolean;
  hasAdditionalRounds: boolean;
};

const primaryActionLabel = (
  phase: Phase,
  context: PrimaryActionContext
): string => {
  switch (phase) {
    case Phase.SETUP:
      return "Lock Teams & Continue";
    case Phase.INTRO:
      return "Start Game";
    case Phase.ROUND_INTRO:
      return "Open Team Briefing";
    case Phase.MINIGAME_INTRO:
      return "Start Eating";
    case Phase.EATING:
      return "Start Mini-Game";
    case Phase.MINIGAME_PLAY:
      return "End Team Turn";
    case Phase.TURN_RESULTS:
      return context.hasNextRoundTurn ? "Prepare Next Team" : "Show Round Results";
    case Phase.ROUND_RESULTS:
      return context.hasAdditionalRounds ? "Start Next Round" : "Show Final Results";
    case Phase.FINAL_RESULTS:
      return "Game Complete";
    default:
      return "Continue";
  }
};

const phaseAdvanceHint = (phase: Phase): string => {
  switch (phase) {
    case Phase.SETUP:
      return "Advance when teams are assigned and the room is ready to start.";
    case Phase.INTRO:
      return "Start game when teams are locked and everyone is ready for Round 1.";
    case Phase.ROUND_INTRO:
      return "Advance when the first team is gathered for the round briefing.";
    case Phase.MINIGAME_INTRO:
      return "Call up the active team, brief them, then start eating once they are in place.";
    case Phase.EATING:
      return "Advance only after each active-team player is marked ate or did not eat.";
    case Phase.MINIGAME_PLAY:
      return "Advance when the active team turn has been scored.";
    case Phase.TURN_RESULTS:
      return "Advance when the next team is gathered and ready for a briefing.";
    case Phase.ROUND_RESULTS:
      return "Advance to continue to the next round or final results.";
    case Phase.FINAL_RESULTS:
      return "Game complete. Use reset controls when ready for a new game.";
    default:
      return "Use host controls to continue.";
  }
};

const phaseDescription = (phase: Phase): string => {
  switch (phase) {
    case Phase.SETUP:
      return "Create teams and assign players before starting the game.";
    case Phase.INTRO:
      return "Review locked teams and start the game when the room is ready.";
    case Phase.ROUND_INTRO:
      return "Review this round before the first team briefing.";
    case Phase.MINIGAME_INTRO:
      return "Call up the active team and brief them before their turn begins.";
    case Phase.EATING:
      return "Track wing participation for the active team and run the eating timer.";
    case Phase.MINIGAME_PLAY:
      return "Record outcomes for the active team turn.";
    case Phase.TURN_RESULTS:
      return "Pause between team turns so the next team can get set.";
    case Phase.ROUND_RESULTS:
      return "Review score updates before moving to the next round.";
    case Phase.FINAL_RESULTS:
      return "Final standings are locked for this game.";
    default:
      return "Review the current game state.";
  }
};

export const hostCopy = {
  headerKickerLabel: "Host",
  headerRoundContextTitle: "Round",
  headerActiveTeamContextTitle: "Active Team",
  headerSauceContextTitle: "Sauce",
  headerMinigameContextTitle: "Mini-game",
  headerPreGameLabel: "Pre-game",
  headerWaitingTitle: "Waiting for room state",
  headerWaitingDescription:
    "Host controls will update when the latest snapshot arrives.",
  headerPhaseDescription: phaseDescription,
  primaryActionLabel,
  nextPhaseButtonLabel: "Next Phase",
  startGameButtonLabel: "Start Game",
  setupLockedNoticeLabel: "Game Locked In",
  skipTurnBoundaryButtonLabel: "Skip Turn",
  redoLastMutationButtonLabel: "Undo Last Score",
  resetGameButtonLabel: "Reset Game",
  resetGameConfirmButtonLabel: "Confirm Reset",
  resetGameCancelButtonLabel: "Cancel",
  resetGameArmedMessage:
    "Confirm reset to return to setup. Teams and scores will be cleared.",
  overridesTriggerButtonLabel: "Overrides",
  overridesTriggerNeedsAttentionLabel: "Needs Review",
  overridesTriggerOpenAriaLabel: "Open overrides panel",
  overridesTriggerCloseAriaLabel: "Close overrides panel",
  overridesPanelTitle: "Overrides",
  overridesPanelDescription:
    "Use manual controls for turn order, scoring, and escape-hatch actions.",
  overridesCloseButtonLabel: "Close",
  overridesScrimDismissAriaLabel: "Close overrides panel",
  overridesActionsSectionTitle: "Escape Hatches",
  overridesActionsDescription:
    "Skip turn, undo last score, and reset game require confirmation.",
  overrideConfirmButtonLabel: "Confirm",
  overrideCancelButtonLabel: "Cancel",
  overrideSkipTurnConfirmTitle: "Confirm Skip Turn",
  overrideSkipTurnConfirmDescription:
    "Skip turn advances the active team boundary immediately.",
  overrideRedoMutationConfirmTitle: "Confirm Undo Last Score",
  overrideRedoMutationConfirmDescription:
    "Undo restores scoring fields to the previous scoring snapshot.",
  overrideResetGameConfirmTitle: "Confirm Reset Game",
  overrideResetGameConfirmDescription:
    "Reset returns the game to setup and clears teams and scores.",
  scoreOverrideSectionTitle: "Score Override",
  scoreOverrideDescription:
    "Apply integer score deltas when manual correction is needed.",
  scoreOverrideTeamLabel: "Team",
  scoreOverrideDeltaLabel: "Score Delta",
  scoreOverrideDeltaPlaceholder: "e.g. +2 or -1",
  scoreOverrideApplyButtonLabel: "Apply",
  scoreOverrideNoTeamsLabel: "No teams available for score adjustments.",
  teamSetupTitle: "Team Setup",
  teamSetupDescription:
    "Preset teams load here, and you can still add teams and map players before moving the game forward.",
  teamNameInputLabel: "Team Name",
  teamNameInputPlaceholder: "Enter a team name",
  createTeamButtonLabel: "Create Team",
  autoAssignRemainingPlayersButtonLabel: "Auto-Assign Remaining Players",
  playersSectionTitle: "Players",
  playerNameInputLabel: "Player Name",
  playerNameInputPlaceholder: "Enter a player name",
  addPlayerButtonLabel: "Add Player",
  teamsSectionTitle: "Teams",
  eatingParticipationDescription:
    "Mark each player who finished their wing this round.",
  timerSectionTitle: "Timer Controls",
  timerRunningLabel: "Running",
  timerPausedLabel: "Paused",
  timerRemainingLabel: "Time Remaining",
  timerPauseButtonLabel: "Pause Timer",
  timerResumeButtonLabel: "Resume Timer",
  timerExtendFifteenButtonLabel: "+15s",
  timerExtendThirtyButtonLabel: "+30s",
  timerValue: formatClockSeconds,
  phaseAdvanceHint,
  unassignedOptionLabel: "Unassigned",
  assignmentSelectLabel: (playerName: string): string =>
    `Assign ${playerName} to a team`,
  noPlayersLabel: "No players available.",
  activeTeamNoPlayersLabel: "No players assigned to the active team.",
  noTeamsLabel: "No teams created yet.",
  noAssignedTeamLabel: "No team assigned",
  assignedTeamLabel: (teamName: string): string => `Team: ${teamName}`,
  ateWingLabel: "Ate wing",
  wingParticipationToggleLabel: (playerName: string): string =>
    `Mark ${playerName} as ate wing`,
  activeRoundTeamTitle: "Active Team",
  activeRoundTeamValue: (teamName: string): string => teamName,
  triviaSectionDescription:
    "Mark the active team's answer as correct or incorrect.",
  minigameSectionTitle: "Mini-Game",
  minigameIntroDescription: (minigame: MinigameType): string =>
    `${minigame} is queued. Call the team up, explain it, then start eating once they are set.`,
  minigamePlayDescription: (minigame: MinigameType): string =>
    `${minigame} is live for this team turn.`,
  minigameWaitingForViewLabel:
    "Waiting for minigame host state from the server snapshot.",
  minigameRendererUnavailableLabel: (minigame: MinigameType): string =>
    `${minigame} host surface is not available yet.`,
  minigameFallbackType: "TRIVIA" as MinigameType,
  waitingStateLabel: "Waiting for room state...",
  triviaActiveTeamLabel: (teamName: string): string => `Active Team: ${teamName}`,
  triviaQuestionLabel: "Question",
  triviaAnswerLabel: "Answer",
  triviaCorrectButtonLabel: "Correct",
  triviaIncorrectButtonLabel: "Incorrect",
  compactStandingsTitle: "Standings Snapshot",
  compactNoStandingsLabel: "No teams available for standings yet.",
  compactLeaderLabel: "Leader",
  compactRosterValue: (
    visiblePlayerNames: string[],
    hiddenPlayerCount: number
  ): string => {
    if (visiblePlayerNames.length === 0) {
      return COMPACT_ROSTER_EMPTY_LABEL;
    }

    if (hiddenPlayerCount > 0) {
      return `${visiblePlayerNames.join(", ")} +${hiddenPlayerCount}`;
    }

    return visiblePlayerNames.join(", ");
  },
  compactPhaseLabel: formatPhaseLabel,
  compactRoundProgressLabel: (currentRound: number, totalRounds: number): string =>
    `Round ${Math.max(currentRound, 1)} of ${totalRounds}`,
  compactScoreLabel: (score: number): string => `${score} pts`,
  teamMembersLabel: (memberCount: number): string =>
    `${memberCount} player${memberCount === 1 ? "" : "s"}`,
  teamRosterValue: (
    visiblePlayerNames: string[],
    hiddenPlayerCount: number
  ): string => {
    if (visiblePlayerNames.length === 0) {
      return TEAM_ROSTER_EMPTY_LABEL;
    }

    if (hiddenPlayerCount > 0) {
      return `${visiblePlayerNames.join(", ")} +${hiddenPlayerCount}`;
    }

    return visiblePlayerNames.join(", ");
  },
  turnOrderSectionTitle: "Turn Order",
  turnOrderDescription:
    "Adjust team order before the round begins. This order carries into later rounds until changed.",
  turnOrderLockedDescription:
    "Turn order is locked outside Round Intro. Open during Round Intro to edit.",
  turnOrderLockedStatusLabel: "Locked until Round Intro",
  turnOrderEmptyLabel: "Turn order will appear when teams are available.",
  turnOrderPositionLabel: (index: number, total: number): string =>
    `Team ${index + 1} of ${total}`,
  turnOrderMoveUpButtonLabel: "Move Up",
  turnOrderMoveDownButtonLabel: "Move Down"
} as const;
