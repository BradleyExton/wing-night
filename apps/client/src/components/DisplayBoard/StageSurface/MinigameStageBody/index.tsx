import type { MinigameType, RoomState } from "@wingnight/shared";
import type { MinigameSurfacePhase } from "@wingnight/minigames-core";

import { resolveMinigameRendererBundle } from "../../../../minigames/registry";
import { useServerOrigin } from "../../../../utils/useServerOrigin";
import { displayBoardCopy } from "../../copy";
import { MinigameTimerChip } from "../MinigameTimerChip";
import { MinigameTimerLine } from "../MinigameTimerLine";
import * as styles from "./styles";

type MinigameStageBodyProps = {
  phase: MinigameSurfacePhase;
  minigameType: MinigameType | null;
  activeTeamName: string | null;
  minigameDisplayView: RoomState["minigameDisplayView"];
  remainingTimerSeconds?: number | null;
  totalTimerSeconds?: number | null;
};

export const MinigameStageBody = ({
  phase,
  minigameType,
  activeTeamName,
  minigameDisplayView,
  remainingTimerSeconds = null,
  totalTimerSeconds = null
}: MinigameStageBodyProps): JSX.Element => {
  // Unconditional: the early returns below must not sit between the hook and
  // the component's first render pass.
  const serverOrigin = useServerOrigin();

  if (minigameType === null) {
    return (
      <div className={styles.minigameShell}>
        <p className={styles.fallbackText}>{displayBoardCopy.roundFallbackLabel}</p>
      </div>
    );
  }

  const minigameRendererBundle = resolveMinigameRendererBundle(minigameType);

  if (minigameRendererBundle === null) {
    return (
      <div className={styles.minigameShell}>
        <p className={styles.fallbackText}>
          {displayBoardCopy.minigameRendererUnavailableLabel(minigameType)}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.minigameShell}>
      {/* Handed to the surface rather than pinned over it. The chip used to be
          a sibling of the renderer with `absolute right-… top-…`, which is why
          eight surfaces reserved a corner for it and six of those corners were
          empty — only three minigames declare a `timerKey`. The surface puts
          it in its marquee's meta cell and an absent clock costs no width
          (docs/takeover-layout-api.md §6). The clock is two slots since the
          Neon Heat Line marquee (ADR-0006): the digits pill, and the lit
          length in the track under the row. Same seconds, both null together. */}
      <minigameRendererBundle.DisplaySurface
        phase={phase}
        minigameType={minigameType}
        minigameDisplayView={minigameDisplayView}
        activeTeamName={activeTeamName}
        clock={<MinigameTimerChip remainingSeconds={remainingTimerSeconds} />}
        clockLine={
          <MinigameTimerLine
            remainingSeconds={remainingTimerSeconds}
            totalSeconds={totalTimerSeconds}
          />
        }
        serverOrigin={serverOrigin}
      />
    </div>
  );
};
