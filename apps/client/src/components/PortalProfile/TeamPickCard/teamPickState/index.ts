// What the team card shows, decided in one tested place. A pick is optimistic
// (docs/guest-portal-team-pick-plan.md, decision 2): the tapped team is shown — and the bird
// above repaints — while PUT myTeam is in flight; useTeamPick owns that in-flight name and
// clears it on the answer, this module only reads the pair.
import type { PortalTeam } from "@wingnight/shared/guestPortal";

export type TeamPickState = {
  // The pick the portal has stored (PortalMe.team), null before one.
  pickedName: string | null;
  // The tile just tapped, while its save is in flight; null when settled.
  pendingName: string | null;
};

export const isPickPending = (state: TeamPickState): boolean => state.pendingName !== null;

// The team the card and the bird show: the one in flight, else the one stored.
export const resolveShownPick = (state: TeamPickState): string | null => state.pendingName ?? state.pickedName;

// A stored pick naming a team the list no longer has — the pack renamed it (decision 1). Shown
// as "pick again", with no tile ringed.
export const isPickOrphaned = (pickedName: string | null, teams: ReadonlyArray<Pick<PortalTeam, "name">>): boolean =>
  pickedName !== null && !teams.some((team) => team.name === pickedName);

export type TeamTileState = "picked" | "full" | "open";

export type TeamTile = {
  state: TeamTileState;
  // Full, closed or mid-save: the tile takes no tap. A picked tile under closed picks is still
  // shown picked, just inert.
  isDisabled: boolean;
};

type TeamTileContext = {
  shownPick: string | null;
  seatCap: number;
  picksClosed: boolean;
  isPending: boolean;
};

export const resolveTeamTile = (
  team: Pick<PortalTeam, "name" | "members">,
  { shownPick, seatCap, picksClosed, isPending }: TeamTileContext
): TeamTile => {
  const state: TeamTileState =
    team.name === shownPick ? "picked" : team.members.length >= seatCap ? "full" : "open";

  return { state, isDisabled: picksClosed || isPending || state === "full" };
};
