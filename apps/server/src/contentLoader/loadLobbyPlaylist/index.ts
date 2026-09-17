import { readdirSync } from "node:fs";
import { resolve } from "node:path";

import { resolveContentRootDir } from "../contentLoaderUtils/index.js";

type LoadLobbyPlaylistOptions = {
  contentRootDir?: string;
};

const MP3_FILE_EXTENSION = ".mp3";

// Convention over configuration: the playlist is whatever MP3s sit in the
// directory, and `01-`/`02-` filename prefixes are the ordering mechanism.
// There is no lobby JSON to author, which is the point — a host drops files in
// an hour before guests arrive and restarts the server.
//
// Local ONLY, unlike every other loader in here. The sample pack ships no
// party music (nobody's clips belong in the repo), so a sample fallback would
// be a directory that never exists — and "local wins" only means something
// when both sides can have content.
export const loadLobbyPlaylist = (
  options: LoadLobbyPlaylistOptions = {}
): string[] => {
  const contentRootDir = options.contentRootDir ?? resolveContentRootDir();
  const lobbyAudioDir = resolve(contentRootDir, "local", "audio", "lobby");

  let directoryEntries: string[];

  try {
    directoryEntries = readdirSync(lobbyAudioDir);
  } catch {
    // A missing directory is the DEFAULT state of a fresh clone, not an error:
    // no lobby music simply means a silent SETUP screen. Every other failure
    // (permissions, a file where the directory should be) lands here too, and
    // deliberately so — the party must not fail to boot over background music.
    return [];
  }

  return directoryEntries
    .filter((fileName) => fileName.toLowerCase().endsWith(MP3_FILE_EXTENSION))
    .sort((a, b) => a.localeCompare(b));
};
