import type {
  MinigameDisplayView,
  MinigameHostView,
  SongGuessMinigameDisplayView,
  SongGuessMinigameHostSong,
  SongGuessPrompt,
  SongGuessTeamScore
} from "@wingnight/shared";

import {
  EMPTY_SONG_GUESS_TEAM_SCORE,
  type SongGuessRuntimeContent,
  type SongGuessRuntimeState
} from "../types/index.js";

export const resolveCurrentSong = (
  state: SongGuessRuntimeState,
  content: SongGuessRuntimeContent
): SongGuessPrompt | null => {
  const songId = state.selectedSongIds[state.songCursor];

  if (songId === undefined) {
    return null;
  }

  return content.prompts.find((prompt) => prompt.id === songId) ?? null;
};

export const resolveActiveTurnTeamId = (
  state: SongGuessRuntimeState
): string | null => {
  return state.turnOrderTeamIds[state.activeTurnIndex] ?? null;
};

export const resolveScoreForSong = (
  state: SongGuessRuntimeState,
  songId: string
): SongGuessTeamScore => {
  return state.scoresBySongId[songId] ?? { ...EMPTY_SONG_GUESS_TEAM_SCORE };
};

const toHostSong = (prompt: SongGuessPrompt): SongGuessMinigameHostSong => {
  return {
    id: prompt.id,
    audioFileName: prompt.file,
    clipStart: prompt.clipStart,
    clipEnd: prompt.clipEnd,
    revealStart: prompt.revealStart,
    correctTitle: prompt.correctTitle,
    correctArtist: prompt.correctArtist,
    ...(prompt.difficulty === undefined ? {} : { difficulty: prompt.difficulty }),
    ...(prompt.hint === undefined ? {} : { hint: prompt.hint })
  };
};

export const toSongGuessHostView = (
  state: SongGuessRuntimeState,
  content: SongGuessRuntimeContent
): MinigameHostView => {
  const currentSong = resolveCurrentSong(state, content);

  return {
    minigame: "SONG_GUESS",
    activeTurnTeamId: resolveActiveTurnTeamId(state),
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    phase: state.phase,
    songCursor: state.songCursor,
    songsTotal: state.selectedSongIds.length,
    replayUsed: state.replayUsed,
    currentSong: currentSong === null ? null : toHostSong(currentSong),
    currentScore:
      currentSong === null
        ? { ...EMPTY_SONG_GUESS_TEAM_SCORE }
        : resolveScoreForSong(state, currentSong.id),
    scoresBySongId: Object.fromEntries(
      Object.entries(state.scoresBySongId).map(([songId, score]) => [
        songId,
        { ...score }
      ])
    )
  };
};

// Answer-safe: `correctTitle` / `correctArtist` reach the display only through
// the `reveal` branch, which the reducer can only enter on an explicit host
// action. Every other phase carries the audio asset and nothing else.
export const toSongGuessDisplayView = (
  state: SongGuessRuntimeState,
  content: SongGuessRuntimeContent
): MinigameDisplayView => {
  const currentSong = resolveCurrentSong(state, content);

  const baseView = {
    minigame: "SONG_GUESS" as const,
    activeTurnTeamId: resolveActiveTurnTeamId(state),
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    songCursor: state.songCursor,
    songsTotal: state.selectedSongIds.length,
    replayUsed: state.replayUsed
  };

  if (state.phase === "done" || currentSong === null) {
    return { ...baseView, phase: "done" } satisfies SongGuessMinigameDisplayView;
  }

  if (state.phase === "reveal") {
    return {
      ...baseView,
      phase: "reveal",
      reveal: {
        title: currentSong.correctTitle,
        artist: currentSong.correctArtist,
        audioFileName: currentSong.file,
        revealStart: currentSong.revealStart
      }
    } satisfies SongGuessMinigameDisplayView;
  }

  return {
    ...baseView,
    phase: state.phase,
    clip: {
      audioFileName: currentSong.file,
      clipStart: currentSong.clipStart,
      clipEnd: currentSong.clipEnd
    }
  } satisfies SongGuessMinigameDisplayView;
};
