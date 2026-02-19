import { Phase, type DisplayRoomStateSnapshot } from "@wingnight/shared";

import { displayBoardCopy } from "../copy";
import { resolveClientMinigameRendererDescriptor } from "../../../minigames/registry";
import * as styles from "./styles";

type MinigameTakeoverShellProps = {
  roomState: DisplayRoomStateSnapshot | null;
  phaseLabel: string;
};

const resolveActiveTeamName = (
  roomState: DisplayRoomStateSnapshot | null
): string | null => {
  if (roomState === null) {
    return null;
  }

  const activeTeamId =
    roomState.minigameDisplayView?.activeTurnTeamId ??
    roomState.activeRoundTeamId ??
    roomState.activeTurnTeamId;

  if (activeTeamId === null) {
    return null;
  }

  return roomState.teams.find((team) => team.id === activeTeamId)?.name ?? null;
};

export const MinigameTakeoverShell = ({
  roomState,
  phaseLabel
}: MinigameTakeoverShellProps): JSX.Element => {
  const phase = roomState?.phase ?? null;
  const isMinigamePlayPhase = phase === Phase.MINIGAME_PLAY;
  const minigameId =
    roomState?.minigameDisplayView?.minigame ??
    roomState?.currentRoundConfig?.minigame ??
    displayBoardCopy.minigameFallbackType;
  const activeTeamName = resolveActiveTeamName(roomState);
  const rendererDescriptor = resolveClientMinigameRendererDescriptor(minigameId);
  const DisplayTakeoverRenderer = rendererDescriptor.displayTakeoverRenderer;

  return (
    <section
      className={styles.container}
      data-display-minigame-takeover={isMinigamePlayPhase ? "play" : "intro"}
      data-display-minigame-id={minigameId}
    >
      <DisplayTakeoverRenderer
        roomState={roomState}
        phaseLabel={phaseLabel}
        isMinigamePlayPhase={isMinigamePlayPhase}
        minigameId={minigameId}
        activeTeamName={activeTeamName}
      />
    </section>
  );
};
