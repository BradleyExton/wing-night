import type { Player, Team, TeamTheme } from "@wingnight/shared";

import { hostControlPanelCopy } from "../copy";
import { resolveLeadingTeams } from "../../../utils/resolveLeadingTeams";
import { resolveTeamTheme } from "../../../utils/resolveTeamTheme";
import { resolveTeamRosterPreview } from "../../../utils/resolveTeamRosterPreview";
import * as styles from "./styles";

type CompactSummarySurfaceProps = {
  sortedStandings: Team[];
  players: Player[];
  teamThemeByTeamId: Map<string, TeamTheme>;
};

export const CompactSummarySurface = ({
  sortedStandings,
  players,
  teamThemeByTeamId
}: CompactSummarySurfaceProps): JSX.Element => {
  const playerById = new Map(players.map((player) => [player.id, player] as const));
  // The leader row only lights up on a strict lead — while the top score is
  // shared (every round-1 snapshot) the hero already says "tied", and a gold
  // LEADER badge beside it contradicts that.
  const hasStrictLeader = resolveLeadingTeams(sortedStandings).length === 1;

  return (
    <section className={styles.group}>
      <div className={styles.groupHead}>
        <span>{hostControlPanelCopy.compactStandingsTitle}</span>
      </div>

      {sortedStandings.length === 0 && (
        <div className={styles.row}>
          <span className={styles.rowMeta}>
            {hostControlPanelCopy.compactNoStandingsLabel}
          </span>
        </div>
      )}

      {sortedStandings.map((team, index) => {
        const isLeader = index === 0 && hasStrictLeader;
        const teamColorVariant = (teamThemeByTeamId.get(team.id) ?? resolveTeamTheme(team))
          .colorVariant;
        const teamRosterPreview = resolveTeamRosterPreview(team, playerById, 2);
        const rowClassName = `${styles.row} ${isLeader ? styles.leaderRow : ""}`;
        const scoreClassName = `${styles.score} ${isLeader ? styles.scoreLeader : ""}`;

        return (
          <div key={team.id} className={rowClassName}>
            <div className="min-w-0">
              <span className={styles.rowName}>
                <span
                  className={`${styles.teamDot} ${teamColorVariant.dotAccentClassName}`}
                  aria-hidden
                />
                {team.name}
              </span>
              <span className={styles.rosterMeta}>
                {hostControlPanelCopy.compactRosterValue(
                  teamRosterPreview.visiblePlayerNames,
                  teamRosterPreview.hiddenPlayerCount
                )}
              </span>
            </div>
            <div className={styles.metaCluster}>
              {isLeader && (
                <span className={styles.leaderLabel}>
                  {hostControlPanelCopy.compactLeaderLabel}
                </span>
              )}
              <span className={scoreClassName}>
                {hostControlPanelCopy.compactScoreLabel(team.totalScore)}
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
};
