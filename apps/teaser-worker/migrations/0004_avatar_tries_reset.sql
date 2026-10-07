-- Brad giving a guest their tries back (milestone 2 review). A reset stamps every try the guest
-- has had so far, and a stamped try no longer counts against either cap. The kept head's row is
-- stamped too and keeps its head: a reset is more tries, never a lost head.
--
-- Like 0002, an ALTER that relies on `wrangler d1 migrations apply` running it once.
ALTER TABLE avatar_attempts ADD COLUMN reset_at INTEGER;
