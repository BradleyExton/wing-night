import { useEffect, useRef, useState } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type {
  DrawingMinigameHostView,
  DrawingPromptReveal
} from "@wingnight/shared";

import {
  DrawingCanvas,
  type DrawingCanvasHandle
} from "./DrawingCanvas/index.js";
import { hostDrawingSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// Glowing "palette light" inks from the easel mockups; chalk plus existing
// theme tokens (see DESIGN.md §2.5). Inks are drawing content, not UI accents.
const INK_PALETTE = [
  { id: "chalk", label: "Chalk", color: "#F3EEE2" },
  { id: "ember", label: "Ember", color: "#F97316" },
  { id: "chili", label: "Chili", color: "#EF4444" },
  { id: "gold", label: "Gold", color: "#FBBF24" },
  { id: "wave", label: "Wave", color: "#06B6D4" },
  { id: "lime", label: "Lime", color: "#84CC16" }
] as const;

const BRUSH_SIZE = 0.03;

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

const resolveActiveTeamName = ({
  minigameHostView,
  teamNameByTeamId,
  activeTeamName
}: Pick<
  MinigameHostRendererProps,
  "minigameHostView" | "teamNameByTeamId" | "activeTeamName"
>): string => {
  if (minigameHostView?.activeTurnTeamId) {
    return (
      teamNameByTeamId.get(minigameHostView.activeTurnTeamId) ??
      hostDrawingSurfaceCopy.noAssignedTeamLabel
    );
  }

  return activeTeamName ?? hostDrawingSurfaceCopy.noAssignedTeamLabel;
};

const resolvePendingPoints = (
  drawingHostView: DrawingMinigameHostView | null
): number | null => {
  if (drawingHostView === null || drawingHostView.activeTurnTeamId === null) {
    return null;
  }

  return (
    drawingHostView.pendingPointsByTeamId[drawingHostView.activeTurnTeamId] ?? 0
  );
};

export const HostDrawingSurface = ({
  phase,
  minigameHostView,
  activeTeamName,
  teamNameByTeamId,
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

  const resolvedActiveTeamName = resolveActiveTeamName({
    minigameHostView,
    teamNameByTeamId,
    activeTeamName
  });
  const isPlayPhase = phase === "play";
  const currentPrompt = drawingHostView?.currentPrompt ?? null;
  const pendingPoints = resolvePendingPoints(drawingHostView);
  const selectedInk =
    INK_PALETTE.find((ink) => ink.id === selectedInkId) ?? INK_PALETTE[0];
  const canDraw =
    isPlayPhase && canDispatchAction && drawingHostView !== null;
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
    <div className={styles.container}>
      <div className={styles.rail}>
        <span className={styles.railTitle}>
          {hostDrawingSurfaceCopy.railTitle}
        </span>
        <span className={styles.railTeam}>
          <span className={styles.railTeamDot} aria-hidden="true" />
          {hostDrawingSurfaceCopy.teamPrefix} {resolvedActiveTeamName}
        </span>
        {isPlayPhase && pendingPoints !== null && (
          <span className={styles.railPending}>
            {hostDrawingSurfaceCopy.pendingChip(pendingPoints)}
          </span>
        )}
      </div>
      {!isPlayPhase && (
        <p className={styles.introCard}>
          {hostDrawingSurfaceCopy.introDescription}
        </p>
      )}
      {isPlayPhase && drawingHostView !== null && (
        <div className={styles.playArea}>
          <div className={styles.easelColumn}>
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
          </div>
          <aside className={styles.deck}>
            {currentPrompt !== null ? (
              <div className={styles.promptCard}>
                <div className={styles.promptCardLabel}>
                  {hostDrawingSurfaceCopy.promptCardLabel}
                </div>
                <p className={styles.promptCardText}>{currentPrompt.prompt}</p>
              </div>
            ) : (
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
            <button
              className={styles.verdictCorrect}
              type="button"
              disabled={!canResolvePrompt}
              onClick={(): void => {
                dispatchControlAction("markCorrect");
              }}
            >
              <span className={styles.verdictIcon} aria-hidden="true">
                ✓
              </span>
              <span className={styles.verdictLabel}>
                {hostDrawingSurfaceCopy.correctButtonLabel}
              </span>
              <span className={styles.verdictSub}>
                {hostDrawingSurfaceCopy.correctButtonSub}
              </span>
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
                ✗
              </span>
              <span className={styles.verdictLabel}>
                {hostDrawingSurfaceCopy.incorrectButtonLabel}
              </span>
              <span className={styles.verdictSub}>
                {hostDrawingSurfaceCopy.incorrectButtonSub}
              </span>
            </button>
            <div className={styles.deckRows}>
              <button
                className={styles.deckRowButton}
                type="button"
                disabled={!canDraw || !hasStrokes}
                onClick={(): void => {
                  dispatchControlAction("undoStroke");
                }}
              >
                {hostDrawingSurfaceCopy.undoButtonLabel}
              </button>
              <button
                className={styles.deckRowButton}
                type="button"
                disabled={!canDraw || !hasStrokes}
                onClick={(): void => {
                  dispatchControlAction("clearCanvas");
                }}
              >
                {hostDrawingSurfaceCopy.clearButtonLabel}
              </button>
              <button
                className={styles.deckRowButton}
                type="button"
                disabled={!canResolvePrompt}
                onClick={(): void => {
                  dispatchControlAction("skipPrompt");
                }}
              >
                {hostDrawingSurfaceCopy.skipButtonLabel}
              </button>
            </div>
            <div className={styles.paletteGrid}>
              {INK_PALETTE.map((ink) => (
                <button
                  key={ink.id}
                  type="button"
                  aria-label={hostDrawingSurfaceCopy.inkSwatchLabel(ink.label)}
                  aria-pressed={ink.id === selectedInk.id}
                  className={`${styles.inkLight}${
                    ink.id === selectedInk.id
                      ? ` ${styles.inkLightSelected}`
                      : ""
                  }`}
                  style={{
                    backgroundColor: ink.color,
                    boxShadow: `inset 0 -4px 8px rgba(0,0,0,0.45), inset 0 4px 8px rgba(255,255,255,0.18), 0 0 12px ${ink.color}`
                  }}
                  disabled={!canDraw}
                  onClick={(): void => {
                    setSelectedInkId(ink.id);
                  }}
                />
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
