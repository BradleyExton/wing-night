import { useCallback, useEffect, useState } from "react";
import {
  PORTAL_API_ROUTES,
  isAdminGuestList,
  isAdminVoteSummary,
  type AdminGuestStatus,
  type AdminVoteSummary
} from "@wingnight/shared/guestPortal";

import { requestPortal, type PortalFailure } from "../../../utils/portalApi";

export type AdminData =
  | { kind: "loading" }
  | { kind: "failed"; error: PortalFailure }
  | { kind: "ready"; guests: AdminGuestStatus[]; votes: AdminVoteSummary };

// Brad's two reads, the guest list and the vote summary, fetched together and again after any
// change he makes, so every section shows the portal's truth rather than a local guess at it.
export const useAdminData = (enabled: boolean): { data: AdminData; reload: () => Promise<void> } => {
  const [data, setData] = useState<AdminData>({ kind: "loading" });

  const reload = useCallback(async (): Promise<void> => {
    const [guests, votes] = await Promise.all([
      requestPortal(PORTAL_API_ROUTES.adminGuests, isAdminGuestList),
      requestPortal(PORTAL_API_ROUTES.adminVotes, isAdminVoteSummary)
    ]);

    if (!guests.ok) {
      setData({ kind: "failed", error: guests.error });
    } else if (!votes.ok) {
      setData({ kind: "failed", error: votes.error });
    } else {
      setData({ kind: "ready", guests: guests.body, votes: votes.body });
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      void reload();
    }
  }, [enabled, reload]);

  return { data, reload };
};
