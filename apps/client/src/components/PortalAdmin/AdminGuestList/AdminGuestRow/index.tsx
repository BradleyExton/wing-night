import { useState } from "react";
import { Check, Minus } from "lucide-react";
import {
  AVATAR_TRIES_MAX,
  isAdminAvatarReset,
  isAdminGuestStatus,
  isAdminInviteResult,
  isAdminMintedLink,
  resolveAdminGuestAvatarResetRoute,
  resolveAdminGuestInviteRoute,
  resolveAdminGuestLinkRoute,
  resolveAdminGuestRoute,
  type AdminGuestStatus
} from "@wingnight/shared/guestPortal";

import { jsonRequest, requestPortal, type PortalFailure } from "../../../../utils/portalApi";
import * as shellStyles from "../../../PortalShell/styles";
import { AdminGuestForm, type AdminGuestFormValues } from "../../AdminGuestForm";
import { adminGuestListCopy } from "../copy";
import { resolveGuestStanding } from "../standing";
import * as styles from "./styles";

type AdminGuestRowProps = {
  guest: AdminGuestStatus;
  onChanged: () => Promise<void>;
};

type RowNote = { kind: "invited" } | { kind: "reset" } | { kind: "failed"; error: PortalFailure };

// One guest, and everything Brad does to one: invite them, mint a link to text (shown once, as
// the portal keeps only its hash), correct their name and address, or give them their head tries
// back (which also deletes any photo they left).
export const AdminGuestRow = ({ guest, onChanged }: AdminGuestRowProps): JSX.Element => {
  const [isEditing, setIsEditing] = useState(false);
  const [mintedUrl, setMintedUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [note, setNote] = useState<RowNote | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const standing = resolveGuestStanding(guest);

  const invite = async (): Promise<void> => {
    setIsBusy(true);
    const result = await requestPortal(resolveAdminGuestInviteRoute(guest.guestId), isAdminInviteResult, {
      method: "POST"
    });

    setIsBusy(false);
    setNote(result.ok ? { kind: "invited" } : { kind: "failed", error: result.error });
    await onChanged();
  };

  const resetTries = async (): Promise<void> => {
    setIsBusy(true);
    const result = await requestPortal(resolveAdminGuestAvatarResetRoute(guest.guestId), isAdminAvatarReset, {
      method: "POST"
    });

    setIsBusy(false);
    setNote(result.ok ? { kind: "reset" } : { kind: "failed", error: result.error });
    await onChanged();
  };

  const mintLink = async (): Promise<void> => {
    setIsBusy(true);
    const result = await requestPortal(resolveAdminGuestLinkRoute(guest.guestId), isAdminMintedLink, {
      method: "POST"
    });

    setIsBusy(false);
    setIsCopied(false);
    setMintedUrl(result.ok ? result.body.url : null);
    setNote(result.ok ? null : { kind: "failed", error: result.error });
  };

  const copyLink = async (): Promise<void> => {
    if (mintedUrl === null) {
      return;
    }

    try {
      await navigator.clipboard.writeText(mintedUrl);
      setIsCopied(true);
    } catch {
      setIsCopied(false);
    }
  };

  const saveEdit = async (values: AdminGuestFormValues): Promise<PortalFailure | null> => {
    const result = await requestPortal(
      resolveAdminGuestRoute(guest.guestId),
      isAdminGuestStatus,
      jsonRequest("PATCH", values)
    );

    if (!result.ok) {
      return result.error;
    }

    setIsEditing(false);
    await onChanged();

    return null;
  };

  return (
    <li className={styles.row} data-testid="admin-guest-row" data-guest-name={guest.displayName}>
      <div className={styles.top}>
        <div className={styles.who}>
          <span className={styles.name}>{guest.displayName}</span>
          <span className={styles.email}>{guest.email ?? adminGuestListCopy.noEmail}</span>
        </div>
        <span className={standing === "signedIn" ? shellStyles.pill : shellStyles.pillDim}>
          {standing === "signedIn" && <span className={shellStyles.pillDot} aria-hidden />}
          {adminGuestListCopy.standings[standing]}
        </span>
      </div>
      <div className={styles.ticks}>
        {guest.isAdmin && <span className={styles.tickOn}>{adminGuestListCopy.admin}</span>}
        <span className={guest.hasHead ? styles.tickOn : styles.tickOff}>
          {guest.hasHead ? <Check className={styles.tickGlyph} aria-hidden /> : <Minus className={styles.tickGlyph} aria-hidden />}
          {guest.hasHead ? adminGuestListCopy.hasHead : adminGuestListCopy.noHead}
        </span>
        <span className={guest.hasVoted ? styles.tickOn : styles.tickOff}>
          {guest.hasVoted ? <Check className={styles.tickGlyph} aria-hidden /> : <Minus className={styles.tickGlyph} aria-hidden />}
          {guest.hasVoted ? adminGuestListCopy.hasVoted : adminGuestListCopy.notVoted}
        </span>
        <span className={guest.triesLeft === 0 ? styles.tickOn : styles.tickOff}>
          {adminGuestListCopy.tries(guest.triesLeft, AVATAR_TRIES_MAX)}
        </span>
      </div>
      {isEditing ? (
        <AdminGuestForm
          initial={{ displayName: guest.displayName, email: guest.email }}
          submitLabel={adminGuestListCopy.save}
          onSubmit={saveEdit}
          onCancel={(): void => setIsEditing(false)}
        />
      ) : (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.action}
            disabled={isBusy || guest.email === null}
            onClick={(): void => void invite()}
          >
            {guest.invitedAt === null ? adminGuestListCopy.invite : adminGuestListCopy.reinvite}
          </button>
          <button type="button" className={styles.action} disabled={isBusy} onClick={(): void => void mintLink()}>
            {adminGuestListCopy.mintLink}
          </button>
          <button type="button" className={styles.action} onClick={(): void => setIsEditing(true)}>
            {adminGuestListCopy.edit}
          </button>
          <button type="button" className={styles.action} disabled={isBusy} onClick={(): void => void resetTries()}>
            {adminGuestListCopy.resetTries}
          </button>
        </div>
      )}
      {mintedUrl !== null && (
        <div className={styles.linkBox}>
          <div className={styles.linkRow}>
            <input
              className={styles.linkInput}
              readOnly
              value={mintedUrl}
              aria-label={adminGuestListCopy.linkLabel(guest.displayName)}
              onFocus={(event): void => event.target.select()}
            />
            <button type="button" className={styles.action} onClick={(): void => void copyLink()}>
              {isCopied ? adminGuestListCopy.copied : adminGuestListCopy.copy}
            </button>
          </div>
          <p className={shellStyles.fine}>{adminGuestListCopy.linkNote}</p>
        </div>
      )}
      {note !== null && (
        <p className={note.kind === "failed" ? shellStyles.statusError : shellStyles.status} role="status">
          {note.kind === "invited"
            ? adminGuestListCopy.invited
            : note.kind === "reset"
              ? adminGuestListCopy.resetDone(AVATAR_TRIES_MAX)
              : (adminGuestListCopy.failures[note.error] ?? adminGuestListCopy.failed)}
        </p>
      )}
    </li>
  );
};
