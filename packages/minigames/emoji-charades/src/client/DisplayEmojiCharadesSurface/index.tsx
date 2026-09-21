import { useEffect, useRef, useState } from "react";

import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import type {
  EmojiCharadesMinigameDisplayView,
  EmojiCharadesSubjectReveal
} from "@wingnight/shared";

import { MAX_EMOJIS_PER_SUBJECT } from "../../runtime/types/index.js";
import { ClueBoard } from "./ClueBoard/index.js";
import { RevealOverlay } from "./RevealOverlay/index.js";
import { displayEmojiCharadesSurfaceCopy } from "./copy.js";
import {
  resolveHeldClue,
  resolveRevealKey,
  type HeldClue
} from "./heldClue/index.js";
import * as styles from "./styles.js";

// The reveal window is display-client-driven: visible while now is before
// expiresAtMs, then the subject text disappears again.
const useIsRevealVisible = (
  reveal: EmojiCharadesSubjectReveal | null
): boolean => {
  const [, setExpiryTick] = useState(0);

  useEffect(() => {
    if (reveal === null) {
      return undefined;
    }

    const remainingMs = reveal.expiresAtMs - Date.now();

    if (remainingMs <= 0) {
      return undefined;
    }

    const expiryTimer = setTimeout(() => {
      setExpiryTick((tick) => tick + 1);
    }, remainingMs);

    return (): void => {
      clearTimeout(expiryTimer);
    };
  }, [reveal]);

  return reveal !== null && Date.now() < reveal.expiresAtMs;
};

export const DisplayEmojiCharadesSurface = ({
  minigameDisplayView,
  activeTeamName
}: MinigameDisplayRendererProps): JSX.Element => {
  const displayView: EmojiCharadesMinigameDisplayView | null =
    minigameDisplayView?.minigame === "EMOJI_CHARADES" ? minigameDisplayView : null;
  // The final verdict of a turn flips straight to `turn_complete`, so the reveal has to be read
  // from that status too — otherwise the turn's last answer never reaches the room.
  const reveal = displayView === null ? null : displayView.reveal;
  const isRevealVisible = useIsRevealVisible(reveal);
  const emojiSequence =
    displayView?.status === "playing" ? displayView.emojiSequence : [];

  // The verdict lands in the same update that empties the clue, so the board
  // the answer dims over is the one held from the render before.
  const previousEmojiSequenceRef = useRef<string[]>(emojiSequence);
  const heldClueRef = useRef<HeldClue | null>(null);

  heldClueRef.current = resolveHeldClue({
    heldClue: heldClueRef.current,
    revealKey: resolveRevealKey(reveal),
    emojiSequence,
    previousEmojiSequence: previousEmojiSequenceRef.current
  });
  previousEmojiSequenceRef.current = emojiSequence;

  const boardEmojiSequence =
    isRevealVisible && heldClueRef.current !== null
      ? heldClueRef.current.emojiSequence
      : emojiSequence;

  const pendingPoints =
    displayView === null || displayView.activeTurnTeamId === null
      ? 0
      : (displayView.pendingPointsByTeamId[displayView.activeTurnTeamId] ?? 0);

  return (
    <div className={styles.container}>
      <div className={styles.marquee}>
        <span className={styles.marqueeBulbs} aria-hidden="true" />
        <p className={styles.teamName}>
          {activeTeamName ?? displayEmojiCharadesSurfaceCopy.showTitle}
          <span className={styles.pendingPoints}>
            {displayEmojiCharadesSurfaceCopy.pendingPointsLabel(pendingPoints)}
          </span>
        </p>
        <p className={styles.showTitle}>
          {displayEmojiCharadesSurfaceCopy.showTitle}
        </p>
        <span className={styles.timerGutter} aria-hidden="true" />
      </div>

      {displayView === null && (
        <p className={styles.statusLine}>
          {displayEmojiCharadesSurfaceCopy.waitingLabel}
        </p>
      )}

      {displayView?.status === "playing" && (
        <div className={styles.boardArea}>
          <ClueBoard
            emojiSequence={boardEmojiSequence}
            isDimmed={isRevealVisible}
          />
          {isRevealVisible && reveal !== null && (
            <RevealOverlay
              reveal={reveal}
              teamName={activeTeamName}
              pointsAwarded={displayView.pointsPerCorrect}
            />
          )}
          <p className={styles.statusLine}>
            {displayEmojiCharadesSurfaceCopy.clueingLabel(activeTeamName)}{" "}
            <span className={styles.statusCount}>
              {displayEmojiCharadesSurfaceCopy.clueProgressLabel(
                boardEmojiSequence.length,
                MAX_EMOJIS_PER_SUBJECT
              )}
            </span>
          </p>
        </div>
      )}

      {displayView?.status === "turn_complete" && (
        <div className={styles.boardArea}>
          {isRevealVisible && reveal !== null ? (
            <>
              <ClueBoard emojiSequence={boardEmojiSequence} isDimmed />
              <RevealOverlay
                reveal={reveal}
                teamName={activeTeamName}
                pointsAwarded={displayView.pointsPerCorrect}
              />
            </>
          ) : (
            <div className={styles.turnCompleteCard}>
              <p className={styles.turnCompleteTitle}>
                {displayEmojiCharadesSurfaceCopy.turnCompleteTitle}
              </p>
              <p className={styles.turnCompleteHint}>
                {displayEmojiCharadesSurfaceCopy.turnCompleteHint(pendingPoints)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
