import type { GameConfigFile, MinigameType } from "@wingnight/shared";

const DISPLAY_ASSET_ROOT = "/display/minigames";
const DEFAULT_TRIVIA_QUESTIONS_PER_TURN = 1;
const DEFAULT_SONG_GUESS_SONGS_PER_TURN = 4;
const DEFAULT_JOUST_SHOTS_PER_TURN = 3;
const DEFAULT_FAPPY_LEGS_PER_TURN = 4;
const DEFAULT_FAPPY_GATES_PER_LEG = 8;

const resolvePositiveInteger = (value: unknown, fallback: number): number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
};

export type MinigameBriefingContent = {
  displayName: string;
  illustrationPath: string;
  illustrationAlt: string;
  summary: string;
  steps: string[];
};

const resolveTriviaQuestionsPerTurn = (gameConfig: GameConfigFile | null): number => {
  const configuredQuestionsPerTurn = gameConfig?.minigameRules?.trivia?.questionsPerTurn;

  if (
    typeof configuredQuestionsPerTurn !== "number" ||
    !Number.isInteger(configuredQuestionsPerTurn) ||
    configuredQuestionsPerTurn <= 0
  ) {
    return DEFAULT_TRIVIA_QUESTIONS_PER_TURN;
  }

  return configuredQuestionsPerTurn;
};

const resolveTriviaBriefingContent = (
  gameConfig: GameConfigFile | null
): MinigameBriefingContent => {
  const questionsPerTurn = resolveTriviaQuestionsPerTurn(gameConfig);
  const questionCountLabel = `${questionsPerTurn} question${
    questionsPerTurn === 1 ? "" : "s"
  } this turn.`;

  return {
    displayName: "Trivia",
    illustrationPath: `${DISPLAY_ASSET_ROOT}/trivia-illustration.svg`,
    illustrationAlt: "Trivia mini-game artwork",
    summary: "Quick-fire questions start once your team is in position.",
    steps: [
      "A question appears on screen.",
      "Your team gives one answer per question.",
      `You'll get ${questionCountLabel}`
    ]
  };
};

const resolveSongGuessSongsPerTurn = (gameConfig: GameConfigFile | null): number => {
  const configuredSongsPerTurn = gameConfig?.minigameRules?.songGuess?.songsPerTurn;

  if (
    typeof configuredSongsPerTurn !== "number" ||
    !Number.isInteger(configuredSongsPerTurn) ||
    configuredSongsPerTurn <= 0
  ) {
    return DEFAULT_SONG_GUESS_SONGS_PER_TURN;
  }

  return configuredSongsPerTurn;
};

const resolveSongGuessBriefingContent = (
  gameConfig: GameConfigFile | null
): MinigameBriefingContent => {
  const songsPerTurn = resolveSongGuessSongsPerTurn(gameConfig);

  return {
    displayName: "Who's That Song",
    illustrationPath: `${DISPLAY_ASSET_ROOT}/song-guess-illustration.svg`,
    illustrationAlt: "Who's That Song mini-game artwork",
    summary:
      "Lounge covers of songs you already know. Name the song, name who did it first.",
    steps: [
      `You'll hear ${songsPerTurn} clip${songsPerTurn === 1 ? "" : "s"} this turn.`,
      "Call out the title and the original artist.",
      "One point each — the host is the judge."
    ]
  };
};

const resolveJoustShotsPerTurn = (gameConfig: GameConfigFile | null): number => {
  const configuredShotsPerTurn = gameConfig?.minigameRules?.joust?.shotsPerTurn;

  if (
    typeof configuredShotsPerTurn !== "number" ||
    !Number.isInteger(configuredShotsPerTurn) ||
    configuredShotsPerTurn <= 0
  ) {
    return DEFAULT_JOUST_SHOTS_PER_TURN;
  }

  return configuredShotsPerTurn;
};

const resolveJoustBriefingContent = (
  gameConfig: GameConfigFile | null
): MinigameBriefingContent => {
  const shotsPerTurn = resolveJoustShotsPerTurn(gameConfig);

  return {
    displayName: "Slingshlong",
    illustrationPath: `${DISPLAY_ASSET_ROOT}/joust-illustration.svg`,
    illustrationAlt: "Slingshlong mini-game artwork",
    summary:
      "Load the challenger into the slingshot, pull back, and try to land it on the champ.",
    steps: [
      `You get ${shotsPerTurn} shot${shotsPerTurn === 1 ? "" : "s"} this turn.`,
      "Drag back on the tablet and let go. The TV shows the flight.",
      "Headshot 3, body 2, low blow 5. A miss is a miss."
    ]
  };
};

const resolveFappyBriefingContent = (
  gameConfig: GameConfigFile | null
): MinigameBriefingContent => {
  const rules = gameConfig?.minigameRules?.fappy;
  const legsPerTurn = resolvePositiveInteger(rules?.legsPerTurn, DEFAULT_FAPPY_LEGS_PER_TURN);
  const gatesPerLeg = resolvePositiveInteger(rules?.gatesPerLeg, DEFAULT_FAPPY_GATES_PER_LEG);

  return {
    displayName: "Fappy Bird",
    illustrationPath: `${DISPLAY_ASSET_ROOT}/fappy-illustration.svg`,
    illustrationAlt: "Fappy Bird mini-game artwork",
    summary:
      "Your chickens fly a relay through a corridor of champs. Tap to flap, crash to pass the tablet.",
    steps: [
      `${legsPerTurn} leg${legsPerTurn === 1 ? "" : "s"} this turn, one player each, in seating order.`,
      `Tap anywhere on the tablet to flap. Clear ${gatesPerLeg} gates or crash, then pass it on.`,
      "Every gate cleared is a point for the team."
    ]
  };
};

const minigameBriefingContentByType: Record<
  MinigameType,
  (gameConfig: GameConfigFile | null) => MinigameBriefingContent
> = {
  TRIVIA: resolveTriviaBriefingContent,
  SONG_GUESS: resolveSongGuessBriefingContent,
  EMOJI_CHARADES: () => {
    return {
      displayName: "Emoji Charades",
      illustrationPath: `${DISPLAY_ASSET_ROOT}/emoji-charades-illustration.svg`,
      illustrationAlt: "Emoji Charades mini-game artwork",
      summary:
        "One picker holds the tablet and clues the subject in emoji — no words, no letters.",
      steps: [
        "Your team picks a deck on the tablet.",
        "The picker builds a clue in emoji; it appears on the TV live.",
        "Shout your guesses — the picker taps Got It or Skip."
      ]
    };
  },
  JOUST: resolveJoustBriefingContent,
  FAPPY: resolveFappyBriefingContent,
  GEO: () => {
    return {
      displayName: "Geo",
      illustrationPath: `${DISPLAY_ASSET_ROOT}/geo-illustration.png`,
      illustrationAlt: "Geo mini-game artwork",
      summary: "Listen for the location prompt, talk fast, and lock one answer in.",
      steps: [
        "The host gives the location challenge.",
        "Your team agrees on one final answer.",
        "The host scores the turn once you lock it in."
      ]
    };
  },
  DRAWING: () => {
    return {
      displayName: "Drawing",
      illustrationPath: `${DISPLAY_ASSET_ROOT}/drawing-icon.svg`,
      illustrationAlt: "Drawing mini-game icon",
      summary: "One teammate draws while the rest of the team guesses under pressure.",
      steps: [
        "One teammate draws the prompt.",
        "The rest of the team calls out guesses.",
        "The host scores the turn when time is up."
      ]
    };
  }
};

export const resolveMinigameBriefingContent = (
  minigameType: MinigameType | null,
  gameConfig: GameConfigFile | null
): MinigameBriefingContent | null => {
  if (minigameType === null) {
    return null;
  }

  const resolveBriefingContent = minigameBriefingContentByType[minigameType];

  return resolveBriefingContent(gameConfig);
};
