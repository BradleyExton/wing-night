import type { JoustPerch, JoustPlayerFigure, Player, Team } from "@wingnight/shared";
import { resolveJoustPinPerchIndex, resolveJoustRackSlots } from "@wingnight/shared";

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
  // Which of the lane's perches they are stood on — what they are worth, and whose tower folding
  // takes them down. Null on bare sand the lane never authored.
  perchIndex: number | null;
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

    return [
      {
        ...figure,
        slotIndex,
        perchIndex: resolveJoustPinPerchIndex(slot, perches),
        x: slot.x,
        y: slot.y
      }
    ];
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

export type JoustBenchOrderInput = {
  teammates: readonly JoustPlayerFigure[];
  // Null once the turn is over: nobody is at the post and everybody has walked off.
  activeShooterPlayerId: string | null;
  shotIndex: number;
  shotsPerTurn: number;
};

/** Where one of the shooting team stands in the line behind the slingshot. */
export type JoustBenchPlace = {
  figure: JoustPlayerFigure;
  // 0 is the post. 1.. is the line behind it, nearest the post first; it has one spot per
  // teammate, so the far end is the team's size and is only ever reached by someone walking off.
  slot: number;
  // Spent for the turn: stood at the far end of the line with their back to the lane.
  isDone: boolean;
};

/**
 * The bench in turn order rather than roster order: whoever shoots next stands nearest the post,
 * then the one after, so on every new shot the whole line visibly steps up a spot. Somebody who
 * has taken their last shot walks off to the far end and stays there — the spots fill from the
 * far end in the order they finished, so a player who has walked off never moves again, and the
 * one gap in the line is always the spot the current shooter stepped up from. Under
 * `shotsPerPlayer` > 1 a player who has shot but will shoot again is still in the line.
 *
 * Once the turn is over the last shooter takes that gap, and anyone the turn ended before they
 * shot (the rack was cleared) keeps their place in the line, so nobody crosses anybody.
 */
export const resolveBenchOrder = ({
  teammates,
  activeShooterPlayerId,
  shotIndex,
  shotsPerTurn
}: JoustBenchOrderInput): JoustBenchPlace[] => {
  const size = teammates.length;

  if (size === 0) {
    return [];
  }

  const isTurnOver = activeShooterPlayerId === null;
  const shooterIndex = ((shotIndex % size) + size) % size;
  const shooter: JoustBenchPlace[] = [];
  const waiting: { figure: JoustPlayerFigure; distance: number }[] = [];
  const done: { figure: JoustPlayerFigure; lastShotIndex: number }[] = [];

  teammates.forEach((figure, index) => {
    const distance = (index - shooterIndex + size) % size;
    const nextShotIndex = shotIndex + distance;
    const lastShotIndex = distance === 0 ? shotIndex : nextShotIndex - size;

    if (distance === 0 && !isTurnOver) {
      shooter.push({ figure, slot: 0, isDone: false });
    } else if ((isTurnOver || nextShotIndex >= shotsPerTurn) && lastShotIndex >= 0) {
      done.push({ figure, lastShotIndex });
    } else {
      waiting.push({ figure, distance });
    }
  });

  waiting.sort((a, b) => a.distance - b.distance);
  done.sort((a, b) => a.lastShotIndex - b.lastShotIndex);

  return [
    ...shooter,
    ...waiting.map(({ figure }, index) => ({ figure, slot: index + 1, isDone: isTurnOver })),
    ...done.map(({ figure }, index) => ({ figure, slot: size - index, isDone: true }))
  ];
};
