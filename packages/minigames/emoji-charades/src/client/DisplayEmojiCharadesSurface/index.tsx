import { useEffect, useState } from "react";

import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import type {
  EmojiCharadesMinigameDisplayView,
  EmojiCharadesSubjectReveal
} from "@wingnight/shared";

import { MAX_EMOJIS_PER_SUBJECT } from "../../runtime/types/index.js";
import { displayEmojiCharadesSurfaceCopy } from "./copy.js";
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

const ClueBoard = ({
  emojiSequence,
  isDimmed
}: {
  emojiSequence: string[];
  isDimmed: boolean;
}): JSX.Element => {
  const slots = Array.from({ length: MAX_EMOJIS_PER_SUBJECT }, (_, index) => index);
  const newestIndex = emojiSequence.length - 1;

  return (
    <div className={isDimmed ? `${styles.board} ${styles.boardDimmed}` : styles.board}>
      {slots.map((slotIndex) => {
        const emoji = emojiSequence[slotIndex];

        if (emoji === undefined) {
          return <div key={slotIndex} className={styles.slotEmpty} />;
        }

        return (
          <div
            key={slotIndex}
            className={
              slotIndex === newestIndex ? styles.slotNewest : styles.slotFilled
            }
          >
            {emoji}
          </div>
        );
      })}
    </div>
  );
};

const RevealOverlay = ({
  reveal,
  teamName
}: {
  reveal: EmojiCharadesSubjectReveal;
  teamName: string | null;
}): JSX.Element => {
  const isCorrect = reveal.outcome === "CORRECT";

  return (
    <div className={styles.revealOverlay}>
      <span
        className={isCorrect ? styles.revealIconCorrect : styles.revealIconSkipped}
        aria-hidden="true"
      >
        {isCorrect ? "✓" : "✗"}
      </span>
      <div>
        <p className={styles.revealLabel}>
          {isCorrect
            ? displayEmojiCharadesSurfaceCopy.revealCorrectLabel
            : displayEmojiCharadesSurfaceCopy.revealSkippedLabel}
        </p>
        <p className={styles.revealAnswer}>{reveal.subjectText}</p>
      </div>
      {isCorrect && teamName !== null && (
        <p className={styles.revealAward}>
          <span className={styles.revealAwardPoints}>
            {displayEmojiCharadesSurfaceCopy.revealAwardLabel}
          </span>
          <span className={styles.revealAwardTeam}>{teamName}</span>
        </p>
      )}
    </div>
  );
};

export const DisplayEmojiCharadesSurface = ({
  minigameDisplayView,
  activeTeamName
}: MinigameDisplayRendererProps): JSX.Element => {
  const displayView: EmojiCharadesMinigameDisplayView | null =
    minigameDisplayView?.minigame === "EMOJI_CHARADES" ? minigameDisplayView : null;
  const reveal = displayView?.status === "playing" ? displayView.reveal : null;
  const isRevealVisible = useIsRevealVisible(reveal);
  const pendingPoints =
    displayView?.activeTurnTeamId === undefined ||
    displayView?.activeTurnTeamId === null
      ? 0
      : (displayView.pendingPointsByTeamId[displayView.activeTurnTeamId] ?? 0);

  return (
    <div className={styles.container}>
      <div className={styles.marquee}>
        <p className={styles.teamName}>
          {activeTeamName ?? displayEmojiCharadesSurfaceCopy.showTitle}
          <span className={styles.pendingPoints}>{pendingPoints}</span>
        </p>
        <p className={styles.showTitle}>
          {displayEmojiCharadesSurfaceCopy.showTitle}
        </p>
      </div>

      {displayView === null && (
        <p className={styles.statusLine}>
          {displayEmojiCharadesSurfaceCopy.waitingLabel}
        </p>
      )}

      {displayView?.status === "deck_selection" && (
        <div className={styles.deckGrid}>
          {displayView.availableDecks.map((deck) => (
            <div
              key={deck.id}
              className={deck.isSelectable ? styles.deckCard : styles.deckCardDisabled}
            >
              <p className={styles.deckCardLabel}>{deck.label}</p>
              <p className={styles.deckCardMeta}>
                {deck.isSelectable
                  ? displayEmojiCharadesSurfaceCopy.deckSubjectCountLabel(
                      deck.subjectCount
                    )
                  : displayEmojiCharadesSurfaceCopy.deckTooSmallLabel}
              </p>
            </div>
          ))}
          <p className={styles.sectionHint}>
            {displayEmojiCharadesSurfaceCopy.deckSelectionHint}
          </p>
        </div>
      )}

      {displayView?.status === "playing" && (
        <div className={styles.boardArea}>
          <ClueBoard
            emojiSequence={displayView.emojiSequence}
            isDimmed={isRevealVisible}
          />
          {isRevealVisible && reveal !== null && (
            <RevealOverlay reveal={reveal} teamName={activeTeamName} />
          )}
          <p className={styles.statusLine}>
            {displayEmojiCharadesSurfaceCopy.clueingLabel(activeTeamName)}{" "}
            <span className={styles.statusCount}>
              {displayEmojiCharadesSurfaceCopy.clueProgressLabel(
                displayView.emojiSequence.length,
                MAX_EMOJIS_PER_SUBJECT
              )}
            </span>
          </p>
        </div>
      )}

      {displayView?.status === "turn_complete" && (
        <div className={styles.boardArea}>
          <p className={styles.sectionTitle}>
            {displayEmojiCharadesSurfaceCopy.turnCompleteTitle}
          </p>
        </div>
      )}
    </div>
  );
};
