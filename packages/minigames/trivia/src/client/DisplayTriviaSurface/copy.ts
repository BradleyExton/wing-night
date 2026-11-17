import { MINIGAME_DEFINITIONS } from "@wingnight/shared";

export const displayTriviaSurfaceCopy = {
  introMessage: "Get ready",
  title: MINIGAME_DEFINITIONS.TRIVIA.displayName,
  // The TV's own wording, not the tablet's. The host's counter is operational —
  // how many questions are still his to run — while the room is watching a turn
  // run down. SCHLONIC's two surfaces split the same counter the same way
  // ("Run 1 of 3" on the tablet, "Run 1 / 3" on the wall).
  questionsToGoLabel: (count: number): string =>
    `${count} question${count === 1 ? "" : "s"} to go`,
  turnCompleteLabel: "Turn complete",
  waitingMessage: "Waiting for trivia prompt..."
} as const;
