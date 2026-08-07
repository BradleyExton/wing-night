import { Phase, type Player, type Team } from "@wingnight/shared";
import { Flame, Trophy } from "lucide-react";

import { displayBoardCopy } from "../copy";
import { resolveTeamColorVariant } from "../../../utils/resolveTeamColorVariant";
import * as styles from "./styles";

type StandingsSurfaceProps = {
  phase: Phase | null;
  standings: Team[];
  players: Player[];
};

export const StandingsSurface = ({
  phase,
  standings
}: StandingsSurfaceProps): JSX.Element => {
  const leadingTeamId = standings[0]?.id ?? null;

  if (standings.length === 0) {
    return (
      <footer
        className={styles.footer}
        ref={styles.applyFooterColumns(standings.length)}
      >
        <p className={styles.emptyLabel}>{displayBoardCopy.standingsEmptyLabel}</p>
      </footer>
    );
  }

  return (
    <footer
      className={styles.footer}
      ref={styles.applyFooterColumns(standings.length)}
    >
      {standings.map((team, index) => {
        const topScore = standings[0]?.totalScore ?? null;
        // At FINAL_RESULTS every team tied at the top score is a winner —
        // never crown only the alphabetically-first of a tie.
        const isLeader =
          phase === Phase.FINAL_RESULTS
            ? topScore !== null && team.totalScore === topScore
            : leadingTeamId !== null && team.id === leadingTeamId;
        const isWinner = isLeader && phase === Phase.FINAL_RESULTS;
        const teamColorVariant = resolveTeamColorVariant(team.id);
        const columnBgClassName = isLeader
          ? teamColorVariant.splitColumnLeadBgClassName
          : teamColorVariant.splitColumnBgClassName;
        const edgeClassName = isLeader
          ? teamColorVariant.splitEdgeFullClassName
          : teamColorVariant.splitEdgeMutedClassName;
        const metaLabel = isWinner
          ? displayBoardCopy.standingWinnerLabel
          : isLeader
            ? displayBoardCopy.standingLeaderLabel
            : displayBoardCopy.standingRankOrdinalLabel(index + 1);
        const metaClassName = `${styles.columnMeta} ${isLeader ? styles.columnMetaLead : ""}`.trim();
        const scoreClassName = `${styles.columnScore} ${isLeader ? styles.columnScoreLead : ""}`.trim();
        const LeaderIcon = isWinner ? Trophy : Flame;

        return (
          <div key={team.id} className={`${styles.column} ${columnBgClassName}`}>
            <span className={`${styles.columnEdge} ${edgeClassName}`} aria-hidden />
            <div className={styles.columnInfo}>
              <span className={metaClassName}>
                {metaLabel}
                {isLeader && (
                  <LeaderIcon className={styles.columnMetaIcon} aria-hidden />
                )}
              </span>
              <p className={styles.columnName}>{team.name}</p>
            </div>
            <p className={scoreClassName}>{team.totalScore}</p>
          </div>
        );
      })}
    </footer>
  );
};
