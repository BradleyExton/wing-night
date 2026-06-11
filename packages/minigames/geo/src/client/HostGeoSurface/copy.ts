export const hostGeoSurfaceCopy = {
  introDescription:
    "Review the active team, then advance to begin the map challenge.",
  playDescription:
    "Hand the tablet to the active team. They tap the map to place a guess, then submit to lock it in.",
  activeTeamMetaLabel: "Team Up",
  promptProgressMetaLabel: "Prompt",
  promptProgressLabel: (current: number, total: number): string =>
    `${current} of ${total}`,
  noAssignedTeamLabel: "No assigned team",
  hintLabel: (hint: string): string => `Hint: ${hint}`,
  mapInstructionLabel: "Tap the map to drop your guess. Tap again to move it.",
  mapLoadingLabel: "Loading map...",
  submitButtonLabel: "Submit Guess",
  resultDistanceLabel: "Distance",
  resultDistanceValue: (distanceKm: number): string =>
    distanceKm < 1
      ? `${Math.round(distanceKm * 1000)} m away`
      : `${distanceKm.toFixed(distanceKm < 100 ? 1 : 0)} km away`,
  resultPointsLabel: "Points",
  resultPointsValue: (points: number): string =>
    `+${points} point${points === 1 ? "" : "s"}`,
  nextPromptButtonLabel: "Next Prompt",
  turnCompleteLabel:
    "This team has finished all map prompts. Advance when ready.",
  waitingPromptLabel: "Waiting for the next map prompt."
} as const;
