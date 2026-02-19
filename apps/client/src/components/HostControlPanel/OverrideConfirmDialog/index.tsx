import { useId } from "react";

import * as styles from "./styles";

type OverrideConfirmDialogProps = {
  title: string;
  description: string;
  confirmButtonLabel: string;
  cancelButtonLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export const OverrideConfirmDialog = ({
  title,
  description,
  confirmButtonLabel,
  cancelButtonLabel,
  onConfirm,
  onCancel
}: OverrideConfirmDialogProps): JSX.Element => {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <section
      className={styles.card}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <h3 className={styles.title} id={titleId}>
        {title}
      </h3>
      <p className={styles.description} id={descriptionId}>
        {description}
      </p>
      <div className={styles.actions}>
        <button className={styles.confirmButton} type="button" onClick={onConfirm}>
          {confirmButtonLabel}
        </button>
        <button className={styles.cancelButton} type="button" onClick={onCancel}>
          {cancelButtonLabel}
        </button>
      </div>
    </section>
  );
};

