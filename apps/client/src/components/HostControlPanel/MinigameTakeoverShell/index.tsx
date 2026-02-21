import { type MinigameHostView } from "@wingnight/shared";

import { hostControlPanelCopy } from "../copy";
import { resolveClientMinigameRendererDescriptor } from "../../../minigames/registry";
import * as styles from "./styles";

type MinigameTakeoverShellProps = {
  hostMode: "minigame_intro" | "minigame_play";
  minigameHostView: MinigameHostView | null;
  activeRoundTeamName: string;
  teamNameByTeamId: Map<string, string>;
  triviaAttemptDisabled: boolean;
  onRecordTriviaAttempt: (isCorrect: boolean) => void;
};

export const MinigameTakeoverShell = ({
  hostMode,
  minigameHostView,
  activeRoundTeamName,
  teamNameByTeamId,
  triviaAttemptDisabled,
  onRecordTriviaAttempt
}: MinigameTakeoverShellProps): JSX.Element => {
  const minigameId = minigameHostView?.minigame ?? hostControlPanelCopy.minigameFallbackType;
  const rendererDescriptor = resolveClientMinigameRendererDescriptor(minigameId);
  const HostTakeoverRenderer = rendererDescriptor.hostTakeoverRenderer;

  return (
    <section
      className={styles.container}
      data-host-minigame-takeover={hostMode === "minigame_intro" ? "intro" : "play"}
      data-host-minigame-id={minigameId}
    >
      <HostTakeoverRenderer
        hostMode={hostMode}
        minigameId={minigameId}
        minigameHostView={minigameHostView}
        activeRoundTeamName={activeRoundTeamName}
        teamNameByTeamId={teamNameByTeamId}
        triviaAttemptDisabled={triviaAttemptDisabled}
        onRecordTriviaAttempt={onRecordTriviaAttempt}
      />
    </section>
  );
};
