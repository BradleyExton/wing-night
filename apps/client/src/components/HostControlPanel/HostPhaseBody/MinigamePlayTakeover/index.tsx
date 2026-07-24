import { MinigameSurface } from "../../MinigameSurface";
import { useMinigameHostContext } from "../../useMinigameHostContext";

export const MinigamePlayTakeover = (): JSX.Element => {
  const {
    teamNameByTeamId,
    minigameType,
    minigameHostView,
    activeRoundTeamId,
    activeRoundTeamName,
    canDispatchMinigameAction,
    handleDispatchMinigameAction
  } = useMinigameHostContext("minigame_play");

  return (
    <MinigameSurface
      phase="play"
      minigameType={minigameType}
      minigameHostView={minigameHostView}
      activeTeamName={activeRoundTeamId === null ? null : activeRoundTeamName}
      teamNameByTeamId={teamNameByTeamId}
      canDispatchAction={canDispatchMinigameAction}
      onDispatchAction={handleDispatchMinigameAction}
    />
  );
};
