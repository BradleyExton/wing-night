import { ControlDeck } from "../ControlDeck";
import { StageHero } from "../StageHero";
import { CompactSummarySurface } from "../../CompactSummarySurface";
import { hostControlPanelCopy } from "../../copy";
import { selectHeaderContext } from "../../HostMiniRail/selectHeaderContext";
import { selectHostTeamMaps } from "../../selectHostTeamMaps";
import { useHostRoomState } from "../../../../context/RoomStateContext";
import { resolveLeadingTeams } from "../../../../utils/resolveLeadingTeams";
import { resolveSortedStandings } from "../../../../utils/resolveSortedStandings";
import * as styles from "./styles";

export const CompactStage = (): JSX.Element | null => {
  const roomState = useHostRoomState();
  const { teamNameByTeamId } = selectHostTeamMaps(roomState);

  if (roomState === null) {
    return null;
  }

  const headerContext = selectHeaderContext(roomState, teamNameByTeamId);
  const players = roomState.players;
  const sortedStandings = resolveSortedStandings(roomState.teams);
  const leadingTeams = resolveLeadingTeams(sortedStandings);
  const leader = leadingTeams[0] ?? null;
  const isTiedLead = leadingTeams.length > 1;

  return (
    <>
      <StageHero>
        <span className={styles.eyebrow}>{headerContext.phaseTitle}</span>
        <h1 className={styles.headline}>
          {leader !== null ? (
            <>
              <span className={styles.headlineAccent}>
                {leadingTeams.map((team) => team.name).join(" & ")}
              </span>{" "}
              {isTiedLead
                ? hostControlPanelCopy.compactTiedLeadSuffix
                : hostControlPanelCopy.compactLeadSuffix}
            </>
          ) : (
            hostControlPanelCopy.compactStandingsTitle
          )}
        </h1>
        <p className={styles.meta}>
          {hostControlPanelCopy.headerPhaseDescription(roomState.phase)}
        </p>
      </StageHero>
      <ControlDeck>
        <CompactSummarySurface
          sortedStandings={sortedStandings}
          players={players}
        />
      </ControlDeck>
    </>
  );
};
