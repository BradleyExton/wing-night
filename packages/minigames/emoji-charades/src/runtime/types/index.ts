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
  // Shuffled once, alongside the deal, with anything the room has already seen
  // this round dealt last; the cursor never wraps.
  shuffledSubjectIds: string[];
  // Subjects earlier teams' turns revealed on the TV this round, from the
  // round memory, so this turn can hand the next one the whole list.
  roundShownSubjectIds: string[];
  subjectCursor: number;
  emojiSequence: string[];
  reveal: EmojiCharadesSubjectReveal | null;
  pendingPointsByTeamId: Record<string, number>;
};

// What one team's turn hands the next in the same round: every subject the TV
// has revealed, CORRECT or SKIPPED. Every team is dealt the same deck, so
// without it a later team was guessing answers the room had just watched.
export type EmojiCharadesRoundMemory = {
  shownSubjectIds: string[];
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
