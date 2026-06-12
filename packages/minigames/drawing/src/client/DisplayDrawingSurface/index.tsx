import { useEffect, useRef, useState } from "react";
import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import type { DrawingPromptReveal, DrawingStroke } from "@wingnight/shared";

import { StrokeReplayCanvas } from "./StrokeReplayCanvas/index.js";
import { displayDrawingSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// The reveal window is display-client-driven: visible while now is before
// expiresAtMs, then the prompt text disappears again.
const useIsRevealVisible = (reveal: DrawingPromptReveal | null): boolean => {
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

const RevealPlaque = ({
  reveal,
  teamName
}: {
  reveal: DrawingPromptReveal;
  teamName: string | null;
}): JSX.Element => {
  const isCorrect = reveal.outcome === "CORRECT";

  return (
    <div
      className={
        isCorrect ? styles.revealPlaqueCorrect : styles.revealPlaqueIncorrect
      }
    >
      <span
        className={
          isCorrect ? styles.revealCheckCorrect : styles.revealCheckIncorrect
        }
        aria-hidden="true"
      >
        {isCorrect ? "✓" : "✗"}
      </span>
      <div className={styles.revealAnswer}>
        <span
          className={
            isCorrect
              ? styles.revealAnswerLabelCorrect
              : styles.revealAnswerLabelIncorrect
          }
        >
          {displayDrawingSurfaceCopy.revealAnswerLabel}
        </span>
        {reveal.promptText}
      </div>
      {isCorrect && (
        <div className={styles.revealAward}>
          <span className={styles.revealAwardPoints}>
            {displayDrawingSurfaceCopy.revealAwardPoints}
          </span>
          {teamName !== null && (
            <span className={styles.revealAwardTeam}>{teamName}</span>
          )}
        </div>
      )}
    </div>
  );
};

export const DisplayDrawingSurface = ({
  phase,
  minigameDisplayView,
  activeTeamName
}: MinigameDisplayRendererProps): JSX.Element => {
  const drawingDisplayView =
    minigameDisplayView?.minigame === "DRAWING" ? minigameDisplayView : null;
  const reveal = drawingDisplayView?.reveal ?? null;
  const isRevealVisible = useIsRevealVisible(reveal);
  const isPlayPhase = phase === "play";
  const strokes = drawingDisplayView?.strokes ?? [];

  // The runtime clears the canvas the moment a prompt resolves, but the
  // payoff lands better when the finished sketch lingers, dimmed, under the
  // reveal plaque — so hold the last drawing until the reveal expires.
  const heldStrokesRef = useRef<DrawingStroke[]>([]);

  useEffect(() => {
    if (strokes.length > 0) {
      heldStrokesRef.current = strokes;
    }
  }, [strokes]);

  const shouldHoldSketch = isRevealVisible && strokes.length === 0;
  const strokesToRender = shouldHoldSketch ? heldStrokesRef.current : strokes;

  const pendingPoints =
    drawingDisplayView !== null &&
    drawingDisplayView.activeTurnTeamId !== null
      ? (drawingDisplayView.pendingPointsByTeamId[
          drawingDisplayView.activeTurnTeamId
        ] ?? 0)
      : null;

  return (
    <div className={styles.stage}>
      <header className={styles.marquee}>
        <span className={styles.marqueeBulbs} aria-hidden="true" />
        <p className={styles.marqueeTeamName}>{activeTeamName ?? ""}</p>
        <span className={styles.marqueeTitle}>
          {displayDrawingSurfaceCopy.marqueeTitle}
        </span>
        <span className={styles.marqueePending}>
          {pendingPoints !== null
            ? displayDrawingSurfaceCopy.pendingChip(pendingPoints)
            : ""}
        </span>
      </header>
      <main className={styles.canvasArea}>
        <StrokeReplayCanvas
          strokes={strokesToRender}
          isDimmed={isRevealVisible}
        />
        {!isPlayPhase && (
          <div className={styles.idleOverlay}>
            <p className={styles.idleText}>
              {displayDrawingSurfaceCopy.introMessage}
            </p>
          </div>
        )}
        {isPlayPhase && isRevealVisible && reveal !== null && (
          <>
            <span className={`${styles.spark} ${styles.sparkOne}`} aria-hidden="true">
              ✦
            </span>
            <span className={`${styles.spark} ${styles.sparkTwo}`} aria-hidden="true">
              ✦
            </span>
            <span
              className={`${styles.spark} ${styles.sparkThree}`}
              aria-hidden="true"
            >
              ✧
            </span>
            <span
              className={`${styles.spark} ${styles.sparkFour}`}
              aria-hidden="true"
            >
              ✧
            </span>
            <div className={styles.revealOverlay}>
              <RevealPlaque reveal={reveal} teamName={activeTeamName} />
            </div>
          </>
        )}
      </main>
      {isPlayPhase && activeTeamName !== null && (
        <p className={styles.statusLine}>
          {displayDrawingSurfaceCopy.drawingStatus(activeTeamName)}
        </p>
      )}
    </div>
  );
};
