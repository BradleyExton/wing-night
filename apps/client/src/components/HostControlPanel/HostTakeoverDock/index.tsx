import { useEffect, useState } from "react";

import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

type HostTakeoverDockProps = {
  primaryActionLabel: string;
  primaryActionDisabled: boolean;
  onPrimaryAction?: () => void;
  showOverridesAction: boolean;
  overridesNeedAttention: boolean;
  onOpenOverrides: () => void;
};

export const HostTakeoverDock = ({
  primaryActionLabel,
  primaryActionDisabled,
  onPrimaryAction,
  showOverridesAction,
  overridesNeedAttention,
  onOpenOverrides
}: HostTakeoverDockProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const toggleClassName = isOpen
    ? `${styles.toggle} ${styles.toggleOpen}`
    : styles.toggle;

  return (
    <div className={styles.root}>
      {isOpen && (
        <button
          type="button"
          className={styles.scrim}
          aria-label={hostControlPanelCopy.takeoverDockScrimDismissAriaLabel}
          onClick={(): void => {
            setIsOpen(false);
          }}
        />
      )}

      <div className={styles.cluster}>
        {isOpen && (
          <>
            {showOverridesAction && (
              <button
                type="button"
                className={styles.overridesAction}
                onClick={(): void => {
                  setIsOpen(false);
                  onOpenOverrides();
                }}
              >
                <span>{hostControlPanelCopy.overridesTriggerButtonLabel}</span>
                {overridesNeedAttention && (
                  <span className={styles.overridesBadge}>
                    {hostControlPanelCopy.overridesTriggerNeedsAttentionLabel}
                  </span>
                )}
              </button>
            )}
            <button
              type="button"
              className={styles.primaryAction}
              disabled={primaryActionDisabled}
              onClick={(): void => {
                setIsOpen(false);
                onPrimaryAction?.();
              }}
            >
              {primaryActionLabel}
            </button>
          </>
        )}

        <button
          type="button"
          className={toggleClassName}
          aria-expanded={isOpen}
          aria-label={
            isOpen
              ? hostControlPanelCopy.takeoverDockCloseAriaLabel
              : hostControlPanelCopy.takeoverDockOpenAriaLabel
          }
          onClick={(): void => {
            setIsOpen((wasOpen) => !wasOpen);
          }}
        >
          {isOpen
            ? hostControlPanelCopy.takeoverDockCloseGlyph
            : hostControlPanelCopy.takeoverDockOpenGlyph}
          {!isOpen && overridesNeedAttention && (
            <span className={styles.toggleBadge} />
          )}
        </button>
      </div>
    </div>
  );
};
