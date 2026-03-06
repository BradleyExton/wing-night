import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  isTeamsContentFile,
  type Team,
  type TeamsContentEntry
} from "@wingnight/shared";

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
  const localTeamsFilePath = resolve(contentRootDir, "local", "teams.json");

  if (!existsSync(localTeamsFilePath)) {
    return [];
  }

  const entries = parseTeamsEntries(
    readFileSync(localTeamsFilePath, "utf8"),
    localTeamsFilePath
  );

  return entries.map((entry, index) => buildTeam(entry, index));
};
