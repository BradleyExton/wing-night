import { useEffect, useReducer } from "react";

import { hostControlPanelCopy } from "../copy";
import { OverrideConfirmDialog } from "../OverrideConfirmDialog";
import * as styles from "./styles";

type PendingConfirmationAction =
  | "previous_phase"
  | "skip_turn_boundary"
  | "redo_last_mutation"
  | "reset_game";

type PendingConfirmationEvent =
  | { type: "arm"; action: PendingConfirmationAction }
  | { type: "clear" };

type OverrideActionsSurfaceProps = {
  onPreviousPhase?: () => void;
  showPreviousPhaseAction: boolean;
  onSkipTurnBoundary?: () => void;
  showSkipTurnBoundaryAction: boolean;
  onRedoLastMutation?: () => void;
  showRedoLastMutationAction: boolean;
  onResetGame?: () => void;
  showResetGameAction: boolean;
  initialPendingAction?: PendingConfirmationAction | null;
};

export const reducePendingConfirmation = (
  pendingAction: PendingConfirmationAction | null,
  event: PendingConfirmationEvent
): PendingConfirmationAction | null => {
  switch (event.type) {
    case "arm":
      return event.action;
    case "clear":
      return null;
    default:
      return pendingAction;
  }
};

export const OverrideActionsSurface = ({
  onPreviousPhase,
  showPreviousPhaseAction,
  onSkipTurnBoundary,
  showSkipTurnBoundaryAction,
  onRedoLastMutation,
  showRedoLastMutationAction,
  onResetGame,
  showResetGameAction,
  initialPendingAction = null
}: OverrideActionsSurfaceProps): JSX.Element => {
  const [pendingAction, dispatchPendingAction] = useReducer(
    reducePendingConfirmation,
    initialPendingAction
  );

  useEffect(() => {
    if (pendingAction === "previous_phase") {
      if (!showPreviousPhaseAction || onPreviousPhase === undefined) {
        dispatchPendingAction({ type: "clear" });
      }

      return;
    }

    if (pendingAction === "skip_turn_boundary") {
      if (!showSkipTurnBoundaryAction || onSkipTurnBoundary === undefined) {
        dispatchPendingAction({ type: "clear" });
      }

      return;
    }

    if (pendingAction === "redo_last_mutation") {
      if (!showRedoLastMutationAction || onRedoLastMutation === undefined) {
        dispatchPendingAction({ type: "clear" });
      }

      return;
    }

    if (pendingAction === "reset_game") {
      if (!showResetGameAction || onResetGame === undefined) {
        dispatchPendingAction({ type: "clear" });
      }

      return;
    }
  }, [
    onPreviousPhase,
    onRedoLastMutation,
    onResetGame,
    onSkipTurnBoundary,
    pendingAction,
    showPreviousPhaseAction,
    showRedoLastMutationAction,
    showResetGameAction,
    showSkipTurnBoundaryAction
  ]);

  const handleConfirm = (): void => {
    if (pendingAction === "previous_phase") {
      onPreviousPhase?.();
      dispatchPendingAction({ type: "clear" });
      return;
    }

    if (pendingAction === "skip_turn_boundary") {
      onSkipTurnBoundary?.();
      dispatchPendingAction({ type: "clear" });
      return;
    }

    if (pendingAction === "redo_last_mutation") {
      onRedoLastMutation?.();
      dispatchPendingAction({ type: "clear" });
      return;
    }

    if (pendingAction === "reset_game") {
      onResetGame?.();
      dispatchPendingAction({ type: "clear" });
    }
  };

  const confirmTitle =
    pendingAction === "previous_phase"
      ? hostControlPanelCopy.overridePreviousPhaseConfirmTitle
      : pendingAction === "skip_turn_boundary"
      ? hostControlPanelCopy.overrideSkipTurnConfirmTitle
      : pendingAction === "redo_last_mutation"
        ? hostControlPanelCopy.overrideRedoMutationConfirmTitle
        : pendingAction === "reset_game"
          ? hostControlPanelCopy.overrideResetGameConfirmTitle
          : null;

  const confirmDescription =
    pendingAction === "previous_phase"
      ? hostControlPanelCopy.overridePreviousPhaseConfirmDescription
      : pendingAction === "skip_turn_boundary"
      ? hostControlPanelCopy.overrideSkipTurnConfirmDescription
      : pendingAction === "redo_last_mutation"
        ? hostControlPanelCopy.overrideRedoMutationConfirmDescription
        : pendingAction === "reset_game"
          ? hostControlPanelCopy.overrideResetGameConfirmDescription
          : null;

  return (
    <section className={styles.card}>
      <h2 className={styles.sectionHeading}>{hostControlPanelCopy.overridesActionsSectionTitle}</h2>
      <p className={styles.sectionDescription}>{hostControlPanelCopy.overridesActionsDescription}</p>
      <div className={styles.actionRow}>
        {showPreviousPhaseAction && (
          <button
            className={styles.actionButton}
            type="button"
            disabled={onPreviousPhase === undefined}
            onClick={(): void => {
              dispatchPendingAction({ type: "arm", action: "previous_phase" });
            }}
          >
            {hostControlPanelCopy.previousPhaseButtonLabel}
          </button>
        )}
        {showSkipTurnBoundaryAction && (
          <button
            className={styles.actionButton}
            type="button"
            disabled={onSkipTurnBoundary === undefined}
            onClick={(): void => {
              dispatchPendingAction({ type: "arm", action: "skip_turn_boundary" });
            }}
          >
            {hostControlPanelCopy.skipTurnBoundaryButtonLabel}
          </button>
        )}
        {showRedoLastMutationAction && (
          <button
            className={styles.actionButton}
            type="button"
            disabled={onRedoLastMutation === undefined}
            onClick={(): void => {
              dispatchPendingAction({ type: "arm", action: "redo_last_mutation" });
            }}
          >
            {hostControlPanelCopy.redoLastMutationButtonLabel}
          </button>
        )}
        {showResetGameAction && (
          <button
            className={styles.actionButton}
            type="button"
            disabled={onResetGame === undefined}
            onClick={(): void => {
              dispatchPendingAction({ type: "arm", action: "reset_game" });
            }}
          >
            {hostControlPanelCopy.resetGameButtonLabel}
          </button>
        )}
      </div>
      {pendingAction !== null && confirmTitle !== null && confirmDescription !== null && (
        <OverrideConfirmDialog
          title={confirmTitle}
          description={confirmDescription}
          confirmButtonLabel={hostControlPanelCopy.overrideConfirmButtonLabel}
          cancelButtonLabel={hostControlPanelCopy.overrideCancelButtonLabel}
          onConfirm={handleConfirm}
          onCancel={(): void => {
            dispatchPendingAction({ type: "clear" });
          }}
        />
      )}
    </section>
  );
};
