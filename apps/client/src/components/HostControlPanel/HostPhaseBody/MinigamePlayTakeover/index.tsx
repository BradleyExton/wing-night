import type { SerializableValue } from "@wingnight/minigames-core";
import type { MinigameHostView, MinigameType } from "@wingnight/shared";

import { MinigameSurface } from "../../MinigameSurface";

type MinigamePlayTakeoverProps = {
  minigameType: MinigameType | null;
  minigameHostView: MinigameHostView | null;
  activeRoundTeamId: string | null;
  activeRoundTeamName: string;
  teamNameByTeamId: Map<string, string>;
  canDispatchMinigameAction: boolean;
  onDispatchMinigameAction: (
    actionType: string,
    actionPayload: SerializableValue
  ) => void;
};

export const MinigamePlayTakeover = ({
  minigameType,
  minigameHostView,
  activeRoundTeamId,
  activeRoundTeamName,
  teamNameByTeamId,
  canDispatchMinigameAction,
  onDispatchMinigameAction
}: MinigamePlayTakeoverProps): JSX.Element => {
  return (
    <MinigameSurface
      phase="play"
      minigameType={minigameType}
      minigameHostView={minigameHostView}
      activeTeamName={activeRoundTeamId === null ? null : activeRoundTeamName}
      teamNameByTeamId={teamNameByTeamId}
      canDispatchAction={canDispatchMinigameAction}
      onDispatchAction={onDispatchMinigameAction}
    />
  );
};
