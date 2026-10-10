import { useCallback, useMemo, useState } from "react";
import { PORTAL_API_ROUTES, isPortalTeamPicked, type PortalMe } from "@wingnight/shared/guestPortal";

import { jsonRequest, requestPortal, type PortalFailure } from "../../../utils/portalApi";
import type { PortalTeamsHandle } from "../../../utils/usePortalTeams";
import { isPickPending, resolveShownPick, type TeamPickState } from "../TeamPickCard/teamPickState";

export type TeamPickStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; teamName: string }
  | { kind: "failed"; error: PortalFailure };

export type TeamPickHandle = {
  state: TeamPickState;
  // The team the card rings and the bird dresses as: the tap in flight, else the stored pick.
  shownPick: string | null;
  isPending: boolean;
  status: TeamPickStatus;
  pick: (teamName: string) => Promise<void>;
};

type UseTeamPickArgs = {
  // The stored pick's name (PortalMe.team), the reducer's settled half.
  storedPick: string | null;
  update: (next: (me: PortalMe) => PortalMe) => void;
  teams: PortalTeamsHandle;
};

// A tap on a tile, end to end: the tapped name is held here as `pendingName` and shown at once,
// saved with PUT myTeam, then cleared — on success the stored pick (PortalMe.team) takes over
// and the list comes back with the answer, so the tile that just gained a seat updates with it;
// on refusal the stored pick is what remains, and the list is read again so a tile that filled
// under the guest goes dim. Lives above the card because the studio's bird reads `shownPick` too.
export const useTeamPick = ({ storedPick, update, teams }: UseTeamPickArgs): TeamPickHandle => {
  const [pendingName, setPendingName] = useState<string | null>(null);
  const [status, setStatus] = useState<TeamPickStatus>({ kind: "idle" });
  const state = useMemo<TeamPickState>(() => ({ pickedName: storedPick, pendingName }), [storedPick, pendingName]);

  const pick = useCallback(
    async (teamName: string): Promise<void> => {
      setPendingName(teamName);
      setStatus({ kind: "saving" });

      const result = await requestPortal(PORTAL_API_ROUTES.myTeam, isPortalTeamPicked, jsonRequest("PUT", { teamName }));

      if (result.ok) {
        const { team, teams: list } = result.body;

        update((me) => ({ ...me, team, picksClosed: list.picksClosed }));
        teams.replace(list);
        setPendingName(null);
        setStatus({ kind: "saved", teamName: team.teamName });

        return;
      }

      setPendingName(null);
      setStatus({ kind: "failed", error: result.error });
      await teams.reload();
    },
    [teams, update]
  );

  return { state, shownPick: resolveShownPick(state), isPending: isPickPending(state), status, pick };
};
