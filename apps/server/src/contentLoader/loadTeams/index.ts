import {
  isTeamsContentFile,
  type Team,
  type TeamsContentEntry
} from "@wingnight/shared";

import { loadContentFileWithFallback } from "../loadContentFileWithFallback/index.js";
import {
  parseContentJson,
  resolveDefaultContentRootDir
} from "../contentLoaderUtils/index.js";

type LoadTeamsOptions = {
  contentRootDir?: string;
};

const defaultContentRootDir = resolveDefaultContentRootDir(import.meta.url);

const parseTeamsEntries = (
  rawContent: string,
  contentFilePath: string
): TeamsContentEntry[] => {
  const parsedContent = parseContentJson(rawContent, contentFilePath, "teams");

  if (!isTeamsContentFile(parsedContent)) {
    throw new Error(
      `Invalid teams content at "${contentFilePath}": expected { teams: [{ name }] }.`
    );
  }

  return parsedContent.teams;
};

const buildTeam = (entry: TeamsContentEntry, index: number): Team => {
  return {
    id: `team-${index + 1}`,
    name: entry.name.trim(),
    playerIds: [],
    totalScore: 0
  };
};

export const loadTeams = (options: LoadTeamsOptions = {}): Team[] => {
  const contentRootDir = options.contentRootDir ?? defaultContentRootDir;
  const entries = loadContentFileWithFallback({
    contentRootDir,
    contentFileName: "teams.json",
    contentLabel: "teams",
    parseFileContent: parseTeamsEntries
  });

  return entries.map((entry, index) => buildTeam(entry, index));
};
