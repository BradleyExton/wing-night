import type { Player, Team, TeamTheme } from "@wingnight/shared";

import { Character, resolvePlayerAppearance } from "@wingnight/cast";

import { resolveTeamTheme } from "../../../../../utils/resolveTeamTheme";
import { useServerOrigin } from "../../../../../utils/useServerOrigin";
import * as styles from "./styles";

type CastWanderProps = {
  players: Player[];
  teams: Team[];
  // Colour and apparel come off the theme map so the strut, the standings
  // dots and the intro lineup can never disagree about a team's look.
  teamThemeByTeamId: Map<string, TeamTheme>;
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
export const CastWander = ({
  players,
  teams,
  teamThemeByTeamId
}: CastWanderProps): JSX.Element | null => {
  // Player heads come from the content pack, which the SERVER serves — the TV
  // is a different origin, so they have to be addressed absolutely. `null` on
  // the first paint, and every player wears their drawn head until it resolves.
  const serverOrigin = useServerOrigin();

  if (players.length === 0) {
    return null;
  }

  const teamByPlayerId = buildTeamByPlayerId(teams);

  return (
    <div className={styles.container} aria-hidden data-cast-wander>
      {players.map((player, index) => {
        const team = teamByPlayerId.get(player.id);
        const theme =
          team === undefined
            ? undefined
            : (teamThemeByTeamId.get(team.id) ?? resolveTeamTheme(team));
        const fillClassName = theme?.colorVariant.characterFillClassName ?? styles.unassignedFill;

        return (
          <span
            key={player.id}
            className={styles.lanes[index % styles.lanes.length]}
            data-cast-member={player.id}
          >
            <span className={styles.waddle}>
              <Character
                appearance={resolvePlayerAppearance(player, serverOrigin)}
                apparel={theme?.apparel}
                fillClassName={fillClassName}
              />
            </span>
          </span>
        );
      })}
    </div>
  );
};
