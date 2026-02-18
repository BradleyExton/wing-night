import { Phase, type MinigameType } from "@wingnight/shared";

export const hostCopy = {
  placeholderTitle: "Host Control Panel",
  placeholderDescription: "Create teams, assign players, and advance phases.",
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
  loadingStateLabel: "Waiting for room state...",
  setupLockedLabel: "Team setup is locked after the game starts.",
  unassignedOptionLabel: "Unassigned",
  assignmentSelectLabel: (playerName: string): string =>
    `Assign ${playerName} to a team`,
  noPlayersLabel: "No players available.",
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
  compactPhaseLabel: (phase: Phase): string =>
    phase
      .toLowerCase()
      .split("_")
      .map((segment) => `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1)}`)
      .join(" "),
  compactPhaseDescription: (phase: Phase): string => {
    switch (phase) {
      case Phase.INTRO:
        return "Confirm teams are ready before starting the first round.";
      case Phase.ROUND_INTRO:
        return "Review the upcoming round and confirm everyone is ready.";
      case Phase.ROUND_RESULTS:
        return "Review score updates and confirm the next round flow.";
      case Phase.FINAL_RESULTS:
        return "Final standings are locked for this game.";
      default:
        return "Review the current game state.";
    }
  },
  compactNextActionHint: (phase: Phase): string => {
    switch (phase) {
      case Phase.INTRO:
        return "Advance when the room is ready for Round 1.";
      case Phase.ROUND_INTRO:
        return "Advance when players are ready to begin eating.";
      case Phase.ROUND_RESULTS:
        return "Advance to continue to the next round or final results.";
      case Phase.FINAL_RESULTS:
        return "Game complete. Use reset controls when ready for a new game.";
      default:
        return "Use host controls to continue.";
    }
  },
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
