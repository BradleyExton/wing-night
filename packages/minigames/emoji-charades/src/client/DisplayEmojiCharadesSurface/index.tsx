import { useEffect, useRef, useState } from "react";

import {
  resolveRevealDurationMs,
  type MinigameDisplayRendererProps
} from "@wingnight/minigames-core";
import { NeonMarquee } from "@wingnight/surface";
import type {
  EmojiCharadesMinigameDisplayView,
  EmojiCharadesSubjectReveal
} from "@wingnight/shared";

import { MAX_EMOJIS_PER_SUBJECT } from "../../runtime/types/index.js";
import { useEmojiCharadesSounds } from "../useEmojiCharadesSounds/index.js";
import { ClueStage } from "./ClueStage/index.js";
import { RevealOverlay } from "./RevealOverlay/index.js";
import { displayEmojiCharadesSurfaceCopy } from "./copy.js";
import {
  resolveHeldClue,
  resolveRevealKey,
  type HeldClue
} from "./heldClue/index.js";
import * as styles from "./styles.js";

// The reveal window is display-client-driven: the subject text is visible for
// the server's window, timed from when THIS display saw the reveal.
//
// Timed from arrival rather than measured against `expiresAtMs`, because that
// stamp is on the server's clock and this comparison would be on the TV's —
// see `resolveRevealDurationMs`. A TV two seconds fast used to find every
// window already closed and show the room no answers at all.
//
// The trade is that a display joining mid-window gives the reveal its full
// length rather than the remainder. That is the right way round: the window
// exists so the room can read the answer, and a late display reading it a
// beat late is the outcome worth having.
const useIsRevealVisible = (
  reveal: EmojiCharadesSubjectReveal | null
): boolean => {
  const [expiredRevealKey, setExpiredRevealKey] = useState<string | null>(null);
  const revealKey = resolveRevealKey(reveal);
  const durationMs = reveal === null ? 0 : resolveRevealDurationMs(reveal);

  useEffect(() => {
    if (revealKey === null || durationMs <= 0) {
      return undefined;
    }

    const expiryTimer = setTimeout(() => {
      setExpiredRevealKey(revealKey);
    }, durationMs);

    return (): void => {
      clearTimeout(expiryTimer);
    };
  }, [durationMs, revealKey]);

  // Visible from the very render the reveal arrives in, not one render later:
  // the verdict empties the clue in the same update, and a render that saw the
  // empty clue before the held one would send the stage's emoji off and bring
  // them back popping.
  return revealKey !== null && durationMs > 0 && expiredRevealKey !== revealKey;
};

export const DisplayEmojiCharadesSurface = ({
  minigameDisplayView,
  activeTeamName,
  clock,
  clockLine
}: MinigameDisplayRendererProps): JSX.Element => {
  const displayView: EmojiCharadesMinigameDisplayView | null =
    minigameDisplayView?.minigame === "EMOJI_CHARADES" ? minigameDisplayView : null;
  // The final verdict of a turn flips straight to `turn_complete`, so the reveal has to be read
  // from that status too — otherwise the turn's last answer never reaches the room.
  const reveal = displayView === null ? null : displayView.reveal;
  const isRevealVisible = useIsRevealVisible(reveal);
  const emojiSequence =
    displayView?.status === "playing" ? displayView.emojiSequence : [];

  useEmojiCharadesSounds(emojiSequence.length);

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
      <NeonMarquee
        title={displayEmojiCharadesSurfaceCopy.title}
        teamName={activeTeamName}
        pending={pendingPoints}
        clock={clock}
        clockLine={clockLine}
      />

      {displayView === null && (
        <p className={styles.statusLine}>
          {displayEmojiCharadesSurfaceCopy.waitingLabel}
        </p>
      )}

      {displayView?.status === "playing" && (
        <div className={styles.boardArea}>
          <ClueStage
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
              <ClueStage emojiSequence={boardEmojiSequence} isDimmed />
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
