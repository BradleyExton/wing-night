import {
  isDrawingContentFile,
  isGeoContentFile,
  isTriviaContentFile,
  type ConfigContentSnapshot,
  type Player
} from "@wingnight/shared";

import { loadContent } from "../contentLoader/index.js";

type ReadConfigContentOptions = {
  contentRootDir?: string;
};

export type ReadConfigContentResult =
  | { ok: true; content: ConfigContentSnapshot }
  | { ok: false; reason: string };

// `loadPlayers` derives ids positionally, so dropping them here is lossless —
// and the wizard edits players.json, whose entries have no id field.
const toPlayersContentEntries = (
  players: Player[]
): ConfigContentSnapshot["players"] => {
  return players.map((player) =>
    player.avatarSrc === undefined
      ? { name: player.name }
      : { name: player.name, avatarSrc: player.avatarSrc }
  );
};

// Reads the MERGED on-disk content (local wins over sample) rather than
// echoing room state: the geo import CLI may have written local files the room
// never saw, and the prompt packs are not in room state at all.
//
// Non-throwing for the same reason the reload is: this runs inside a socket
// listener, and the acute case is reading content that is already broken.
export const readConfigContent = (
  options: ReadConfigContentOptions = {}
): ReadConfigContentResult => {
  try {
    const { players, teams, gameConfig, minigameContentById } =
      loadContent(options);
    const triviaContent = minigameContentById.TRIVIA;
    const drawingContent = minigameContentById.DRAWING;
    const geoContent = minigameContentById.GEO;

    return {
      ok: true,
      content: {
        gameConfig,
        players: toPlayersContentEntries(players),
        teams: teams.map((team) => ({ name: team.name })),
        triviaPrompts: isTriviaContentFile(triviaContent)
          ? triviaContent.prompts
          : [],
        drawingPrompts: isDrawingContentFile(drawingContent)
          ? drawingContent.prompts
          : [],
        geoPromptCount: isGeoContentFile(geoContent)
          ? geoContent.prompts.length
          : 0
      }
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error)
    };
  }
};
