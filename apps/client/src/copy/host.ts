import { Phase, type MinigameType } from "@wingnight/shared";

const formatPhaseLabel = (phase: Phase): string => {
  return phase
    .toLowerCase()
    .split("_")
    .map((segment) => `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1)}`)
    .join(" ");
};

const phaseAdvanceHint = (phase: Phase): string => {
  switch (phase) {
    case Phase.SETUP:
      return "Advance when teams are assigned and the room is ready to start.";
    case Phase.INTRO:
      return "Advance when the room is ready for Round 1.";
    case Phase.ROUND_INTRO:
      return "Advance when players are ready to begin eating.";
    case Phase.EATING:
      return "Advance when eating participation is captured for the active team.";
    case Phase.MINIGAME_INTRO:
      return "Advance when the active team is ready to start the mini-game.";
    case Phase.MINIGAME_PLAY:
      return "Advance when the active team turn has been scored.";
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
      return "Confirm teams are ready before starting the first round.";
    case Phase.ROUND_INTRO:
      return "Review this round and confirm players are ready to eat.";
    case Phase.EATING:
      return "Track wing participation and manage the active turn timer.";
    case Phase.MINIGAME_INTRO:
      return "Confirm the active team before minigame play begins.";
    case Phase.MINIGAME_PLAY:
      return "Record outcomes for the active team turn.";
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
  headerTurnContextTitle: "Turn",
  headerActiveTeamContextTitle: "Active Team",
  headerSauceContextTitle: "Sauce",
  headerMinigameContextTitle: "Mini-game",
  headerPreGameLabel: "Pre-game",
  headerWaitingTitle: "Waiting for room state",
  headerWaitingDescription:
    "Host controls will update when the latest snapshot arrives.",
  headerPhaseDescription: phaseDescription,
  nextPhaseButtonLabel: "Next Phase",
  teamSetupTitle: "Team Setup",
  teamSetupDescription:
    "Add teams and map players before moving the game forward.",
  teamNameInputLabel: "Team Name",
  teamNameInputPlaceholder: "Enter a team name",
  createTeamButtonLabel: "Create Team",
  playersSectionTitle: "Players",
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
  timerValue: (remainingSeconds: number): string => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  },
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
  turnProgressTitle: "Turn Progress",
  turnProgressLabel: (turnNumber: number, totalTurns: number): string =>
    `Team ${turnNumber} of ${totalTurns}`,
  triviaSectionDescription:
    "Mark the active team's answer as correct or incorrect.",
  minigameSectionTitle: "Mini-Game",
  minigameIntroDescription: (minigame: MinigameType): string =>
    `${minigame} is queued. Advance when players are ready to begin.`,
  minigameFallbackType: "TRIVIA" as MinigameType,
  waitingStateLabel: "Waiting for room state...",
  triviaActiveTeamLabel: (teamName: string): string => `Active Team: ${teamName}`,
  triviaQuestionLabel: "Question",
  triviaAnswerLabel: "Answer",
  triviaCorrectButtonLabel: "Correct",
  triviaIncorrectButtonLabel: "Incorrect",
  compactPhaseStatusTitle: "Phase Status",
  compactRoundContextTitle: "Round Context",
  compactStandingsTitle: "Standings Snapshot",
  compactNextActionTitle: "Next Action",
  compactNoRoundContextLabel: "Round details are not available for this phase yet.",
  compactNoStandingsLabel: "No teams available for standings yet.",
  compactLeaderLabel: "Leader",
  compactPhaseLabel: formatPhaseLabel,
  compactPhaseDescription: phaseDescription,
  compactNextActionHint: phaseAdvanceHint,
  compactRoundProgressLabel: (currentRound: number, totalRounds: number): string =>
    `Round ${Math.max(currentRound, 1)} of ${totalRounds}`,
  compactRoundLabel: (label: string): string => `Label: ${label}`,
  compactSauceLabel: (sauce: string): string => `Sauce: ${sauce}`,
  compactMinigameLabel: (minigame: MinigameType): string =>
    `Mini-game: ${minigame}`,
  compactScoreLabel: (score: number): string => `${score} pts`,
  teamMembersLabel: (memberCount: number): string =>
    `${memberCount} player${memberCount === 1 ? "" : "s"}`
} as const;
