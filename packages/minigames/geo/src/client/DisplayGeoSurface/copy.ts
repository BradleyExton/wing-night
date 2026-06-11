export const displayGeoSurfaceCopy = {
  introMessage: "Get ready to read the map",
  waitingMessage: "Waiting for the next location...",
  guessingStatus: "is placing their guess",
  hintLabel: (hint: string): string => `Hint: ${hint}`,
  guessPinLabel: "Guess",
  answerPinLabel: "Answer",
  distanceLabel: "Distance",
  distanceValue: (distanceKm: number): string =>
    distanceKm < 1
      ? `${Math.round(distanceKm * 1000)} m`
      : `${distanceKm.toFixed(distanceKm < 100 ? 1 : 0)} km`,
  pointsLabel: "Points",
  pointsValue: (points: number): string =>
    `+${points} point${points === 1 ? "" : "s"}`
} as const;
