// What a signed-in guest can read and write: themself, the names of everyone else (for the
// teammate-wish picker), their own vote, and how far along their head is (src/avatarRoutes).
import {
  PORTAL_API_ROUTES,
  isGuestVote,
  type GuestVote,
  type PortalGuest,
  type PortalMe
} from "@wingnight/shared/guestPortal";

import { readAvatarStatus } from "../avatarStore/index.ts";
import { errorResponse, jsonResponse, readJsonBody } from "../http/index.ts";
import type { GuestContext, PortalRoute } from "../routeContext/index.ts";

type VoteRow = {
  genre_ranking: string;
  teammate_wishes: string;
  team_format: string;
};

// A stored vote read back through the same guard that let it in, so a row the schema has since
// outgrown reads as no vote rather than a malformed one.
export const parseVoteRow = (row: VoteRow, guestId: string): GuestVote | null => {
  try {
    const vote: unknown = {
      genreRanking: JSON.parse(row.genre_ranking),
      teammateWishes: JSON.parse(row.teammate_wishes),
      teamFormat: row.team_format
    };

    return isGuestVote(vote, guestId) ? vote : null;
  } catch {
    return null;
  }
};

const readMe = async ({ deps, session }: GuestContext): Promise<Response> => {
  const [avatar, voteRow] = await Promise.all([
    readAvatarStatus(deps, session.guestId),
    deps.db
      .prepare("SELECT genre_ranking, teammate_wishes, team_format FROM votes WHERE guest_id = ?")
      .bind(session.guestId)
      .first<VoteRow>()
  ]);
  const me: PortalMe = {
    guestId: session.guestId,
    displayName: session.displayName,
    email: session.email,
    isAdmin: session.isAdmin,
    hasHead: avatar.headHash !== null,
    avatar,
    vote: voteRow === null ? null : parseVoteRow(voteRow, session.guestId)
  };

  return jsonResponse(me);
};

// Ids and names, and nothing else: no addresses, no wishes, no admin flags.
const listGuests = async ({ deps }: GuestContext): Promise<Response> => {
  const { results } = await deps.db
    .prepare("SELECT guest_id, display_name FROM guests ORDER BY display_name COLLATE NOCASE, guest_id")
    .all<{ guest_id: string; display_name: string }>();
  const guests: PortalGuest[] = results.map((row) => ({ guestId: row.guest_id, displayName: row.display_name }));

  return jsonResponse(guests);
};

const saveVote = async ({ request, deps, session }: GuestContext): Promise<Response> => {
  const body = await readJsonBody(request);

  if (!isGuestVote(body, session.guestId)) {
    return errorResponse("bad_request");
  }

  if (body.teammateWishes.length > 0) {
    const placeholders = body.teammateWishes.map(() => "?").join(", ");
    const { results } = await deps.db
      .prepare(`SELECT guest_id FROM guests WHERE guest_id IN (${placeholders})`)
      .bind(...body.teammateWishes)
      .all<{ guest_id: string }>();

    if (results.length !== body.teammateWishes.length) {
      return errorResponse("bad_request");
    }
  }

  const vote: GuestVote = {
    genreRanking: body.genreRanking,
    teammateWishes: body.teammateWishes,
    teamFormat: body.teamFormat
  };

  await deps.db
    .prepare(
      `INSERT INTO votes (guest_id, genre_ranking, teammate_wishes, team_format, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (guest_id) DO UPDATE SET
         genre_ranking = excluded.genre_ranking,
         teammate_wishes = excluded.teammate_wishes,
         team_format = excluded.team_format,
         updated_at = excluded.updated_at`
    )
    .bind(
      session.guestId,
      JSON.stringify(vote.genreRanking),
      JSON.stringify(vote.teammateWishes),
      vote.teamFormat,
      deps.now()
    )
    .run();

  return jsonResponse(vote);
};

export const GUEST_ROUTES: PortalRoute[] = [
  { method: "GET", pattern: PORTAL_API_ROUTES.me, access: "guest", handle: readMe },
  { method: "GET", pattern: PORTAL_API_ROUTES.guests, access: "guest", handle: listGuests },
  { method: "PUT", pattern: PORTAL_API_ROUTES.myVote, access: "guest", handle: saveVote }
];
