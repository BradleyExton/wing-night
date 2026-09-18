import { Phase, type Player, type Team, type TeamTheme } from "@wingnight/shared";
import { Flame, Trophy } from "lucide-react";

import { resolveTeamTheme } from "../../../utils/resolveTeamTheme";
import { TeamEmblem } from "../../TeamEmblem";
import { TeamWordmark } from "../../TeamWordmark";
import { displayBoardCopy } from "../copy";
import * as styles from "./styles";

type StandingsSurfaceProps = {
  phase: Phase | null;
  standings: Team[];
  players: Player[];
  // The display's one theme map (docs/team-identity.md); a team the map has
  // somehow missed is themed on its own rather than rendered without a kit.
  teamThemeByTeamId: Map<string, TeamTheme>;
};

export const StandingsSurface = ({
  phase,
  standings,
  teamThemeByTeamId
}: StandingsSurfaceProps): JSX.Element => {
  const topScore = standings[0]?.totalScore ?? null;
  // A team only "leads" when it is strictly ahead. At 0-0-0-0 (setup, round 1)
  // nobody is leading, so crowning the alphabetically-first team reads as a bug.
  const tiedTopCount = standings.filter(
    (team) => team.totalScore === topScore
  ).length;
  const hasStrictLeader = tiedTopCount === 1;

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
        // At FINAL_RESULTS every team tied at the top score is a winner —
        // never crown only the alphabetically-first of a tie.
        const isTiedTop = topScore !== null && team.totalScore === topScore;
        const isLeader =
          phase === Phase.FINAL_RESULTS
            ? isTiedTop
            : isTiedTop && hasStrictLeader;
        const isWinner = isLeader && phase === Phase.FINAL_RESULTS;
        const theme = teamThemeByTeamId.get(team.id) ?? resolveTeamTheme(team);
        const teamColorVariant = theme.colorVariant;
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
            : isTiedTop
              ? displayBoardCopy.standingTiedLabel
              : displayBoardCopy.standingRankOrdinalLabel(index + 1);
        const metaClassName = `${styles.columnMeta} ${isLeader ? styles.columnMetaLead : ""}`.trim();
        const scoreClassName = `${styles.columnScore} ${isLeader ? styles.columnScoreLead : ""}`.trim();
        const LeaderIcon = isWinner ? Trophy : Flame;

        return (
          <div key={team.id} className={`${styles.column} ${columnBgClassName}`}>
            <span className={`${styles.columnEdge} ${edgeClassName}`} aria-hidden />
            <TeamEmblem
              theme={theme}
              sizeClassName={isLeader ? styles.watermarkLead : styles.watermark}
            />
            <div className={styles.columnInfo}>
              <span className={metaClassName}>
                {metaLabel}
                {isLeader && (
                  <LeaderIcon className={styles.columnMetaIcon} aria-hidden />
                )}
              </span>
              <p className={styles.columnName}>
                <TeamWordmark
                  name={team.name}
                  theme={theme}
                  sizeClassName={styles.columnWordmark}
                />
              </p>
            </div>
            <p className={scoreClassName}>{team.totalScore}</p>
          </div>
        );
      })}
    </footer>
  );
};
