import type { Player, Team } from "@wingnight/shared";

import { hostControlPanelCopy } from "../copy";
import { resolveTeamColorVariant } from "../../../utils/resolveTeamColorVariant";
import { resolveTeamRosterPreview } from "../../../utils/resolveTeamRosterPreview";
import * as styles from "./styles";

type CompactSummarySurfaceProps = {
  sortedStandings: Team[];
  players: Player[];
};

export const CompactSummarySurface = ({
  sortedStandings,
  players
}: CompactSummarySurfaceProps): JSX.Element => {
  const playerById = new Map(players.map((player) => [player.id, player] as const));

  return (
    <section className={styles.compactGrid}>
      <div className={styles.card}>
        <h2 className={styles.sectionHeading}>
          {hostControlPanelCopy.compactStandingsTitle}
        </h2>
        {sortedStandings.length > 0 && (
          <ul className={styles.compactStandingsList}>
            {sortedStandings.map((team, index) => {
              const isLeader = index === 0;
              const teamColorVariant = resolveTeamColorVariant(team.id);
              const teamRosterPreview = resolveTeamRosterPreview(team, playerById, 2);

              return (
                <li
                  className={`${styles.compactStandingsRow} ${
                    isLeader ? styles.compactLeaderRow : ""
                  } ${teamColorVariant.borderAccentClassName}`}
                  key={team.id}
                >
                  <div className={styles.teamIdentity}>
                    <span
                      className={`${styles.teamAccentDot} ${teamColorVariant.dotAccentClassName}`}
                      aria-hidden
                    />
                    <div>
                      <span className={styles.teamName}>{team.name}</span>
                      <p className={styles.teamRoster}>
                        {hostControlPanelCopy.compactRosterValue(
                          teamRosterPreview.visiblePlayerNames,
                          teamRosterPreview.hiddenPlayerCount
                        )}
                      </p>
                    </div>
                  </div>
                  <div className={styles.compactStandingsMeta}>
                    {isLeader && (
                      <span className={styles.compactLeaderLabel}>
                        {hostControlPanelCopy.compactLeaderLabel}
                      </span>
                    )}
                    <span className={styles.compactScore}>
                      {hostControlPanelCopy.compactScoreLabel(team.totalScore)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {sortedStandings.length === 0 && (
          <p className={styles.sectionDescription}>
            {hostControlPanelCopy.compactNoStandingsLabel}
          </p>
        )}
      </div>
    </section>
  );
};
