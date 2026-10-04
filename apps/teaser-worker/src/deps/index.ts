// Everything a handler reaches outside itself. The entry (src/index.ts) builds these from the
// Worker's bindings; the tests build them from node:sqlite and in-memory fakes. Each binding is
// typed as the small subset of it the portal uses, so a fake only has to be that much.
import type { MailTransport } from "../mail/index.ts";
import type { HeadPainter } from "../headPainter/index.ts";

export type DbValue = string | number | null;

// The slice of D1 the portal uses: prepared statements, read one/all/run, and `batch`, which D1
// runs as one transaction.
export type DbStatement = {
  bind(...values: DbValue[]): DbStatement;
  first<Row>(): Promise<Row | null>;
  all<Row>(): Promise<{ results: Row[] }>;
  run(): Promise<{ meta: { changes: number } }>;
};

export type PortalDb = {
  prepare(sql: string): DbStatement;
  batch(statements: DbStatement[]): Promise<unknown[]>;
};

export type BucketObject = {
  arrayBuffer(): Promise<ArrayBuffer>;
  httpMetadata?: { contentType?: string };
};

// The slice of R2 the avatar flow (milestone 2) uses.
export type PortalBucket = {
  get(key: string): Promise<BucketObject | null>;
  put(
    key: string,
    value: ArrayBuffer | Uint8Array | string,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
  delete(key: string): Promise<void>;
};

// The Workers rate-limit binding (`ratelimits` in wrangler.jsonc).
export type RateLimiter = {
  limit(options: { key: string }): Promise<{ success: boolean }>;
};

// The static assets binding: the teaser's own pages, for anything the Worker does not answer.
export type AssetFetcher = {
  fetch(request: Request): Promise<Response>;
};

export type PortalDeps = {
  db: PortalDb;
  bucket: PortalBucket;
  mail: MailTransport;
  gemini: HeadPainter;
  signInLimiter: RateLimiter;
  assets: AssetFetcher;
  // Where sign-in links point (PUBLIC_ORIGIN): the canonical site, never whatever Host a request
  // arrived on. Null falls back to the request's own origin.
  publicOrigin: string | null;
  // The bearer that opens the admin API to a script (the pack pull). Null turns that door off.
  adminApiToken: string | null;
  now: () => number;
  // Cryptographically random bytes.
  random: (byteCount: number) => Uint8Array;
  // `ctx.waitUntil`: work that outlives the response.
  defer: (work: Promise<unknown>) => void;
  logError: (message: string, error?: unknown) => void;
};
