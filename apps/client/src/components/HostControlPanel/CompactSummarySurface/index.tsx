import { type GameConfigRound, type Phase, type Team } from "@wingnight/shared";

import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

type CompactSummarySurfaceProps = {
  phase: Phase;
  currentRound: number;
  totalRounds: number;
  currentRoundConfig: GameConfigRound | null;
  sortedStandings: Team[];
};

export const CompactSummarySurface = ({
  phase,
  currentRound,
  totalRounds,
  currentRoundConfig,
  sortedStandings
}: CompactSummarySurfaceProps): JSX.Element => {
  return (
    <section className={styles.compactGrid}>
      <div className={styles.card}>
        <h2 className={styles.sectionHeading}>
          {hostControlPanelCopy.compactPhaseStatusTitle}
        </h2>
        <p className={styles.compactPhaseBadge}>
          {hostControlPanelCopy.compactPhaseLabel(phase)}
        </p>
        <p className={styles.sectionDescription}>
          {hostControlPanelCopy.compactPhaseDescription(phase)}
        </p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.sectionHeading}>
          {hostControlPanelCopy.compactRoundContextTitle}
        </h2>
        {currentRoundConfig && (
          <ul className={styles.compactMetaList}>
            <li>
              {hostControlPanelCopy.compactRoundProgressLabel(
                currentRound,
                totalRounds
              )}
            </li>
            <li>{hostControlPanelCopy.compactRoundLabel(currentRoundConfig.label)}</li>
            <li>{hostControlPanelCopy.compactSauceLabel(currentRoundConfig.sauce)}</li>
            <li>
              {hostControlPanelCopy.compactMinigameLabel(
                currentRoundConfig.minigame
              )}
            </li>
          </ul>
        )}
        {!currentRoundConfig && (
          <p className={styles.sectionDescription}>
            {hostControlPanelCopy.compactNoRoundContextLabel}
          </p>
        )}
      </div>

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

      <div className={styles.card}>
        <h2 className={styles.sectionHeading}>
          {hostControlPanelCopy.compactNextActionTitle}
        </h2>
        <p className={styles.compactHint}>
          {hostControlPanelCopy.compactNextActionHint(phase)}
        </p>
      </div>
    </section>
  );
};
