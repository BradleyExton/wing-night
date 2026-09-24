import {
  MINIGAME_TYPES,
  resolveMinigameDefinition,
  type GameConfigFile,
  type GameConfigRound,
  type MinigameRuleRecord,
  type MinigameType
} from "../content/gameConfig/index.js";

// The wire contract for Quick Play: what the host's launcher sends, and the
// game config the server builds from it. Both halves live here so the shapes
// cannot drift — the launcher validates what it is about to send with the same
// guards the server runs on receipt.

// One queued game. `rules` replaces the pack's block for that game's rules
// key (absent or null keeps the pack's); `timerSeconds` replaces the pack's
// clock for a clock-paced game and is ignored for a host-paced one.
export type QuickPlayGame = {
  minigame: MinigameType;
  rules?: MinigameRuleRecord | null;
  timerSeconds?: number | null;
};

// A team as the launcher dealt it: one of the room's preset teams, so the
// name, genre, anthem and colour it already carries come along for free.
export type QuickPlayTeam = {
  teamId: string;
  playerIds: string[];
};

export type QuickPlayStartRequest = {
  games: QuickPlayGame[];
  teams: QuickPlayTeam[];
};

// Wing points never accrue in Quick Play — there is no EATING — but a round
// must still declare a positive count, so every round carries this one.
export const QUICK_PLAY_POINTS_PER_PLAYER = 1;

// The label every Quick Play round wears in the sauce slot. Surfaces that
// know the mode hide the slot; the ones that do not read this.
export const QUICK_PLAY_SAUCE_LABEL = "No sauce";

export const QUICK_PLAY_CONFIG_NAME = "Quick Play";

export const QUICK_PLAY_MIN_TEAMS = 2;

const isPositiveInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};

const isRuleRecord = (value: unknown): value is MinigameRuleRecord => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
};

const isMinigameType = (value: unknown): value is MinigameType => {
  return typeof value === "string" && MINIGAME_TYPES.includes(value as MinigameType);
};

// Shape only. Whether the rules satisfy the game's own schema is the server's
// call, because only the server can reach the runtime plugin that owns it.
export const isQuickPlayGame = (value: unknown): value is QuickPlayGame => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const game = value as Record<string, unknown>;

  if (!isMinigameType(game.minigame)) {
    return false;
  }

  if (game.rules !== undefined && game.rules !== null && !isRuleRecord(game.rules)) {
    return false;
  }

  return (
    game.timerSeconds === undefined ||
    game.timerSeconds === null ||
    isPositiveInteger(game.timerSeconds)
  );
};

export const isQuickPlayTeam = (value: unknown): value is QuickPlayTeam => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const team = value as Record<string, unknown>;

  return typeof team.teamId === "string" && isStringArray(team.playerIds);
};

export const isQuickPlayStartRequest = (
  value: unknown
): value is QuickPlayStartRequest => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const request = value as Record<string, unknown>;

  return (
    Array.isArray(request.games) &&
    request.games.every((game) => isQuickPlayGame(game)) &&
    Array.isArray(request.teams) &&
    request.teams.every((team) => isQuickPlayTeam(team))
  );
};

// Why a Quick Play request cannot start, in the order the launcher should
// show them. Empty means it can. Pure and shared so the launcher can disable
// its Start button for exactly the reasons the server would refuse.
export type QuickPlayStartIssue =
  | "NO_GAMES"
  | "TOO_FEW_TEAMS"
  | "DUPLICATE_TEAM"
  | "EMPTY_TEAM"
  | "DUPLICATE_PLAYER";

export const resolveQuickPlayStartIssues = (
  request: QuickPlayStartRequest
): QuickPlayStartIssue[] => {
  const issues: QuickPlayStartIssue[] = [];

  if (request.games.length === 0) {
    issues.push("NO_GAMES");
  }

  if (request.teams.length < QUICK_PLAY_MIN_TEAMS) {
    issues.push("TOO_FEW_TEAMS");
  }

  const seenTeamIds = new Set<string>();
  const seenPlayerIds = new Set<string>();

  for (const team of request.teams) {
    if (seenTeamIds.has(team.teamId)) {
      issues.push("DUPLICATE_TEAM");
    }

    seenTeamIds.add(team.teamId);

    if (team.playerIds.length === 0) {
      issues.push("EMPTY_TEAM");
    }

    for (const playerId of team.playerIds) {
      if (seenPlayerIds.has(playerId)) {
        issues.push("DUPLICATE_PLAYER");
      }

      seenPlayerIds.add(playerId);
    }
  }

  return [...new Set(issues)];
};

// The night's config with the queue in place of its rounds. Scoring, the
// eating clock and every rule the queue does not touch come from the pack, so
// a game plays here exactly as it would on the night unless the host changed
// something on purpose. A game queued twice shares one rules block — rules are
// keyed by game, not by round — and the later entry wins.
export const buildQuickPlayGameConfig = (
  baseConfig: GameConfigFile,
  games: QuickPlayGame[]
): GameConfigFile => {
  const minigameRules = { ...(baseConfig.minigameRules ?? {}) };
  const timers = { ...baseConfig.timers };

  for (const game of games) {
    const { rulesKey, timerKey } = resolveMinigameDefinition(game.minigame);

    if (rulesKey !== null && game.rules !== undefined && game.rules !== null) {
      minigameRules[rulesKey] = structuredClone(game.rules);
    }

    if (
      timerKey !== null &&
      game.timerSeconds !== undefined &&
      game.timerSeconds !== null
    ) {
      timers[timerKey] = game.timerSeconds;
    }
  }

  const rounds: GameConfigRound[] = games.map((game, index) => ({
    round: index + 1,
    label: `${QUICK_PLAY_CONFIG_NAME} ${index + 1}`,
    sauce: QUICK_PLAY_SAUCE_LABEL,
    pointsPerPlayer: QUICK_PLAY_POINTS_PER_PLAYER,
    minigame: game.minigame
  }));

  return {
    name: QUICK_PLAY_CONFIG_NAME,
    rounds,
    minigameScoring: { ...baseConfig.minigameScoring },
    timers,
    minigameRules
  };
};
