import { isEmojiToken, isLetterEmoji } from "../../runtime/guards/index.js";

// Search looks emoji up by what they are called and what they mean — "dog",
// "dino", "money", "cry" — across every emoji there is, not just the tabs. The
// names and keywords are emojilib's: ~1,900 emoji, each with its CLDR-style
// name first ("dog_face") and the words a person would reach for after it
// ("puppy", "pet", "woof").
export type EmojiKeywords = Record<string, string[]>;

export type EmojiSearchEntry = {
  emoji: string;
  nameWords: string[];
  keywordWords: string[];
};

export const SEARCH_RESULT_LIMIT = 80;

const splitWords = (text: string): string[] => {
  return text
    .toLowerCase()
    .split(/[\s_\-:,.'’]+/)
    .filter((word) => word.length > 0);
};

// Built once when the keywords load. Letter emoji are left out here, as the
// catalog leaves them out, because the reducer refuses them: regional
// indicators (and so the flags made of them) and keycap digits spell the answer.
export const buildEmojiSearchIndex = (keywords: EmojiKeywords): EmojiSearchEntry[] => {
  return Object.entries(keywords)
    .filter(([emoji]) => isEmojiToken(emoji) && !isLetterEmoji(emoji))
    .map(([emoji, [name = "", ...rest]]) => ({
      emoji,
      nameWords: splitWords(name),
      keywordWords: rest.flatMap(splitWords)
    }));
};

// A whole word beats the start of one, and the start of one beats the middle:
// "car" is 🚗 before it is 💳 ("card") and long before it is 😨 ("scared").
const scoreWord = (word: string, term: string): number => {
  if (word === term) {
    return 4;
  }

  if (word.startsWith(term)) {
    return 2;
  }

  return term.length >= 5 && word.includes(term) ? 0.5 : 0;
};

const scoreTerm = (entry: EmojiSearchEntry, term: string): number => {
  const nameScore = Math.max(0, ...entry.nameWords.map((word) => scoreWord(word, term)));
  const keywordScore = Math.max(
    0,
    ...entry.keywordWords.map((word) => scoreWord(word, term))
  );

  // A word in the name outranks the same word as a keyword: "dog" is 🐶 and
  // 🐕 before it is every animal that lists "dog" somewhere down its list.
  return Math.max(nameScore > 0 ? nameScore + 1 : 0, keywordScore);
};

// Every word typed has to match something, so "red car" narrows rather than
// widens. Ties keep emojilib's own order, which is Unicode's.
export const searchEmojiIndex = (
  index: EmojiSearchEntry[],
  query: string
): string[] => {
  const trimmedQuery = query.trim();
  const terms = splitWords(trimmedQuery);

  if (terms.length === 0) {
    return [];
  }

  const scored: { emoji: string; score: number; order: number }[] = [];

  index.forEach((entry, order) => {
    if (entry.emoji === trimmedQuery) {
      scored.push({ emoji: entry.emoji, score: Number.POSITIVE_INFINITY, order });
      return;
    }

    let score = 0;

    for (const term of terms) {
      const termScore = scoreTerm(entry, term);

      if (termScore === 0) {
        return;
      }

      score += termScore;
    }

    scored.push({ emoji: entry.emoji, score, order });
  });

  return scored
    .sort((left, right) => right.score - left.score || left.order - right.order)
    .slice(0, SEARCH_RESULT_LIMIT)
    .map((result) => result.emoji);
};

// The keywords are ~250KB of JSON, so they ride in their own chunk and load
// when the picker first mounts rather than with the app.
export const loadEmojiSearchIndex = async (): Promise<EmojiSearchEntry[]> => {
  const emojilib = await import("emojilib");

  // emojilib's main is the JSON itself, so at runtime `default` IS the keyword
  // map; its typings describe an ES module with a default export, which a
  // NodeNext import of a CommonJS package wraps one level deeper.
  return buildEmojiSearchIndex(emojilib.default as unknown as EmojiKeywords);
};
