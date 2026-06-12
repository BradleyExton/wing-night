export const hostGeoSurfaceCopy = {
  logTitle: "Expedition Log",
  exhibitLabel: (current: number, total: number): string =>
    `Exhibit ${current} of ${total}`,
  teamPrefix: "Expedition party:",
  noAssignedTeamLabel: "Unassigned party",
  introDescription:
    "Brief the assembled party, then advance to open the field journal.",
  waitingPromptLabel: "The next dispatch has not yet arrived.",
  hintLabel: (hint: string): string => `“${hint}”`,
  mapInstructionLabel:
    "Mark the chart where you believe this was taken. Tap again to move the mark.",
  mapLoadingLabel: "Unrolling the chart...",
  submitButtonLabel: "Stamp the Guess",
  nextPromptButtonLabel: "Turn the Page",
  turnCompleteLabel: "The journal is full for this party. Advance when ready.",
  distanceStamp: (distanceKm: number): string =>
    distanceKm < 1
      ? `${Math.round(distanceKm * 1000)} m off course`
      : `${distanceKm.toFixed(distanceKm < 100 ? 1 : 0)} km off course`,
  pointsSealValue: (points: number): string => `+${points}`,
  pointsSealLabel: "pts"
} as const;
