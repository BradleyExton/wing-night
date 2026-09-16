import { isSongGuessContentFile, isSongGuessPrompt } from "@wingnight/shared";
import type { SongGuessPrompt } from "@wingnight/shared";
import { createPromptContentAdapter } from "@wingnight/minigames-core";

export const songGuessContentAdapter = createPromptContentAdapter<SongGuessPrompt>({
  label: "song guess",
  fileName: "minigames/song-guess.json",
  invalidContentHint:
    "expected { prompts: [{ id, file, clipStart, clipEnd, revealStart, correctTitle, correctArtist }] } with unique ids and clipStart < clipEnd.",
  isContentFile: isSongGuessContentFile,
  isPrompt: isSongGuessPrompt,
  clonePrompt: (prompt) => ({
    id: prompt.id,
    file: prompt.file,
    clipStart: prompt.clipStart,
    clipEnd: prompt.clipEnd,
    revealStart: prompt.revealStart,
    correctTitle: prompt.correctTitle,
    correctArtist: prompt.correctArtist,
    ...(prompt.difficulty === undefined ? {} : { difficulty: prompt.difficulty }),
    ...(prompt.hint === undefined ? {} : { hint: prompt.hint })
  })
});

export const cloneSongGuessPrompt = songGuessContentAdapter.clonePrompt;
export const parseSongGuessContentFile = songGuessContentAdapter.parseFileContent;
export const resolveSongGuessContent = songGuessContentAdapter.resolveContent;
