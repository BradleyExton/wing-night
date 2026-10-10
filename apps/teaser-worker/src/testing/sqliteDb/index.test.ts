import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { applyMigrations, readMigrationFiles } from "./index.ts";

const listTables = (database: DatabaseSync): string[] => {
  return (
    database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as { name: string }[]
  ).map(({ name }) => name);
};

// 0001 creates `votes` and 0005 drops it, so a fresh database ends up without it.
const PORTAL_TABLES = [
  "avatar_attempts",
  "email_tokens",
  "guests",
  "personal_links",
  "sessions",
  "settings",
  "style_reference",
  "team_picks"
];

test("does create every portal table, the vote's dropped, when the migrations apply to an empty database", () => {
  const database = new DatabaseSync(":memory:");

  assert.ok(readMigrationFiles().length > 0);
  applyMigrations(database);

  assert.deepEqual(listTables(database), PORTAL_TABLES);
});

// wrangler applies each file once and records it; 0001 is written to survive a hand re-run too.
test("does leave the schema as it was when the first migration is applied a second time", () => {
  const database = new DatabaseSync(":memory:");
  const [firstMigration] = readMigrationFiles();

  applyMigrations(database);
  database.prepare("INSERT INTO guests (guest_id, display_name, created_at) VALUES ('g_1', 'Rob', 1)").run();
  assert.doesNotThrow(() => database.exec(firstMigration?.sql ?? ""));

  // The one thing a re-run of 0001 brings back is the empty `votes` table 0005 dropped; the
  // portal reads nothing from it.
  assert.deepEqual(listTables(database), [...PORTAL_TABLES, "votes"].sort());
  assert.deepEqual(
    database.prepare("SELECT guest_id FROM guests").all().map((row) => ({ ...row })),
    [{ guest_id: "g_1" }]
  );
});

test("does apply the migrations in file order when there are several", () => {
  const database = new DatabaseSync(":memory:");

  assert.deepEqual(
    readMigrationFiles().map(({ fileName }) => fileName),
    [
      "0001_guest_portal.sql",
      "0002_invite_attempts.sql",
      "0003_style_reference.sql",
      "0004_avatar_tries_reset.sql",
      "0005_team_picks.sql"
    ]
  );
  applyMigrations(database);

  const columns = (database.prepare("PRAGMA table_info(guests)").all() as { name: string }[]).map(({ name }) => name);

  assert.ok(columns.includes("last_invite_attempt_at"));
});

test("does refuse a second live personal link for a guest when one is already live", () => {
  const database = new DatabaseSync(":memory:");

  applyMigrations(database);
  database.prepare("INSERT INTO guests (guest_id, display_name, created_at) VALUES ('g_1', 'Rob', 1)").run();
  database.prepare("INSERT INTO personal_links (token_hash, guest_id, created_at) VALUES ('h1', 'g_1', 1)").run();

  assert.throws(() =>
    database.prepare("INSERT INTO personal_links (token_hash, guest_id, created_at) VALUES ('h2', 'g_1', 2)").run()
  );
});

test("does refuse an address that is not lower-case when a guest is stored", () => {
  const database = new DatabaseSync(":memory:");

  applyMigrations(database);

  assert.throws(() =>
    database
      .prepare("INSERT INTO guests (guest_id, display_name, email, created_at) VALUES ('g_1', 'Rob', 'Rob@x.com', 1)")
      .run()
  );
});

test("does refuse a second style reference when one is already picked", () => {
  const database = new DatabaseSync(":memory:");

  applyMigrations(database);
  database.prepare("INSERT INTO guests (guest_id, display_name, created_at) VALUES ('g_1', 'Rob', 1)").run();
  database.prepare("INSERT INTO style_reference (slot, guest_id, head_hash, picked_at) VALUES (1, 'g_1', 'h', 1)").run();

  assert.throws(() =>
    database.prepare("INSERT INTO style_reference (slot, guest_id, head_hash, picked_at) VALUES (2, 'g_1', 'h', 2)").run()
  );
});

test("does refuse a second pick for a guest, and cascade their pick away with them, when the schema holds", () => {
  const database = new DatabaseSync(":memory:");

  applyMigrations(database);
  database.exec("PRAGMA foreign_keys = ON");
  database.prepare("INSERT INTO guests (guest_id, display_name, created_at) VALUES ('g_1', 'Rob', 1)").run();
  database.prepare("INSERT INTO team_picks (guest_id, team_name, updated_at) VALUES ('g_1', 'Iron Hens', 1)").run();

  assert.equal(database.prepare("SELECT outfits_json FROM team_picks WHERE guest_id = 'g_1'").get()?.outfits_json, "{}");
  assert.throws(() =>
    database.prepare("INSERT INTO team_picks (guest_id, team_name, updated_at) VALUES ('g_1', 'Mirror Balls', 2)").run()
  );

  database.prepare("DELETE FROM guests WHERE guest_id = 'g_1'").run();
  assert.equal(database.prepare("SELECT COUNT(*) AS n FROM team_picks").get()?.n, 0);
});
