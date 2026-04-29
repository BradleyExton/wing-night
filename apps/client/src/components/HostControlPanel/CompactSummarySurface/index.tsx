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
        const isLeader = index === 0;
        const teamColorVariant = resolveTeamColorVariant(team.id);
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
