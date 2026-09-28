import { readdirSync } from "node:fs";
import { resolve } from "node:path";

import { resolveContentRootDir } from "../contentLoaderUtils/index.js";

// The two directories a playlist can be enumerated from, under
// `<pack>/local/audio/`. The express mounts in `createApp` name the same two,
// and the enumeration and the route have to agree or the TV gets a playlist
// of 404s.
export type AudioPlaylistDirectory = "lobby" | "eating";

type LoadAudioPlaylistOptions = {
  contentRootDir?: string;
};

const MP3_FILE_EXTENSION = ".mp3";

// Convention over configuration: the playlist is whatever MP3s sit in the
// directory, and `01-`/`02-` filename prefixes are the ordering mechanism.
// There is no playlist JSON to author, which is the point — a host drops files
// in an hour before guests arrive and restarts the server.
//
// Local ONLY, unlike every other loader in here. The sample pack ships no
// party music (nobody's clips belong in the repo), so a sample fallback would
// be a directory that never exists — and "local wins" only means something
// when both sides can have content.
export const loadAudioPlaylist = (
  directory: AudioPlaylistDirectory,
  options: LoadAudioPlaylistOptions = {}
): string[] => {
  const contentRootDir = options.contentRootDir ?? resolveContentRootDir();
  const audioDir = resolve(contentRootDir, "local", "audio", directory);

  let directoryEntries: string[];

  try {
    directoryEntries = readdirSync(audioDir);
  } catch {
    // A missing directory is the DEFAULT state of a fresh clone, not an error:
    // no music simply means a silent screen. Every other failure (permissions,
    // a file where the directory should be) lands here too, and deliberately
    // so — the party must not fail to boot over background music.
    return [];
  }

  return directoryEntries
    .filter((fileName) => fileName.toLowerCase().endsWith(MP3_FILE_EXTENSION))
    .sort((a, b) => a.localeCompare(b));
};

export const loadLobbyPlaylist = (options: LoadAudioPlaylistOptions = {}): string[] =>
  loadAudioPlaylist("lobby", options);

export const loadEatingPlaylist = (options: LoadAudioPlaylistOptions = {}): string[] =>
  loadAudioPlaylist("eating", options);
