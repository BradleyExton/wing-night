// What a signed-in guest can read and write: themself, the night's teams and their own pick of
// one, their bird's outfit for that team's genre, any guest's kept head (the heads on a team tile), and how far along their own head is
// (src/avatarRoutes).
import { parseOutfit, resolveGenreKey } from "@wingnight/shared";
import {
  OUTFIT_REQUEST_MAX_BYTES,
  PORTAL_API_ROUTES,
  isOutfitRequest,
  isTeamPickRequest,
  resolveTeamSeatCap,
  type PortalMe,
  type PortalOutfitSaved,
  type PortalTeamPicked
} from "@wingnight/shared/guestPortal";

import { readAvatarStatus, serveHead } from "../avatarStore/index.ts";
import { errorResponse, jsonResponse, readContentLength, readJsonBody } from "../http/index.ts";
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

// The JSON body of a small request, or "too_large" past the cap — by its declared length before a
// byte is read, and by what actually came when it declared none.
const readCappedJsonBody = async (request: Request, maxBytes: number): Promise<unknown> => {
  const declaredLength = readContentLength(request);

  if (declaredLength !== null && declaredLength > maxBytes) {
    return "too_large";
  }

  const bytes = new Uint8Array(await request.arrayBuffer());

  if (bytes.byteLength > maxBytes) {
    return "too_large";
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    return undefined;
  }
};

// Every tap in the wardrobe is a save: one genre's whole outfit, read strictly for that genre
// (parseOutfit), written into the pick's row beside every other genre's. The genre must be the
// guest's team's — a page left open across a team switch is told so (no_team) rather than
// dressing a bird for a team they left. The write is one statement that sets just that genre's
// key, and only while the row still names the team that was checked, so a switch racing it wins
// and the outfit is refused. `{}` is kept as `{}`: the guest stripped this genre bare, which the
// pull must carry down (research §2.4). Picks closing leaves the wardrobe open.
const saveOutfit = async ({ request, url, deps, session }: GuestContext): Promise<Response> => {
  const body = await readCappedJsonBody(request, OUTFIT_REQUEST_MAX_BYTES);

  if (body === "too_large") {
    return errorResponse("too_large");
  }

  if (!isOutfitRequest(body)) {
    return errorResponse("bad_request");
  }

  const outfit = parseOutfit(body.genre, body.outfit);

  if (outfit === null) {
    return errorResponse("outfit_invalid");
  }

  const roster = await readRoster(deps, url.origin);

  if (roster === null) {
    return errorResponse("server_error");
  }

  const current = await readTeamPick(deps, session.guestId);
  const team = current === null ? undefined : findRosterTeam(roster, current.teamName);

  if (team === undefined || resolveGenreKey(team.genre) !== body.genre) {
    return errorResponse("no_team");
  }

  const { meta } = await deps.db
    .prepare(
      `UPDATE team_picks SET outfits_json = json_set(outfits_json, ?, json(?)), updated_at = ?
       WHERE guest_id = ? AND team_name = ?`
    )
    .bind(`$.${body.genre}`, JSON.stringify(outfit), deps.now(), session.guestId, team.name)
    .run();

  if (meta.changes === 0) {
    return errorResponse("no_team");
  }

  const saved = await readTeamPick(deps, session.guestId);

  if (saved === null) {
    throw new Error(`outfit: ${session.guestId}'s row did not read back after the outfit was saved`);
  }

  const answer: PortalOutfitSaved = { team: saved };

  return jsonResponse(answer);
};

// Any guest's kept head, for the heads on a team tile: the same bytes the TV shows on the night.
const readGuestHead = async ({ params, deps }: GuestContext): Promise<Response> => {
  return serveHead(deps, params.guestId ?? "");
};

export const GUEST_ROUTES: PortalRoute[] = [
  { method: "GET", pattern: PORTAL_API_ROUTES.me, access: "guest", handle: readMe },
  { method: "GET", pattern: `${PORTAL_API_ROUTES.guests}/:guestId/avatar`, access: "guest", handle: readGuestHead },
  { method: "GET", pattern: PORTAL_API_ROUTES.teams, access: "guest", handle: listTeams },
  { method: "PUT", pattern: PORTAL_API_ROUTES.myTeam, access: "guest", handle: pickTeam },
  { method: "PUT", pattern: PORTAL_API_ROUTES.myOutfit, access: "guest", handle: saveOutfit }
];
