import {
  resolvePlayerAppearance,
  resolveTeamApparel,
  resolveTeamColorVariant,
  type CharacterApparel,
  type CharacterAppearance
} from "@wingnight/cast";
import type { FappyMinigameLeg, Player, Team } from "@wingnight/shared";

export type LegBird = {
  playerName: string | null;
  appearance: CharacterAppearance;
  apparel: CharacterApparel | undefined;
  fillClassName: string;
};

// The hen nobody is wearing: a team with no roster, or a leg whose player
// has left the room state. Still the team's colour, still the team's apparel.
const ANONYMOUS_APPEARANCE: CharacterAppearance = { body: "round", comb: "crest", tail: "fan" };

type ResolveLegBirdInput = {
  leg: Pick<FappyMinigameLeg, "playerId"> | null;
  activeTurnTeamId: string | null;
  players: readonly Player[];
  teams: readonly Team[];
  serverOrigin: string | null;
};

// Who is flying this leg and what their bird looks like: the runtime's view
// names the player by id, and the roster and seating the shell passes turn
// that into a face, a colour and an outfit.
export const resolveLegBird = ({
  leg,
  activeTurnTeamId,
  players,
  teams,
  serverOrigin
}: ResolveLegBirdInput): LegBird => {
  const player =
    leg === null || leg.playerId === null
      ? undefined
      : players.find((candidate) => candidate.id === leg.playerId);
  const team =
    activeTurnTeamId === null ? undefined : teams.find((candidate) => candidate.id === activeTurnTeamId);

  return {
    playerName: player?.name ?? null,
    appearance:
      player === undefined ? ANONYMOUS_APPEARANCE : resolvePlayerAppearance(player, serverOrigin),
    apparel: resolveTeamApparel(team),
    fillClassName:
      activeTurnTeamId === null
        ? "text-mutedWarm"
        : resolveTeamColorVariant(activeTurnTeamId).characterFillClassName
  };
};
