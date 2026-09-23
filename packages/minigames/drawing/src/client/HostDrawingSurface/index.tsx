import { useRef, useState } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import { TakeoverStage } from "@wingnight/surface";

import {
  DrawingCanvas,
  type DrawingCanvasHandle
} from "./DrawingCanvas/index.js";
import { useIsRevealVisible } from "../useIsRevealVisible/index.js";
import { hostDrawingSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// Glowing "palette light" inks from the easel mockups; chalk plus existing
// theme tokens (see DESIGN.md §2.5). Inks are drawing content, not UI accents.
// Each swatch's glow is genuinely per-instance colour, so it rides a `--ink-color`
// custom property (styles.ts) rather than an inline style prop — the same
// enumerated-class pattern the cast package uses for its per-instance timings
// (resolveTeamColorVariant's `tintClassName`).
const INK_PALETTE = [
  { id: "chalk", label: "Chalk", color: "#F3EEE2", varClassName: "[--ink-color:#F3EEE2]" },
  { id: "ember", label: "Ember", color: "#F97316", varClassName: "[--ink-color:#F97316]" },
  { id: "chili", label: "Chili", color: "#EF4444", varClassName: "[--ink-color:#EF4444]" },
  { id: "gold", label: "Gold", color: "#FBBF24", varClassName: "[--ink-color:#FBBF24]" },
  { id: "wave", label: "Wave", color: "#06B6D4", varClassName: "[--ink-color:#06B6D4]" },
  { id: "lime", label: "Lime", color: "#84CC16", varClassName: "[--ink-color:#84CC16]" }
] as const;

const BRUSH_SIZE = 0.03;

// DRAWING's host surface. At play it is a `<TakeoverStage>` with no deck
// (docs/takeover-layout-api.md §3), and it is the case the rule was phrased
// around: the body is the largest single element of any Stage game and still
// is not a Canvas, because chrome floating over the board covers the drawing.
// The rule reads even harder here than §3 states it — the board is both what
// the host reads and what the host presses, so a floating `actions` row would
// not merely sit on scenery, it would put five live buttons (one of them
// CLEAR) on the surface the artist's hand is already moving across.
//
// It renders no rail and no team chip of its own — `rail` arrives filled with
// the shell's `<HostMiniRail />`, which already says the round, the sauce and
// whose turn it is — which is why the `resolveActiveTeamName` helper that all
// nine host surfaces had copied is no longer here. `clock` is forwarded
// untouched and DOES draw: DRAWING is one of the three games with a play-phase
// timer, and it is the game whose `railPending` the old absolute chip used to
// land on top of (§6).
export const HostDrawingSurface = ({
  phase,
  minigameHostView,
  rail,
  clock,
  canDispatchAction,
  onDispatchAction
}: MinigameHostRendererProps): JSX.Element => {
  const drawingHostView =
    minigameHostView?.minigame === "DRAWING" ? minigameHostView : null;
  const canvasHandleRef = useRef<DrawingCanvasHandle | null>(null);
  const [selectedInkId, setSelectedInkId] = useState<string>(
    INK_PALETTE[0].id
  );
  const isRevealVisible = useIsRevealVisible(drawingHostView?.reveal ?? null);

  if (phase !== "play") {
    return (
      <div className={styles.introRoot}>
        <p className={styles.introCard}>
          {hostDrawingSurfaceCopy.introDescription}
        </p>
      </div>
    );
  }

  const currentPrompt = drawingHostView?.currentPrompt ?? null;
  const activeTurnTeamId = drawingHostView?.activeTurnTeamId ?? null;
  const pendingPoints =
    drawingHostView === null || activeTurnTeamId === null
      ? null
      : (drawingHostView.pendingPointsByTeamId[activeTurnTeamId] ?? 0);
  const selectedInk =
    INK_PALETTE.find((ink) => ink.id === selectedInkId) ?? INK_PALETTE[0];
  const canDraw = canDispatchAction && drawingHostView !== null;
  const canResolvePrompt =
    canDispatchAction && drawingHostView !== null && currentPrompt !== null;
  const hasStrokes = (drawingHostView?.strokes.length ?? 0) > 0;

  // Buffered stroke points must reach the server before a control action so
  // the canonical canvas matches what the drawer saw when they tapped it.
  const dispatchControlAction = (actionType: string): void => {
    canvasHandleRef.current?.finalizeStrokes();
    onDispatchAction(actionType, {});
  };

  return (
    <TakeoverStage
      rail={rail}
      clock={clock}
      counter={
        <>
          {currentPrompt !== null && (
            <span className={styles.counterPrompt}>
              <span className={styles.counterPromptLabel}>
                {hostDrawingSurfaceCopy.promptCardLabel}
              </span>
              <p className={styles.counterPromptText}>{currentPrompt.prompt}</p>
            </span>
          )}
          {pendingPoints !== null && (
            <span className={styles.counterPending}>
              {hostDrawingSurfaceCopy.pendingChip(pendingPoints)}
            </span>
          )}
        </>
      }
      actions={
        drawingHostView === null ? null : (
          <div className={styles.actions}>
            <div className={styles.toolGroup}>
              <button
                className={styles.toolButton}
                type="button"
                disabled={!canDraw || !hasStrokes}
                onClick={(): void => {
                  dispatchControlAction("undoStroke");
                }}
              >
                {hostDrawingSurfaceCopy.undoButtonLabel}
              </button>
              <button
                className={styles.toolButton}
                type="button"
                disabled={!canDraw || !hasStrokes}
                onClick={(): void => {
                  dispatchControlAction("clearCanvas");
                }}
              >
                {hostDrawingSurfaceCopy.clearButtonLabel}
              </button>
              <button
                className={styles.toolButton}
                type="button"
                disabled={!canResolvePrompt}
                onClick={(): void => {
                  dispatchControlAction("skipPrompt");
                }}
              >
                {hostDrawingSurfaceCopy.skipButtonLabel}
              </button>
            </div>
            <div className={styles.verdictGroup}>
              {/* Positive verdict first (§4, owner decision P7). */}
              <button
                className={styles.verdictCorrect}
                type="button"
                disabled={!canResolvePrompt}
                onClick={(): void => {
                  dispatchControlAction("markCorrect");
                }}
              >
                <span className={styles.verdictIcon} aria-hidden="true">
                  {hostDrawingSurfaceCopy.correctIconGlyph}
                </span>
                {hostDrawingSurfaceCopy.correctButtonLabel}
              </button>
              <button
                className={styles.verdictIncorrect}
                type="button"
                disabled={!canResolvePrompt}
                onClick={(): void => {
                  dispatchControlAction("markIncorrect");
                }}
              >
                <span className={styles.verdictIcon} aria-hidden="true">
                  {hostDrawingSurfaceCopy.incorrectIconGlyph}
                </span>
                {hostDrawingSurfaceCopy.incorrectButtonLabel}
              </button>
            </div>
          </div>
        )
      }
    >
      {drawingHostView === null ? (
        <p className={styles.statusNote}>
          {hostDrawingSurfaceCopy.waitingBoardLabel}
        </p>
      ) : (
        <div className={styles.easelRow}>
          <div className={styles.inkRail}>
            <span className={styles.boothPlate}>
              {hostDrawingSurfaceCopy.boothTitle}
            </span>
            <span className={styles.boothPlateRule} aria-hidden="true" />
            {INK_PALETTE.map((ink) => (
              <button
                key={ink.id}
                type="button"
                aria-label={hostDrawingSurfaceCopy.inkSwatchLabel(ink.label)}
                aria-pressed={ink.id === selectedInk.id}
                className={`${styles.inkLight} ${ink.varClassName}${
                  ink.id === selectedInk.id ? ` ${styles.inkLightSelected}` : ""
                }`}
                disabled={!canDraw}
                onClick={(): void => {
                  setSelectedInkId(ink.id);
                }}
              />
            ))}
          </div>
          <div className={styles.easelArea}>
            <DrawingCanvas
              ref={canvasHandleRef}
              strokes={drawingHostView.strokes}
              canDraw={canDraw}
              brushColor={selectedInk.color}
              brushSize={BRUSH_SIZE}
              onBeginStroke={(payload): void => {
                onDispatchAction("beginStroke", payload);
              }}
              onAppendStrokePoints={(strokeId, points): void => {
                onDispatchAction("appendStrokePoints", { strokeId, points });
              }}
              onEndStroke={(strokeId): void => {
                onDispatchAction("endStroke", { strokeId });
              }}
            />
            {currentPrompt === null && (
              <p className={styles.waitingNote}>
                {hostDrawingSurfaceCopy.waitingPromptLabel}
              </p>
            )}
            {isRevealVisible && drawingHostView.reveal !== null && (
              <p className={styles.revealLine}>
                {hostDrawingSurfaceCopy.revealLine(
                  drawingHostView.reveal.promptText,
                  drawingHostView.reveal.outcome === "CORRECT"
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </TakeoverStage>
  );
};
