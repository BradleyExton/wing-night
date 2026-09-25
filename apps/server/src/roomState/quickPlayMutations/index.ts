import {
  Phase,
  SESSION_MODES,
  buildQuickPlayGameConfig,
  resolveQuickPlayStartIssues,
  validateGameConfigFile,
  type QuickPlayGame,
  type QuickPlayTeam,
  type RoomState,
  type Team
} from "@wingnight/shared";

import { logPhaseTransition } from "../../logger/index.js";
import { isRulesValidForKey } from "../../minigames/rulesValidation/index.js";
import { defineRoomMutation } from "../defineRoomMutation/index.js";
import { applyPhaseTransitionEffects } from "../phaseState/index.js";
import { clearScoringMutationUndoState } from "../scoringState/index.js";
import { resolveCurrentRoundConfig } from "../selectors/index.js";

// The dealt teams as the room will run them: the preset team's identity
// (name, genre, anthems, colour) with the launcher's roster in place of the
// preset seating, and a clean score.
const resolveQuickPlayTeams = (
  roomState: RoomState,
  teams: QuickPlayTeam[]
): Team[] | null => {
  const resolvedTeams: Team[] = [];

  for (const { teamId, playerIds } of teams) {
    const presetTeam = roomState.teams.find((team) => team.id === teamId);

    if (presetTeam === undefined) {
      return null;
    }

    resolvedTeams.push({
      ...structuredClone(presetTeam),
      playerIds: [...playerIds],
      totalScore: 0
    });
  }

  return resolvedTeams;
};

// Starts a Quick Play session from SETUP: the queue becomes the night's
// rounds, the dealt teams become the room's teams, and the room opens on the
// first team's briefing — the same beat Start Game lands on, minus the
// count-in, because there is no lock screen to count down from.
//
// The game config is set on live state ONLY. It deliberately bypasses
// `setRoomStateGameConfig`, which would sync the setup baseline too: the
// baseline is what Reset Game restores, and a reset after a practice session
// has to bring back the pack's real night, not the queue.
export const startQuickPlay = defineRoomMutation({
  requiredPhase: Phase.SETUP,
  run: (roomState, games: QuickPlayGame[], teams: QuickPlayTeam[]): boolean => {
    if (roomState.gameConfig === null) {
      return false;
    }

    if (resolveQuickPlayStartIssues({ games, teams }).length > 0) {
      return false;
    }

    const knownPlayerIds = new Set(roomState.players.map((player) => player.id));

    if (
      teams.some((team) => team.playerIds.some((playerId) => !knownPlayerIds.has(playerId)))
    ) {
      return false;
    }

    const resolvedTeams = resolveQuickPlayTeams(roomState, teams);

    if (resolvedTeams === null) {
      return false;
    }

    const gameConfig = buildQuickPlayGameConfig(roomState.gameConfig, games);

    // The same validation the loader runs on the pack, plugin rules included,
    // so a rule the launcher let through never reaches a runtime that would
    // throw on it mid-turn.
    if (validateGameConfigFile(gameConfig, { validateRules: isRulesValidForKey }).length > 0) {
      return false;
    }

    const seatedPlayerIds = new Set(resolvedTeams.flatMap((team) => team.playerIds));
    const previousPhase = roomState.phase;

    roomState.sessionMode = SESSION_MODES.QUICK_PLAY;
    roomState.gameConfig = gameConfig;
    roomState.totalRounds = gameConfig.rounds.length;
    // Whoever is not here tonight is not on the board: JOUST racks every
    // player it is handed, and the TV lines a team up by its roster.
    roomState.players = roomState.players.filter((player) => seatedPlayerIds.has(player.id));
    roomState.teams = resolvedTeams;
    roomState.turnOrderTeamIds = resolvedTeams.map((team) => team.id);
    roomState.currentRound = 1;
    roomState.phase = Phase.MINIGAME_INTRO;
    roomState.currentRoundConfig = resolveCurrentRoundConfig(roomState);

    // INTRO -> MINIGAME_INTRO is the round-start transition: it seats the
    // turn cursor, clears wing participation and cues the first anthem.
    applyPhaseTransitionEffects(roomState, Phase.INTRO, Phase.MINIGAME_INTRO);
    clearScoringMutationUndoState(roomState);
    logPhaseTransition(previousPhase, Phase.MINIGAME_INTRO, roomState.currentRound);

    return true;
  }
});
