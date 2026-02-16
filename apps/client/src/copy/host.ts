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
  loadingStateLabel: "Waiting for room state...",
  unassignedOptionLabel: "Unassigned",
  assignmentSelectLabel: (playerName: string): string =>
    `Assign ${playerName} to a team`,
  noPlayersLabel: "No players available.",
  noTeamsLabel: "No teams created yet.",
  teamMembersLabel: (memberCount: number): string =>
    `${memberCount} player${memberCount === 1 ? "" : "s"}`
} as const;
