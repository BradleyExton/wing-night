import { formatGeoDistance } from "../formatGeoDistance/index.js";

export const hostGeoSurfaceCopy = {
  photoCounter: (current: number, total: number): string =>
    `Photo ${current} / ${total}`,
  introDescription: "Brief the team, then advance to open the map.",
  waitingPromptLabel: "Waiting for the next photo.",
  eyebrow: "Where was this taken?",
  hintLabel: (hint: string): string => `“${hint}”`,
  mapInstructionLabel: "Tap the map to place your pin. Tap again to move it.",
  // With the team's phones pinning too: who is in (never where), and that the tablet's own pin is
  // one more guess. The team scores its best pin.
  phonePinsLabel: (answered: number, seated: number): string =>
    `${answered} of ${seated} phone${seated === 1 ? "" : "s"} pinned · tap the map to add the tablet's pin`,
  offlineNote: "No map tiles on this Wi-Fi — tap your best guess on the grid.",
  bestPinDistanceLabel: (name: string | null): string => `${name ?? "Tablet"}'s pin · off by`,
  mapLoadingLabel: "Loading the map...",
  // Not "drop the pin" — that is what tapping the map already does, and a
  // button that repeats the gesture it follows reads as a second chance to do
  // the same thing rather than as the end of the turn.
  submitButtonLabel: "Lock it in",
  nextPromptButtonLabel: "Next photo",
  turnCompleteLabel: "That's every photo for this team. Advance when ready.",
  distanceLabel: "Off by",
  distanceValue: formatGeoDistance,
  pointsLabel: "Points",
  pointsValue: (points: number): string => `+${points}`,
  zoomInLabel: "Zoom in",
  zoomOutLabel: "Zoom out",
  zoomInGlyph: "+",
  zoomOutGlyph: "−"
} as const;
