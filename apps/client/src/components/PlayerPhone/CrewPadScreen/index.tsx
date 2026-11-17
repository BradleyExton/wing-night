import type { ComponentType } from "react";
import type { MinigameActionDispatch, MinigamePadRendererProps } from "@wingnight/minigames-core";
import type { CrewPad, CrewStageStatus, MinigameType } from "@wingnight/shared";

import { crewPadScreenCopy } from "./copy";
import * as styles from "./styles";

type CrewPadScreenProps = {
  // The game's own pad, or null for the moment its chunk is still arriving.
  PadSurface: ComponentType<MinigamePadRendererProps> | null;
  minigameType: MinigameType;
  playerId: string;
  pad: CrewPad;
  status: CrewStageStatus | null;
  onDispatchAction: MinigameActionDispatch;
};

// A crew player's phone in a game the whole team plays at once: the game's gamepad, the whole
// screen, and nothing of the game itself — that is on the TV. No sound, like every phone.
export const CrewPadScreen = ({
  PadSurface,
  minigameType,
  playerId,
  pad,
  status,
  onDispatchAction
}: CrewPadScreenProps): JSX.Element => {
  return (
    <div className={styles.screen} data-crew-pad={pad.state} data-crew-pad-slot={pad.slot ?? ""} data-crew-pad-status={status ?? ""}>
      {PadSurface === null ? (
        <p className={styles.loading}>{crewPadScreenCopy.loading}</p>
      ) : (
        <PadSurface
          minigameType={minigameType}
          playerId={playerId}
          pad={pad}
          status={status}
          canDispatchAction
          onDispatchAction={onDispatchAction}
        />
      )}
      <div className={styles.rotate} data-phone-rotate>
        <p className={styles.rotateTitle}>{crewPadScreenCopy.rotateTitle}</p>
        <p className={styles.rotateBody}>{crewPadScreenCopy.rotateBody}</p>
        <p className={styles.rotateLockHint}>{crewPadScreenCopy.rotateLockHint}</p>
      </div>
    </div>
  );
};
