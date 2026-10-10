// What a signed-in guest can read and write: themself, the night's teams and their own pick of
// one, any guest's kept head (the heads on a team tile), and how far along their own head is
// (src/avatarRoutes).
import {
  PORTAL_API_ROUTES,
  isTeamPickRequest,
  resolveTeamSeatCap,
  type PortalMe,
  type PortalTeamPicked
} from "@wingnight/shared/guestPortal";

import { readAvatarStatus, serveHead } from "../avatarStore/index.ts";
import { errorResponse, jsonResponse, readJsonBody } from "../http/index.ts";
import { findRosterTeam, readRoster } from "../roster/index.ts";
import type { GuestContext, PortalRoute } from "../routeContext/index.ts";
import { readGuestCount, readPicksClosed, readTeamList, readTeamPick } from "../teamPicks/index.ts";

const readMe = async ({ deps, session }: GuestContext): Promise<Response> => {
  const [avatar, team, picksClosed] = await Promise.all([
    readAvatarStatus(deps, session.guestId),
    readTeamPick(deps, session.guestId),
    readPicksClosed(deps)
  ]);
  const me: PortalMe = {
    guestId: session.guestId,
    displayName: session.displayName,
    email: session.email,
    isAdmin: session.isAdmin,
    hasHead: avatar.headHash !== null,
    avatar,
    team,
    picksClosed
  };

  return jsonResponse(me);
};

const listTeams = async ({ deps, url }: GuestContext): Promise<Response> => {
  const roster = await readRoster(deps, url.origin);

  return roster === null ? errorResponse("server_error") : jsonResponse(await readTeamList(deps, roster));
};

// Tapping a tile is the save. The seat is taken in ONE conditional statement — the insert happens
// only while the team's other members number fewer than the cap — so two guests racing for the
// last seat cannot both get it: whichever D1 runs second finds the count at the cap and changes
// nothing, which answers team_full. Re-tapping the team you are on is answered before any write:
// a no-op success even when Brad has seated the team over the cap. The upsert never touches
// outfits_json: the outfit built on another team is kept in the row (plan, decision 6).
const pickTeam = async ({ request, url, deps, session }: GuestContext): Promise<Response> => {
  const body = await readJsonBody(request);

  if (!isTeamPickRequest(body)) {
    return errorResponse("bad_request");
  }

  const roster = await readRoster(deps, url.origin);

  if (roster === null) {
    return errorResponse("server_error");
  }

  if (findRosterTeam(roster, body.teamName) === undefined) {
    return errorResponse("bad_request");
  }

  if (await readPicksClosed(deps)) {
    return errorResponse("picks_closed");
  }

  const current = await readTeamPick(deps, session.guestId);

  if (current?.teamName === body.teamName) {
    const unchanged: PortalTeamPicked = { team: current, teams: await readTeamList(deps, roster) };

    return jsonResponse(unchanged);
  }

  const seatCap = resolveTeamSeatCap(await readGuestCount(deps), roster.teams.length);
  const { meta } = await deps.db
    .prepare(
      `INSERT INTO team_picks (guest_id, team_name, outfits_json, updated_at)
       SELECT ?, ?, '{}', ?
       WHERE (SELECT COUNT(*) FROM team_picks WHERE team_name = ? AND guest_id != ?) < ?
       ON CONFLICT (guest_id) DO UPDATE SET team_name = excluded.team_name, updated_at = excluded.updated_at`
    )
    .bind(session.guestId, body.teamName, deps.now(), body.teamName, session.guestId, seatCap)
    .run();

  if (meta.changes === 0) {
    return errorResponse("team_full");
  }

  const team = await readTeamPick(deps, session.guestId);

  if (team === null) {
    throw new Error(`team pick: ${session.guestId}'s row did not read back after the seat was taken`);
  }

  const picked: PortalTeamPicked = { team, teams: await readTeamList(deps, roster) };

  return jsonResponse(picked);
};

// Any guest's kept head, for the heads on a team tile: the same bytes the TV shows on the night.
const readGuestHead = async ({ params, deps }: GuestContext): Promise<Response> => {
  return serveHead(deps, params.guestId ?? "");
};

export const GUEST_ROUTES: PortalRoute[] = [
  { method: "GET", pattern: PORTAL_API_ROUTES.me, access: "guest", handle: readMe },
  { method: "GET", pattern: `${PORTAL_API_ROUTES.guests}/:guestId/avatar`, access: "guest", handle: readGuestHead },
  { method: "GET", pattern: PORTAL_API_ROUTES.teams, access: "guest", handle: listTeams },
  { method: "PUT", pattern: PORTAL_API_ROUTES.myTeam, access: "guest", handle: pickTeam }
];
