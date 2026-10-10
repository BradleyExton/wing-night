-- The team pick (docs/guest-portal-team-pick-plan.md): a guest picks one of the night's teams
-- on /me, and the vote that used to live there is deleted, not hidden.
--
-- The teams themselves are not in D1. They are the pack's (`teaser-roster.json`, which the
-- Worker reads through its ASSETS binding), so a pick stores the team's exact roster name and a
-- name the roster no longer has is an orphaned pick: /me says "pick again", /admin lists them
-- as unseated.
--
-- Like 0002 and 0004 this file cannot be run twice: the DROP at the end has nothing to drop a
-- second time, so it relies on `wrangler d1 migrations apply` running it once, which it records.

-- One row per guest who has picked. `outfits_json` is the bird's wardrobe per genre
-- (TeamPick.outfitsByGenre), kept in the row when the guest switches teams so flipping back
-- restores it (plan, decision 6); milestone 1 only ever writes '{}'.
CREATE TABLE IF NOT EXISTS team_picks (
  guest_id TEXT PRIMARY KEY REFERENCES guests (guest_id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  outfits_json TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL
);

-- The seat check counts a team's rows on every pick.
CREATE INDEX IF NOT EXISTS team_picks_by_team ON team_picks (team_name);

-- Brad's switches. `picks_closed` is '0' or '1'; a missing row means open.
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- The vote is gone (plan, decision 8). If any real vote on wingnight.tv matters, read /admin
-- once before deploying this.
DROP TABLE votes;
