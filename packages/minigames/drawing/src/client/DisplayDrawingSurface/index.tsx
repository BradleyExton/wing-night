import { useRef } from "react";
import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import { NeonMarquee, ResultPlaque } from "@wingnight/surface";
import type { DrawingPromptReveal, DrawingStroke } from "@wingnight/shared";

import { StrokeReplayCanvas } from "./StrokeReplayCanvas/index.js";
import {
  resolveHeldSketch,
  resolveRevealKey,
  type HeldSketch
} from "./heldSketch/index.js";
import { useIsRevealVisible } from "../useIsRevealVisible/index.js";
import { displayDrawingSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// The reveal is the house `<ResultPlaque>` (DESIGN.md §2.2E): the answer as its
// title, and on a correct call the point and the team that banked it.
const RevealPlaque = ({
  reveal,
  teamName
}: {
  reveal: DrawingPromptReveal;
  teamName: string | null;
}): JSX.Element => {
  const isCorrect = reveal.outcome === "CORRECT";

  return (
    <ResultPlaque
      tone={isCorrect ? "hit" : "miss"}
      kicker={
        isCorrect
          ? displayDrawingSurfaceCopy.revealAnswerLabel
          : displayDrawingSurfaceCopy.revealMissedLabel
      }
      title={reveal.promptText}
      points={isCorrect ? displayDrawingSurfaceCopy.revealAwardPoints : null}
      pointsCaption={isCorrect ? teamName : null}
    />
  );
};

export const DisplayDrawingSurface = ({
  phase,
  minigameDisplayView,
  activeTeamName,
  clock,
  clockLine
}: MinigameDisplayRendererProps): JSX.Element => {
  const drawingDisplayView =
    minigameDisplayView?.minigame === "DRAWING" ? minigameDisplayView : null;
  const reveal = drawingDisplayView?.reveal ?? null;
  const isRevealVisible = useIsRevealVisible(reveal);
  const isPlayPhase = phase === "play";
  const strokes = drawingDisplayView?.strokes ?? [];

  // The runtime clears the canvas the moment a prompt resolves, but the
  // payoff lands better when the finished sketch lingers, dimmed, under the
  // reveal plaque — so hold the board this reveal caught until it expires.
  const previousStrokesRef = useRef<DrawingStroke[]>(strokes);
  const heldSketchRef = useRef<HeldSketch | null>(null);

  heldSketchRef.current = resolveHeldSketch({
    heldSketch: heldSketchRef.current,
    revealKey: resolveRevealKey(reveal),
    strokes,
    previousStrokes: previousStrokesRef.current
  });
  previousStrokesRef.current = strokes;

  const heldStrokes = heldSketchRef.current?.strokes ?? [];
  const shouldHoldSketch = isRevealVisible && strokes.length === 0;
  const strokesToRender = shouldHoldSketch ? heldStrokes : strokes;

  const pendingPoints =
    drawingDisplayView !== null &&
    drawingDisplayView.activeTurnTeamId !== null
      ? (drawingDisplayView.pendingPointsByTeamId[
          drawingDisplayView.activeTurnTeamId
        ] ?? 0)
      : null;

  return (
    <div className={styles.stage}>
      <NeonMarquee
        title={displayDrawingSurfaceCopy.title}
        teamName={activeTeamName}
        pending={pendingPoints}
        clock={clock}
        clockLine={clockLine}
      />
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
              {displayDrawingSurfaceCopy.revealSparkGlyphPrimary}
            </span>
            <span className={`${styles.spark} ${styles.sparkTwo}`} aria-hidden="true">
              {displayDrawingSurfaceCopy.revealSparkGlyphPrimary}
            </span>
            <span
              className={`${styles.spark} ${styles.sparkThree}`}
              aria-hidden="true"
            >
              {displayDrawingSurfaceCopy.revealSparkGlyphSecondary}
            </span>
            <span
              className={`${styles.spark} ${styles.sparkFour}`}
              aria-hidden="true"
            >
              {displayDrawingSurfaceCopy.revealSparkGlyphSecondary}
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
