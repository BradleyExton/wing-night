import { useCallback, useEffect, useState } from "react";
import {
  PORTAL_API_ROUTES,
  isAdminGuestList,
  isAdminTeamBoard,
  type AdminGuestStatus,
  type AdminTeamBoard
} from "@wingnight/shared/guestPortal";

import { requestPortal, type PortalFailure } from "../../../utils/portalApi";

export type AdminData =
  | { kind: "loading" }
  | { kind: "failed"; error: PortalFailure }
  | { kind: "ready"; guests: AdminGuestStatus[]; board: AdminTeamBoard };

// Brad's two reads, the guest list and the team board, fetched together and again after any
// change he makes, so every section shows the portal's truth rather than a local guess at it.
export const useAdminData = (enabled: boolean): { data: AdminData; reload: () => Promise<void> } => {
  const [data, setData] = useState<AdminData>({ kind: "loading" });

  const reload = useCallback(async (): Promise<void> => {
    const [guests, board] = await Promise.all([
      requestPortal(PORTAL_API_ROUTES.adminGuests, isAdminGuestList),
      requestPortal(PORTAL_API_ROUTES.adminTeams, isAdminTeamBoard)
    ]);

    if (!guests.ok) {
      setData({ kind: "failed", error: guests.error });
    } else if (!board.ok) {
      setData({ kind: "failed", error: board.error });
    } else {
      setData({ kind: "ready", guests: guests.body, board: board.body });
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      void reload();
    }
  }, [enabled, reload]);

  return { data, reload };
};
