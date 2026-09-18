import { useState } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { ContraptionPieceKind } from "@wingnight/shared";

import { useRunPlayback } from "../useRunPlayback/index.js";
import { BuildDeck } from "./BuildDeck/index.js";
import { FieldEditor } from "./FieldEditor/index.js";
import { hostContraptionSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

const DEFAULT_PIECE_KIND: ContraptionPieceKind = "slope-right";

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
      hostContraptionSurfaceCopy.noAssignedTeamLabel
    );
  }

  return activeTeamName ?? hostContraptionSurfaceCopy.noAssignedTeamLabel;
};

export const HostContraptionSurface = ({
  phase,
  minigameHostView,
  activeTeamName,
  teamNameByTeamId,
  canDispatchAction,
  onDispatchAction
}: MinigameHostRendererProps): JSX.Element => {
  const view = minigameHostView?.minigame === "CONTRAPTION" ? minigameHostView : null;
  const [selectedKind, setSelectedKind] = useState<ContraptionPieceKind>(DEFAULT_PIECE_KIND);
  const elapsedMs = useRunPlayback(view?.run ?? null);
  const resolvedActiveTeamName = resolveActiveTeamName({
    minigameHostView,
    teamNameByTeamId,
    activeTeamName
  });
  const isPlayPhase = phase === "play";
  const pendingPoints =
    view === null || view.activeTurnTeamId === null
      ? null
      : (view.pendingPointsByTeamId[view.activeTurnTeamId] ?? 0);
  const canAct = canDispatchAction && view !== null;
  const canBuild = canAct && view.phase === "building";

  // Tapping the cell that already holds the selected kind takes it back;
  // anything else is a place (the reducer swaps kinds on a taken cell).
  const handleCellTap = (column: number, row: number): void => {
    const existing = view?.pieces.find(
      (piece) => piece.column === column && piece.row === row
    );

    if (existing !== undefined && existing.kind === selectedKind) {
      onDispatchAction("removePiece", { column, row });
      return;
    }

    onDispatchAction("placePiece", { kind: selectedKind, column, row });
  };

  return (
    <div className={styles.container}>
      <div className={styles.rail}>
        <span className={styles.railTitle}>{hostContraptionSurfaceCopy.railTitle}</span>
        <span className={styles.railTeam}>
          <span className={styles.railTeamDot} aria-hidden="true" />
          {hostContraptionSurfaceCopy.teamPrefix} {resolvedActiveTeamName}
        </span>
        {isPlayPhase && pendingPoints !== null && (
          <span className={styles.railPending}>
            {hostContraptionSurfaceCopy.pendingChip(pendingPoints)}
          </span>
        )}
      </div>
      {!isPlayPhase && (
        <p className={styles.introCard}>{hostContraptionSurfaceCopy.introDescription}</p>
      )}
      {isPlayPhase && view !== null && view.level === null && (
        <p className={styles.waitingNote}>{hostContraptionSurfaceCopy.waitingLevelLabel}</p>
      )}
      {isPlayPhase && view !== null && view.level !== null && (
        <div className={styles.playArea}>
          <div className={styles.fieldColumn}>
            <FieldEditor
              level={view.level}
              pieces={view.pieces}
              run={view.run}
              elapsedMs={elapsedMs}
              canBuild={canBuild}
              onCellTap={handleCellTap}
            />
            {canBuild && <p className={styles.tapHint}>{hostContraptionSurfaceCopy.tapHint}</p>}
          </div>
          <BuildDeck
            view={view}
            selectedKind={selectedKind}
            canAct={canAct}
            teamNameByTeamId={teamNameByTeamId}
            onSelectKind={setSelectedKind}
            onDispatchAction={onDispatchAction}
          />
        </div>
      )}
    </div>
  );
};
