import type { MinigameType, SongGuessTeamScore } from "@wingnight/shared";
import type {
  MinigameRuntimePlugin,
  MinigameRuntimeReductionResult
} from "@wingnight/minigames-core";

import { resolveSongGuessContent, songGuessContentAdapter } from "./content/index.js";
import {
  isSongGuessMarkPayload,
  isSongGuessRuntimeState
} from "./guards/index.js";
import { isSongGuessRules, resolveSongGuessRules } from "./rules/index.js";
import {
  SONG_GUESS_POINTS_PER_MARK,
  type SongGuessRuntimeContent,
  type SongGuessRuntimeState
} from "./types/index.js";
import {
  resolveActiveTurnTeamId,
  resolveCurrentSong,
  resolveScoreForSong,
  toSongGuessDisplayView,
  toSongGuessHostView
} from "./views/index.js";

export const songGuessMinigameId: MinigameType = "SONG_GUESS";

// Each team's turn gets its own slice of the pack, offset by the team's place
// in the turn order, so no two teams are asked the same song and a mid-turn
// reconnect rehydrates the same setlist. Deterministic for the same reason
// GEO's prompt cursor is: a random draw would re-roll on every re-entry.
const resolveSelectedSongIds = (
  teamIds: string[],
  activeRoundTeamId: string | null,
  songsPerTurn: number,
  content: SongGuessRuntimeContent
): string[] => {
  const songCount = content.prompts.length;

  if (songCount === 0) {
    return [];
  }

  const teamIndex =
    activeRoundTeamId === null ? 0 : Math.max(0, teamIds.indexOf(activeRoundTeamId));
  const offset = (teamIndex * songsPerTurn) % songCount;
  // A pack smaller than the configured turn length plays what it has rather
  // than dead-ending the round — a short turn beats a missing one mid-party.
  const turnLength = Math.min(songsPerTurn, songCount);

  const selectedSongIds: string[] = [];

  for (let slotIndex = 0; slotIndex < turnLength; slotIndex += 1) {
    const prompt = content.prompts[(offset + slotIndex) % songCount];

    if (prompt !== undefined) {
      selectedSongIds.push(prompt.id);
    }
  }

  return selectedSongIds;
};

// A mark can be changed — the host may rule a title good, then hear the rest of
// the answer and take it back — so points move by the DELTA between rulings
// rather than incrementing on every tap.
const resolveMarkDelta = (
  previousMark: boolean | null,
  nextMark: boolean
): number => {
  if (previousMark === nextMark) {
    return 0;
  }

  return nextMark ? SONG_GUESS_POINTS_PER_MARK : -SONG_GUESS_POINTS_PER_MARK;
};

const applyMark = (
  state: SongGuessRuntimeState,
  content: SongGuessRuntimeContent,
  field: keyof SongGuessTeamScore,
  correct: boolean,
  pointsMax: number
): MinigameRuntimeReductionResult => {
  const unchanged = { state, didMutate: false };
  const currentSong = resolveCurrentSong(state, content);
  const activeTurnTeamId = resolveActiveTurnTeamId(state);

  if (state.phase !== "reveal" || currentSong === null || activeTurnTeamId === null) {
    return unchanged;
  }

  const previousScore = resolveScoreForSong(state, currentSong.id);
  const delta = resolveMarkDelta(previousScore[field], correct);

  if (delta === 0 && previousScore[field] === correct) {
    return unchanged;
  }

  const previousPoints = state.pendingPointsByTeamId[activeTurnTeamId] ?? 0;

  return {
    state: {
      ...state,
      scoresBySongId: {
        ...state.scoresBySongId,
        [currentSong.id]: { ...previousScore, [field]: correct }
      },
      pendingPointsByTeamId: {
        ...state.pendingPointsByTeamId,
        [activeTurnTeamId]: Math.min(
          pointsMax,
          Math.max(0, previousPoints + delta)
        )
      }
    },
    didMutate: true
  };
};

// Shared by `nextSong` and the `skipSong` escape hatch: both land on the next
// song with a fresh replay allowance, or on `done` past the last one.
const advanceToNextSong = (
  state: SongGuessRuntimeState
): MinigameRuntimeReductionResult => {
  const nextSongCursor = state.songCursor + 1;
  const hasNextSong = nextSongCursor < state.selectedSongIds.length;

  return {
    state: {
      ...state,
      songCursor: hasNextSong ? nextSongCursor : state.songCursor,
      phase: hasNextSong ? "idle" : "done",
      replayUsed: hasNextSong ? false : state.replayUsed
    },
    didMutate: true
  };
};

export const songGuessRuntimePlugin: MinigameRuntimePlugin = {
  id: "SONG_GUESS",
  content: songGuessContentAdapter,
  isRules: isSongGuessRules,
  initialize: (input) => {
    const content = resolveSongGuessContent(input.content);
    const rules = resolveSongGuessRules(input.rules);
    const runtimeTeamIds =
      input.activeRoundTeamId === null ? input.teamIds : [input.activeRoundTeamId];
    const selectedSongIds = resolveSelectedSongIds(
      input.teamIds,
      input.activeRoundTeamId,
      rules.songsPerTurn,
      content
    );

    // No songs means no round to run; the server clears the projection and the
    // host surface falls back to its "check the content pack" note.
    if (selectedSongIds.length === 0) {
      return null;
    }

    const initialState: SongGuessRuntimeState = {
      turnOrderTeamIds: runtimeTeamIds,
      activeTurnIndex: 0,
      phase: "idle",
      songCursor: 0,
      selectedSongIds,
      replayUsed: false,
      scoresBySongId: {},
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    };

    return initialState;
  },
  reduceAction: (input) => {
    const unchanged = { state: input.state, didMutate: false };

    if (!isSongGuessRuntimeState(input.state)) {
      return unchanged;
    }

    const state = input.state;
    const content = resolveSongGuessContent(input.content);
    const { actionType, actionPayload } = input.envelope;

    if (actionType === "playClip") {
      if (state.phase !== "idle" && state.phase !== "clip_paused") {
        return unchanged;
      }

      return { state: { ...state, phase: "clip_playing" }, didMutate: true };
    }

    if (actionType === "pauseClip") {
      if (state.phase !== "clip_playing") {
        return unchanged;
      }

      return { state: { ...state, phase: "clip_paused" }, didMutate: true };
    }

    if (actionType === "replayClip") {
      if (state.phase !== "clip_paused" || state.replayUsed) {
        return unchanged;
      }

      return {
        state: { ...state, phase: "clip_playing", replayUsed: true },
        didMutate: true
      };
    }

    if (actionType === "triggerReveal") {
      if (state.phase !== "clip_paused") {
        return unchanged;
      }

      return { state: { ...state, phase: "reveal" }, didMutate: true };
    }

    if (actionType === "markTitle" || actionType === "markArtist") {
      if (!isSongGuessMarkPayload(actionPayload)) {
        return unchanged;
      }

      return applyMark(
        state,
        content,
        actionType === "markTitle" ? "title" : "artist",
        actionPayload.correct,
        input.pointsMax
      );
    }

    if (actionType === "nextSong") {
      if (state.phase !== "reveal") {
        return unchanged;
      }

      return advanceToNextSong(state);
    }

    // Escape hatch (AGENTS.md §11): drop a song the host can't get audio for,
    // from any phase before the answer is on screen. Scores nothing.
    if (actionType === "skipSong") {
      if (state.phase === "reveal" || state.phase === "done") {
        return unchanged;
      }

      return advanceToNextSong(state);
    }

    return unchanged;
  },
  syncPendingPoints: (input) => {
    if (!isSongGuessRuntimeState(input.state)) {
      return input.state;
    }

    return {
      ...input.state,
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    };
  },
  syncContent: (input) => {
    if (!isSongGuessRuntimeState(input.state)) {
      return input.state;
    }

    const content = resolveSongGuessContent(input.content);
    const availableSongIds = new Set(content.prompts.map((prompt) => prompt.id));
    const selectedSongIds = input.state.selectedSongIds.filter((songId) =>
      availableSongIds.has(songId)
    );

    return {
      ...input.state,
      selectedSongIds,
      songCursor: Math.min(
        input.state.songCursor,
        Math.max(0, selectedSongIds.length - 1)
      )
    };
  },
  selectHostView: (input) => {
    if (!isSongGuessRuntimeState(input.state)) {
      return null;
    }

    return toSongGuessHostView(input.state, resolveSongGuessContent(input.content));
  },
  selectDisplayView: (input) => {
    if (!isSongGuessRuntimeState(input.state)) {
      return null;
    }

    return toSongGuessDisplayView(input.state, resolveSongGuessContent(input.content));
  }
};
