import type { BrawlCrewWalk, BrawlMinigameHostView, CrewPad as CrewPadState, CrewStageStatus } from "@wingnight/shared";

import { CrewPad } from "../CrewPad/index.js";
import { CrewScene } from "../CrewScene/index.js";
import { resolveCrewSlotColour } from "../CrewScene/palette.js";
import { resolveShownBlock } from "../shownBlock/index.js";
import { useCrewFrame } from "../useCrewFrame/index.js";
import { useCrewSounds } from "../useCrewSounds/index.js";
import { crewPhoneBrawlSurfaceCopy as copy } from "./copy.js";
import * as styles from "./styles.js";

export type CrewPhoneBrawlSurfaceProps = {
  view: BrawlMinigameHostView;
  /** This phone's own pad (`selectCrew`), or null while it only watches. */
  pad: CrewPadState | null;
  status: CrewStageStatus | null;
  serverOrigin: string | null;
  onWalk: (dir: BrawlCrewWalk) => void;
  onPeck: (held: boolean) => void;
};

/**
 * One phone in an online room (docs/minigames/base-borden-spec.md §0.6): with no TV, every phone
 * is its own screen, so it draws the street the party's wall would and lays its player's two
 * thumbs over it, and plays the street's sounds itself. The street is the shared `CrewScene`,
 * stepped forward between the room's frames by `useCrewFrame` exactly as the wall steps it; the
 * thumbs are the shared `CrewPad`. What a thumb sends is the room's to stamp with who sent it, so
 * nothing here names a player.
 */
export const CrewPhoneBrawlSurface = ({ view, pad, status, serverOrigin, onWalk, onPeck }: CrewPhoneBrawlSurfaceProps): JSX.Element => {
  const shown = resolveShownBlock(view);
  const { street, layout } = useCrewFrame(shown, view);

  // There is no TV online, so every phone is its own speaker (the page wakes the audio on a tap).
  useCrewSounds({ street, hazard: layout?.hazard?.kind ?? null, serverOrigin, isSpeaker: true });

  const isPlaying = pad !== null && pad.state !== "out";
  const colour = resolveCrewSlotColour(pad?.slot ?? null);

  return (
    <div className={styles.root} data-brawl-phone={pad === null ? "watching" : pad.state} data-brawl-phone-status={status ?? ""}>
      {shown !== null && layout !== null && (
        <CrewScene
          street={street}
          layout={layout}
          crew={shown.crew}
          activeTurnTeamId={view.activeTurnTeamId}
          serverOrigin={serverOrigin}
          label={copy.sceneLabel}
          fit="contain"
        />
      )}
      {isPlaying && <CrewPad colour={colour} isLabelled={false} onWalk={onWalk} onPeck={onPeck} />}
      {pad !== null && pad.state === "down" && (
        <div className={styles.veil}>
          <p className={styles.veilTitle}>{copy.down}</p>
          <p className={styles.veilLine}>{copy.downHint}</p>
        </div>
      )}
      {pad !== null && pad.state === "away" && (
        <div className={styles.veil}>
          <p className={styles.veilLine}>{copy.away}</p>
        </div>
      )}
      {pad !== null && pad.state !== "out" && (
        <svg className={styles.tag} viewBox="0 0 120 28" aria-hidden>
          <rect width={120} height={28} rx={6} fill={colour} />
          <text className={styles.tagText} x={8} y={14} dominantBaseline="central">
            {pad.slot === null ? copy.hearts(pad.hearts) : `${copy.playerTag(pad.slot)} ${copy.hearts(pad.hearts)}`}
          </text>
        </svg>
      )}
      {pad === null && <p className={styles.note}>{copy.watching}</p>}
      {isPlaying && status === "ready" && view.blockIndex > 0 && <p className={styles.note}>{copy.nextBlock}</p>}
    </div>
  );
};
