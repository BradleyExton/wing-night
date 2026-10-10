// Where Brad can move one member from where they sit: every other team, then off the board. The
// API groups the board already; this is the one thing the client derives from it.
import type { PortalTeam } from "@wingnight/shared/guestPortal";

export type MoveTarget = {
  // The <select> option's value. A team is keyed by its roster id, which never collides with
  // the unseat key, so a team named "Unseat" would still be a team.
  key: string;
  // The body POST resolveAdminGuestTeamRoute takes: a team to seat them on, or null to unseat.
  teamName: string | null;
};

export const UNSEAT_KEY = "unseat";

const resolveTeamKey = (team: Pick<PortalTeam, "id">): string => `team:${team.id}`;

// A seated member's targets are the other teams and Unseat; an unseated guest's are every team.
export const resolveMoveTargets = (
  teams: ReadonlyArray<Pick<PortalTeam, "id" | "name">>,
  currentTeamName: string | null
): MoveTarget[] => {
  const targets: MoveTarget[] = teams
    .filter((team) => team.name !== currentTeamName)
    .map((team) => ({ key: resolveTeamKey(team), teamName: team.name }));

  return currentTeamName === null ? targets : [...targets, { key: UNSEAT_KEY, teamName: null }];
};

export const findMoveTarget = (targets: ReadonlyArray<MoveTarget>, key: string): MoveTarget | undefined =>
  targets.find((target) => target.key === key);
