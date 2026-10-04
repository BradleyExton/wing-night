// A signed-in browser: the `wn_session` cookie holds the token, the `sessions` table its hash.
import { PORTAL_SESSION_COOKIE_NAME } from "@wingnight/shared/guestPortal";

import type { PortalDeps } from "../deps/index.ts";
import { readCookie } from "../http/index.ts";
import { hashToken, mintToken } from "../tokens/index.ts";

// Six weeks: long enough to sign in at the invite and still be signed in on the night.
export const SESSION_TTL_MS = 42 * 24 * 60 * 60 * 1000;
// `last_seen_at` is a status for the admin list, not an audit trail, so a busy guest costs one
// write per ten minutes rather than one per request.
const LAST_SEEN_RESOLUTION_MS = 10 * 60 * 1000;

export type SessionGuest = {
  sessionHash: string;
  guestId: string;
  displayName: string;
  email: string | null;
  isAdmin: boolean;
};

type SessionRow = {
  session_hash: string;
  last_seen_at: number;
  guest_id: string;
  display_name: string;
  email: string | null;
  is_admin: number;
};

// `Secure` holds on http://localhost too: browsers treat it as a secure context.
export const buildSessionCookie = (token: string): string => {
  return `${PORTAL_SESSION_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`;
};

export const buildClearedSessionCookie = (): string => {
  return `${PORTAL_SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
};

// Starts a session for a guest who just redeemed a link, and stamps the guest as claimed (first
// time only) and seen. Returns the token for the cookie.
export const createSession = async (deps: PortalDeps, guestId: string): Promise<string> => {
  const token = mintToken(deps.random);
  const now = deps.now();

  await deps.db.batch([
    deps.db
      .prepare(
        "INSERT INTO sessions (session_hash, guest_id, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?)"
      )
      .bind(await hashToken(token), guestId, now, now + SESSION_TTL_MS, now),
    deps.db
      .prepare("UPDATE guests SET claimed_at = COALESCE(claimed_at, ?), last_seen_at = ? WHERE guest_id = ?")
      .bind(now, now, guestId)
  ]);

  return token;
};

export const resolveSession = async (deps: PortalDeps, request: Request): Promise<SessionGuest | null> => {
  const token = readCookie(request, PORTAL_SESSION_COOKIE_NAME);

  if (token === null || token.length === 0) {
    return null;
  }

  const now = deps.now();
  const row = await deps.db
    .prepare(
      `SELECT s.session_hash, s.last_seen_at, g.guest_id, g.display_name, g.email, g.is_admin
       FROM sessions s JOIN guests g ON g.guest_id = s.guest_id
       WHERE s.session_hash = ? AND s.expires_at > ?`
    )
    .bind(await hashToken(token), now)
    .first<SessionRow>();

  if (row === null) {
    return null;
  }

  if (now - row.last_seen_at >= LAST_SEEN_RESOLUTION_MS) {
    deps.defer(
      deps.db
        .batch([
          deps.db.prepare("UPDATE sessions SET last_seen_at = ? WHERE session_hash = ?").bind(now, row.session_hash),
          deps.db.prepare("UPDATE guests SET last_seen_at = ? WHERE guest_id = ?").bind(now, row.guest_id)
        ])
        .catch((error: unknown) => deps.logError("session: last-seen write failed", error))
    );
  }

  return {
    sessionHash: row.session_hash,
    guestId: row.guest_id,
    displayName: row.display_name,
    email: row.email,
    isAdmin: row.is_admin === 1
  };
};

export const deleteSession = async (deps: PortalDeps, request: Request): Promise<void> => {
  const token = readCookie(request, PORTAL_SESSION_COOKIE_NAME);

  if (token !== null && token.length > 0) {
    await deps.db.prepare("DELETE FROM sessions WHERE session_hash = ?").bind(await hashToken(token)).run();
  }
};
