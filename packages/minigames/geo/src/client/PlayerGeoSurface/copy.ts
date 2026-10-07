import { formatGeoDistance } from "../formatGeoDistance/index.js";

// A playing-team phone's GEO card (mockups/phone-answers, frames 1–2).
export const playerGeoSurfaceCopy = {
  eyebrow: (photoNumber: number, promptsPerTurn: number): string =>
    `Photo ${photoNumber} / ${promptsPerTurn} · Where was this taken?`,
  mapLoadingLabel: "Loading the map...",
  noPinYet: "Tap the map to drop your pin.",
  pinIn: "Your pin is in",
  openVoice: "Tap again to move it till the host locks the photo. The team scores its best pin.",
  offlineNote: "No map tiles on this Wi-Fi — tap your best guess on the grid, or ask the host for the tablet.",
  lockedTitle: "Locked in",
  lockedEyebrow: (photoNumber: number, promptsPerTurn: number): string => `Photo ${photoNumber} / ${promptsPerTurn}`,
  noPinVoice: "No pin from you on this one.",
  waitingVoice: "Watch the TV.",
  bestStamp: "✓ Best pin on the team",
  scoredStamp: "✓ On the board",
  missStamp: "✗ Not this time",
  distanceLabel: "Off by",
  distanceValue: formatGeoDistance,
  pointsLabel: "Points",
  pointsValue: (points: number): string => `+${points}`
} as const;
