import type { SerializableValue } from "@wingnight/minigames-core";
import type {
  MinigameHostView,
  MinigameType,
  RoomState
} from "@wingnight/shared";

import { ControlDeck } from "../ControlDeck";
import { StageHero } from "../StageHero";
import { MinigameSurface } from "../../MinigameSurface";
import { hostControlPanelCopy } from "../../copy";
import { selectHeaderContext } from "../../HostMiniRail/selectHeaderContext";
import * as styles from "./styles";

type MinigameIntroStageProps = {
  roomState: RoomState | null;
  teamNameByTeamId: Map<string, string>;
  minigameType: MinigameType | null;
  minigameHostView: MinigameHostView | null;
  activeRoundTeamId: string | null;
  activeRoundTeamName: string;
  canDispatchMinigameAction: boolean;
  showOverridesButton: boolean;
  overridesShowBadge: boolean;
  onOpenOverrides: () => void;
  onDispatchMinigameAction: (
    actionType: string,
    actionPayload: SerializableValue
  ) => void;
};

export const MinigameIntroStage = ({
  roomState,
  teamNameByTeamId,
  minigameType,
  minigameHostView,
  activeRoundTeamId,
  activeRoundTeamName,
  canDispatchMinigameAction,
  showOverridesButton,
  overridesShowBadge,
  onOpenOverrides,
  onDispatchMinigameAction
}: MinigameIntroStageProps): JSX.Element => {
  const headerContext = selectHeaderContext(roomState, teamNameByTeamId);

  return (
    <>
      <StageHero roomState={roomState} teamNameByTeamId={teamNameByTeamId}>
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
      <ControlDeck
        showOverridesButton={showOverridesButton}
        overridesShowBadge={overridesShowBadge}
        onOpenOverrides={onOpenOverrides}
      >
        <MinigameSurface
          phase="intro"
          minigameType={minigameType}
          minigameHostView={minigameHostView}
          activeTeamName={activeRoundTeamId === null ? null : activeRoundTeamName}
          teamNameByTeamId={teamNameByTeamId}
          canDispatchAction={canDispatchMinigameAction}
          onDispatchAction={onDispatchMinigameAction}
        />
      </ControlDeck>
    </>
  );
};
