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
  triviaSectionDescription:
    "Mark the active team's answer as correct or incorrect.",
  triviaLockedDescription:
    "Pass-and-play is locked. Hold to unlock host-only controls.",
  triviaUnlockedDescription:
    "Host controls are unlocked. Mark the answer, then relock before passing.",
  triviaActiveTeamLabel: (teamName: string): string => `Active Team: ${teamName}`,
  passAndPlayLockedStateLabel: "Pass-and-Play: Locked",
  passAndPlayUnlockedStateLabel: "Pass-and-Play: Unlocked",
  passAndPlayHoldToUnlockButtonLabel: "Hold to Unlock",
  passAndPlayHoldInProgressLabel: "Keep holding to unlock...",
  passAndPlayRelockButtonLabel: "Relock Pass-and-Play",
  triviaQuestionLabel: "Question",
  triviaAnswerLabel: "Answer",
  triviaCorrectButtonLabel: "Correct",
  triviaIncorrectButtonLabel: "Incorrect",
  teamMembersLabel: (memberCount: number): string =>
    `${memberCount} player${memberCount === 1 ? "" : "s"}`
} as const;
