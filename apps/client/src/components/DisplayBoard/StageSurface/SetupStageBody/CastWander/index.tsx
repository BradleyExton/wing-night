import type { Player, Team } from "@wingnight/shared";

import { resolvePlayerAppearance } from "../../../../../utils/resolvePlayerAppearance";
import { resolveTeamColorVariant } from "../../../../../utils/resolveTeamColorVariant";
import { Character } from "../../../../Character";
import * as styles from "./styles";

type CastWanderProps = {
  players: Player[];
  teams: Team[];
};

const buildTeamIdByPlayerId = (teams: Team[]): Map<string, string> => {
  const teamIdByPlayerId = new Map<string, string>();

  for (const team of teams) {
    for (const playerId of team.playerIds) {
      teamIdByPlayerId.set(playerId, team.id);
    }
  }

  return teamIdByPlayerId;
};

// The lobby's ambient cast: every rostered player pacing the foot of the stage
// behind the lobby content, in their team's accent so the room can see who is
// seated where. Decoration only — no state, no server field, `aria-hidden`.
export const CastWander = ({ players, teams }: CastWanderProps): JSX.Element | null => {
  if (players.length === 0) {
    return null;
  }

  const teamIdByPlayerId = buildTeamIdByPlayerId(teams);

  return (
    <div className={styles.container} aria-hidden data-cast-wander>
      {players.map((player, index) => {
        const teamId = teamIdByPlayerId.get(player.id);
        const fillClassName =
          teamId === undefined
            ? styles.unassignedFill
            : resolveTeamColorVariant(teamId).characterFillClassName;

        return (
          <span
            key={player.id}
            className={styles.lanes[index % styles.lanes.length]}
            data-cast-member={player.id}
          >
            <span className={styles.waddle}>
              <Character
                appearance={resolvePlayerAppearance(player)}
                fillClassName={fillClassName}
              />
            </span>
          </span>
        );
      })}
    </div>
  );
};
