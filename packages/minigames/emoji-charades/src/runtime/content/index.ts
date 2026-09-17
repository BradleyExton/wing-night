import {
  isEmojiCharadesContentFile,
  isEmojiCharadesDeck,
  type EmojiCharadesDeck,
  type EmojiCharadesSubject
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import type { EmojiCharadesRuntimeContent } from "../types/index.js";

export const EMOJI_CHARADES_CONTENT_FILE_NAME = "minigames/emoji-charades.json";

export const cloneEmojiCharadesSubject = (
  subject: EmojiCharadesSubject
): EmojiCharadesSubject => {
  return { id: subject.id, text: subject.text };
};

export const cloneEmojiCharadesDeck = (
  deck: EmojiCharadesDeck
): EmojiCharadesDeck => {
  return {
    id: deck.id,
    label: deck.label,
    subjects: deck.subjects.map(cloneEmojiCharadesSubject)
  };
};

// Strict parse for the server content loader: throws with file context so a
// malformed deck file fails fast at startup rather than mid-party.
export const parseEmojiCharadesContentFile = (
  rawContent: string,
  contentFilePath: string
): EmojiCharadesRuntimeContent => {
  let parsedContent: unknown;

  try {
    parsedContent = JSON.parse(rawContent);
  } catch (error) {
    const parseReason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to parse emoji charades content at "${contentFilePath}": ${parseReason}`
    );
  }

  if (!isEmojiCharadesContentFile(parsedContent)) {
    throw new Error(
      `Invalid emoji charades content at "${contentFilePath}": expected ` +
        `{ decks: [{ id, label, subjects: [{ id, text }] }] } with unique, ` +
        `non-empty ids and at least one deck.`
    );
  }

  return { decks: parsedContent.decks.map(cloneEmojiCharadesDeck) };
};

// Lenient resolve for runtime: drops anything malformed rather than throwing,
// mirroring the prompt-pack adapter the other games share.
export const resolveEmojiCharadesContent = (
  content: SerializableValue | null
): EmojiCharadesRuntimeContent => {
  if (typeof content !== "object" || content === null || Array.isArray(content)) {
    return { decks: [] };
  }

  if (!("decks" in content) || !Array.isArray(content.decks)) {
    return { decks: [] };
  }

  const candidateDecks: unknown[] = content.decks;
  const decks = candidateDecks.filter((deck): deck is EmojiCharadesDeck => {
    return isEmojiCharadesDeck(deck);
  });

  return { decks: decks.map(cloneEmojiCharadesDeck) };
};

export const emojiCharadesContentAdapter = {
  fileName: EMOJI_CHARADES_CONTENT_FILE_NAME,
  parseFileContent: (
    rawContent: string,
    contentFilePath: string
  ): SerializableValue => {
    return parseEmojiCharadesContentFile(
      rawContent,
      contentFilePath
    ) as unknown as SerializableValue;
  }
};

export const findEmojiCharadesDeck = (
  content: EmojiCharadesRuntimeContent,
  deckId: string | null
): EmojiCharadesDeck | null => {
  if (deckId === null) {
    return null;
  }

  return content.decks.find((deck) => deck.id === deckId) ?? null;
};
