import { formatGeoDistance } from "../formatGeoDistance/index.js";

export const displayGeoSurfaceCopy = {
  showTitle: "Geo",
  photoCounter: (current: number, total: number): string =>
    `Photo ${current} / ${total}`,
  introMessage: "Lining up the next photo...",
  waitingMessage: "Waiting for the next photo...",
  eyebrow: "Where was this taken?",
  hintLabel: (hint: string): string => `“${hint}”`,
  plottingStatus: (teamName: string): string => `${teamName} is dropping a pin`,
  distanceLabel: "Off by",
  distanceValue: formatGeoDistance,
  pointsLabel: "Points",
  pointsValue: (points: number): string => `+${points}`,
  guessPinLabel: "Their pin",
  answerPinLabel: "Actual spot"
} as const;
