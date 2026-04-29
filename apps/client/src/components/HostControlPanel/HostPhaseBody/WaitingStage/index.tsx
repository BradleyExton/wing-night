import type { RoomState } from "@wingnight/shared";

import { ControlDeck } from "../ControlDeck";
import { StageHero } from "../StageHero";
import { hostControlPanelCopy } from "../../copy";
import * as styles from "./styles";

type WaitingStageProps = {
  roomState: RoomState | null;
  teamNameByTeamId: Map<string, string>;
  showOverridesButton: boolean;
  overridesShowBadge: boolean;
  onOpenOverrides: () => void;
};

export const WaitingStage = ({
  roomState,
  teamNameByTeamId,
  showOverridesButton,
  overridesShowBadge,
  onOpenOverrides
}: WaitingStageProps): JSX.Element => {
  return (
    <>
      <StageHero roomState={roomState} teamNameByTeamId={teamNameByTeamId}>
        <span className={styles.eyebrow}>{hostControlPanelCopy.headerKickerLabel}</span>
        <h1 className={styles.headline}>{hostControlPanelCopy.headerWaitingTitle}</h1>
        <p className={styles.meta}>{hostControlPanelCopy.headerWaitingDescription}</p>
      </StageHero>
      <ControlDeck
        showOverridesButton={showOverridesButton}
        overridesShowBadge={overridesShowBadge}
        onOpenOverrides={onOpenOverrides}
      >
        <></>
      </ControlDeck>
    </>
  );
};
