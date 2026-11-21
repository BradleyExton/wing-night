import { CrewPad, resolveCrewSlotColour } from "@wingnight/minigames-brawl/client";
import type { BordenMinigameHostView, BordenStick, CrewPad as CrewPadState, CrewStageStatus } from "@wingnight/shared";

import { BordenScene } from "../BordenScene/index.js";
import { resolveShownStretch } from "../shownStretch/index.js";
import { useBaseValue, useBordenFrame } from "../useBordenFrame/index.js";
import { useBordenSounds } from "../useBordenSounds/index.js";
import { crewPhoneBordenSurfaceCopy as copy } from "./copy.js";
import * as styles from "./styles.js";

export type CrewPhoneBordenSurfaceProps = {
  view: BordenMinigameHostView;
  /** The player this phone sits as, or null while it only watches. */
  playerId: string | null;
  /** This phone's own pad (`selectCrew`), or null while it only watches. */
  pad: CrewPadState | null;
  status: CrewStageStatus | null;
  serverOrigin: string | null;
  onStick: (dir: BordenStick) => void;
  onJump: () => void;
};

/** What a player sitting this stretch out is told: when her pair is up, or that she has run hers. */
const resolveOutNote = (view: BordenMinigameHostView, seat: number | null): string => {
  const next = seat === null ? undefined : view.stretches.find((stretch) => stretch.stretchIndex > view.stretchIndex && stretch.pair.includes(seat));

  return next === undefined ? copy.sittingOut : copy.nextUp(next.stretchIndex + 1);
};

/**
 * One phone in an online room (docs/minigames/base-borden-spec.md §0.6): with no TV, every phone
 * is its own screen and its own speaker. A phone in the pair draws the base with its player's two
 * thumbs laid over it, the crew pad's: the left half is the stick (run, aim, duck), the right half
 * jumps. A phone sitting the stretch out draws the same base with no pad and when she is up. What
 * a thumb sends is the room's to stamp with who sent it, so nothing here names a player.
 */
export const CrewPhoneBordenSurface = ({
  view,
  playerId,
  pad,
  status,
  serverOrigin,
  onStick,
  onJump
}: CrewPhoneBordenSurfaceProps): JSX.Element => {
  const shown = resolveShownStretch(view);
  const { base, layout } = useBordenFrame(shown, view);
  // Her seat is her colour for the whole game, in the pair or sitting a stretch out.
  const seat = view.crew.find((member) => member.player !== null && member.player.playerId === playerId)?.seat ?? null;
  const ownSlot = shown === null || seat === null ? null : shown.pair.indexOf(seat);
  const isOwnSlot = ownSlot !== null && ownSlot >= 0;
  const bottle = useBaseValue(base, (frame) => (isOwnSlot ? (frame?.hens[ownSlot]?.bottle ?? null) : null));

  useBordenSounds({ base, isSpeaker: true, ownSlot: isOwnSlot ? ownSlot : null });

  const isPlaying = pad !== null && pad.state !== "out";
  const colour = resolveCrewSlotColour(seat);

  return (
    <div className={styles.root} data-borden-phone={pad === null ? "watching" : pad.state} data-borden-phone-status={status ?? ""}>
      {shown !== null && layout !== null && (
        <BordenScene
          base={base}
          layout={layout}
          crew={view.crew}
          pair={shown.pair}
          activeTurnTeamId={view.activeTurnTeamId}
          serverOrigin={serverOrigin}
          ownSlot={isOwnSlot ? ownSlot : null}
          label={copy.sceneLabel}
        />
      )}
      {isPlaying && (
        <CrewPad
          colour={colour}
          isLabelled={false}
          onWalk={onStick}
          onPeck={(held): void => {
            if (held) {
              onJump();
            }
          }}
        />
      )}
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
      {isPlaying && (
        <svg className={styles.tag} viewBox="0 0 144 28" aria-hidden>
          <rect width={144} height={28} rx={6} fill={colour} />
          <text className={styles.tagText} x={8} y={14} dominantBaseline="central">
            {`${copy.hearts(pad.hearts)} ${bottle === null ? "" : copy.bottles[bottle]}`}
          </text>
        </svg>
      )}
      {pad === null && <p className={styles.note}>{copy.watching}</p>}
      {pad !== null && pad.state === "out" && <p className={styles.note}>{resolveOutNote(view, seat)}</p>}
      {isPlaying && status === "ready" && view.stretchIndex > 0 && <p className={styles.note}>{copy.nextStretch}</p>}
    </div>
  );
};
