import { mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  validateDrawingContentFile,
  validateGameConfigFile,
  validatePlayersContentFile,
  validateTeamsContentFile,
  validateTriviaContentFile,
  type ConfigFileEdit,
  type ConfigFileKey,
  type ValidationIssue
} from "@wingnight/shared";

import { isRulesValidForKey } from "../minigames/rulesValidation/index.js";
import { resolveContentRootDir } from "../contentLoader/contentLoaderUtils/index.js";

type ContentWriterOptions = {
  contentRootDir?: string;
};

export type WriteContentFilesResult =
  | { ok: true }
  | { ok: false; reason: "invalid"; issues: ValidationIssue[] }
  | { ok: false; reason: "writeFailed"; message: string };

type ContentFileDescriptor = {
  fileName: string;
  validate: (value: unknown) => ValidationIssue[];
};

// The write half of the content lifecycle, keyed to match the read half. Each
// entry pairs the file's on-disk name with the SAME shared validator the
// loader parses it through — so nothing can reach disk that the next boot
// would reject.
const DESCRIPTOR_BY_KEY: Readonly<
  Record<ConfigFileKey, ContentFileDescriptor>
> = Object.freeze({
  gameConfig: {
    fileName: "gameConfig.json",
    // The rules seam is the load-bearing part: called bare,
    // `validateGameConfigFile` does not check `minigameRules` at all, and a
    // plugin-rejected config that lands here fatals every subsequent boot with
    // the wizard's own read path unusable to undo it.
    validate: (value) =>
      validateGameConfigFile(value, { validateRules: isRulesValidForKey })
  },
  players: {
    fileName: "players.json",
    validate: validatePlayersContentFile
  },
  teams: {
    fileName: "teams.json",
    validate: validateTeamsContentFile
  },
  trivia: {
    fileName: "minigames/trivia.json",
    validate: validateTriviaContentFile
  },
  drawing: {
    fileName: "minigames/drawing.json",
    validate: validateDrawingContentFile
  }
});

const prefixIssuesWithKey = (
  key: ConfigFileKey,
  issues: ValidationIssue[]
): ValidationIssue[] => {
  return issues.map(({ path, message }) => ({
    path: path.length === 0 ? key : `${key}.${path}`,
    message
  }));
};

// Write-then-rename so a reader never observes a half-written file: the
// temp file is created in the destination directory, which keeps the rename
// on one filesystem and therefore atomic.
const writeFileAtomically = (filePath: string, contents: string): void => {
  const temporaryFilePath = `${filePath}.${process.pid}.tmp`;

  mkdirSync(dirname(filePath), { recursive: true });

  try {
    writeFileSync(temporaryFilePath, contents, "utf8");
    renameSync(temporaryFilePath, filePath);
  } catch (error) {
    rmSync(temporaryFilePath, { force: true });
    throw error;
  }
};

// Validates EVERY edit before writing ANY of them: a batch that fails
// halfway would leave content/local/ in a state neither the wizard nor the
// loader asked for.
export const writeContentFiles = (
  edits: ConfigFileEdit[],
  options: ContentWriterOptions = {}
): WriteContentFilesResult => {
  const issues = edits.flatMap((edit) =>
    prefixIssuesWithKey(edit.key, DESCRIPTOR_BY_KEY[edit.key].validate(edit.value))
  );

  if (issues.length > 0) {
    return { ok: false, reason: "invalid", issues };
  }

  const contentRootDir = options.contentRootDir ?? resolveContentRootDir();

  // A filesystem failure is reported, not thrown: this runs inside a socket
  // listener, and it is a different failure from "your content is invalid" —
  // the caller maps the two onto distinct error codes so the wizard can tell
  // a rejected edit from an unwritable disk.
  try {
    for (const edit of edits) {
      const { fileName } = DESCRIPTOR_BY_KEY[edit.key];
      const filePath = resolve(contentRootDir, "local", fileName);

      writeFileAtomically(filePath, `${JSON.stringify(edit.value, null, 2)}\n`);
    }
  } catch (error) {
    return {
      ok: false,
      reason: "writeFailed",
      message: error instanceof Error ? error.message : String(error)
    };
  }

  return { ok: true };
};
