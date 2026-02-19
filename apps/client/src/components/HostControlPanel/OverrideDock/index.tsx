import { useEffect, useId, useRef, type ReactNode } from "react";

import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

type OverrideDockProps = {
  isOpen: boolean;
  showBadge: boolean;
  onOpen: () => void;
  onClose: () => void;
  panelId: string;
  children: ReactNode;
};

export const OverrideDock = ({
  isOpen,
  showBadge,
  onOpen,
  onClose,
  panelId,
  children
}: OverrideDockProps): JSX.Element => {
  const headingId = useId();
  const descriptionId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = useRef(isOpen);

  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      triggerRef.current?.focus();
    }

    wasOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const triggerAriaLabel = isOpen
    ? hostControlPanelCopy.overridesTriggerCloseAriaLabel
    : hostControlPanelCopy.overridesTriggerOpenAriaLabel;

  return (
    <div className={styles.layer}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : styles.triggerClosed}`}
        onClick={isOpen ? onClose : onOpen}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={triggerAriaLabel}
      >
        <span className={styles.triggerLabel}>{hostControlPanelCopy.overridesTriggerButtonLabel}</span>
        {showBadge && (
          <span className={styles.triggerBadge}>
            {hostControlPanelCopy.overridesTriggerNeedsAttentionLabel}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`${styles.overlay} ${styles.overlayOpen}`}>
          <button
            type="button"
            className={`${styles.scrim} ${styles.scrimOpen}`}
            aria-label={hostControlPanelCopy.overridesScrimDismissAriaLabel}
            onClick={onClose}
          />
          <aside
            id={panelId}
            role="dialog"
            aria-modal="false"
            aria-labelledby={headingId}
            aria-describedby={descriptionId}
            className={`${styles.panel} ${styles.panelOpen}`}
          >
            <header className={styles.header}>
              <div>
                <h2 className={styles.heading} id={headingId}>
                  {hostControlPanelCopy.overridesPanelTitle}
                </h2>
                <p className={styles.description} id={descriptionId}>
                  {hostControlPanelCopy.overridesPanelDescription}
                </p>
              </div>
              <button className={styles.closeButton} type="button" onClick={onClose}>
                {hostControlPanelCopy.overridesCloseButtonLabel}
              </button>
            </header>
            <div className={styles.content}>{children}</div>
          </aside>
        </div>
      )}
    </div>
  );
};
