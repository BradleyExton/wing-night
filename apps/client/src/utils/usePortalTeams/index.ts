import { useCallback, useEffect, useState } from "react";
import { PORTAL_API_ROUTES, isPortalTeamList, type PortalTeamList } from "@wingnight/shared/guestPortal";

import { requestPortal, type PortalFailure } from "../portalApi";

export type PortalTeamsState =
  | { kind: "loading" }
  | { kind: "failed"; error: PortalFailure }
  | { kind: "ready"; teams: PortalTeamList };

export type PortalTeamsHandle = {
  state: PortalTeamsState;
  // A write that answered with the list (PUT myTeam) hands it straight in: no second round trip.
  replace: (teams: PortalTeamList) => void;
  // Reads the list again. A list already on screen stays if the read fails — a tile that cannot
  // be refreshed is better than a card that empties.
  reload: () => Promise<void>;
};

// The night's teams as the portal lists them (GET teams), read once when a signed-in page opens.
// Held above the team card because the studio's bird reads the picked team's theme from it too.
export const usePortalTeams = (enabled: boolean): PortalTeamsHandle => {
  const [state, setState] = useState<PortalTeamsState>({ kind: "loading" });

  const reload = useCallback(async (): Promise<void> => {
    const result = await requestPortal(PORTAL_API_ROUTES.teams, isPortalTeamList);

    setState((current) => {
      if (result.ok) {
        return { kind: "ready", teams: result.body };
      }

      return current.kind === "ready" ? current : { kind: "failed", error: result.error };
    });
  }, []);

  useEffect(() => {
    if (enabled) {
      void reload();
    }
  }, [enabled, reload]);

  const replace = useCallback((teams: PortalTeamList): void => {
    setState({ kind: "ready", teams });
  }, []);

  return { state, replace, reload };
};
