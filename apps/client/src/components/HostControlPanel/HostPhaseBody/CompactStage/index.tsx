import type { Player, RoomState, Team } from "@wingnight/shared";

import { ControlDeck } from "../ControlDeck";
import { StageHero } from "../StageHero";
import { CompactSummarySurface } from "../../CompactSummarySurface";
import { hostControlPanelCopy } from "../../copy";
import { selectHeaderContext } from "../../HostMiniRail/selectHeaderContext";
import * as styles from "./styles";

type CompactStageProps = {
  roomState: RoomState;
  teamNameByTeamId: Map<string, string>;
  players: Player[];
  sortedStandings: Team[];
  showOverridesButton: boolean;
  overridesShowBadge: boolean;
  onOpenOverrides: () => void;
};

export const CompactStage = ({
  roomState,
  teamNameByTeamId,
  players,
  sortedStandings,
  showOverridesButton,
  overridesShowBadge,
  onOpenOverrides
}: CompactStageProps): JSX.Element => {
  const headerContext = selectHeaderContext(roomState, teamNameByTeamId);
  const leader = sortedStandings[0] ?? null;

  return (
    <>
      <StageHero roomState={roomState} teamNameByTeamId={teamNameByTeamId}>
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
      <ControlDeck
        showOverridesButton={showOverridesButton}
        overridesShowBadge={overridesShowBadge}
        onOpenOverrides={onOpenOverrides}
      >
        <CompactSummarySurface
          sortedStandings={sortedStandings}
          players={players}
        />
      </ControlDeck>
    </>
  );
};
