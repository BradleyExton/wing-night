import { MUSIC_VOLUME_DEFAULT } from "@wingnight/shared";

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
    activeTeamName,
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
          {minigameType !== null ? (
            <>
              {hostControlPanelCopy.minigameHeadlineLead}{" "}
              <span className={styles.headlineAccent}>
                {hostControlPanelCopy.minigameName(minigameType)}
              </span>
            </>
          ) : (
            hostControlPanelCopy.minigameSectionTitle
          )}
        </h1>
        <p className={styles.meta}>
          {minigameType !== null
            ? hostControlPanelCopy.minigameIntroDescription(minigameType)
            : hostControlPanelCopy.headerWaitingDescription}
        </p>
      </StageHero>
      <ControlDeck>
        {/* The intro deck is a panel in the host's own control deck, not a
            takeover: the rail is already above it in the stage hero, and the
            clock belongs to play — so this surface carries no chrome slots. */}
        <MinigameSurface
          phase="intro"
          minigameType={minigameType}
          minigameHostView={minigameHostView}
          activeTeamName={activeTeamName}
          teamNameByTeamId={teamNameByTeamId}
          rail={null}
          clock={null}
          canDispatchAction={canDispatchMinigameAction}
          onDispatchAction={handleDispatchMinigameAction}
        />
        {/* The anthem is playing right now on the TV, so the controls for it
            belong on the phase that plays it — not parked on a settings screen
            the host would have to leave the briefing to reach. */}
        <MusicControlsSurface
          musicPlayback={roomState?.musicPlayback ?? null}
          musicVolume={roomState?.musicVolume ?? MUSIC_VOLUME_DEFAULT}
          onPauseMusic={handlers.onPauseMusic}
          onResumeMusic={handlers.onResumeMusic}
          onSkipMusicTrack={handlers.onSkipMusicTrack}
          onPreviousMusicTrack={handlers.onPreviousMusicTrack}
          onSetMusicVolume={handlers.onSetMusicVolume}
        />
      </ControlDeck>
    </>
  );
};
