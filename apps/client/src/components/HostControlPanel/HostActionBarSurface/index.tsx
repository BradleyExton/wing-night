import { useEffect, useState } from "react";

import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

const RESET_CONFIRM_WINDOW_MS = 8_000;

type HostActionBarSurfaceProps = {
  onNextPhase?: () => void;
  onSkipTurnBoundary?: () => void;
  showSkipTurnBoundaryAction: boolean;
  onRedoLastMutation?: () => void;
  showRedoLastMutationAction: boolean;
  onResetGame?: () => void;
  showResetGameAction: boolean;
};

export const HostActionBarSurface = ({
  onNextPhase,
  onSkipTurnBoundary,
  showSkipTurnBoundaryAction,
  onRedoLastMutation,
  showRedoLastMutationAction,
  onResetGame,
  showResetGameAction
}: HostActionBarSurfaceProps): JSX.Element => {
  const [isResetArmed, setIsResetArmed] = useState(false);

  useEffect(() => {
    if (!showResetGameAction) {
      setIsResetArmed(false);
    }
  }, [showResetGameAction]);

  useEffect(() => {
    if (!isResetArmed) {
      return;
    }

    const timeout = setTimeout(() => {
      setIsResetArmed(false);
    }, RESET_CONFIRM_WINDOW_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [isResetArmed]);

  return (
    <div className={styles.controlsRow}>
      <button
        className={styles.primaryButton}
        type="button"
        onClick={onNextPhase}
        disabled={onNextPhase === undefined}
      >
        {hostControlPanelCopy.nextPhaseButtonLabel}
      </button>
      {showSkipTurnBoundaryAction && (
        <button
          className={styles.secondaryButton}
          type="button"
          onClick={onSkipTurnBoundary}
          disabled={onSkipTurnBoundary === undefined}
        >
          {hostControlPanelCopy.skipTurnBoundaryButtonLabel}
        </button>
      )}
      {showRedoLastMutationAction && (
        <button
          className={styles.secondaryButton}
          type="button"
          onClick={onRedoLastMutation}
          disabled={onRedoLastMutation === undefined}
        >
          {hostControlPanelCopy.redoLastMutationButtonLabel}
        </button>
      )}
      {showResetGameAction && !isResetArmed && (
        <button
          className={styles.secondaryButton}
          type="button"
          onClick={(): void => {
            setIsResetArmed(true);
          }}
        >
          {hostControlPanelCopy.resetGameButtonLabel}
        </button>
      )}
      {showResetGameAction && isResetArmed && (
        <div className={styles.resetConfirmGroup}>
          <span className={styles.resetWarning}>{hostControlPanelCopy.resetGameArmedMessage}</span>
          <button
            className={styles.dangerButton}
            type="button"
            onClick={(): void => {
              onResetGame?.();
              setIsResetArmed(false);
            }}
            disabled={onResetGame === undefined}
          >
            {hostControlPanelCopy.resetGameConfirmButtonLabel}
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={(): void => {
              setIsResetArmed(false);
            }}
          >
            {hostControlPanelCopy.resetGameCancelButtonLabel}
          </button>
        </div>
      )}
    </div>
  );
};
