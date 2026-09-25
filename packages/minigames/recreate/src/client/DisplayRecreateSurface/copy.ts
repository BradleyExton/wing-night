import { MINIGAME_DEFINITIONS } from "@wingnight/shared";

export const displayRecreateSurfaceCopy = {
  title: MINIGAME_DEFINITIONS.RECREATE.displayName,
  studioSubtitle: "Wing Night Appraisal Office",
  introMessage: "The forger is warming up…",
  waitingMessage: "Waiting for a target…",
  originalCaption: "The original",
  targetCaption: "The target",
  attemptCaption: "The forgery",
  writingStatus: (teamName: string): string => `${teamName} is writing the prompt`,
  sealedIngredientsLabel: "Ingredients sealed until the prompt is in",
  promptLabel: "Their prompt",
  ingredientsLabel: "Secret ingredients",
  attemptGeneratingLabel: "Painting…",
  attemptFailedLabel: "The forger bailed",
  attemptSkippedLabel: "Judged by ear tonight",
  // The appraisal is the house `<ResultPlaque>` (DESIGN.md §2.2E), not a stamp.
  appraisalKicker: "Appraised",
  appraisalTitle: (named: number, total: number): string =>
    `${named} of ${total} ingredient${total === 1 ? "" : "s"}`,
  pointsValue: (points: number): string => `+${points}`,
  pointsCaption: "pts",
  authoredPromptLabel: "The real prompt"
} as const;
