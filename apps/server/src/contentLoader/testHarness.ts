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

export const createValidSongGuessJson = (prefix: string): string => {
  return JSON.stringify({
    prompts: [
      {
        id: `${prefix.toLowerCase()}-song-1`,
        file: `${prefix.toLowerCase()}-song-1.mp3`,
        clipStart: 10,
        clipEnd: 25,
        revealStart: 40,
        correctTitle: `${prefix} Title`,
        correctArtist: `${prefix} Artist`
      }
    ]
  });
};

export const createValidEmojiCharadesJson = (prefix: string): string => {
  return JSON.stringify({
    decks: [
      {
        id: `${prefix.toLowerCase()}-deck-1`,
        label: `${prefix} Deck`,
        subjects: [
          { id: `${prefix.toLowerCase()}-subject-1`, text: `${prefix} Subject` }
        ]
      }
    ]
  });
};

export const createValidJoustJson = (prefix: string): string => {
  return JSON.stringify({
    prompts: [
      {
        id: `${prefix.toLowerCase()}-arena-1`,
        name: `${prefix} Arena`,
        perches: [
          { x: 54, y: 78, width: 102 },
          { x: 116, y: 50, width: 34 }
        ],
        obstacles: [{ x: 46, y: 66, width: 5, height: 12 }]
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
      drawingSeconds: 60,
      emojiCharadesSeconds: 90
    }
  });
};

type ContentTreeScope = "local" | "sample";

// Writes a complete, valid set of content files under one scope, so a test
// that cares about ONE file does not have to hand-build the rest just to get
// `loadContent` past them. Every registered minigame needs an entry here: the
// loader walks the plugin registry and throws on the first missing pack.
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
  writeContentFile(
    contentRoot,
    `${scope}/minigames/song-guess.json`,
    createValidSongGuessJson(prefix)
  );
  writeContentFile(
    contentRoot,
    `${scope}/minigames/emoji-charades.json`,
    createValidEmojiCharadesJson(prefix)
  );
  writeContentFile(
    contentRoot,
    `${scope}/minigames/joust.json`,
    createValidJoustJson(prefix)
  );
};
