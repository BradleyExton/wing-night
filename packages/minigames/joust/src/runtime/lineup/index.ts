import type { JoustPerch, JoustPlayerFigure, Player, Team } from "@wingnight/shared";
import { resolveJoustRackSlots } from "@wingnight/shared";

export type JoustRosterInput = {
  players: Player[];
  teams: Team[];
  activeTurnTeamId: string | null;
};

export type JoustRoster = {
  lineup: JoustPlayerFigure[];
  teammates: JoustPlayerFigure[];
};

/** One standing player and the spot they are standing on, for the shot about to be fired. */
export type JoustStandingPin = JoustPlayerFigure & {
  // Index into the FULL lineup, so a felled player's gap is still a gap.
  slotIndex: number;
  x: number;
  y: number;
};

const toFigure = (player: Player, team: Team | undefined): JoustPlayerFigure => {
  return {
    playerId: player.id,
    name: player.name,
    // Pack-relative as authored; the surface that draws the head resolves it against the server
    // origin, because the client and server are always separate origins.
    avatarSrc: player.avatarSrc ?? null,
    teamId: team?.id ?? null,
    genre: team?.genre ?? null
  };
};

/**
 * Splits the room into the two sides of a JOUST turn: the shooting team behind the slingshot, and
 * everybody else racked up down the lane. Roster order is kept on both sides, so the rack is the
 * same shape every team faces and nobody's place is a surprise.
 *
 * A player seated on no team at all is a target. There is no team for them to shoot with, and the
 * alternative — quietly leaving them out of the night's one game about the room — is worse.
 */
export const resolveJoustRoster = ({
  players,
  teams,
  activeTurnTeamId
}: JoustRosterInput): JoustRoster => {
  const activeTeam = teams.find((team) => team.id === activeTurnTeamId) ?? null;
  const shootingPlayerIds = new Set(activeTeam?.playerIds ?? []);
  const teamByPlayerId = new Map(
    teams.flatMap((team) => team.playerIds.map((playerId) => [playerId, team] as const))
  );
  const lineup: JoustPlayerFigure[] = [];
  const teammates: JoustPlayerFigure[] = [];

  for (const player of players) {
    const figure = toFigure(player, teamByPlayerId.get(player.id));

    (shootingPlayerIds.has(player.id) ? teammates : lineup).push(figure);
  }

  return { lineup, teammates };
};

/**
 * Who is still on their feet, and where. The spots come from the FULL lineup, so a player felled
 * on the first shot leaves the gap they fell out of rather than closing the rank — which is how
 * the room reads the damage from across it.
 */
export const resolveStandingPins = (
  lineup: readonly JoustPlayerFigure[],
  downPlayerIds: readonly string[],
  perches: readonly JoustPerch[]
): JoustStandingPin[] => {
  const slots = resolveJoustRackSlots(perches, lineup.length);
  const down = new Set(downPlayerIds);

  return lineup.flatMap((figure, slotIndex): JoustStandingPin[] => {
    const slot = slots[slotIndex];

    if (down.has(figure.playerId) || slot === undefined) {
      return [];
    }

    return [{ ...figure, slotIndex, x: slot.x, y: slot.y }];
  });
};

/**
 * Whose shot this is: the team in roster order, one each, round and round if the rules give
 * everybody more than one. Derived rather than stored — the shot index already says it.
 */
export const resolveActiveShooter = (
  teammates: readonly JoustPlayerFigure[],
  shotIndex: number
): JoustPlayerFigure | null => {
  if (teammates.length === 0) {
    return null;
  }

  return teammates[shotIndex % teammates.length] ?? null;
};
