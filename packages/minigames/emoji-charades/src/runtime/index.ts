import type {
  EmojiCharadesSubjectOutcome,
  MinigameType
} from "@wingnight/shared";
import type {
  MinigameRuntimePlugin,
  MinigameRuntimeReductionResult
} from "@wingnight/minigames-core";

import {
  emojiCharadesContentAdapter,
  findEmojiCharadesDeck,
  resolveEmojiCharadesContent
} from "./content/index.js";
import {
  isAppendEmojiPayload,
  isEmojiCharadesRules,
  isEmojiCharadesRuntimeState,
  isLetterEmoji,
  isSelectDeckPayload,
  resolveEmojiCharadesRules
} from "./guards/index.js";
import {
  MAX_EMOJIS_PER_SUBJECT,
  SUBJECT_REVEAL_MS,
  type EmojiCharadesRuntimeState
} from "./types/index.js";
import {
  resolveCurrentEmojiCharadesSubject,
  toEmojiCharadesDisplayView,
  toEmojiCharadesHostView
} from "./views/index.js";

export const emojiCharadesMinigameId: MinigameType = "EMOJI_CHARADES";

const shuffleSubjectIds = (subjectIds: string[]): string[] => {
  const shuffled = [...subjectIds];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const held = shuffled[index] as string;
    shuffled[index] = shuffled[swapIndex] as string;
    shuffled[swapIndex] = held;
  }

  return shuffled;
};

const resolveSubjectOutcome = (
  actionType: string
): EmojiCharadesSubjectOutcome | null => {
  if (actionType === "markCorrect") {
    return "CORRECT";
  }

  if (actionType === "skipSubject") {
    return "SKIPPED";
  }

  return null;
};

export const emojiCharadesRuntimePlugin: MinigameRuntimePlugin = {
  id: "EMOJI_CHARADES",
  content: emojiCharadesContentAdapter,
  isRules: isEmojiCharadesRules,
  initialize: (input) => {
    const initialState: EmojiCharadesRuntimeState = {
      activeTurnTeamId: input.activeRoundTeamId ?? input.teamIds[0] ?? null,
      status: "deck_selection",
      selectedDeckId: null,
      shuffledSubjectIds: [],
      subjectCursor: 0,
      emojiSequence: [],
      reveal: null,
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId },
      pointsMax: input.pointsMax
    };

    return initialState;
  },
  reduceAction: (input): MinigameRuntimeReductionResult => {
    const unchanged = { state: input.state, didMutate: false };

    if (!isEmojiCharadesRuntimeState(input.state)) {
      return unchanged;
    }

    const state = input.state;
    const actionType = input.envelope.actionType;
    const rules = resolveEmojiCharadesRules(input.rules);

    if (actionType === "selectDeck") {
      if (state.status !== "deck_selection") {
        return unchanged;
      }

      if (!isSelectDeckPayload(input.envelope.actionPayload)) {
        return unchanged;
      }

      const content = resolveEmojiCharadesContent(input.content);
      const deck = findEmojiCharadesDeck(
        content,
        input.envelope.actionPayload.deckId
      );

      if (deck === null) {
        return unchanged;
      }

      // The gate that guarantees the cursor can never run off the end.
      if (deck.subjects.length < input.pointsMax) {
        return unchanged;
      }

      return {
        state: {
          ...state,
          status: "playing",
          selectedDeckId: deck.id,
          shuffledSubjectIds: shuffleSubjectIds(
            deck.subjects.map((subject) => subject.id)
          ),
          subjectCursor: 0,
          emojiSequence: [],
          reveal: null,
          pointsMax: input.pointsMax
        },
        didMutate: true
      };
    }

    if (state.status !== "playing") {
      return unchanged;
    }

    if (actionType === "appendEmoji") {
      if (!isAppendEmojiPayload(input.envelope.actionPayload)) {
        return unchanged;
      }

      const emoji = input.envelope.actionPayload.emoji;

      // Defence in depth: the picker already hides these.
      if (rules.banLetterEmojis && isLetterEmoji(emoji)) {
        return unchanged;
      }

      if (state.emojiSequence.length >= MAX_EMOJIS_PER_SUBJECT) {
        return unchanged;
      }

      return {
        state: {
          ...state,
          emojiSequence: [...state.emojiSequence, emoji],
          reveal: null
        },
        didMutate: true
      };
    }

    if (actionType === "removeEmoji") {
      if (state.emojiSequence.length === 0) {
        return unchanged;
      }

      return {
        state: {
          ...state,
          emojiSequence: state.emojiSequence.slice(0, -1)
        },
        didMutate: true
      };
    }

    if (actionType === "clearEmojis") {
      if (state.emojiSequence.length === 0) {
        return unchanged;
      }

      return {
        state: { ...state, emojiSequence: [] },
        didMutate: true
      };
    }

    const outcome = resolveSubjectOutcome(actionType);

    if (outcome === null) {
      return unchanged;
    }

    const content = resolveEmojiCharadesContent(input.content);
    const currentSubject = resolveCurrentEmojiCharadesSubject(state, content);

    if (currentSubject === null) {
      return unchanged;
    }

    const nowMs = Date.now();
    const nextCursor = state.subjectCursor + 1;
    const exhausted = nextCursor >= state.shuffledSubjectIds.length;

    let pendingPointsByTeamId = { ...state.pendingPointsByTeamId };

    if (outcome === "CORRECT" && state.activeTurnTeamId !== null) {
      const previousPoints =
        pendingPointsByTeamId[state.activeTurnTeamId] ?? 0;
      pendingPointsByTeamId = {
        ...pendingPointsByTeamId,
        [state.activeTurnTeamId]: Math.min(
          input.pointsMax,
          previousPoints + rules.pointsPerCorrect
        )
      };
    }

    return {
      state: {
        ...state,
        status: exhausted ? "turn_complete" : "playing",
        subjectCursor: nextCursor,
        emojiSequence: [],
        pendingPointsByTeamId,
        pointsMax: input.pointsMax,
        reveal: {
          subjectId: currentSubject.id,
          subjectText: currentSubject.text,
          outcome,
          revealedAtMs: nowMs,
          expiresAtMs: nowMs + SUBJECT_REVEAL_MS
        }
      },
      didMutate: true
    };
  },
  syncPendingPoints: (input) => {
    if (!isEmojiCharadesRuntimeState(input.state)) {
      return input.state;
    }

    return {
      ...input.state,
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    };
  },
  selectHostView: (input) => {
    if (!isEmojiCharadesRuntimeState(input.state)) {
      return null;
    }

    return toEmojiCharadesHostView(
      input.state,
      resolveEmojiCharadesContent(input.content)
    );
  },
  selectDisplayView: (input) => {
    if (!isEmojiCharadesRuntimeState(input.state)) {
      return null;
    }

    return toEmojiCharadesDisplayView(
      input.state,
      resolveEmojiCharadesContent(input.content)
    );
  }
};
