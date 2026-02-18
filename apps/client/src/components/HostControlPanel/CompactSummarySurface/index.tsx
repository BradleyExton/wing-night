import type { Team } from "@wingnight/shared";

import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

type CompactSummarySurfaceProps = {
  sortedStandings: Team[];
};

export const CompactSummarySurface = ({
  sortedStandings
}: CompactSummarySurfaceProps): JSX.Element => {
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

              return (
                <li
                  className={`${styles.compactStandingsRow} ${
                    isLeader ? styles.compactLeaderRow : ""
                  }`}
                  key={team.id}
                >
                  <span className={styles.teamName}>{team.name}</span>
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
