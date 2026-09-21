import type { SerializableValue } from "@wingnight/minigames-core";
import type {
  MinigameHostView,
  MinigameType,
  RoomState
} from "@wingnight/shared";

import { useHostHandlers } from "../../../context/HostHandlersContext";
import { useHostRoomState } from "../../../context/RoomStateContext";
import { selectHeaderContext } from "../HostMiniRail/selectHeaderContext";
import type { HostRenderMode } from "../resolveHostRenderMode";
import { selectHostTeamMaps } from "../selectHostTeamMaps";
import { createMinigameHandlers } from "../setupHandlers";

type MinigameHostMode = Extract<HostRenderMode, "minigame_intro" | "minigame_play">;

type MinigameHostContext = {
  roomState: RoomState | null;
  teamNameByTeamId: Map<string, string>;
  minigameType: MinigameType | null;
  minigameHostView: MinigameHostView | null;
  // The TURN's team, not the round's, resolved by the mini-rail's own
  // selector so the name a minigame is handed and the name the rail prints
  // are one string. The takeover used to pass `activeRoundTeamName` here,
  // which is why all nine host surfaces grew an identical
  // `resolveActiveTeamName` to re-derive the turn's team from the host view
  // (docs/takeover-layout-api.md §1).
  activeTeamName: string | null;
  canDispatchMinigameAction: boolean;
  handleDispatchMinigameAction: (
    actionType: string,
    actionPayload: SerializableValue
  ) => void;
};

export const useMinigameHostContext = (
  hostMode: MinigameHostMode
): MinigameHostContext => {
  const roomState = useHostRoomState();
  const handlers = useHostHandlers();
  const { teamNameByTeamId } = selectHostTeamMaps(roomState);
  const minigameHostView = roomState?.minigameHostView ?? null;
  const minigameType =
    minigameHostView?.minigame ?? roomState?.currentRoundConfig?.minigame ?? null;
  const triviaHostView =
    minigameHostView?.minigame === "TRIVIA" ? minigameHostView : null;
  const { activeTeamName } = selectHeaderContext(roomState, teamNameByTeamId);
  const currentTriviaPrompt = triviaHostView?.currentPrompt ?? null;
  const activeTurnTeamId =
    minigameHostView?.activeTurnTeamId ?? roomState?.activeTurnTeamId ?? null;
  const triviaAttemptsRemaining = triviaHostView?.attemptsRemaining ?? 0;
  const canDispatchMinigameAction =
    handlers.onDispatchMinigameAction !== undefined &&
    hostMode === "minigame_play" &&
    minigameType !== null &&
    activeTurnTeamId !== null &&
    (minigameType !== "TRIVIA" ||
      (currentTriviaPrompt !== null && triviaAttemptsRemaining > 0));
  const { handleDispatchMinigameAction } = createMinigameHandlers({
    hostMode,
    minigameType,
    onDispatchMinigameAction: handlers.onDispatchMinigameAction,
    onSetWingParticipation: handlers.onSetWingParticipation
  });

  return {
    roomState,
    teamNameByTeamId,
    minigameType,
    minigameHostView,
    activeTeamName,
    canDispatchMinigameAction,
    handleDispatchMinigameAction
  };
};
