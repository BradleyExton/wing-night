import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { applyMigrations, readMigrationFiles } from "./index.ts";

const listTables = (database: DatabaseSync): string[] => {
  return (
    database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as { name: string }[]
  ).map(({ name }) => name);
};

test("does create every portal table when the migrations apply to an empty database", () => {
  const database = new DatabaseSync(":memory:");

  assert.ok(readMigrationFiles().length > 0);
  applyMigrations(database);

  assert.deepEqual(listTables(database), [
    "avatar_attempts",
    "email_tokens",
    "guests",
    "personal_links",
    "sessions",
    "style_reference",
    "votes"
  ]);
});

// wrangler applies each file once and records it; 0001 is written to survive a hand re-run too.
test("does leave the schema as it was when the first migration is applied a second time", () => {
  const database = new DatabaseSync(":memory:");
  const [firstMigration] = readMigrationFiles();

  applyMigrations(database);
  database.prepare("INSERT INTO guests (guest_id, display_name, created_at) VALUES ('g_1', 'Rob', 1)").run();
  assert.doesNotThrow(() => database.exec(firstMigration?.sql ?? ""));

  assert.equal(listTables(database).length, 7);
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
      "0004_avatar_tries_reset.sql"
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
