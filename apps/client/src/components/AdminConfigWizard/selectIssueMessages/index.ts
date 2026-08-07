import type { ValidationIssue } from "@wingnight/shared";

// Maps validation issues back onto the field that caused them.
//
// The server prefixes every issue with its file key before it reaches the wire
// (`contentWriter` turns "rounds[1].sauce" into "gameConfig.rounds[1].sauce"),
// so the wizard — which edits one file per step — strips that prefix to get
// back to the coordinates its own fields are named in.

export type IssueMessagesByPath = ReadonlyMap<string, string[]>;

const stripKeyPrefix = (path: string, fileKey: string): string | null => {
  if (path === fileKey) {
    // The file as a whole is the wrong shape; the root is the empty path.
    return "";
  }

  const prefix = `${fileKey}.`;

  return path.startsWith(prefix) ? path.slice(prefix.length) : null;
};

// Issues for other files are dropped rather than shown against a same-named
// field of this one: "players.name" and "gameConfig.name" would otherwise
// collide on `name`.
export const selectIssueMessages = (
  issues: readonly ValidationIssue[],
  fileKey: string
): IssueMessagesByPath => {
  const messagesByPath = new Map<string, string[]>();

  for (const issue of issues) {
    const path = stripKeyPrefix(issue.path, fileKey);

    if (path === null) {
      continue;
    }

    // One field can fail more than one rule, and dropping the second message
    // would leave the host fixing the same field twice.
    messagesByPath.set(path, [...(messagesByPath.get(path) ?? []), issue.message]);
  }

  return messagesByPath;
};

// Reads as a sentence completing "<path> ...", which is how the shared
// validators phrase their messages ("must be a non-empty string").
export const selectFieldIssueText = (
  messagesByPath: IssueMessagesByPath,
  path: string
): string | null => {
  const messages = messagesByPath.get(path);

  return messages === undefined ? null : messages.join("; ");
};
