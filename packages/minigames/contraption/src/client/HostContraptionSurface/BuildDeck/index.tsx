import {
  CONTRAPTION_PIECE_KINDS,
  type ContraptionMinigameHostView,
  type ContraptionPieceKind
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { toPieceSegment } from "../../../runtime/geometry/index.js";
import { hostContraptionSurfaceCopy } from "../copy.js";
import * as styles from "./styles.js";

type BuildDeckProps = {
  view: ContraptionMinigameHostView;
  selectedKind: ContraptionPieceKind;
  canAct: boolean;
  teamNameByTeamId: Map<string, string>;
  onSelectKind: (kind: ContraptionPieceKind) => void;
  onDispatchAction: (actionType: string, actionPayload: SerializableValue) => void;
};

// A piece drawn in its own cell, so the palette shows the exact segment the
// tap will lay down.
const PieceGlyph = ({ kind }: { kind: ContraptionPieceKind }): JSX.Element => {
  const segment = toPieceSegment({ kind, column: 0, row: 0 });

  return (
    <svg viewBox="-1 -1 12 12" className={styles.pieceGlyph} aria-hidden="true">
      <line
        x1={segment.from.x}
        y1={segment.from.y}
        x2={segment.to.x}
        y2={segment.to.y}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
};

const RunningTotals = ({
  view,
  teamNameByTeamId
}: Pick<BuildDeckProps, "view" | "teamNameByTeamId">): JSX.Element => {
  return (
    <div className={styles.totalsCard}>
      <span className={styles.totalsTitle}>{hostContraptionSurfaceCopy.totalsTitle}</span>
      {Object.keys(view.pendingPointsByTeamId).map((teamId) => (
        <div
          key={teamId}
          className={`${styles.totalsRow}${
            teamId === view.activeTurnTeamId ? ` ${styles.totalsRowActive}` : ""
          }`}
        >
          <span>{teamNameByTeamId.get(teamId) ?? teamId}</span>
          <span className={styles.totalsPoints}>
            {hostContraptionSurfaceCopy.totalsPoints(view.pendingPointsByTeamId[teamId] ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
};

const RunOutcomeCard = ({ view }: Pick<BuildDeckProps, "view">): JSX.Element | null => {
  if (view.run === null) {
    return null;
  }

  const landed = view.run.outcome === "landed";

  return (
    <div className={landed ? styles.outcomeCardLanded : styles.outcomeCardMissed}>
      <p className={styles.outcomeLabel}>
        {hostContraptionSurfaceCopy.outcomeLabel[view.run.outcome]}
      </p>
      <p className={styles.outcomePoints}>
        {hostContraptionSurfaceCopy.runPoints(view.run.points)}
      </p>
      <p className={styles.outcomeMeta}>
        {hostContraptionSurfaceCopy.bonusesClipped(view.run.collectedPickupIds.length)}
        {" · "}
        {hostContraptionSurfaceCopy.bestPoints(view.bestPoints)}
      </p>
    </div>
  );
};

export const BuildDeck = ({
  view,
  selectedKind,
  canAct,
  teamNameByTeamId,
  onSelectKind,
  onDispatchAction
}: BuildDeckProps): JSX.Element => {
  const level = view.level;
  const isBuilding = view.phase === "building";
  const hasAttemptsLeft = view.attemptsUsed < view.attemptsPerTurn;
  const canBuild = canAct && isBuilding;
  const attemptNumber = isBuilding ? view.attemptsUsed + 1 : view.attemptsUsed;

  return (
    <aside className={styles.deck}>
      {level !== null && (
        <div className={styles.levelCard}>
          <span className={styles.levelLabel}>{hostContraptionSurfaceCopy.levelLabel}</span>
          <p className={styles.levelTitle}>{level.title}</p>
          <div className={styles.levelMeta}>
            <span>
              {hostContraptionSurfaceCopy.attemptCounter(
                Math.min(Math.max(attemptNumber, 1), view.attemptsPerTurn),
                view.attemptsPerTurn
              )}
            </span>
            <span>
              {hostContraptionSurfaceCopy.piecesCounter(view.pieces.length, level.pieceBudget)}
            </span>
          </div>
        </div>
      )}

      {isBuilding ? (
        <>
          <span className={styles.paletteTitle}>{hostContraptionSurfaceCopy.paletteTitle}</span>
          <div className={styles.paletteGrid}>
            {CONTRAPTION_PIECE_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                aria-label={hostContraptionSurfaceCopy.pieceAriaLabel(
                  hostContraptionSurfaceCopy.pieceLabel[kind]
                )}
                aria-pressed={kind === selectedKind}
                className={`${styles.pieceButton}${
                  kind === selectedKind ? ` ${styles.pieceButtonSelected}` : ""
                }`}
                disabled={!canBuild}
                onClick={(): void => {
                  onSelectKind(kind);
                }}
              >
                <PieceGlyph kind={kind} />
                {hostContraptionSurfaceCopy.pieceLabel[kind]}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.rowButton}
            disabled={!canBuild || view.pieces.length === 0}
            onClick={(): void => {
              onDispatchAction("clearPieces", {});
            }}
          >
            {hostContraptionSurfaceCopy.clearButtonLabel}
          </button>
          <button
            type="button"
            className={styles.goButton}
            disabled={!canBuild || !hasAttemptsLeft}
            onClick={(): void => {
              onDispatchAction("runContraption", {});
            }}
          >
            <span className={styles.goLabel}>{hostContraptionSurfaceCopy.goButtonLabel}</span>
            <span className={styles.goSub}>{hostContraptionSurfaceCopy.goButtonSub}</span>
          </button>
        </>
      ) : (
        <>
          <RunOutcomeCard view={view} />
          <button
            type="button"
            className={styles.rowButton}
            disabled={!canAct || view.run === null}
            onClick={(): void => {
              onDispatchAction("replayRun", {});
            }}
          >
            {hostContraptionSurfaceCopy.replayButtonLabel}
          </button>
          {view.phase === "ran" ? (
            <button
              type="button"
              className={styles.advanceButton}
              disabled={!canAct}
              onClick={(): void => {
                onDispatchAction("nextAttempt", {});
              }}
            >
              {hasAttemptsLeft
                ? hostContraptionSurfaceCopy.nextAttemptButtonLabel
                : hostContraptionSurfaceCopy.finishTurnButtonLabel}
            </button>
          ) : (
            <p className={styles.doneNote}>{hostContraptionSurfaceCopy.doneLabel}</p>
          )}
        </>
      )}

      <RunningTotals view={view} teamNameByTeamId={teamNameByTeamId} />
    </aside>
  );
};
