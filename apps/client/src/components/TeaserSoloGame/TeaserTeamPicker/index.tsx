import { Character, resolvePlayerAppearance } from "@wingnight/cast";
import type { Player, Team, TeamTheme } from "@wingnight/shared";

import { TeamWordmark } from "../../TeamWordmark";
import * as styles from "./styles";

type TeaserTeamPickerProps = {
  kicker: string;
  title: string;
  body: string;
  players: Player[];
  teams: Team[];
  teamThemeByTeamId: Map<string, TeamTheme>;
  serverOrigin: string | null;
  onPick: (teamId: string) => void;
};

// Before the street: whose relay you are skating. Each team is its wordmark over its riders, so
// the choice is between people, which is the teaser's whole pitch.
export const TeaserTeamPicker = ({
  kicker,
  title,
  body,
  players,
  teams,
  teamThemeByTeamId,
  serverOrigin,
  onPick
}: TeaserTeamPickerProps): JSX.Element => {
  const playerById = new Map(players.map((player) => [player.id, player]));

  return (
    <div className={styles.container}>
      <div className={styles.intro}>
        <p className={styles.kicker}>{kicker}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.body}>{body}</p>
      </div>
      <div className={styles.teams}>
        {teams.map((team) => {
          const theme = teamThemeByTeamId.get(team.id);

          return (
            <button
              key={team.id}
              type="button"
              className={styles.team}
              onClick={(): void => {
                onPick(team.id);
              }}
            >
              <span className={styles.riders}>
                {team.playerIds.map((playerId) => {
                  const player = playerById.get(playerId);

                  return player === undefined ? null : (
                    <span key={player.id} className={styles.rider}>
                      <Character
                        appearance={resolvePlayerAppearance(player, serverOrigin)}
                        apparel={theme?.apparel}
                        silhouette={theme?.silhouette}
                        fillClassName={theme?.colorVariant.characterFillClassName}
                        pose="still"
                      />
                    </span>
                  );
                })}
              </span>
              {theme === undefined ? (
                <span className={styles.teamNamePlain}>{team.name}</span>
              ) : (
                <TeamWordmark name={team.name} theme={theme} sizeClassName={styles.teamName} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
