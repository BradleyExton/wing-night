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
  pointsSealValue: (points: number): string => `+${points}`,
  pointsSealLabel: "pts",
  authoredPromptLabel: "The real prompt"
} as const;
