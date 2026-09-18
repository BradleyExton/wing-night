import { ControlDeck } from "../ControlDeck";
import { StageHero } from "../StageHero";
import { MinigameSurface } from "../../MinigameSurface";
import { MusicControlsSurface } from "../../MusicControlsSurface";
import { hostControlPanelCopy } from "../../copy";
import { selectHeaderContext } from "../../HostMiniRail/selectHeaderContext";
import { useMinigameHostContext } from "../../useMinigameHostContext";
import { useHostHandlers } from "../../../../context/HostHandlersContext";
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
  const handlers = useHostHandlers();

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
          players={roomState?.players ?? []}
          teams={roomState?.teams ?? []}
        />
        {/* The anthem is playing right now on the TV, so the controls for it
            belong on the phase that plays it — not parked on a settings screen
            the host would have to leave the briefing to reach. */}
        <MusicControlsSurface
          musicPlayback={roomState?.musicPlayback ?? null}
          onPauseMusic={handlers.onPauseMusic}
          onResumeMusic={handlers.onResumeMusic}
          onSkipMusicTrack={handlers.onSkipMusicTrack}
        />
      </ControlDeck>
    </>
  );
};
