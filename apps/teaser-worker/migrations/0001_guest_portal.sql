-- The guest portal: who is coming, how they sign in, their avatar tries and their vote.
--
-- Every timestamp is milliseconds since the epoch. Every token and session is stored as the
-- SHA-256 hex of its plaintext; the plaintext only ever exists in a link or a cookie.
--
-- `wrangler d1 migrations apply` runs a file once and records it, but every statement is
-- IF NOT EXISTS anyway, so a hand re-run (`wrangler d1 execute --file`) is harmless.

-- Brad creates every guest; nobody signs up. Brad is a guest too, with is_admin set.
CREATE TABLE IF NOT EXISTS guests (
  guest_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  -- Lower-cased on the way in; NULL for a guest Brad texts instead (SQLite's UNIQUE lets many
  -- rows be NULL).
  email TEXT UNIQUE CHECK (email IS NULL OR email = lower(email)),
  is_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)),
  created_at INTEGER NOT NULL,
  -- When an invite was last emailed.
  invited_at INTEGER,
  -- The first sign-in.
  claimed_at INTEGER,
  last_seen_at INTEGER
);

-- A guest's personal link (`/s/<token>`): reusable, so one invite signs in a phone and a laptop,
-- until a fresh one is minted, which revokes it.
CREATE TABLE IF NOT EXISTS personal_links (
  token_hash TEXT PRIMARY KEY,
  guest_id TEXT NOT NULL REFERENCES guests (guest_id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  revoked_at INTEGER
);

-- One live link per guest, held by the database rather than by every caller remembering.
CREATE UNIQUE INDEX IF NOT EXISTS personal_links_one_live_per_guest
  ON personal_links (guest_id) WHERE revoked_at IS NULL;

-- A link a guest asked to have emailed: single use, thirty minutes.
CREATE TABLE IF NOT EXISTS email_tokens (
  token_hash TEXT PRIMARY KEY,
  guest_id TEXT NOT NULL REFERENCES guests (guest_id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  -- SHA-256 of the requesting IP, for tracing abuse without keeping addresses.
  requested_ip_hash TEXT
);

-- The per-address rate limit counts a guest's recent rows.
CREATE INDEX IF NOT EXISTS email_tokens_by_guest_created
  ON email_tokens (guest_id, created_at);

CREATE TABLE IF NOT EXISTS sessions (
  session_hash TEXT PRIMARY KEY,
  guest_id TEXT NOT NULL REFERENCES guests (guest_id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_by_guest ON sessions (guest_id);

-- Each try at an avatar head (milestone 2). A guest gets a fixed number of tries, counted from
-- this table; the photo and each painted head are R2 objects. The accepted try is the guest's
-- head, and a guest has at most one.
CREATE TABLE IF NOT EXISTS avatar_attempts (
  attempt_id TEXT PRIMARY KEY,
  guest_id TEXT NOT NULL REFERENCES guests (guest_id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('painting', 'painted', 'failed')),
  -- The uploaded photo.
  source_key TEXT,
  -- The painted head, once there is one, and the SHA-256 of its bytes so a pull can tell a
  -- changed head from one it already has.
  object_key TEXT,
  head_hash TEXT,
  accepted_at INTEGER
);

CREATE INDEX IF NOT EXISTS avatar_attempts_by_guest_created
  ON avatar_attempts (guest_id, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS avatar_attempts_one_accepted_per_guest
  ON avatar_attempts (guest_id) WHERE accepted_at IS NOT NULL;

-- A guest's vote, replaced whole on every save. The two lists are JSON arrays in the shape of
-- GuestVote (packages/shared/src/guestPortal).
CREATE TABLE IF NOT EXISTS votes (
  guest_id TEXT PRIMARY KEY REFERENCES guests (guest_id) ON DELETE CASCADE,
  genre_ranking TEXT NOT NULL,
  teammate_wishes TEXT NOT NULL,
  team_format TEXT NOT NULL CHECK (team_format IN ('host_assigns', 'guests_pick', 'random_draw')),
  updated_at INTEGER NOT NULL
);
