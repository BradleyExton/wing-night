export const displayGeoSurfaceCopy = {
  dossierTitle: "Field Dossier",
  dossierSubtitle: "Wing Night Expedition Society",
  introMessage: "A new dispatch is being decoded...",
  waitingMessage: "Awaiting the next dispatch from the field...",
  hintLabel: (hint: string): string => `“${hint}”`,
  plottingStatus: (teamName: string): string =>
    `The ${teamName} expedition is plotting coordinates`,
  distanceStamp: (distanceKm: number): string =>
    distanceKm < 1
      ? `${Math.round(distanceKm * 1000)} m off course`
      : `${distanceKm.toFixed(distanceKm < 100 ? 1 : 0)} km off course`,
  pointsSealValue: (points: number): string => `+${points}`,
  pointsSealLabel: "pts",
  guessPinLabel: "Your mark",
  answerPinLabel: "True site",
  postmarkLabel: "WN Post"
} as const;
