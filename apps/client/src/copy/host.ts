import { Phase, type MinigameType } from "@wingnight/shared";
import { formatClockSeconds, formatMinigameName, formatPhaseLabel } from "./formatters";

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
      return "Set the turn order if needed, then start the game when everyone is ready for Round 1.";
    case Phase.MINIGAME_INTRO:
      return "Call up the active team, brief them, then start eating once they are in place.";
    case Phase.EATING:
      return "Tap each player who ate. Untapped players count as did-not-eat. Advance when ready.";
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
  // ROUND_RESULTS after the last round has no "next round" to move to.
  roundResultsFinalDescription:
    "Review score updates before revealing the final results.",
  primaryActionLabel,
  nextPhaseButtonLabel: "Next Phase",
  startGameButtonLabel: "Start Game",
  // The tablet holds the same count-in the TV is showing the room, so the
  // host knows the tap landed and how long the lock screen has left.
  startGameCountingInLabel: (remainingSeconds: number): string =>
    `Starting in ${remainingSeconds}…`,
  setupLockedNoticeLabel: "Game Locked In",
  skipTurnBoundaryButtonLabel: "Skip Turn",
  redoLastMutationButtonLabel: "Undo Last Score",
  resetGameButtonLabel: "Reset Game",
  // Takeover dock — the host's own controls while the tablet is in the players'
  // hands. One discreet circle; the labelled actions only appear after a tap.
  takeoverDockOpenGlyph: "⋯",
  takeoverDockCloseGlyph: "✕",
  takeoverDockOpenAriaLabel: "Open host controls",
  takeoverDockCloseAriaLabel: "Close host controls",
  takeoverDockScrimDismissAriaLabel: "Close host controls",
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
  // The setup headline and assignment summary interleave copy with styled <span>s around
  // the live counts, so each run of text is its own key rather than one interpolated string.
  setupHeadlineLead: "Build the",
  setupHeadlineAccent: "lineup.",
  // Once teams are locked (INTRO) the hero stops asking the host to build
  // anything — the deck is read-only and the only job left is Start Game.
  setupLockedHeadlineLead: "Lineup",
  setupLockedHeadlineAccent: "locked.",
  setupAssignedOfLabel: " of ",
  setupPlayersAssignedLabel: " players assigned. ",
  setupUnassignedRemainderLabel: " still need a home.",
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
  eatingCompletionCountLabel: (
    completedCount: number,
    totalCount: number
  ): string => `${completedCount} / ${totalCount}`,
  timerSectionTitle: "Timer Controls",
  timerRunningLabel: "Running",
  timerPausedLabel: "Paused",
  timerRemainingLabel: "Time Remaining",
  timerTimesUpLabel: "Time's Up",
  // The deck group is already headed "Timer Controls", so the buttons drop the
  // noun — "Pause Timer" wrapped to two lines in the 1.4fr column on tablets.
  timerPauseButtonLabel: "Pause",
  timerResumeButtonLabel: "Resume",
  timerExtendFifteenButtonLabel: "+15s",
  timerExtendThirtyButtonLabel: "+30s",
  musicSectionTitle: "Music",
  musicLobbyStatusLabel: "Lobby",
  musicAnthemStatusLabel: "Anthem",
  musicPlayingStatusLabel: "Playing",
  musicPausedStatusLabel: "Paused",
  // Same reasoning as the timer buttons: the deck group is already headed
  // "Music", so the buttons drop the noun and stay on one line on a tablet.
  musicPauseButtonLabel: "Pause",
  musicResumeButtonLabel: "Resume",
  musicSkipButtonLabel: "Next",
  musicPreviousButtonLabel: "Back",
  musicVolumeLabel: "Volume",
  musicVolumeValue: (percent: number): string => `${percent}%`,
  musicStatusValue: (sourceLabel: string, stateLabel: string): string =>
    `${sourceLabel} · ${stateLabel}`,
  musicTrackPositionLabel: (trackIndex: number, trackCount: number): string =>
    `Track ${trackIndex + 1} of ${trackCount}`,
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
  minigameName: formatMinigameName,
  minigameHeadlineLead: "Up next:",
  railNoGameLabel: "No game yet",
  minigameIntroDescription: (minigame: MinigameType): string =>
    `${formatMinigameName(minigame)} is queued. Call the team up, explain it, then start eating once they are set.`,
  minigamePlayDescription: (minigame: MinigameType): string =>
    `${formatMinigameName(minigame)} is live for this team turn.`,
  minigameWaitingForViewLabel:
    "Waiting for minigame host state from the server snapshot.",
  minigameRendererUnavailableLabel: (minigame: MinigameType): string =>
    `${formatMinigameName(minigame)} host surface is not available yet.`,
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
  // One headline pattern across the host (DESIGN.md §2.0A): a white lead and the
  // phrase that matters last, in `primary`.
  compactLeadPrefix: "In the lead:",
  compactWinsPrefix: "Champion:",
  compactTiedLeadPrefix: "Level at the top:",
  compactTiedTeamsLabel: (teamCount: number): string => `${teamCount} teams`,
  compactAllTiedLabel: "All teams",
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
    "Adjust the order for the round about to start. Each round opens one team further down the list than the last.",
  turnOrderLockedDescription:
    "Turn order is locked once a round is under way. Edit before the game starts or between rounds.",
  turnOrderLockedStatusLabel: "Locked until the round ends",
  turnOrderEmptyLabel: "Turn order will appear when teams are available.",
  turnOrderPositionLabel: (index: number, total: number): string =>
    `Team ${index + 1} of ${total}`,
  turnOrderMoveUpButtonLabel: "Move Up",
  turnOrderMoveDownButtonLabel: "Move Down"
} as const;
