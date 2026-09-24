import type {
  MinigameDisplayView,
  MinigameHostView,
  SongGuessMinigameDisplayReveal,
  SongGuessMinigameDisplayView,
  SongGuessMinigameHostSong,
  SongGuessPrompt,
  SongGuessTeamScore
} from "@wingnight/shared";

import {
  EMPTY_SONG_GUESS_TEAM_SCORE,
  SONG_GUESS_POINTS_PER_MARK,
  SONG_GUESS_REVEAL_MS,
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

// The card the TV shows once the host has ruled on both halves, or `null`
// while either is still pending. A pending half is what keeps the answer off
// the wall: `reveal` is built from the SCORE, so there is no phase the reducer
// can enter that puts the title up before the ruling is complete.
const toDisplayReveal = (
  state: SongGuessRuntimeState,
  currentSong: SongGuessPrompt
): SongGuessMinigameDisplayReveal | null => {
  const score = resolveScoreForSong(state, currentSong.id);

  if (score.title === null || score.artist === null || state.revealedAtMs === null) {
    return null;
  }

  const verdict = { title: score.title, artist: score.artist };
  const hits = [verdict.title, verdict.artist].filter(Boolean).length;

  return {
    title: currentSong.correctTitle,
    artist: currentSong.correctArtist,
    audioFileName: currentSong.file,
    revealStart: currentSong.revealStart,
    verdict,
    pointsEarned: hits * SONG_GUESS_POINTS_PER_MARK,
    revealedAtMs: state.revealedAtMs,
    expiresAtMs: state.revealedAtMs + SONG_GUESS_REVEAL_MS
  };
};

// Answer-safe: `correctTitle` / `correctArtist` reach the display only through
// the `reveal` branch, and only once the host has ruled on both of them. Every
// other phase carries the audio asset and nothing else.
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
      reveal: toDisplayReveal(state, currentSong)
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
