// Brad's side: the guest list and its sign-in status, adding and editing guests, invites, a link
// to text by hand, the team board and its switch, every guest's head, the style reference, a
// guest's tries and the export the pack pull reads.
// Reachable by a signed-in guest with `is_admin` or by a script holding ADMIN_API_TOKEN
// (app/index.ts decides which).
import {
  AVATAR_HEAD_TYPE,
  PORTAL_API_ROUTES,
  isAdminCreateGuestRequest,
  isAdminEditGuestRequest,
  isAdminPicksRequest,
  isAdminStyleReferenceRequest,
  isAdminTeamSeatRequest,
  normalizeGuestDisplayName,
  normalizeGuestEmail,
  type AdminAvatarReset,
  type AdminGuestExport,
  type AdminGuestStatus,
  type AdminInviteAllResult,
  type AdminInviteResult,
  type AdminMintedLink,
  type AdminPicksState,
  type AdminSignOutResult,
  type AdminStyleReference
} from "@wingnight/shared/guestPortal";

import {
  STYLE_REFERENCE_KEY,
  deletePhoto,
  readAcceptedHead,
  readAvatarStatus,
  resolveTriesLeft,
  serveHead
} from "../avatarStore/index.ts";
import { encodeBase64 } from "../base64/index.ts";
import type { DbStatement, PortalDeps } from "../deps/index.ts";
import { errorResponse, jsonResponse, readJsonBody } from "../http/index.ts";
import { findRosterTeam, readRoster, type PortalRoster } from "../roster/index.ts";
import type { AdminContext, PortalRoute } from "../routeContext/index.ts";
import { composeSignInMail } from "../signInMail/index.ts";
import { mintPersonalLink, resolveLinkOrigin, resolveSignInUrl } from "../signInLinks/index.ts";
import {
  SEATED_TEAM_NAME_SQL,
  UNSEATED_TEAM_NAME,
  parseOutfitsJson,
  readTeamBoard,
  writePicksClosed
} from "../teamPicks/index.ts";
import { mintGuestId } from "../tokens/index.ts";

// "Invite everyone" sends at most this many per request. Each invite is three D1 statements and
// one Resend call, and a Worker on the free plan gets 50 of each per request; ten leaves room.
export const INVITE_ALL_BATCH_SIZE = 10;

type GuestStatusRow = {
  guest_id: string;
  display_name: string;
  email: string | null;
  is_admin: number;
  created_at: number;
  invited_at: number | null;
  claimed_at: number | null;
  last_seen_at: number | null;
  head_hash: string | null;
  is_style_reference: number;
  tries_spent: number;
  tries_failed: number;
  team: string | null;
};

const GUEST_STATUS_SELECT = `
  SELECT g.guest_id, g.display_name, g.email, g.is_admin, g.created_at, g.invited_at,
    g.claimed_at, g.last_seen_at,
    (SELECT a.head_hash FROM avatar_attempts a WHERE a.guest_id = g.guest_id AND a.accepted_at IS NOT NULL) AS head_hash,
    -- The reference only while it is a copy of the head the guest has now.
    EXISTS (
      SELECT 1 FROM style_reference s JOIN avatar_attempts a
        ON a.guest_id = s.guest_id AND a.accepted_at IS NOT NULL AND a.head_hash = s.head_hash
      WHERE s.guest_id = g.guest_id
    ) AS is_style_reference,
    (SELECT COUNT(*) FROM avatar_attempts a
      WHERE a.guest_id = g.guest_id AND a.reset_at IS NULL AND a.status IN ('painting', 'painted')) AS tries_spent,
    (SELECT COUNT(*) FROM avatar_attempts a
      WHERE a.guest_id = g.guest_id AND a.reset_at IS NULL AND a.status = 'failed') AS tries_failed,
    -- The pick as stored, an unseated row as none; withRosterTeam checks it against the roster
    -- before it leaves.
    (SELECT ${SEATED_TEAM_NAME_SQL} FROM team_picks p WHERE p.guest_id = g.guest_id) AS team
  FROM guests g`;

const toGuestStatus = (row: GuestStatusRow): AdminGuestStatus => ({
  guestId: row.guest_id,
  displayName: row.display_name,
  email: row.email,
  isAdmin: row.is_admin === 1,
  createdAt: row.created_at,
  invitedAt: row.invited_at,
  claimedAt: row.claimed_at,
  lastSeenAt: row.last_seen_at,
  hasHead: row.head_hash !== null,
  headHash: row.head_hash,
  isStyleReference: row.is_style_reference === 1,
  triesLeft: resolveTriesLeft({ spent: row.tries_spent, failed: row.tries_failed, headHash: row.head_hash }),
  team: row.team
});

// A pick naming a team the roster no longer has is orphaned: the board lists that guest as
// unseated, and the guest row says the same (`team: null`) so the two never disagree. With no
// roster to check against (a deploy bug the board already fails loudly on) the raw name stays,
// rather than the guest list failing too.
const withRosterTeam = (status: AdminGuestStatus, roster: PortalRoster | null): AdminGuestStatus => {
  return status.team === null || roster === null || findRosterTeam(roster, status.team) !== undefined
    ? status
    : { ...status, team: null };
};

// The row as stored, the pick unchecked: for the handlers' own lookups. What leaves the Worker
// goes through readGuestStatus / listGuests.
const readGuestRow = async (deps: PortalDeps, guestId: string): Promise<AdminGuestStatus | null> => {
  const row = await deps.db
    .prepare(`${GUEST_STATUS_SELECT} WHERE g.guest_id = ?`)
    .bind(guestId)
    .first<GuestStatusRow>();

  return row === null ? null : toGuestStatus(row);
};

const readGuestStatus = async (deps: PortalDeps, origin: string, guestId: string): Promise<AdminGuestStatus | null> => {
  const status = await readGuestRow(deps, guestId);

  return status === null ? null : withRosterTeam(status, await readRoster(deps, origin));
};

const isEmailTaken = async (deps: PortalDeps, email: string, exceptGuestId: string | null): Promise<boolean> => {
  const row = await deps.db
    .prepare("SELECT guest_id FROM guests WHERE email = ?")
    .bind(email)
    .first<{ guest_id: string }>();

  return row !== null && row.guest_id !== exceptGuestId;
};

const endSessions = (deps: PortalDeps, guestId: string): DbStatement =>
  deps.db.prepare("DELETE FROM sessions WHERE guest_id = ?").bind(guestId);

const evictGuest = (deps: PortalDeps, guestId: string): DbStatement[] => {
  const now = deps.now();

  return [
    deps.db.prepare("UPDATE personal_links SET revoked_at = ? WHERE guest_id = ? AND revoked_at IS NULL").bind(now, guestId),
    // Marked used rather than deleted, so they still count against the address's hourly cap.
    deps.db.prepare("UPDATE email_tokens SET used_at = ? WHERE guest_id = ? AND used_at IS NULL").bind(now, guestId),
    endSessions(deps, guestId)
  ];
};

const listGuests = async ({ url, deps }: AdminContext): Promise<Response> => {
  const [{ results }, roster] = await Promise.all([
    deps.db.prepare(`${GUEST_STATUS_SELECT} ORDER BY g.display_name COLLATE NOCASE, g.guest_id`).all<GuestStatusRow>(),
    readRoster(deps, url.origin)
  ]);

  return jsonResponse(results.map((row) => withRosterTeam(toGuestStatus(row), roster)));
};

const createGuest = async ({ request, url, deps }: AdminContext): Promise<Response> => {
  const body = await readJsonBody(request);

  if (!isAdminCreateGuestRequest(body)) {
    return errorResponse("bad_request");
  }

  const email = body.email === null ? null : normalizeGuestEmail(body.email);

  if (email !== null && (await isEmailTaken(deps, email, null))) {
    return errorResponse("email_taken");
  }

  const guestId = mintGuestId(deps.random);

  await deps.db
    .prepare("INSERT INTO guests (guest_id, display_name, email, is_admin, created_at) VALUES (?, ?, ?, 0, ?)")
    .bind(guestId, normalizeGuestDisplayName(body.displayName), email, deps.now())
    .run();

  return jsonResponse(await readGuestStatus(deps, url.origin, guestId), 201);
};

const editGuest = async ({ request, params, url, deps }: AdminContext): Promise<Response> => {
  const guestId = params.guestId ?? "";
  const body = await readJsonBody(request);

  if (!isAdminEditGuestRequest(body)) {
    return errorResponse("bad_request");
  }

  const current = await readGuestRow(deps, guestId);

  if (current === null) {
    return errorResponse("not_found");
  }

  const displayName =
    body.displayName === undefined ? current.displayName : normalizeGuestDisplayName(body.displayName);
  const email =
    body.email === undefined ? current.email : body.email === null ? null : normalizeGuestEmail(body.email);

  if (email !== null && (await isEmailTaken(deps, email, guestId))) {
    return errorResponse("email_taken");
  }

  const update = deps.db
    .prepare("UPDATE guests SET display_name = ?, email = ? WHERE guest_id = ?")
    .bind(displayName, email, guestId);

  // A new address may mean the invite went to a mistyped one, so whoever holds a link sent there
  // — or is signed in from it — is shut out: the personal link is revoked, any emailed link not
  // yet used is spent, and every session ends. The guest gets back in with a fresh invite.
  await deps.db.batch(email === current.email ? [update] : [update, ...evictGuest(deps, guestId)]);

  return jsonResponse(await readGuestStatus(deps, url.origin, guestId));
};

type InviteOutcome = { kind: "invited"; invitedAt: number } | { kind: "no_email" } | { kind: "mail_failed" };

// An invite always mints: a personal link is only kept as a hash, so the old one cannot be
// re-sent, and minting revokes it. If the mail then fails, the old link is already gone — Brad
// can retry, or mint one to text.
const inviteGuest = async (
  deps: PortalDeps,
  guest: { guestId: string; displayName: string; email: string | null },
  origin: string
): Promise<InviteOutcome> => {
  if (guest.email === null) {
    return { kind: "no_email" };
  }

  const token = await mintPersonalLink(deps, guest.guestId);
  const attemptedAt = deps.now();
  let mailError: unknown = null;

  try {
    await deps.mail.send(
      composeSignInMail({
        kind: "invite",
        to: guest.email,
        displayName: guest.displayName,
        url: resolveSignInUrl(origin, token)
      })
    );
  } catch (error) {
    mailError = error;
  }

  // The try is stamped either way, so "invite everyone" moves a failing guest to the back.
  await deps.db
    .prepare("UPDATE guests SET last_invite_attempt_at = ?, invited_at = COALESCE(?, invited_at) WHERE guest_id = ?")
    .bind(attemptedAt, mailError === null ? attemptedAt : null, guest.guestId)
    .run();

  // Every failed send is a 502 to Brad — Resend refusing the message, and equally a
  // MAIL_TRANSPORT the Worker does not know (src/mail fails those closed). The log says which.
  if (mailError !== null) {
    deps.logError(`invite: mail to ${guest.guestId} failed`, mailError);

    return { kind: "mail_failed" };
  }

  return { kind: "invited", invitedAt: attemptedAt };
};

const sendInvite = async ({ params, url, deps }: AdminContext): Promise<Response> => {
  const guest = await readGuestRow(deps, params.guestId ?? "");

  if (guest === null) {
    return errorResponse("not_found");
  }

  const outcome = await inviteGuest(deps, guest, resolveLinkOrigin(deps, url));

  if (outcome.kind !== "invited") {
    return errorResponse(outcome.kind);
  }

  const result: AdminInviteResult = { guestId: guest.guestId, invitedAt: outcome.invitedAt };

  return jsonResponse(result);
};

// Brad's own row is left out: he is an admin, and seed:admin already handed him his link.
// Never-tried guests go first, then the longest since a try, so ten bouncing addresses cannot
// hold the front of every batch.
const inviteEveryone = async ({ url, deps }: AdminContext): Promise<Response> => {
  const { results } = await deps.db
    .prepare(
      `SELECT guest_id, display_name, email FROM guests
       WHERE email IS NOT NULL AND invited_at IS NULL AND is_admin = 0
       ORDER BY last_invite_attempt_at IS NOT NULL, last_invite_attempt_at, created_at, guest_id`
    )
    .all<{ guest_id: string; display_name: string; email: string }>();
  const result: AdminInviteAllResult = { invited: [], failed: [], remaining: 0 };

  for (const row of results.slice(0, INVITE_ALL_BATCH_SIZE)) {
    const outcome = await inviteGuest(
      deps,
      { guestId: row.guest_id, displayName: row.display_name, email: row.email },
      resolveLinkOrigin(deps, url)
    );

    (outcome.kind === "invited" ? result.invited : result.failed).push(row.guest_id);
  }

  // Everyone still uninvited after this press, the ones whose mail just failed included.
  result.remaining = results.length - result.invited.length;

  return jsonResponse(result);
};

// For texting by hand: a fresh personal link, its URL returned this once.
const mintLink = async ({ params, url, deps }: AdminContext): Promise<Response> => {
  const guest = await readGuestRow(deps, params.guestId ?? "");

  if (guest === null) {
    return errorResponse("not_found");
  }

  const minted: AdminMintedLink = {
    guestId: guest.guestId,
    url: resolveSignInUrl(resolveLinkOrigin(deps, url), await mintPersonalLink(deps, guest.guestId))
  };

  return jsonResponse(minted);
};

// Signs a guest out everywhere, e.g. a lost phone. Their links still work; minting a new link
// does NOT end sessions (a guest re-sent their link stays signed in on the devices they have).
const signGuestOut = async ({ params, deps }: AdminContext): Promise<Response> => {
  const guestId = params.guestId ?? "";

  if ((await readGuestRow(deps, guestId)) === null) {
    return errorResponse("not_found");
  }

  const { meta } = await endSessions(deps, guestId).run();
  const result: AdminSignOutResult = { guestId, sessionsEnded: meta.changes };

  return jsonResponse(result);
};

// The board: every team's members in seating order, the unseated, the cap and the switch.
const readBoard = async ({ url, deps }: AdminContext): Promise<Response> => {
  const roster = await readRoster(deps, url.origin);

  return roster === null ? errorResponse("server_error") : jsonResponse(await readTeamBoard(deps, roster));
};

// Brad moving someone: onto a team (over the cap if he wants, closed or not) or off every team.
// Like the guest's own pick, the row's outfits_json is left as it is — unseating too, which
// keeps the row and empties its team name (UNSEATED_TEAM_NAME), so a guest who reseats finds
// every genre they dressed. A guest with no row has no seat and no outfits, so nothing to clear.
const seatGuest = async ({ request, params, url, deps }: AdminContext): Promise<Response> => {
  const guestId = params.guestId ?? "";
  const body = await readJsonBody(request);

  if (!isAdminTeamSeatRequest(body)) {
    return errorResponse("bad_request");
  }

  if ((await readGuestRow(deps, guestId)) === null) {
    return errorResponse("not_found");
  }

  const roster = await readRoster(deps, url.origin);

  if (roster === null) {
    return errorResponse("server_error");
  }

  if (body.teamName === null) {
    await deps.db
      .prepare("UPDATE team_picks SET team_name = ?, updated_at = ? WHERE guest_id = ?")
      .bind(UNSEATED_TEAM_NAME, deps.now(), guestId)
      .run();
  } else if (findRosterTeam(roster, body.teamName) === undefined) {
    return errorResponse("bad_request");
  } else {
    await deps.db
      .prepare(
        `INSERT INTO team_picks (guest_id, team_name, outfits_json, updated_at) VALUES (?, ?, '{}', ?)
         ON CONFLICT (guest_id) DO UPDATE SET team_name = excluded.team_name, updated_at = excluded.updated_at`
      )
      .bind(guestId, body.teamName, deps.now())
      .run();
  }

  return jsonResponse(await readTeamBoard(deps, roster));
};

// The switch: closed, PUT myTeam refuses with picks_closed and /me's tiles go inert, which is
// what makes the last pack pull before the night stable (plan, decision 4).
const setPicksClosed = async ({ request, deps }: AdminContext): Promise<Response> => {
  const body = await readJsonBody(request);

  if (!isAdminPicksRequest(body)) {
    return errorResponse("bad_request");
  }

  await writePicksClosed(deps, body.closed);

  const state: AdminPicksState = { picksClosed: body.closed };

  return jsonResponse(state);
};

const readGuestHead = async ({ params, deps }: AdminContext): Promise<Response> => {
  return serveHead(deps, params.guestId ?? "");
};

// What `pnpm pack:pull` copies into the night pack: each guest's name, their kept head's hash
// and size (for the pull to fetch from readGuestHead), the team they picked, and every genre's
// outfit they built. Selected column by column so an address or a sign-in time cannot ride along.
// The outfits go as stored, a bare-stripped genre's `{}` included (the pull's "cleared"), and go
// even when the pick is orphaned or Brad unseated the guest: they are kept per genre, not per
// team, and the pull merges them genre by genre. A head whose PNG is
// missing from R2 exports as none, the same answer readGuestHead would give. A pick naming a
// team the roster no longer has exports as none, as the board lists it: the night server refuses
// to boot on a player whose team teams.json does not declare (seatPresetRosters), so an orphan
// must never reach the pack. No roster, no export (server_error): the pull is told, not fed.
const exportGuests = async ({ url, deps }: AdminContext): Promise<Response> => {
  const roster = await readRoster(deps, url.origin);

  if (roster === null) {
    return errorResponse("server_error");
  }

  const { results } = await deps.db
    .prepare(
      `SELECT g.guest_id, g.display_name, a.object_key, a.head_hash, ${SEATED_TEAM_NAME_SQL} AS team_name,
         p.outfits_json
       FROM guests g
       LEFT JOIN avatar_attempts a ON a.guest_id = g.guest_id AND a.accepted_at IS NOT NULL
         AND a.object_key IS NOT NULL AND a.head_hash IS NOT NULL
       LEFT JOIN team_picks p ON p.guest_id = g.guest_id
       ORDER BY g.display_name COLLATE NOCASE, g.guest_id`
    )
    .all<{
      guest_id: string;
      display_name: string;
      object_key: string | null;
      head_hash: string | null;
      team_name: string | null;
      outfits_json: string | null;
    }>();
  const exported: AdminGuestExport[] = await Promise.all(
    results.map(async (row) => {
      const object = row.object_key === null ? null : await deps.bucket.head(row.object_key);
      const outfits = row.outfits_json === null ? null : parseOutfitsJson(row.outfits_json);

      return {
        guestId: row.guest_id,
        displayName: row.display_name,
        head:
          object === null || row.head_hash === null
            ? null
            : { sha256: row.head_hash, contentType: AVATAR_HEAD_TYPE, bytes: object.size },
        team: row.team_name !== null && findRosterTeam(roster, row.team_name) !== undefined ? row.team_name : null,
        outfits: outfits ?? {}
      };
    })
  );

  return jsonResponse(exported);
};

// Picks the head every new head is painted to match. Its base64 copy is made here, once, so that
// no guest's paint ever encodes a byte (see src/base64 for what this one encode costs).
const pickStyleReference = async ({ request, deps }: AdminContext): Promise<Response> => {
  const body = await readJsonBody(request);

  if (!isAdminStyleReferenceRequest(body)) {
    return errorResponse("bad_request");
  }

  const head = await readAcceptedHead(deps, body.guestId);
  const object = head === null ? null : await deps.bucket.get(head.objectKey);

  if (head === null || object === null) {
    return errorResponse("not_found");
  }

  const picked: AdminStyleReference = { guestId: body.guestId, headHash: head.headHash, pickedAt: deps.now() };

  await deps.bucket.put(STYLE_REFERENCE_KEY, encodeBase64(new Uint8Array(await object.arrayBuffer())), {
    httpMetadata: { contentType: "text/plain; charset=us-ascii" },
    customMetadata: { mimeType: AVATAR_HEAD_TYPE, guestId: picked.guestId, headHash: picked.headHash }
  });
  await deps.db
    .prepare(
      `INSERT INTO style_reference (slot, guest_id, head_hash, picked_at) VALUES (1, ?, ?, ?)
       ON CONFLICT (slot) DO UPDATE SET
         guest_id = excluded.guest_id, head_hash = excluded.head_hash, picked_at = excluded.picked_at`
    )
    .bind(picked.guestId, picked.headHash, picked.pickedAt)
    .run();

  return jsonResponse(picked);
};

// Gives a guest their tries back and clears any photo they left in R2 — what "Brad can sort you
// out" means on a guest's studio. The kept head stays (avatarStore: reset tries count for nothing).
const resetGuestAvatar = async ({ params, deps }: AdminContext): Promise<Response> => {
  const guestId = params.guestId ?? "";

  if ((await readGuestRow(deps, guestId)) === null) {
    return errorResponse("not_found");
  }

  await deps.db
    .prepare("UPDATE avatar_attempts SET reset_at = ? WHERE guest_id = ? AND reset_at IS NULL")
    .bind(deps.now(), guestId)
    .run();
  await deletePhoto(deps, guestId);

  const reset: AdminAvatarReset = { guestId, avatar: await readAvatarStatus(deps, guestId) };

  return jsonResponse(reset);
};

const GUEST_PATTERN = `${PORTAL_API_ROUTES.adminGuests}/:guestId`;

export const ADMIN_ROUTES: PortalRoute[] = [
  { method: "GET", pattern: PORTAL_API_ROUTES.adminGuests, access: "admin", handle: listGuests },
  { method: "POST", pattern: PORTAL_API_ROUTES.adminGuests, access: "admin", handle: createGuest },
  { method: "PATCH", pattern: GUEST_PATTERN, access: "admin", handle: editGuest },
  { method: "POST", pattern: `${GUEST_PATTERN}/invite`, access: "admin", handle: sendInvite },
  { method: "POST", pattern: `${GUEST_PATTERN}/link`, access: "admin", handle: mintLink },
  { method: "POST", pattern: `${GUEST_PATTERN}/sign-out`, access: "admin", handle: signGuestOut },
  { method: "POST", pattern: PORTAL_API_ROUTES.adminInviteAll, access: "admin", handle: inviteEveryone },
  { method: "GET", pattern: PORTAL_API_ROUTES.adminTeams, access: "admin", handle: readBoard },
  { method: "POST", pattern: `${GUEST_PATTERN}/team`, access: "admin", handle: seatGuest },
  { method: "PUT", pattern: PORTAL_API_ROUTES.adminPicks, access: "admin", handle: setPicksClosed },
  { method: "GET", pattern: `${GUEST_PATTERN}/avatar`, access: "admin", handle: readGuestHead },
  { method: "POST", pattern: `${GUEST_PATTERN}/avatar/reset`, access: "admin", handle: resetGuestAvatar },
  { method: "POST", pattern: PORTAL_API_ROUTES.adminStyleReference, access: "admin", handle: pickStyleReference },
  { method: "GET", pattern: PORTAL_API_ROUTES.adminExport, access: "admin", handle: exportGuests }
];
