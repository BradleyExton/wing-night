// Two surfaces, two readers. The TV's copy is read from across the room by
// people who are not going to do anything about it, so it explains and
// reassures; the tablet's is read by the host, who can.
export type AppCrashSurface = "DISPLAY" | "CONTROL";

export const appErrorBoundaryCopy = {
  DISPLAY: {
    kicker: "Off the air",
    title: "The display dropped out.",
    recoveringDescription:
      "Bringing it back now. The server still has the room, so no scores are lost.",
    manualDescription:
      "Refresh the browser on the TV to bring it back. The server still has the room, so no scores are lost.",
    reloadButtonLabel: "Reload the Display"
  },
  CONTROL: {
    kicker: "Dropped the plate",
    title: "The controller dropped out.",
    recoveringDescription:
      "Reloading now. The server keeps the score, so the night picks up where it left off.",
    manualDescription:
      "Reload to get back to the night. The server keeps the score, so the night picks up where it left off.",
    reloadButtonLabel: "Reload"
  }
} as const satisfies Record<
  AppCrashSurface,
  {
    kicker: string;
    title: string;
    recoveringDescription: string;
    manualDescription: string;
    reloadButtonLabel: string;
  }
>;
