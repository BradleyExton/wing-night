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

export const createValidTriviaJson = (prefix: string): string => {
  return JSON.stringify({
    prompts: [
      {
        id: `${prefix.toLowerCase()}-1`,
        question: `${prefix} question 1?`,
        answer: `${prefix} answer 1`
      }
    ]
  });
};

export const createValidGeoJson = (prefix: string): string => {
  return JSON.stringify({
    prompts: [
      {
        id: `${prefix.toLowerCase()}-geo-1`,
        title: `${prefix} Landmark`,
        imageSrc: `/sample-assets/geo/${prefix.toLowerCase()}.svg`,
        answer: { lat: 48.85837, lng: 2.294481 }
      }
    ]
  });
};

export const createValidDrawingJson = (prefix: string): string => {
  return JSON.stringify({
    prompts: [
      {
        id: `${prefix.toLowerCase()}-drawing-1`,
        prompt: `${prefix} Doodle`
      }
    ]
  });
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

type ContentTreeScope = "local" | "sample";

// Writes a complete, valid set of the six content files under one scope, so a
// test that cares about ONE file does not have to hand-build the other five
// just to get `loadContent` past them.
export const writeValidContentTree = (
  contentRoot: string,
  scope: ContentTreeScope,
  prefix: string
): void => {
  writeContentFile(
    contentRoot,
    `${scope}/players.json`,
    JSON.stringify({ players: [{ name: `${prefix} Player` }] })
  );
  writeContentFile(
    contentRoot,
    `${scope}/teams.json`,
    JSON.stringify({ teams: [{ name: `${prefix} Team` }] })
  );
  writeContentFile(
    contentRoot,
    `${scope}/gameConfig.json`,
    createValidGameConfigJson(prefix)
  );
  writeContentFile(
    contentRoot,
    `${scope}/minigames/trivia.json`,
    createValidTriviaJson(prefix)
  );
  writeContentFile(
    contentRoot,
    `${scope}/minigames/geo.json`,
    createValidGeoJson(prefix)
  );
  writeContentFile(
    contentRoot,
    `${scope}/minigames/drawing.json`,
    createValidDrawingJson(prefix)
  );
};
