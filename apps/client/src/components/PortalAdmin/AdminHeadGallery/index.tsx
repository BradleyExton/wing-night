import { useState } from "react";
import {
  PORTAL_API_ROUTES,
  isAdminStyleReference,
  resolveAdminGuestAvatarRoute,
  type AdminGuestStatus
} from "@wingnight/shared/guestPortal";

import { jsonRequest, requestPortal } from "../../../utils/portalApi";
import { PortalHeadBird } from "../../PortalHeadBird";
import * as shellStyles from "../../PortalShell/styles";
import { adminHeadGalleryCopy } from "./copy";
import * as styles from "./styles";

type AdminHeadGalleryProps = {
  guests: AdminGuestStatus[];
  onChanged: () => Promise<void>;
};

// Every kept head, on its bird, and the one Brad picks for the rest to be painted like.
export const AdminHeadGallery = ({ guests, onChanged }: AdminHeadGalleryProps): JSX.Element => {
  const [pickingId, setPickingId] = useState<string | null>(null);
  const [hasFailed, setHasFailed] = useState(false);
  const withHeads = guests.filter((guest) => guest.headHash !== null);

  const pick = async (guestId: string): Promise<void> => {
    setPickingId(guestId);
    const result = await requestPortal(
      PORTAL_API_ROUTES.adminStyleReference,
      isAdminStyleReference,
      jsonRequest("POST", { guestId })
    );

    setHasFailed(!result.ok);
    await onChanged();
    setPickingId(null);
  };

  return (
    <section className={shellStyles.card} aria-labelledby="admin-heads-title">
      <p className={shellStyles.eyebrow}>{adminHeadGalleryCopy.eyebrow(withHeads.length)}</p>
      <h2 id="admin-heads-title" className={shellStyles.cardTitle}>
        {adminHeadGalleryCopy.title}
      </h2>
      <p className={shellStyles.voice}>{adminHeadGalleryCopy.body}</p>
      {withHeads.length === 0 ? (
        <p className={styles.empty}>{adminHeadGalleryCopy.empty}</p>
      ) : (
        <div className={styles.grid}>
          {withHeads.map((guest) => (
            <div
              key={guest.guestId}
              className={guest.isStyleReference ? styles.tileReference : styles.tile}
              data-testid="admin-head-tile"
              data-guest-name={guest.displayName}
            >
              <PortalHeadBird
                name={guest.displayName}
                headSrc={`${resolveAdminGuestAvatarRoute(guest.guestId)}?v=${guest.headHash ?? ""}`}
                size="small"
                label={adminHeadGalleryCopy.birdLabel(guest.displayName)}
              />
              <span className={styles.name}>{guest.displayName}</span>
              {guest.isStyleReference ? (
                <span className={`${shellStyles.pill} ${styles.referencePill}`}>
                  <span className={shellStyles.pillDot} aria-hidden />
                  {adminHeadGalleryCopy.styleReference}
                </span>
              ) : (
                <button
                  type="button"
                  className={styles.pick}
                  disabled={pickingId !== null}
                  onClick={(): void => void pick(guest.guestId)}
                >
                  {pickingId === guest.guestId ? adminHeadGalleryCopy.picking : adminHeadGalleryCopy.useAsStyle}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {hasFailed && (
        <p className={shellStyles.statusError} role="status">
          {adminHeadGalleryCopy.failed}
        </p>
      )}
    </section>
  );
};
