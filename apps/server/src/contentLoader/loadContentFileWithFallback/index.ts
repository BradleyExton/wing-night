import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type LoadContentFileWithFallbackOptions<TParsedContent> = {
  contentRootDir: string;
  contentFileName: string;
  contentLabel: string;
  parseFileContent: (rawContent: string, contentFilePath: string) => TParsedContent;
};

const resolveContentFilePath = (
  contentRootDir: string,
  contentFileName: string,
  contentLabel: string
): string => {
  const localContentFilePath = resolve(contentRootDir, "local", contentFileName);
  const sampleContentFilePath = resolve(contentRootDir, "sample", contentFileName);

  if (existsSync(localContentFilePath)) {
    return localContentFilePath;
  }

  if (existsSync(sampleContentFilePath)) {
    return sampleContentFilePath;
  }

  throw new Error(
    `Missing ${contentLabel} content file. Checked "${localContentFilePath}" and "${sampleContentFilePath}".`
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
