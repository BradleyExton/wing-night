import { Phase, type Player, type Team, type TeamTheme } from "@wingnight/shared";

import { resolveTeamTheme } from "../../../utils/resolveTeamTheme";
import { displayBoardCopy } from "../copy";
import { DeckChrome } from "./DeckChrome";
import { StandingBay } from "./StandingBay";
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
        <DeckChrome />
        <p className={styles.emptyLabel}>{displayBoardCopy.standingsEmptyLabel}</p>
      </footer>
    );
  }

  return (
    <footer
      className={styles.footer}
      ref={styles.applyFooterColumns(standings.length)}
    >
      <DeckChrome />
      {standings.map((team, index) => {
        // A tie at the top crowns nobody, at FINAL_RESULTS as at every other
        // phase: sudden death decides the champion, so every tied bay reads
        // "Tied" — never "Winner" on all of them, and never only on the
        // alphabetically-first.
        const isTiedTop = topScore !== null && team.totalScore === topScore;
        const isLeader = isTiedTop && hasStrictLeader;
        const metaLabel =
          isLeader && phase === Phase.FINAL_RESULTS
            ? displayBoardCopy.standingWinnerLabel
            : isLeader
              ? displayBoardCopy.standingLeaderLabel
              : isTiedTop
                ? displayBoardCopy.standingTiedLabel
                : displayBoardCopy.standingRankOrdinalLabel(index + 1);

        return (
          <StandingBay
            key={team.id}
            name={team.name}
            score={team.totalScore}
            theme={teamThemeByTeamId.get(team.id) ?? resolveTeamTheme(team)}
            isLeader={isLeader}
            isWinner={isLeader && phase === Phase.FINAL_RESULTS}
            metaLabel={metaLabel}
          />
        );
      })}
    </footer>
  );
};
