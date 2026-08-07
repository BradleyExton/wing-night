// The single currency of content validation: every editable content surface
// returns these, so a caller (the config wizard, the server) can map a failure
// back to the field that caused it instead of getting one opaque boolean.
//
// `path` is a dotted/bracketed field path into the validated value —
// "name", "rounds[1].sauce", "timers.eatingSeconds", "minigameRules.trivia".
// The empty string is the root: the value as a whole is the wrong shape.
// `message` completes the sentence "<path> ...", e.g. "must be a non-empty string".
export type ValidationIssue = {
  path: string;
  message: string;
};

// Lifts issues from an entry validator (which reports paths relative to the
// entry) into the enclosing file's coordinates. A root-level issue on the entry
// becomes an issue on the entry itself: `players[2]`, not `players[2].`.
export const prefixIssuePaths = (
  issues: ValidationIssue[],
  prefix: string
): ValidationIssue[] => {
  return issues.map(({ path, message }) => ({
    path: path.length === 0 ? prefix : `${prefix}.${path}`,
    message
  }));
};
