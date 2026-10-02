import type { MinigameType } from "@wingnight/shared";

const DISPLAY_ASSET_ROOT = "/display/minigames";

// The game's name is not briefing copy: it is `displayName` on the shared definition, read by
// every surface that names a game.
//
// No rule counts here ("3 questions this turn"): this copy is static, and the per-game rule
// defaults live in each game's runtime. A copy of them here drifted from the server's and
// said the wrong thing.
export type MinigameBriefingContent = {
  illustrationPath: string;
  illustrationAlt: string;
  summary: string;
};

const minigameBriefingContentByType: Record<MinigameType, MinigameBriefingContent> = {
  TRIVIA: {
    illustrationPath: `${DISPLAY_ASSET_ROOT}/trivia-illustration.svg`,
    illustrationAlt: "Trivia mini-game artwork",
    summary: "Quick-fire questions start once your team is in position."
  },
  SONG_GUESS: {
    illustrationPath: `${DISPLAY_ASSET_ROOT}/song-guess-illustration.svg`,
    illustrationAlt: "Name That Cheese mini-game artwork",
    summary:
      "Lounge covers of songs you already know. Name the song, name who did it first."
  },
  JOUST: {
    illustrationPath: `${DISPLAY_ASSET_ROOT}/joust-illustration.svg`,
    illustrationAlt: "Slingshlong mini-game artwork",
    summary:
      "Load the challenger into the slingshot, pull back, and try to land it on the champ."
  },
  FAPPY: {
    illustrationPath: `${DISPLAY_ASSET_ROOT}/fappy-illustration.svg`,
    illustrationAlt: "Fappy Bird mini-game artwork",
    summary:
      "Your chickens fly a relay through a corridor of champs, against one clock. Get the whole team through, fast."
  },
  SCHLONIC: {
    illustrationPath: `${DISPLAY_ASSET_ROOT}/schlonic-illustration.svg`,
    illustrationAlt: "Dunlop Dash mini-game artwork",
    summary:
      "Your chickens skate Dunlop Street as a relay, a leg each, collecting wings. The wings are the score — and they are the only health you have."
  },
  BRAWL: {
    illustrationPath: `${DISPLAY_ASSET_ROOT}/brawl-illustration.svg`,
    illustrationAlt: "Streets of Barrie mini-game artwork",
    summary:
      "Your chickens brawl down Dunlop Street to the Spirit Catcher, a block each. Walk with your left thumb, peck with your right, and put down every goose."
  },
  RECREATE: {
    illustrationPath: `${DISPLAY_ASSET_ROOT}/recreate-illustration.svg`,
    illustrationAlt: "Forgery Studio mini-game artwork",
    summary:
      "The TV shows a doctored party photo. Write the prompt you think made it, and the forger paints your version next to it."
  },
  EMOJI_CHARADES: {
    illustrationPath: `${DISPLAY_ASSET_ROOT}/emoji-charades-illustration.svg`,
    illustrationAlt: "Emoji Charades mini-game artwork",
    summary:
      "One picker holds the tablet and clues the subject in emoji — no words, no letters."
  },
  GEO: {
    illustrationPath: `${DISPLAY_ASSET_ROOT}/geo-illustration.png`,
    illustrationAlt: "Geo mini-game artwork",
    summary: "Listen for the location prompt, talk fast, and lock one answer in."
  },
  DRAWING: {
    illustrationPath: `${DISPLAY_ASSET_ROOT}/drawing-icon.svg`,
    illustrationAlt: "Drawing mini-game icon",
    summary: "One teammate draws while the rest of the team guesses under pressure."
  }
};

export const resolveMinigameBriefingContent = (
  minigameType: MinigameType
): MinigameBriefingContent => {
  return minigameBriefingContentByType[minigameType];
};
