import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { isGameConfigFile, type GameConfigFile } from "@wingnight/shared";

type LoadGameConfigOptions = {
  contentRootDir?: string;
};

const defaultContentRootDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../../content"
);

const parseGameConfig = (
  rawContent: string,
  contentFilePath: string
): GameConfigFile => {
  let parsedContent: unknown;

  try {
    parsedContent = JSON.parse(rawContent);
  } catch (error) {
    const parseReason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to parse game config content at "${contentFilePath}": ${parseReason}`
    );
  }

  if (!isGameConfigFile(parsedContent)) {
    throw new Error(
      `Invalid game config content at "${contentFilePath}": expected { name, rounds, minigameScoring, timers }.`
    );
  }

  return parsedContent;
};

const readGameConfigFromFile = (contentFilePath: string): GameConfigFile => {
  const fileContents = readFileSync(contentFilePath, "utf8");
  return parseGameConfig(fileContents, contentFilePath);
};

export const loadGameConfig = (
  options: LoadGameConfigOptions = {}
): GameConfigFile => {
  const contentRootDir = options.contentRootDir ?? defaultContentRootDir;
  const localConfigPath = resolve(contentRootDir, "local", "gameConfig.json");
  const sampleConfigPath = resolve(contentRootDir, "sample", "gameConfig.json");

  if (existsSync(localConfigPath)) {
    return readGameConfigFromFile(localConfigPath);
  }

  if (!existsSync(sampleConfigPath)) {
    throw new Error(
      `Missing game config content file. Checked "${localConfigPath}" and "${sampleConfigPath}".`
    );
  }

  return readGameConfigFromFile(sampleConfigPath);
};
