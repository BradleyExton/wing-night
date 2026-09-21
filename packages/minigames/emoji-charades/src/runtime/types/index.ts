import type {
  EmojiCharadesContentFile,
  EmojiCharadesSubjectReveal,
  EmojiCharadesSubState
} from "@wingnight/shared";

export type EmojiCharadesRuntimeContent = EmojiCharadesContentFile;

export type EmojiCharadesRuntimeState = {
  activeTurnTeamId: string | null;
  status: EmojiCharadesSubState;
  // The deck the turn was dealt at initialize; the room never picks one.
  selectedDeckId: string | null;
  // Shuffled once, alongside the deal; the cursor never wraps.
  shuffledSubjectIds: string[];
  subjectCursor: number;
  emojiSequence: string[];
  reveal: EmojiCharadesSubjectReveal | null;
  pendingPointsByTeamId: Record<string, number>;
};

export type EmojiCharadesMinigameRules = {
  pointsPerCorrect: number;
  banLetterEmojis: boolean;
};

export const DEFAULT_EMOJI_CHARADES_RULES: EmojiCharadesMinigameRules = {
  pointsPerCorrect: 1,
  banLetterEmojis: true
};

export const SUBJECT_REVEAL_MS = 2000;

export const MAX_EMOJIS_PER_SUBJECT = 30;
