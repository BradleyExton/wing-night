import { formatGeoDistance } from "../formatGeoDistance/index.js";

export const hostGeoSurfaceCopy = {
  photoCounter: (current: number, total: number): string =>
    `Photo ${current} / ${total}`,
  noAssignedTeamLabel: "No team assigned",
  introDescription: "Brief the team, then advance to open the map.",
  waitingPromptLabel: "Waiting for the next photo.",
  eyebrow: "Where was this taken?",
  hintLabel: (hint: string): string => `“${hint}”`,
  mapInstructionLabel: "Tap the map to place your pin. Tap again to move it.",
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
  zoomOutLabel: "Zoom out"
} as const;
