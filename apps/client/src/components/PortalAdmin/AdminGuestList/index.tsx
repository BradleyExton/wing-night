import { useState } from "react";
import {
  PORTAL_API_ROUTES,
  isAdminGuestStatus,
  isAdminInviteAllResult,
  type AdminGuestStatus
} from "@wingnight/shared/guestPortal";

import { jsonRequest, requestPortal, type PortalFailure } from "../../../utils/portalApi";
import * as shellStyles from "../../PortalShell/styles";
import { AdminGuestForm, type AdminGuestFormValues } from "../AdminGuestForm";
import { AdminGuestRow } from "./AdminGuestRow";
import { adminGuestListCopy } from "./copy";
import * as styles from "./styles";

type AdminGuestListProps = {
  guests: AdminGuestStatus[];
  onChanged: () => Promise<void>;
};

// Who "invite everyone" would reach: guests with an address nobody has invited yet. Admins are
// left out, as the portal leaves them out (seed:admin handed Brad his link).
const countInvitable = (guests: readonly AdminGuestStatus[]): number =>
  guests.filter((guest) => guest.email !== null && guest.invitedAt === null && !guest.isAdmin).length;

// Brad's guest list: everyone, where they are with signing in, and the ways to get them in.
export const AdminGuestList = ({ guests, onChanged }: AdminGuestListProps): JSX.Element => {
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const invitable = countInvitable(guests);

  const inviteEveryone = async (): Promise<void> => {
    setIsInviting(true);
    const result = await requestPortal(PORTAL_API_ROUTES.adminInviteAll, isAdminInviteAllResult, { method: "POST" });

    setIsInviting(false);
    setMessage(
      result.ok
        ? {
            text: adminGuestListCopy.inviteAllResult(
              result.body.invited.length,
              result.body.failed.length,
              result.body.remaining
            ),
            isError: result.body.failed.length > 0
          }
        : { text: adminGuestListCopy.failed, isError: true }
    );
    await onChanged();
  };

  const addGuest = async (values: AdminGuestFormValues): Promise<PortalFailure | null> => {
    const result = await requestPortal(PORTAL_API_ROUTES.adminGuests, isAdminGuestStatus, jsonRequest("POST", values));

    if (!result.ok) {
      return result.error;
    }

    setIsAdding(false);
    setMessage({ text: adminGuestListCopy.added, isError: false });
    await onChanged();

    return null;
  };

  return (
    <section className={shellStyles.card} aria-labelledby="admin-guests-title">
      <p className={shellStyles.eyebrow}>{adminGuestListCopy.count(guests.length)}</p>
      <div className={styles.header}>
        <h2 id="admin-guests-title" className={shellStyles.cardTitle}>
          {adminGuestListCopy.title}
        </h2>
        {invitable > 0 && (
          <button
            type="button"
            className={shellStyles.buttonPrimary}
            disabled={isInviting}
            onClick={(): void => void inviteEveryone()}
          >
            {isInviting ? adminGuestListCopy.inviting : adminGuestListCopy.inviteAll(invitable)}
          </button>
        )}
      </div>
      <ul className={styles.list}>
        {guests.map((guest) => (
          <AdminGuestRow key={guest.guestId} guest={guest} onChanged={onChanged} />
        ))}
      </ul>
      <div className={styles.addArea}>
        {isAdding ? (
          <AdminGuestForm
            initial={{ displayName: "", email: null }}
            submitLabel={adminGuestListCopy.add}
            onSubmit={addGuest}
            onCancel={(): void => setIsAdding(false)}
          />
        ) : (
          <button type="button" className={shellStyles.buttonGhost} onClick={(): void => setIsAdding(true)}>
            {adminGuestListCopy.addGuest}
          </button>
        )}
        {message !== null && (
          <p className={message.isError ? shellStyles.statusError : shellStyles.status} role="status">
            {message.text}
          </p>
        )}
      </div>
    </section>
  );
};
