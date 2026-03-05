import { Phase, type Player, type Team } from "@wingnight/shared";

import { displayBoardCopy } from "../copy";
import { resolveTeamColorVariant } from "../../../utils/resolveTeamColorVariant";
import { resolveTeamRosterPreview } from "../../../utils/resolveTeamRosterPreview";
import * as styles from "./styles";

type StandingsSurfaceProps = {
  phase: Phase | null;
  standings: Team[];
  players: Player[];
};

export const StandingsSurface = ({
  phase,
  standings,
  players
}: StandingsSurfaceProps): JSX.Element => {
  const leadingTeamId = standings[0]?.id ?? null;
  const playerById = new Map(players.map((player) => [player.id, player] as const));

  return (
    <footer className={styles.footer}>
      <div className={styles.headingRow}>
        <span className={styles.headingAccentLine} aria-hidden />
        <h2 className={styles.heading}>{displayBoardCopy.standingsTitle}</h2>
        <span className={styles.headingAccentLine} aria-hidden />
      </div>
      {standings.length === 0 && (
        <p className={styles.emptyLabel}>{displayBoardCopy.standingsEmptyLabel}</p>
      )}
      {standings.length > 0 && (
        <ul className={styles.standingsList}>
          {standings.map((team, index) => {
            const isLeader = leadingTeamId !== null && team.id === leadingTeamId;
            const isFinalResultsLeader = phase === Phase.FINAL_RESULTS && isLeader;
            const standingCardClassName = isFinalResultsLeader
              ? styles.winnerStandingCard
              : isLeader
                ? styles.leadingStandingCard
                : styles.standingCard;
            const statusLabel = isFinalResultsLeader
              ? displayBoardCopy.standingWinnerLabel
              : isLeader
                ? displayBoardCopy.standingLeaderLabel
                : null;
            const statusClassName = isFinalResultsLeader
              ? styles.winnerStatusLabel
              : styles.leadingStatusLabel;
            const teamColorVariant = resolveTeamColorVariant(team.id);
            const borderAccentClassName = isFinalResultsLeader
              ? styles.winnerTeamAccentBorder
              : teamColorVariant.borderAccentClassName;
            const dotAccentClassName = isFinalResultsLeader
              ? styles.winnerTeamAccentDot
              : teamColorVariant.dotAccentClassName;
            const teamRosterPreview = resolveTeamRosterPreview(team, playerById, 3);

            return (
              <li
                key={team.id}
                className={`${standingCardClassName} ${styles.teamColorEdge} ${borderAccentClassName}`}
              >
                <span className={styles.cardGlow} aria-hidden />
                <div className={styles.teamRow}>
                  <div className={styles.teamIdentity}>
                    <p className={styles.rankBadge}>
                      {displayBoardCopy.standingRankLabel(index + 1)}
                    </p>
                    <div className={styles.teamIdentityBody}>
                      <div className={styles.teamNameRow}>
                        <span
                          className={`${styles.teamAccentDot} ${dotAccentClassName}`}
                          aria-hidden
                        />
                        <p className={styles.teamName}>{team.name}</p>
                        {statusLabel !== null && (
                          <span className={statusClassName}>{statusLabel}</span>
                        )}
                      </div>
                      <p className={styles.teamRoster}>
                        {displayBoardCopy.standingRosterValue(
                          teamRosterPreview.visiblePlayerNames,
                          teamRosterPreview.hiddenPlayerCount
                        )}
                      </p>
                    </div>
                  </div>
                  <p className={styles.score}>
                    {displayBoardCopy.standingScoreLabel(team.totalScore)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </footer>
  );
};
