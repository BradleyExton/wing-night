import type { PlayersContentFile } from "../players/index.js";
import type { TeamsContentFile } from "../teams/index.js";
import type { ValidationIssue } from "../validationIssue/index.js";

// The one rule that spans two content files: a player's `team` must name a team
// that `teams.json` actually declares.
//
// It lives here, in `shared`, rather than in either file's validator, because
// both halves of the app need the identical answer for opposite reasons — the
// server refuses to boot on a dangling reference, and the wizard blocks an
// apply that would create one. Two implementations of "does this name match"
// would eventually disagree about case or whitespace, and the disagreement
// would surface as content that saves cleanly and then fatals at boot.

// Matching is case- and whitespace-insensitive, because both sides of the
// comparison are hand-typed into JSON: "Scorch Squad", "scorch squad" and
// " Scorch Squad " are one team. Internal spacing is NOT collapsed — that would
// make "TheHeat" match "The Heat" and start guessing at intent.
export const toTeamMatchKey = (teamName: string): string => {
  return teamName.trim().toLowerCase();
};

export const resolveTeamIndexByName = (
  teamName: string,
  teams: TeamsContentFile
): number => {
  const matchKey = toTeamMatchKey(teamName);

  return teams.teams.findIndex((team) => toTeamMatchKey(team.name) === matchKey);
};

// Reported in `players.json` coordinates — `players[3].team` — so the issue
// lands on the field the host has to edit, not on the teams list they got
// right. Paths match `validatePlayersContentFile`'s exactly, which is what lets
// these issues merge into the wizard's existing per-field messages.
export const validateRosterAssignments = (
  players: PlayersContentFile,
  teams: TeamsContentFile
): ValidationIssue[] => {
  return players.players.flatMap((player, playerIndex) => {
    if (player.team === undefined || player.team.trim().length === 0) {
      return [];
    }

    if (resolveTeamIndexByName(player.team, teams) !== -1) {
      return [];
    }

    return [
      {
        path: `players[${playerIndex}].team`,
        message: `must name a team from teams.json (no team called "${player.team.trim()}")`
      }
    ];
  });
};
