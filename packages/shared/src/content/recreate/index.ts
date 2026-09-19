import { validatePromptPackFile } from "../promptPack/index.js";
import type { ValidationIssue } from "../validationIssue/index.js";

// One RECREATE target: a remix of a party photo that a team has to talk the
// image model back into. The pack author generates `targetImageSrc` ahead of
// the night (`pnpm import:recreate`) from `sourceImageSrc` and `prompt`; the
// `ingredients` are the visible things that prompt put in the picture, and
// they are the whole scoring rubric — the team's prompt is graded on how many
// of them it names, never on how the generated image looks.
//
// `prompt` and `ingredients` are the secret. They reach the display only once
// the team has submitted, and the authored prompt only once the host has
// locked the score.
export type RecreatePrompt = {
  id: string;
  title: string;
  // The remix the team is trying to recreate. Pack-relative
  // (`recreate/targets/cottage-underwater.png`) or a leading-slash sample path.
  targetImageSrc: string;
  // The untouched party photo the remix was made from. Optional: a sample
  // target has no photo behind it. When present it is sent along with the
  // team's prompt so their attempt is an edit of the same picture.
  sourceImageSrc?: string;
  // The prompt that made the target. Revealed at the end of the turn.
  prompt: string;
  // Two to six visible ingredients of that prompt, in display order.
  ingredients: string[];
};

export type RecreateContentFile = {
  prompts: RecreatePrompt[];
};

export const RECREATE_MIN_INGREDIENTS = 2;
export const RECREATE_MAX_INGREDIENTS = 6;

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isObjectLike = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const validateIngredients = (value: unknown): ValidationIssue[] => {
  if (!Array.isArray(value)) {
    return [{ path: "ingredients", message: "must be an array of ingredient labels" }];
  }

  if (value.length < RECREATE_MIN_INGREDIENTS || value.length > RECREATE_MAX_INGREDIENTS) {
    return [
      {
        path: "ingredients",
        message: `must list between ${RECREATE_MIN_INGREDIENTS} and ${RECREATE_MAX_INGREDIENTS} ingredients`
      }
    ];
  }

  return value.flatMap((ingredient, index) =>
    isNonEmptyString(ingredient)
      ? []
      : [{ path: `ingredients[${index}]`, message: "must be a non-empty string" }]
  );
};

export const validateRecreatePrompt = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  const stringFieldIssues = (["id", "title", "targetImageSrc", "prompt"] as const)
    .filter((field) => !isNonEmptyString(value[field]))
    .map((field) => ({ path: field, message: "must be a non-empty string" }));

  const sourceIssues: ValidationIssue[] =
    value.sourceImageSrc === undefined || isNonEmptyString(value.sourceImageSrc)
      ? []
      : [{ path: "sourceImageSrc", message: "must be a non-empty string when present" }];

  return [...stringFieldIssues, ...sourceIssues, ...validateIngredients(value.ingredients)];
};

export const validateRecreateContentFile = (value: unknown): ValidationIssue[] => {
  return validatePromptPackFile(value, validateRecreatePrompt);
};

export const isRecreatePrompt = (value: unknown): value is RecreatePrompt => {
  return validateRecreatePrompt(value).length === 0;
};

export const isRecreateContentFile = (value: unknown): value is RecreateContentFile => {
  return validateRecreateContentFile(value).length === 0;
};
