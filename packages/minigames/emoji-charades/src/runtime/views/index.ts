import type {
  EmojiCharadesMinigameHostSubject,
  EmojiCharadesSubject,
  EmojiCharadesSubjectReveal,
  MinigameDisplayView,
  MinigameHostView
} from "@wingnight/shared";

import {
  cloneEmojiCharadesSubject,
  findEmojiCharadesDeck
} from "../content/index.js";
import type {
  EmojiCharadesMinigameRules,
  EmojiCharadesRuntimeContent,
  EmojiCharadesRuntimeState
} from "../types/index.js";

export const resolveCurrentEmojiCharadesSubject = (
  state: EmojiCharadesRuntimeState,
  content: EmojiCharadesRuntimeContent
): EmojiCharadesSubject | null => {
  const deck = findEmojiCharadesDeck(content, state.selectedDeckId);

  if (deck === null) {
    return null;
  }

  const subjectId = state.shuffledSubjectIds[state.subjectCursor];

  if (subjectId === undefined) {
    return null;
  }

  const subject = deck.subjects.find((entry) => entry.id === subjectId);

  if (subject === undefined) {
    return null;
  }

  return cloneEmojiCharadesSubject(subject);
};

const cloneReveal = (
  reveal: EmojiCharadesSubjectReveal | null
): EmojiCharadesSubjectReveal | null => {
  return reveal === null ? null : { ...reveal };
};

const toHostSubject = (
  subject: EmojiCharadesSubject | null
): EmojiCharadesMinigameHostSubject | null => {
  if (subject === null) {
    return null;
  }

  return {
    id: subject.id,
    text: subject.text,
    lockedEmojis: subject.lockedEmojis === undefined ? null : [...subject.lockedEmojis]
  };
};

export const toEmojiCharadesHostView = (
  state: EmojiCharadesRuntimeState,
  content: EmojiCharadesRuntimeContent
): MinigameHostView => {
  const base = {
    minigame: "EMOJI_CHARADES" as const,
    activeTurnTeamId: state.activeTurnTeamId,
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId }
  };

  if (state.status === "turn_complete") {
    return { ...base, status: "turn_complete", reveal: cloneReveal(state.reveal) };
  }

  return {
    ...base,
    status: "playing",
    currentSubject: toHostSubject(
      resolveCurrentEmojiCharadesSubject(state, content)
    ),
    emojiSequence: [...state.emojiSequence],
    subjectsRemaining: Math.max(
      0,
      state.shuffledSubjectIds.length - state.subjectCursor
    ),
    reveal: cloneReveal(state.reveal)
  };
};

// Answer-safe: no `currentSubject`, no cursor, no subject count. It takes no
// content at all — subject text reaches the TV only through `reveal`, which
// the tablet has already resolved.
export const toEmojiCharadesDisplayView = (
  state: EmojiCharadesRuntimeState,
  rules: EmojiCharadesMinigameRules
): MinigameDisplayView => {
  const base = {
    minigame: "EMOJI_CHARADES" as const,
    activeTurnTeamId: state.activeTurnTeamId,
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    pointsPerCorrect: rules.pointsPerCorrect
  };

  if (state.status === "turn_complete") {
    return { ...base, status: "turn_complete", reveal: cloneReveal(state.reveal) };
  }

  return {
    ...base,
    status: "playing",
    emojiSequence: [...state.emojiSequence],
    reveal: cloneReveal(state.reveal)
  };
};
