import type { GameConfigFile, MinigameType } from "@wingnight/shared";

const DISPLAY_ASSET_ROOT = "/display/minigames";
const DEFAULT_TRIVIA_QUESTIONS_PER_TURN = 1;
const DEFAULT_SONG_GUESS_SONGS_PER_TURN = 4;
const DEFAULT_JOUST_SHOTS_PER_TURN = 3;
const DEFAULT_FAPPY_LEGS_PER_TURN = 4;
const DEFAULT_FAPPY_GATES_PER_LEG = 6;
const DEFAULT_RECREATE_TARGETS_PER_TURN = 1;
const DEFAULT_SCHLONIC_RUNS_PER_TURN = 3;
const DEFAULT_SCHLONIC_PAR_WINGS_PER_RUN = 70;

const resolvePositiveInteger = (value: unknown, fallback: number): number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
};

// The game's name is not briefing copy: it is `displayName` on the shared definition, read by
// every surface that names a game.
export type MinigameBriefingContent = {
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
    illustrationPath: `${DISPLAY_ASSET_ROOT}/fappy-illustration.svg`,
    illustrationAlt: "Fappy Bird mini-game artwork",
    summary:
      "Your chickens fly a relay through a corridor of champs, against one clock. Get the whole team through, fast.",
    steps: [
      `${legsPerTurn} leg${legsPerTurn === 1 ? "" : "s"} this turn, one player each, in seating order.`,
      `Tap anywhere on the tablet to flap through your ${gatesPerLeg} gates. Eagles get knocked out of the way; a champ or the sand sends you back to your last gate.`,
      "Land your section and hand the tablet on. The faster the team finishes, the more points."
    ]
  };
};

const resolveSchlonicBriefingContent = (
  gameConfig: GameConfigFile | null
): MinigameBriefingContent => {
  const rules = gameConfig?.minigameRules?.schlonic;
  const runsPerTurn = resolvePositiveInteger(rules?.runsPerTurn, DEFAULT_SCHLONIC_RUNS_PER_TURN);
  const parWingsPerRun = resolvePositiveInteger(
    rules?.parWingsPerRun ?? rules?.parRingsPerRun,
    DEFAULT_SCHLONIC_PAR_WINGS_PER_RUN
  );

  return {
    illustrationPath: `${DISPLAY_ASSET_ROOT}/schlonic-illustration.svg`,
    illustrationAlt: "Schlonic mini-game artwork",
    summary:
      "One at a time, your chickens run Kempenfelt Bay Zone, collecting wings. The wings are the score — and they are the only health you have.",
    steps: [
      `${runsPerTurn} run${runsPerTurn === 1 ? "" : "s"} this turn, one player each, in seating order. Everyone runs the same shore.`,
      "Your bird runs on its own; the tablet only jumps. Tap to hop, hold the tap to go higher — and you curl into a ball in the air, which is what lets you land on the things standing in the zone and pop them.",
      `A thorn bed or a hole is bad news either way. Take a hit and you drop half your wings; take one holding none and the run is over. ${parWingsPerRun * runsPerTurn} wings over the post is full marks.`
    ]
  };
};

const resolveRecreateBriefingContent = (
  gameConfig: GameConfigFile | null
): MinigameBriefingContent => {
  const rules = gameConfig?.minigameRules?.recreate;
  const targetsPerTurn = resolvePositiveInteger(
    rules?.targetsPerTurn,
    DEFAULT_RECREATE_TARGETS_PER_TURN
  );

  return {
    illustrationPath: `${DISPLAY_ASSET_ROOT}/recreate-illustration.svg`,
    illustrationAlt: "Forgery Studio mini-game artwork",
    summary:
      "The TV shows a doctored party photo. Write the prompt you think made it, and the forger paints your version next to it.",
    steps: [
      `${targetsPerTurn} target${targetsPerTurn === 1 ? "" : "s"} this turn. Study the picture, then type one prompt on the tablet.`,
      "The host reads your prompt aloud and ticks off every secret ingredient it names.",
      "A point per ingredient. The forgery itself is just for laughs."
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
  SCHLONIC: resolveSchlonicBriefingContent,
  RECREATE: resolveRecreateBriefingContent,
  GEO: () => {
    return {
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
