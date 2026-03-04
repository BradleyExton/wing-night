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
      <h2 className={styles.heading}>{displayBoardCopy.standingsTitle}</h2>
      {standings.length === 0 && (
        <p className={styles.emptyLabel}>{displayBoardCopy.standingsEmptyLabel}</p>
      )}
      {standings.length > 0 && (
        <ul className={styles.standingsList}>
          {standings.map((team) => {
            const isLeader = leadingTeamId !== null && team.id === leadingTeamId;
            const isFinalResultsLeader = phase === Phase.FINAL_RESULTS && isLeader;
            const standingCardClassName = isFinalResultsLeader
              ? styles.winnerStandingCard
              : isLeader
                ? styles.leadingStandingCard
                : styles.standingCard;
            const teamColorVariant = resolveTeamColorVariant(team.id);
            const teamRosterPreview = resolveTeamRosterPreview(team, playerById, 3);

            return (
              <li
                key={team.id}
                className={`${standingCardClassName} ${styles.teamColorEdge} ${teamColorVariant.borderAccentClassName}`}
              >
                <div className={styles.teamRow}>
                  <div className={styles.teamIdentity}>
                    <span
                      className={`${styles.teamAccentDot} ${teamColorVariant.dotAccentClassName}`}
                      aria-hidden
                    />
                    <p className={styles.teamName}>{team.name}</p>
                  </div>
                  <p className={styles.score}>
                    {displayBoardCopy.standingScoreLabel(team.totalScore)}
                  </p>
                </div>
                <p className={styles.teamRoster}>
                  {displayBoardCopy.standingRosterValue(
                    teamRosterPreview.visiblePlayerNames,
                    teamRosterPreview.hiddenPlayerCount
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </footer>
  );
};
