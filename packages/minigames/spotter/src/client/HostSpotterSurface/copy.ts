import type { SpotterHostShot } from "@wingnight/shared";

export const hostSpotterSurfaceCopy = {
  railTitle: "Spotter",
  teamPrefix: "Holder for",
  noAssignedTeamLabel: "Unassigned team",
  pendingChip: (points: number): string => `+${points} pending`,
  introDescription:
    "Hand the tablet to the holder and sit them with their back to the TV. Their team calls every move; the holder only taps.",
  waitingLabel: "Waiting for the field…",
  targetProgress: (current: number, total: number): string =>
    `Target ${current} of ${total}`,
  nudgesLabel: (nudges: number): string =>
    `${nudges} nudge${nudges === 1 ? "" : "s"}`,
  shotLabel: (shot: SpotterHostShot): string => {
    if (shot.band === "HIT") {
      return `Hit! +${shot.points}`;
    }

    if (shot.band === "CLOSE") {
      return `Close · +${shot.points}`;
    }

    return "Miss";
  },
  doneLabel: "All targets resolved. Advance when ready.",
  upLabel: "Up",
  downLabel: "Down",
  leftLabel: "Left",
  rightLabel: "Right",
  fireLabel: "Fire",
  fireHint: "hold",
  fireChargingHint: "holding…",
  padInstruction: "Edges nudge one cell. Hold the centre to fire."
} as const;
