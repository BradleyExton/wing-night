import type { MinigameType, RoomState } from "@wingnight/shared";
import type { MinigameHandset, MinigameSurfacePhase } from "@wingnight/minigames-core";

import { useMinigameRendererBundle } from "../../../../minigames/useMinigameRendererBundle";
import { useServerOrigin } from "../../../../utils/useServerOrigin";
import { displayBoardCopy } from "../../copy";
import { MinigameTimerChip } from "../MinigameTimerChip";
import { MinigameTimerLine } from "../MinigameTimerLine";
import { useMinigameClockSound } from "../useMinigameClockSound";
import * as styles from "./styles";

type MinigameStageBodyProps = {
  phase: MinigameSurfacePhase;
  minigameType: MinigameType | null;
  activeTeamName: string | null;
  minigameDisplayView: RoomState["minigameDisplayView"];
  // Who plays the leg in hand (`resolveLegHandset`).
  handset: MinigameHandset;
  remainingTimerSeconds?: number | null;
  totalTimerSeconds?: number | null;
};

export const MinigameStageBody = ({
  phase,
  minigameType,
  activeTeamName,
  minigameDisplayView,
  handset,
  remainingTimerSeconds = null,
  totalTimerSeconds = null
}: MinigameStageBodyProps): JSX.Element => {
  // Unconditional: the early returns below must not sit between the hooks and
  // the component's first render pass.
  const serverOrigin = useServerOrigin();
  // Warm by now in a real game: DisplayBoard asked for this chunk back when the
  // room named the round's minigame, phases ago. The null branch below is the
  // boot-from-cold path (a TV refreshed into MINIGAME_PLAY), not a phase change.
  const minigameRendererLoad = useMinigameRendererBundle(minigameType);

  // The clock's voice, on the same seconds the chip and the line draw: the TV
  // is the room's speaker, and this is the one place the display composes the
  // turn clock, so it is the one place the clock is heard. A host-paced game
  // hands it `null` and it says nothing.
  useMinigameClockSound(remainingTimerSeconds);

  if (minigameType === null) {
    return (
      <div className={styles.minigameShell}>
        <p className={styles.fallbackText}>{displayBoardCopy.roundFallbackLabel}</p>
      </div>
    );
  }

  if (minigameRendererLoad.rendererBundle === null) {
    // The chunk has failed often enough that silence has stopped being the
    // kinder answer — the retries are still running underneath, but the room
    // has been looking at an empty stage and deserves to know why.
    if (minigameRendererLoad.status === "unavailable") {
      return (
        <div className={styles.minigameShell}>
          <p className={styles.fallbackText}>
            {displayBoardCopy.minigameRendererUnavailableLabel(minigameType)}
          </p>
        </div>
      );
    }

    // An empty stage, not a spinner and not a message: the renderer is a LAN
    // fetch away and whatever we drew here would be gone before the room read
    // it. The shell keeps its size so the stage does not jump when it lands.
    return <div className={styles.minigameShell} aria-hidden />;
  }

  const { DisplaySurface } = minigameRendererLoad.rendererBundle;

  return (
    <div className={styles.minigameShell}>
      {/* Handed to the surface rather than pinned over it. The chip used to be
          a sibling of the renderer with `absolute right-… top-…`, which is why
          eight surfaces reserved a corner for it and six of those corners were
          empty — only three minigames declare a `timerKey`. The surface puts
          it in its marquee's meta cell and an absent clock costs no width
          (docs/takeover-layout-api.md §6). The clock is two slots since the
          Neon Heat Line marquee (ADR-0006): the digits pill, and the lit
          length in the track under the row. Same seconds, both null together.
          The pill grows into the biggest thing on the sign for the last ten
          seconds (DESIGN.md §5), still inside the marquee's meta cell — no
          overlay, no reflow, nothing new for a game to reserve against. */}
      <DisplaySurface
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
        handset={handset}
      />
    </div>
  );
};
