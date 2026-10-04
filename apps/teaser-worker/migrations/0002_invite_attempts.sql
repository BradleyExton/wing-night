-- When an invite was last TRIED, whether or not the mail went. "Invite everyone" works through
-- the uninvited oldest-try first, so a guest whose address keeps bouncing goes to the back of the
-- queue instead of holding the front of every batch.
--
-- Unlike 0001 this cannot be IF NOT EXISTS (SQLite has no such ALTER), so it relies on
-- `wrangler d1 migrations apply` running it once, which it records.
ALTER TABLE guests ADD COLUMN last_invite_attempt_at INTEGER;
