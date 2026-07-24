import { ControlDeck } from "../ControlDeck";
import { StageHero } from "../StageHero";
import { CompactSummarySurface } from "../../CompactSummarySurface";
import { hostControlPanelCopy } from "../../copy";
import { selectHeaderContext } from "../../HostMiniRail/selectHeaderContext";
import { selectHostTeamMaps } from "../../selectHostTeamMaps";
import { useHostRoomState } from "../../../../context/RoomStateContext";
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
  const leader = sortedStandings[0] ?? null;

  return (
    <>
      <StageHero>
        <span className={styles.eyebrow}>{headerContext.phaseTitle}</span>
        <h1 className={styles.headline}>
          {leader !== null ? (
            <>
              <span className={styles.headlineAccent}>{leader.name}</span> leads.
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
