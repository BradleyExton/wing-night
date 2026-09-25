import { MINIGAME_DEFINITIONS } from "@wingnight/shared";

import { formatGeoDistance } from "../formatGeoDistance/index.js";

export const displayGeoSurfaceCopy = {
  title: MINIGAME_DEFINITIONS.GEO.displayName,
  // The active team's pending points, lit beside its name the way JOUST's are.
  pendingPoints: (points: number): string => `+${points}`,
  photoCounter: (current: number, total: number): string =>
    `Photo ${current} / ${total}`,
  introMessage: "Lining up the next photo...",
  waitingMessage: "Waiting for the next photo...",
  eyebrow: "Where was this taken?",
  hintLabel: (hint: string): string => `“${hint}”`,
  plottingStatus: (teamName: string): string => `${teamName} is dropping a pin`,
  distanceLabel: "Off by",
  distanceValue: formatGeoDistance,
  distanceTitle: (value: string, unit: string): string => `${value} ${unit}`,
  pointsLabel: "Points",
  pointsValue: (points: number): string => `+${points}`,
  guessPinLabel: "Their pin",
  answerPinLabel: "Actual spot"
} as const;
