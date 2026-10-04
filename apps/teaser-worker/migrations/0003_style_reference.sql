-- The style reference (milestone 2): the one accepted head Brad picked for every new head to be
-- painted to match, sent to Gemini beside the guest's photo. The picture itself is an R2 object,
-- kept as the base64 the Gemini request needs so painting never encodes a byte; this row is who
-- it came from, for the admin's gallery. One row at most, held by the CHECK.
CREATE TABLE IF NOT EXISTS style_reference (
  slot INTEGER PRIMARY KEY CHECK (slot = 1),
  guest_id TEXT NOT NULL REFERENCES guests (guest_id) ON DELETE CASCADE,
  -- The head's hash at the time it was picked; the copy does not follow a later re-accept.
  head_hash TEXT NOT NULL,
  picked_at INTEGER NOT NULL
);
