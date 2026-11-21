import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import type { BordenMinigameDisplayView } from "@wingnight/shared";
import { NeonMarquee } from "@wingnight/surface";

import { BordenScene } from "../BordenScene/index.js";
import { resolveLiveBanked, resolveShownStretch } from "../shownStretch/index.js";
import { useBaseValue, useBordenFrame } from "../useBordenFrame/index.js";
import { useBordenSounds } from "../useBordenSounds/index.js";
import { displayBordenSurfaceCopy as copy } from "./copy.js";
import * as styles from "./styles.js";

type StageProps = Pick<MinigameDisplayRendererProps, "activeTeamName" | "clock" | "clockLine" | "serverOrigin"> & {
  view: BordenMinigameDisplayView;
};

/** The wall while a pair runs the base: the house sign with the count and the tally, and the base under it. */
const Stage = ({ view, activeTeamName, clock, clockLine, serverOrigin }: StageProps): JSX.Element => {
  const shown = resolveShownStretch(view);
  const { base, layout } = useBordenFrame(shown, view);
  const drawnBanked = useBaseValue(base, (frame) => frame?.banked ?? null);
  const banked = resolveLiveBanked(view, shown, drawnBanked);

  // The TV is the room's speaker at the party.
  useBordenSounds({ base, isSpeaker: true, ownSlot: null });

  return (
    <div className={styles.stage}>
      <NeonMarquee
        title={copy.title}
        teamName={activeTeamName}
        clock={clock}
        clockLine={clockLine}
        readout={
          <span className={styles.counts}>
            <span>{copy.stretchCounter(Math.min(view.stretchIndex + 1, view.stretchesPerTurn), view.stretchesPerTurn)}</span>
            <span className={styles.tally} data-borden-banked={banked} data-borden-total={view.total}>
              {copy.tally(banked, view.total)}
              <span className={styles.tallyLabel}>{copy.tallyLabel}</span>
            </span>
          </span>
        }
      />
      <div className={styles.arenaArea}>
        {shown === null || layout === null ? (
          <p className={styles.hint}>{copy.waitingBaseLabel}</p>
        ) : (
          <BordenScene
            base={base}
            layout={layout}
            crew={view.crew}
            pair={shown.pair}
            activeTurnTeamId={view.activeTurnTeamId}
            serverOrigin={serverOrigin}
            ownSlot={null}
            label={copy.sceneLabel}
          />
        )}
      </div>
    </div>
  );
};

// Base Borden's display surface: the briefing before the run, and at play the wall's stage. The
// TV is the one picture and the only speaker at the party; online every phone is both.
export const DisplayBordenSurface = ({ phase, minigameDisplayView, activeTeamName, clock, clockLine, serverOrigin }: MinigameDisplayRendererProps): JSX.Element => {
  const view = minigameDisplayView?.minigame === "BORDEN" ? minigameDisplayView : null;

  if (phase !== "play") {
    return (
      <div className={styles.container}>
        <h2 className={styles.introTitle}>{copy.title}</h2>
        <p className={styles.introDescription}>{copy.introDescription}</p>
      </div>
    );
  }

  if (view === null) {
    return (
      <div className={styles.stage}>
        <NeonMarquee title={copy.title} teamName={activeTeamName} clock={clock} clockLine={clockLine} />
        <p className={styles.hint}>{copy.waitingBaseLabel}</p>
      </div>
    );
  }

  return <Stage view={view} activeTeamName={activeTeamName} clock={clock} clockLine={clockLine} serverOrigin={serverOrigin} />;
};
