import type {
  EmojiCharadesContentFile,
  EmojiCharadesSubjectReveal,
  EmojiCharadesSubState
} from "@wingnight/shared";

export type EmojiCharadesRuntimeContent = EmojiCharadesContentFile;

export type EmojiCharadesRuntimeState = {
  activeTurnTeamId: string | null;
  status: EmojiCharadesSubState;
  selectedDeckId: string | null;
  // Populated once, on selectDeck; the cursor never wraps.
  shuffledSubjectIds: string[];
  subjectCursor: number;
  emojiSequence: string[];
  reveal: EmojiCharadesSubjectReveal | null;
  pendingPointsByTeamId: Record<string, number>;
  // Selectors receive only { state, rules, content }, so the deck gate's
  // threshold has to travel in the state itself. initialize() seeds it and
  // reduceAction() refreshes it from the live input.
  pointsMax: number;
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
