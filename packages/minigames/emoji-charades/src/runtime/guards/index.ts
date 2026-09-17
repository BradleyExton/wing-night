import type { SerializableValue } from "@wingnight/minigames-core";
import type { EmojiCharadesSubState } from "@wingnight/shared";

import {
  DEFAULT_EMOJI_CHARADES_RULES,
  type EmojiCharadesMinigameRules,
  type EmojiCharadesRuntimeState
} from "../types/index.js";

const SUB_STATES: readonly EmojiCharadesSubState[] = [
  "deck_selection",
  "playing",
  "turn_complete"
];

const isObjectLike = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
};

const isNumberRecord = (value: unknown): value is Record<string, number> => {
  return (
    isObjectLike(value) &&
    Object.values(value).every((entry) => typeof entry === "number")
  );
};

export const isEmojiCharadesRuntimeState = (
  value: unknown
): value is EmojiCharadesRuntimeState => {
  if (!isObjectLike(value)) {
    return false;
  }

  if (
    value.activeTurnTeamId !== null &&
    typeof value.activeTurnTeamId !== "string"
  ) {
    return false;
  }

  if (!SUB_STATES.includes(value.status as EmojiCharadesSubState)) {
    return false;
  }

  if (value.selectedDeckId !== null && typeof value.selectedDeckId !== "string") {
    return false;
  }

  if (!isStringArray(value.shuffledSubjectIds)) {
    return false;
  }

  if (
    typeof value.subjectCursor !== "number" ||
    !Number.isInteger(value.subjectCursor) ||
    value.subjectCursor < 0
  ) {
    return false;
  }

  if (!isStringArray(value.emojiSequence)) {
    return false;
  }

  if (value.reveal !== null && !isObjectLike(value.reveal)) {
    return false;
  }

  return isNumberRecord(value.pendingPointsByTeamId);
};

export const isSelectDeckPayload = (
  value: SerializableValue
): value is { deckId: string } => {
  return (
    isObjectLike(value) &&
    typeof value.deckId === "string" &&
    value.deckId.trim().length > 0
  );
};

export const isAppendEmojiPayload = (
  value: SerializableValue
): value is { emoji: string } => {
  return (
    isObjectLike(value) &&
    typeof value.emoji === "string" &&
    value.emoji.trim().length > 0
  );
};

const REGIONAL_INDICATOR_FIRST = 0x1f1e6;
const REGIONAL_INDICATOR_LAST = 0x1f1ff;
const COMBINING_ENCLOSING_KEYCAP = 0x20e3;

// Letters spell the answer outright, so the picker hides them and the reducer
// refuses them: regional-indicator letters 🇦–🇿 and keycap digits 0️⃣–9️⃣.
export const isLetterEmoji = (emoji: string): boolean => {
  for (const character of emoji) {
    const codePoint = character.codePointAt(0);

    if (codePoint === undefined) {
      continue;
    }

    if (
      codePoint >= REGIONAL_INDICATOR_FIRST &&
      codePoint <= REGIONAL_INDICATOR_LAST
    ) {
      return true;
    }

    if (codePoint === COMBINING_ENCLOSING_KEYCAP) {
      return true;
    }
  }

  return false;
};

export const isEmojiCharadesRules = (
  value: unknown
): value is EmojiCharadesMinigameRules => {
  if (!isObjectLike(value)) {
    return false;
  }

  if (
    "pointsPerCorrect" in value &&
    (typeof value.pointsPerCorrect !== "number" ||
      !Number.isInteger(value.pointsPerCorrect) ||
      value.pointsPerCorrect < 0)
  ) {
    return false;
  }

  if ("banLetterEmojis" in value && typeof value.banLetterEmojis !== "boolean") {
    return false;
  }

  return true;
};

export const resolveEmojiCharadesRules = (
  rules: SerializableValue | null
): EmojiCharadesMinigameRules => {
  if (!isEmojiCharadesRules(rules)) {
    return { ...DEFAULT_EMOJI_CHARADES_RULES };
  }

  return {
    pointsPerCorrect:
      typeof rules.pointsPerCorrect === "number"
        ? rules.pointsPerCorrect
        : DEFAULT_EMOJI_CHARADES_RULES.pointsPerCorrect,
    banLetterEmojis:
      typeof rules.banLetterEmojis === "boolean"
        ? rules.banLetterEmojis
        : DEFAULT_EMOJI_CHARADES_RULES.banLetterEmojis
  };
};
