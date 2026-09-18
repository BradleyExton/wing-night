import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { resolveContentLayerDirs } from "../contentLoaderUtils/index.js";

type LoadContentFileWithFallbackOptions<TParsedContent> = {
  contentRootDir: string;
  contentFileName: string;
  contentLabel: string;
  parseFileContent: (rawContent: string, contentFilePath: string) => TParsedContent;
};

// Walks the layers `resolveContentLayerDirs` orders: the root's `local/`, then
// its `sample/`, then — for the night pack alone, which lives outside the repo
// and carries only what a party customises — the repo's committed
// `content/sample/` as a floor. Anything missing from every layer still throws,
// which is what blocks the boot with a clear error rather than starting a game
// on content nobody authored.
const resolveContentFilePath = (
  contentRootDir: string,
  contentFileName: string,
  contentLabel: string
): string => {
  const layerDirs = resolveContentLayerDirs(contentRootDir);
  const candidatePaths = layerDirs.map((layerDir) =>
    resolve(layerDir, contentFileName)
  );
  const foundPath = candidatePaths.find((candidatePath) => existsSync(candidatePath));

  if (foundPath !== undefined) {
    return foundPath;
  }

  throw new Error(
    `Missing ${contentLabel} content file. Checked ${candidatePaths
      .map((candidatePath) => `"${candidatePath}"`)
      .join(" and ")}.`
  );
};

export const loadContentFileWithFallback = <TParsedContent>({
  contentRootDir,
  contentFileName,
  contentLabel,
  parseFileContent
}: LoadContentFileWithFallbackOptions<TParsedContent>): TParsedContent => {
  const contentFilePath = resolveContentFilePath(
    contentRootDir,
    contentFileName,
    contentLabel
  );
  const fileContents = readFileSync(contentFilePath, "utf8");

  return parseFileContent(fileContents, contentFilePath);
};
