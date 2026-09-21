import type {
  EmojiCharadesSubjectOutcome,
  MinigameType
} from "@wingnight/shared";
import type {
  MinigameRuntimePlugin,
  MinigameRuntimeReductionResult
} from "@wingnight/minigames-core";

import {
  dealEmojiCharadesDeck,
  emojiCharadesContentAdapter,
  resolveEmojiCharadesContent
} from "./content/index.js";
import {
  isAppendEmojiPayload,
  isEmojiCharadesRules,
  isEmojiCharadesRuntimeState,
  isLetterEmoji,
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
    // The turn opens on its first subject: the deck is dealt here rather than
    // chosen on the tablet, so nobody spends the clock browsing.
    const dealtDeck = dealEmojiCharadesDeck(
      resolveEmojiCharadesContent(input.content),
      input.pointsMax
    );

    const initialState: EmojiCharadesRuntimeState = {
      activeTurnTeamId: input.activeRoundTeamId ?? input.teamIds[0] ?? null,
      status: "playing",
      selectedDeckId: dealtDeck?.id ?? null,
      shuffledSubjectIds:
        dealtDeck === null
          ? []
          : shuffleSubjectIds(dealtDeck.subjects.map((subject) => subject.id)),
      subjectCursor: 0,
      emojiSequence: [],
      reveal: null,
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
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

      // A locked subject is a bit, and the bit only lands if it holds: the
      // reducer refuses anything off the authored list, the same way the
      // picker refuses to draw it.
      const lockedEmojis = resolveCurrentEmojiCharadesSubject(
        state,
        resolveEmojiCharadesContent(input.content)
      )?.lockedEmojis;

      if (lockedEmojis !== undefined && !lockedEmojis.includes(emoji)) {
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
      resolveEmojiCharadesRules(input.rules)
    );
  }
};
