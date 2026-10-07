import { mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

// Write-then-rename so a reader never observes a half-written file: the
// temp file is created in the destination directory, which keeps the rename
// on one filesystem and therefore atomic.
//
// Its own module, importing only node, because `pnpm pack:pull`
// (tools/pull-guests) writes the pack with it under plain `node`, which cannot
// load the rest of the content writer.
export const writeFileAtomically = (filePath: string, contents: string | Uint8Array): void => {
  const temporaryFilePath = `${filePath}.${process.pid}.tmp`;

  mkdirSync(dirname(filePath), { recursive: true });

  try {
    writeFileSync(temporaryFilePath, contents);
    renameSync(temporaryFilePath, filePath);
  } catch (error) {
    // Best effort: the error worth reporting is the write's, never a failed cleanup's (a temp
    // path that is somehow a directory, say, which rmSync refuses).
    try {
      rmSync(temporaryFilePath, { force: true });
    } catch {
      // The original error below is the one that explains what went wrong.
    }

    throw error;
  }
};
