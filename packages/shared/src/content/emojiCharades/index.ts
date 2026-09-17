import type { ValidationIssue } from "../validationIssue/index.js";

export type EmojiCharadesSubject = {
  id: string;
  text: string;
};

export type EmojiCharadesDeck = {
  id: string;
  label: string;
  subjects: EmojiCharadesSubject[];
};

export type EmojiCharadesContentFile = {
  decks: EmojiCharadesDeck[];
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isObjectLike = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const validateEmojiCharadesSubject = (
  value: unknown
): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  return (["id", "text"] as const)
    .filter((field) => !isNonEmptyString(value[field]))
    .map((field) => ({ path: field, message: "must be a non-empty string" }));
};

// Decks own their own id namespace: subject ids must be unique within a deck
// but may repeat across decks, since only one deck is ever in play at a time.
export const validateEmojiCharadesDeck = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  const issues: ValidationIssue[] = (["id", "label"] as const)
    .filter((field) => !isNonEmptyString(value[field]))
    .map((field) => ({ path: field, message: "must be a non-empty string" }));

  if (!Array.isArray(value.subjects)) {
    issues.push({ path: "subjects", message: "must be an array" });
    return issues;
  }

  if (value.subjects.length === 0) {
    issues.push({ path: "subjects", message: "must not be empty" });
    return issues;
  }

  const seenSubjectIds = new Set<string>();

  value.subjects.forEach((subject, index) => {
    validateEmojiCharadesSubject(subject).forEach((issue) => {
      issues.push({
        path:
          issue.path.length === 0
            ? `subjects[${index}]`
            : `subjects[${index}].${issue.path}`,
        message: issue.message
      });
    });

    if (isObjectLike(subject) && isNonEmptyString(subject.id)) {
      if (seenSubjectIds.has(subject.id)) {
        issues.push({
          path: `subjects[${index}].id`,
          message: "must be unique within the deck"
        });
      }

      seenSubjectIds.add(subject.id);
    }
  });

  return issues;
};

export const validateEmojiCharadesContentFile = (
  value: unknown
): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  if (!Array.isArray(value.decks)) {
    return [{ path: "decks", message: "must be an array" }];
  }

  if (value.decks.length === 0) {
    return [{ path: "decks", message: "must not be empty" }];
  }

  const issues: ValidationIssue[] = [];
  const seenDeckIds = new Set<string>();

  value.decks.forEach((deck, index) => {
    validateEmojiCharadesDeck(deck).forEach((issue) => {
      issues.push({
        path:
          issue.path.length === 0 ? `decks[${index}]` : `decks[${index}].${issue.path}`,
        message: issue.message
      });
    });

    if (isObjectLike(deck) && isNonEmptyString(deck.id)) {
      if (seenDeckIds.has(deck.id)) {
        issues.push({
          path: `decks[${index}].id`,
          message: "must be unique across the file"
        });
      }

      seenDeckIds.add(deck.id);
    }
  });

  return issues;
};

export const isEmojiCharadesSubject = (
  value: unknown
): value is EmojiCharadesSubject => {
  return validateEmojiCharadesSubject(value).length === 0;
};

export const isEmojiCharadesDeck = (value: unknown): value is EmojiCharadesDeck => {
  return validateEmojiCharadesDeck(value).length === 0;
};

export const isEmojiCharadesContentFile = (
  value: unknown
): value is EmojiCharadesContentFile => {
  return validateEmojiCharadesContentFile(value).length === 0;
};
