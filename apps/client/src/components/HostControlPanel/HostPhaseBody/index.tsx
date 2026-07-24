import type { ComponentType } from "react";

import { CompactStage } from "./CompactStage";
import { EatingStage } from "./EatingStage";
import { MinigameIntroStage } from "./MinigameIntroStage";
import { MinigamePlayTakeover } from "./MinigamePlayTakeover";
import { SetupStage } from "./SetupStage";
import { WaitingStage } from "./WaitingStage";
import { resolveHostRenderMode } from "../resolveHostRenderMode";
import type { HostRenderMode } from "../resolveHostRenderMode";
import { useHostRoomState } from "../../../context/RoomStateContext";
import * as styles from "./styles";

const UnlockedSetupStage = (): JSX.Element => {
  return <SetupStage isLocked={false} />;
};

const LockedSetupStage = (): JSX.Element => {
  return <SetupStage isLocked />;
};

type HostStageEntry = {
  StageComponent: ComponentType;
  containerClassName: string;
};

const HOST_STAGE_ENTRIES: Record<HostRenderMode, HostStageEntry> = {
  waiting: { StageComponent: WaitingStage, containerClassName: styles.mainSplit },
  setup: { StageComponent: UnlockedSetupStage, containerClassName: styles.mainSplit },
  setup_locked: {
    StageComponent: LockedSetupStage,
    containerClassName: styles.mainSplit
  },
  eating: { StageComponent: EatingStage, containerClassName: styles.mainSplit },
  minigame_intro: {
    StageComponent: MinigameIntroStage,
    containerClassName: styles.mainSplit
  },
  minigame_play: {
    StageComponent: MinigamePlayTakeover,
    containerClassName: styles.takeoverMain
  },
  compact: { StageComponent: CompactStage, containerClassName: styles.mainSplit }
};

export const HostPhaseBody = (): JSX.Element | null => {
  const roomState = useHostRoomState();
  const hostMode = resolveHostRenderMode(roomState?.phase ?? null);

  if (hostMode === "compact" && roomState === null) {
    return null;
  }

  const { StageComponent, containerClassName } = HOST_STAGE_ENTRIES[hostMode];

  return (
    <div className={containerClassName}>
      <StageComponent />
    </div>
  );
};
