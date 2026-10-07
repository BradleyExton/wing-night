import type { SerializableValue } from "@wingnight/minigames-core";
import { isRecord, isRecordOf, isStringArray, type EmojiCharadesSubState } from "@wingnight/shared";

import {
  DEFAULT_EMOJI_CHARADES_RULES,
  type EmojiCharadesMinigameRules,
  type EmojiCharadesRoundMemory,
  type EmojiCharadesRuntimeState
} from "../types/index.js";

const SUB_STATES: readonly EmojiCharadesSubState[] = ["playing", "turn_complete"];

// Any number, NaN included — looser than the shared `isNumberRecord`, which
// wants every value finite. Kept as it was rather than tightened in passing.
const isNumber = (entry: unknown): entry is number => typeof entry === "number";

export const isEmojiCharadesRuntimeState = (
  value: unknown
): value is EmojiCharadesRuntimeState => {
  if (!isRecord(value)) {
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

  if (!isStringArray(value.shuffledSubjectIds) || !isStringArray(value.roundShownSubjectIds)) {
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

  if (value.reveal !== null && !isRecord(value.reveal)) {
    return false;
  }

  return isRecordOf(value.pendingPointsByTeamId, isNumber);
};

export const isEmojiCharadesRoundMemory = (
  value: SerializableValue | null | undefined
): value is EmojiCharadesRoundMemory => {
  return isRecord(value) && isStringArray(value.shownSubjectIds);
};

// One clue slot holds one emoji, so the payload has to be exactly that: a run
// of pictographs, emoji components (skin tones, ZWJ, variation selectors,
// regional indicators, keycaps) and flag tag characters. Anything else — plain
// text, markup, a sentence, a novel — would ride the sequence straight onto the
// TV, and the subject word is plain text. Defence in depth: the picker only
// ever sends a catalog emoji.
const EMOJI_TOKEN_PATTERN =
  /^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|[\u{E0020}-\u{E007F}])+$/u;

// Headroom over the longest sequences in use: a tag-sequence flag and the
// family ZWJ sequence are 7 code points each.
const MAX_EMOJI_CODE_POINTS = 16;

export const isEmojiToken = (value: string): boolean => {
  if (!EMOJI_TOKEN_PATTERN.test(value)) {
    return false;
  }

  return [...value].length <= MAX_EMOJI_CODE_POINTS;
};

export const isAppendEmojiPayload = (
  value: SerializableValue
): value is { emoji: string } => {
  return (
    isRecord(value) &&
    typeof value.emoji === "string" &&
    isEmojiToken(value.emoji)
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
  if (!isRecord(value)) {
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
