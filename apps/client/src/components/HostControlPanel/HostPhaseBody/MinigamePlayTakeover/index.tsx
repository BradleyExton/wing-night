import { HostMiniRail } from "../../HostMiniRail";
import { MinigameSurface } from "../../MinigameSurface";
import { useMinigameHostContext } from "../../useMinigameHostContext";
import { TakeoverTimerChip } from "./TakeoverTimerChip";
import * as styles from "./styles";

// The shell stops rendering the control deck at MINIGAME_PLAY. It does not
// stop rendering the room's context (docs/takeover-layout-api.md §1): the
// rail that says which round, which sauce and whose turn it is, and the play
// clock, are the shell's to own on every phase, this one included.
//
// It hands both down rather than drawing them itself, because where they land
// is the layout's decision and the layout is the game's: a `<TakeoverStage>`
// gives them a row of their own above the body, a `<TakeoverCanvas>` floats
// them over it. Neither is something this component can choose from out here.
export const MinigamePlayTakeover = (): JSX.Element => {
  const {
    teamNameByTeamId,
    minigameType,
    minigameHostView,
    activeTeamName,
    canDispatchMinigameAction,
    handleDispatchMinigameAction
  } = useMinigameHostContext("minigame_play");

  return (
    <div className={styles.container}>
      <MinigameSurface
        phase="play"
        minigameType={minigameType}
        minigameHostView={minigameHostView}
        activeTeamName={activeTeamName}
        teamNameByTeamId={teamNameByTeamId}
        rail={<HostMiniRail />}
        clock={<TakeoverTimerChip />}
        canDispatchAction={canDispatchMinigameAction}
        onDispatchAction={handleDispatchMinigameAction}
      />
    </div>
  );
};
