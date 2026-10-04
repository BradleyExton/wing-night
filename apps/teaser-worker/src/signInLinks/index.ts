// The two kinds of sign-in link, both `/s/<token>`:
//
// - a PERSONAL link, which Brad's invite carries. Reusable, so one invite signs in a phone and a
//   laptop, until a fresh one is minted for the guest, which revokes it.
// - an EMAILED link, which a guest asks for. Single use and thirty minutes.
import { PORTAL_SIGN_IN_PATH_PREFIX } from "@wingnight/shared/guestPortal";

import type { PortalDeps } from "../deps/index.ts";
import { hashToken, mintToken } from "../tokens/index.ts";

export const EMAIL_LINK_TTL_MS = 30 * 60 * 1000;

export const resolveSignInUrl = (origin: string, token: string): string => {
  return `${origin}${PORTAL_SIGN_IN_PATH_PREFIX}${token}`;
};

// The origin an emailed or minted link is built on. A configured one wins, because a request's
// Host is the caller's to choose, and a link built from it could send a guest's token elsewhere.
export const resolveLinkOrigin = (deps: PortalDeps, url: URL): string => deps.publicOrigin ?? url.origin;

// Revokes the guest's live personal link and mints its replacement in one transaction, so a
// guest never has two (and the schema's partial unique index would refuse it anyway). Sessions
// are left alone: a guest re-sent their link stays signed in where they already are. Ending
// sessions is its own admin action (`/sign-out`), and changing the address does both.
export const mintPersonalLink = async (deps: PortalDeps, guestId: string): Promise<string> => {
  const token = mintToken(deps.random);
  const now = deps.now();

  await deps.db.batch([
    deps.db
      .prepare("UPDATE personal_links SET revoked_at = ? WHERE guest_id = ? AND revoked_at IS NULL")
      .bind(now, guestId),
    deps.db
      .prepare("INSERT INTO personal_links (token_hash, guest_id, created_at) VALUES (?, ?, ?)")
      .bind(await hashToken(token), guestId, now)
  ]);

  return token;
};

// How many links one address may be sent in a rolling hour. The per-IP limit is the
// SIGNIN_LIMITER binding's (wrangler.jsonc).
export const EMAIL_LINKS_PER_ADDRESS_PER_HOUR = 3;
const EMAIL_LINK_WINDOW_MS = 60 * 60 * 1000;

// Mints an emailed link unless the guest already has their hour's worth, or returns null. The
// count and the insert are ONE statement, so requests that arrive together cannot each read
// "two so far" and all send: the database runs one statement at a time.
export const mintEmailLink = async (deps: PortalDeps, guestId: string, ipHash: string): Promise<string | null> => {
  const token = mintToken(deps.random);
  const now = deps.now();
  const inserted = await deps.db
    .prepare(
      `INSERT INTO email_tokens (token_hash, guest_id, created_at, expires_at, requested_ip_hash)
       SELECT ?, ?, ?, ?, ?
       WHERE (SELECT COUNT(*) FROM email_tokens WHERE guest_id = ? AND created_at > ?) < ?
       RETURNING token_hash`
    )
    .bind(
      await hashToken(token),
      guestId,
      now,
      now + EMAIL_LINK_TTL_MS,
      ipHash,
      guestId,
      now - EMAIL_LINK_WINDOW_MS,
      EMAIL_LINKS_PER_ADDRESS_PER_HOUR
    )
    .first<{ token_hash: string }>();

  return inserted === null ? null : token;
};

// The guest a token signs in, or null. A personal link is only looked at; an emailed one is
// burned by the same statement that finds it, so two racing POSTs cannot both succeed.
export const redeemSignInToken = async (deps: PortalDeps, token: string): Promise<string | null> => {
  const tokenHash = await hashToken(token);
  const personal = await deps.db
    .prepare("SELECT guest_id FROM personal_links WHERE token_hash = ? AND revoked_at IS NULL")
    .bind(tokenHash)
    .first<{ guest_id: string }>();

  if (personal !== null) {
    return personal.guest_id;
  }

  const now = deps.now();
  const emailed = await deps.db
    .prepare(
      `UPDATE email_tokens SET used_at = ?
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?
       RETURNING guest_id`
    )
    .bind(now, tokenHash, now)
    .first<{ guest_id: string }>();

  return emailed?.guest_id ?? null;
};
