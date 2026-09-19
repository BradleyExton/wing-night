import type {
  EmojiCharadesDeckOption,
  EmojiCharadesMinigameHostSubject,
  EmojiCharadesSubject,
  EmojiCharadesSubjectReveal,
  MinigameDisplayView,
  MinigameHostView
} from "@wingnight/shared";

import { findEmojiCharadesDeck } from "../content/index.js";
import type {
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

  return { id: subject.id, text: subject.text };
};

// A deck is only offered once it can carry a full turn: the gate is what makes
// mid-turn subject exhaustion impossible, so the cursor never has to wrap.
export const toEmojiCharadesDeckOptions = (
  content: EmojiCharadesRuntimeContent,
  pointsMax: number
): EmojiCharadesDeckOption[] => {
  return content.decks.map((deck) => ({
    id: deck.id,
    label: deck.label,
    subjectCount: deck.subjects.length,
    isSelectable: deck.subjects.length >= pointsMax
  }));
};

const cloneReveal = (
  reveal: EmojiCharadesSubjectReveal | null
): EmojiCharadesSubjectReveal | null => {
  return reveal === null ? null : { ...reveal };
};

const toHostSubject = (
  subject: EmojiCharadesSubject | null
): EmojiCharadesMinigameHostSubject | null => {
  return subject === null ? null : { id: subject.id, text: subject.text };
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

  if (state.status === "deck_selection") {
    return {
      ...base,
      status: "deck_selection",
      availableDecks: toEmojiCharadesDeckOptions(content, state.pointsMax)
    };
  }

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

// Answer-safe: no `currentSubject`, no cursor, no subject count. Subject text
// reaches the TV only through `reveal`, which the tablet has already resolved.
export const toEmojiCharadesDisplayView = (
  state: EmojiCharadesRuntimeState,
  content: EmojiCharadesRuntimeContent
): MinigameDisplayView => {
  const base = {
    minigame: "EMOJI_CHARADES" as const,
    activeTurnTeamId: state.activeTurnTeamId,
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId }
  };

  if (state.status === "deck_selection") {
    return {
      ...base,
      status: "deck_selection",
      availableDecks: toEmojiCharadesDeckOptions(content, state.pointsMax)
    };
  }

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
