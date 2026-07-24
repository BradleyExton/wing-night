import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after } from "node:test";

const createdDirs: string[] = [];

after(() => {
  for (const dirPath of createdDirs) {
    rmSync(dirPath, { recursive: true, force: true });
  }
});

export const createContentRoot = (): string => {
  const contentRoot = mkdtempSync(join(tmpdir(), "wingnight-content-"));
  createdDirs.push(contentRoot);
  return contentRoot;
};

export const writeContentFile = (
  contentRoot: string,
  relativePath: string,
  content: string
): void => {
  const fullPath = join(contentRoot, relativePath);
  const directoryPath = dirname(fullPath);

  mkdirSync(directoryPath, { recursive: true });
  writeFileSync(fullPath, content, "utf8");
};

type ValidGameConfigOptions = {
  questionsPerTurn?: number;
  setupPreviewRoundSlots?: number;
};

export const createValidGameConfigJson = (
  name: string,
  options: ValidGameConfigOptions = {}
): string => {
  return JSON.stringify({
    name,
    rounds: [
      {
        round: 1,
        label: "Warm Up",
        sauce: "Frank's",
        pointsPerPlayer: 2,
        minigame: "TRIVIA"
      }
    ],
    minigameScoring: {
      defaultMax: 15,
      finalRoundMax: 20
    },
    ...(options.questionsPerTurn === undefined
      ? {}
      : {
          minigameRules: {
            trivia: {
              questionsPerTurn: options.questionsPerTurn
            }
          }
        }),
    ...(options.setupPreviewRoundSlots === undefined
      ? {}
      : {
          setupPreviewRoundSlots: options.setupPreviewRoundSlots
        }),
    timers: {
      eatingSeconds: 120,
      triviaSeconds: 30,
      geoSeconds: 45,
      drawingSeconds: 60
    }
  });
};
