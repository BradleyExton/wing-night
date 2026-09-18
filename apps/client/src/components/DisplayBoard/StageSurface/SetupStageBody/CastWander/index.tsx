import type { Player, Team } from "@wingnight/shared";

import { resolvePlayerAppearance } from "../../../../../utils/resolvePlayerAppearance";
import { resolveTeamApparel } from "../../../../../utils/resolveTeamApparel";
import { resolveTeamColorVariant } from "../../../../../utils/resolveTeamColorVariant";
import { Character } from "../../../../Character";
import * as styles from "./styles";

type CastWanderProps = {
  players: Player[];
  teams: Team[];
};

const buildTeamByPlayerId = (teams: Team[]): Map<string, Team> => {
  const teamByPlayerId = new Map<string, Team>();

  for (const team of teams) {
    for (const playerId of team.playerIds) {
      teamByPlayerId.set(playerId, team);
    }
  }

  return teamByPlayerId;
};

// The lobby's ambient cast: every rostered player pacing the foot of the stage
// behind the lobby content, in their team's accent and wearing their team
// genre's apparel, so the room can see who is seated where. Decoration only —
// no state, no server field, `aria-hidden`.
export const CastWander = ({ players, teams }: CastWanderProps): JSX.Element | null => {
  if (players.length === 0) {
    return null;
  }

  const teamByPlayerId = buildTeamByPlayerId(teams);

  return (
    <div className={styles.container} aria-hidden data-cast-wander>
      {players.map((player, index) => {
        const team = teamByPlayerId.get(player.id);
        const fillClassName =
          team === undefined
            ? styles.unassignedFill
            : resolveTeamColorVariant(team.id).characterFillClassName;

        return (
          <span
            key={player.id}
            className={styles.lanes[index % styles.lanes.length]}
            data-cast-member={player.id}
          >
            <span className={styles.waddle}>
              <Character
                appearance={resolvePlayerAppearance(player)}
                apparel={resolveTeamApparel(team)}
                fillClassName={fillClassName}
              />
            </span>
          </span>
        );
      })}
    </div>
  );
};
