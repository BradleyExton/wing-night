import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const resolveDefaultContentRootDir = (importMetaUrl: string): string => {
  return resolve(dirname(fileURLToPath(importMetaUrl)), "../../../../../content");
};

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
