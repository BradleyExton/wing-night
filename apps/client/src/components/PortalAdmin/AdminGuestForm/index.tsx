import { useState, type FormEvent } from "react";

import type { PortalFailure } from "../../../utils/portalApi";
import * as shellStyles from "../../PortalShell/styles";
import { adminGuestFormCopy } from "./copy";
import * as styles from "./styles";

export type AdminGuestFormValues = {
  displayName: string;
  email: string | null;
};

type AdminGuestFormProps = {
  initial: AdminGuestFormValues;
  submitLabel: string;
  // Resolves to the failure, or null once the portal has it.
  onSubmit: (values: AdminGuestFormValues) => Promise<PortalFailure | null>;
  onCancel: () => void;
};

// Adding a guest and correcting one are the same two fields. A blank address is a guest Brad
// texts a link to instead.
export const AdminGuestForm = ({ initial, submitLabel, onSubmit, onCancel }: AdminGuestFormProps): JSX.Element => {
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [email, setEmail] = useState(initial.email ?? "");
  const [failure, setFailure] = useState<PortalFailure | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSaving(true);
    const trimmedEmail = email.trim();
    const result = await onSubmit({ displayName, email: trimmedEmail.length === 0 ? null : trimmedEmail });

    setIsSaving(false);
    setFailure(result);
  };

  return (
    <form className={styles.form} onSubmit={(event): void => void submit(event)}>
      <label className={shellStyles.field}>
        <span className={shellStyles.fieldLabel}>{adminGuestFormCopy.nameLabel}</span>
        <input
          className={shellStyles.input}
          required
          maxLength={40}
          placeholder={adminGuestFormCopy.namePlaceholder}
          value={displayName}
          onChange={(event): void => setDisplayName(event.target.value)}
        />
      </label>
      <label className={shellStyles.field}>
        <span className={shellStyles.fieldLabel}>{adminGuestFormCopy.emailLabel}</span>
        <input
          className={shellStyles.input}
          type="email"
          autoComplete="off"
          placeholder={adminGuestFormCopy.emailPlaceholder}
          value={email}
          onChange={(event): void => setEmail(event.target.value)}
        />
      </label>
      <div className={shellStyles.buttonRow}>
        <button type="submit" className={shellStyles.buttonPrimary} disabled={isSaving}>
          {isSaving ? adminGuestFormCopy.saving : submitLabel}
        </button>
        <button type="button" className={shellStyles.buttonGhost} onClick={onCancel}>
          {adminGuestFormCopy.cancel}
        </button>
      </div>
      {failure !== null && (
        <p className={shellStyles.statusError} role="status">
          {adminGuestFormCopy.failures[failure] ?? adminGuestFormCopy.failed}
        </p>
      )}
    </form>
  );
};
