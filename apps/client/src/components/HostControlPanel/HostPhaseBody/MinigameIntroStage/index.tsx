import { ControlDeck } from "../ControlDeck";
import { StageHero } from "../StageHero";
import { MinigameSurface } from "../../MinigameSurface";
import { hostControlPanelCopy } from "../../copy";
import { selectHeaderContext } from "../../HostMiniRail/selectHeaderContext";
import { useMinigameHostContext } from "../../useMinigameHostContext";
import * as styles from "./styles";

export const MinigameIntroStage = (): JSX.Element => {
  const {
    roomState,
    teamNameByTeamId,
    minigameType,
    minigameHostView,
    activeRoundTeamId,
    activeRoundTeamName,
    canDispatchMinigameAction,
    handleDispatchMinigameAction
  } = useMinigameHostContext("minigame_intro");
  const headerContext = selectHeaderContext(roomState, teamNameByTeamId);

  return (
    <>
      <StageHero>
        <span className={styles.eyebrow}>{headerContext.phaseTitle}</span>
        <h1 className={styles.headline}>
          {minigameType ?? hostControlPanelCopy.minigameSectionTitle}
        </h1>
        <p className={styles.meta}>
          {minigameType !== null
            ? hostControlPanelCopy.minigameIntroDescription(minigameType)
            : hostControlPanelCopy.headerWaitingDescription}
        </p>
      </StageHero>
      <ControlDeck>
        <MinigameSurface
          phase="intro"
          minigameType={minigameType}
          minigameHostView={minigameHostView}
          activeTeamName={activeRoundTeamId === null ? null : activeRoundTeamName}
          teamNameByTeamId={teamNameByTeamId}
          canDispatchAction={canDispatchMinigameAction}
          onDispatchAction={handleDispatchMinigameAction}
        />
      </ControlDeck>
    </>
  );
};
