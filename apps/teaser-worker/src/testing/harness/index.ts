// The portal under test: real handlers over node:sqlite, a recording mailbox, a counting rate
// limiter, a clock the test moves, and deferred work the test can wait for.
import { randomBytes } from "node:crypto";

import { handleRequest } from "../../app/index.ts";
import type { PortalBucket, PortalDeps, RateLimiter } from "../../deps/index.ts";
import { createFakeHeadPainter } from "../../headPainter/index.ts";
import { createRecordingMailTransport } from "../../mail/index.ts";
import { hashToken, mintToken } from "../../tokens/index.ts";
import { createSqliteDb, type SqliteDb } from "../sqliteDb/index.ts";

export const ORIGIN = "https://wingnight.tv";
export const ADMIN_API_TOKEN = "test-admin-api-token-0123456789";
export const START_MS = Date.UTC(2026, 9, 1, 18, 0, 0);

const createCountingLimiter = (limit: number): RateLimiter & { counts: Map<string, number> } => {
  const counts = new Map<string, number>();

  return {
    counts,
    limit: async ({ key }) => {
      const count = (counts.get(key) ?? 0) + 1;

      counts.set(key, count);

      return { success: count <= limit };
    }
  };
};

const createMemoryBucket = (): PortalBucket => {
  const objects = new Map<string, Uint8Array>();

  return {
    get: async (key) => {
      const bytes = objects.get(key);

      return bytes === undefined ? null : { arrayBuffer: async () => bytes.slice().buffer };
    },
    put: async (key, value) => {
      objects.set(key, typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value));
    },
    delete: async (key) => {
      objects.delete(key);
    }
  };
};

export type TestPortal = ReturnType<typeof createTestPortal>;

export const createTestPortal = (
  options: { ipLimit?: number; adminApiToken?: string | null; publicOrigin?: string | null } = {}
) => {
  const db: SqliteDb = createSqliteDb();
  const mail = createRecordingMailTransport();
  const limiter = createCountingLimiter(options.ipLimit ?? 5);
  const deferred: Promise<unknown>[] = [];
  const errors: string[] = [];
  const clock = { now: START_MS };
  const deps: PortalDeps = {
    db,
    bucket: createMemoryBucket(),
    mail,
    gemini: createFakeHeadPainter(),
    signInLimiter: limiter,
    assets: { fetch: async () => new Response("<!doctype html><title>teaser</title>", { status: 200 }) },
    publicOrigin: options.publicOrigin ?? null,
    adminApiToken: options.adminApiToken === undefined ? ADMIN_API_TOKEN : options.adminApiToken,
    now: () => clock.now,
    random: (byteCount) => new Uint8Array(randomBytes(byteCount)),
    defer: (work) => {
      deferred.push(work);
    },
    logError: (message) => {
      errors.push(message);
    }
  };

  // Sends a request as a page on the portal's own origin would, unless told otherwise.
  const request = async (
    method: string,
    path: string,
    init: { body?: unknown; cookie?: string; origin?: string | null; headers?: Record<string, string> } = {}
  ): Promise<Response> => {
    const headers = new Headers(init.headers);

    if (init.origin !== null) {
      headers.set("Origin", init.origin ?? ORIGIN);
    }

    if (init.cookie !== undefined) {
      headers.set("Cookie", init.cookie);
    }

    if (init.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    return handleRequest(
      new Request(`${ORIGIN}${path}`, {
        method,
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body)
      }),
      deps
    );
  };

  const settle = async (): Promise<void> => {
    while (deferred.length > 0) {
      await Promise.all(deferred.splice(0));
    }
  };

  const addGuest = (guest: { guestId: string; displayName: string; email?: string | null; isAdmin?: boolean }) => {
    db.raw
      .prepare("INSERT INTO guests (guest_id, display_name, email, is_admin, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(guest.guestId, guest.displayName, guest.email ?? null, guest.isAdmin === true ? 1 : 0, clock.now);
  };

  // A session straight into the table, as a sign-in would leave it; returns the Cookie header.
  const signInAs = async (guestId: string, expiresInMs = 60 * 60 * 1000): Promise<string> => {
    const token = mintToken(deps.random);

    db.raw
      .prepare(
        "INSERT INTO sessions (session_hash, guest_id, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?)"
      )
      .run(await hashToken(token), guestId, clock.now, clock.now + expiresInMs, clock.now);

    return `wn_session=${token}`;
  };

  return { db, deps, mail, limiter, clock, errors, request, settle, addGuest, signInAs };
};

// The `/s/<token>` path out of a sign-in email or minted link.
export const readSignInPath = (text: string): string => {
  const match = /https:\/\/wingnight\.tv(\/s\/[A-Za-z0-9_-]+)/.exec(text);

  if (match?.[1] === undefined) {
    throw new Error(`No sign-in link in: ${text}`);
  }

  return match[1];
};

// The `wn_session=<token>` pair out of a Set-Cookie header.
export const readSessionCookie = (response: Response): string => {
  const match = /^(wn_session=[^;]*)/.exec(response.headers.get("Set-Cookie") ?? "");

  if (match?.[1] === undefined) {
    throw new Error("No session cookie was set.");
  }

  return match[1];
};
