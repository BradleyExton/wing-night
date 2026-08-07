import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Resolved ONCE, here, and exported as a value — never re-derived by each
// consumer from its own `import.meta.url`. The walk below is relative to THIS
// file's depth (`src/contentLoader/contentLoaderUtils/`), so a module that
// called it from a different depth would silently get a different root: a
// consumer one directory shallower lands on the repo's PARENT, happily
// `mkdirSync`s a `content/local/` there, and writes content nothing ever reads
// back. Exporting the computed value instead of the function that computes it
// removes that whole failure mode.
export const DEFAULT_CONTENT_ROOT_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../../content"
);

export const parseContentJson = (
  rawContent: string,
  contentFilePath: string,
  contentLabel: string
): unknown => {
  try {
    return JSON.parse(rawContent) as unknown;
  } catch (error) {
    const parseReason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to parse ${contentLabel} content at "${contentFilePath}": ${parseReason}`
    );
  }
};
