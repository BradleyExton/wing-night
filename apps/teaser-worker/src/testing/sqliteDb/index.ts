// A D1 stand-in for the tests: Node's built-in SQLite behind the PortalDb subset, with the real
// files in migrations/ applied in order. D1 is SQLite, so the schema, the partial indexes and
// RETURNING all behave as they will in production.
import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

import type { DbStatement, DbValue, PortalDb } from "../../deps/index.ts";

const MIGRATIONS_DIR = new URL("../../../migrations/", import.meta.url);

export const readMigrationFiles = (): { fileName: string; sql: string }[] => {
  return readdirSync(MIGRATIONS_DIR)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort()
    .map((fileName) => ({ fileName, sql: readFileSync(new URL(fileName, MIGRATIONS_DIR), "utf8") }));
};

export const applyMigrations = (database: DatabaseSync): void => {
  for (const { sql } of readMigrationFiles()) {
    database.exec(sql);
  }
};

const createStatement = (database: DatabaseSync, sql: string, values: DbValue[]): DbStatement => {
  const bound = values as SQLInputValue[];

  return {
    bind: (...nextValues) => createStatement(database, sql, nextValues),
    first: async <Row>() => (database.prepare(sql).get(...bound) as Row | undefined) ?? null,
    all: async <Row>() => ({ results: database.prepare(sql).all(...bound) as Row[] }),
    run: async () => ({ meta: { changes: Number(database.prepare(sql).run(...bound).changes) } })
  };
};

export type SqliteDb = PortalDb & {
  // The database underneath, for reading raw rows.
  raw: DatabaseSync;
};

export const createSqliteDb = (): SqliteDb => {
  const database = new DatabaseSync(":memory:");

  applyMigrations(database);

  return {
    raw: database,
    prepare: (sql) => createStatement(database, sql, []),
    // Like D1's: all or nothing.
    batch: async (statements) => {
      database.exec("BEGIN");

      try {
        const results = [];

        for (const statement of statements) {
          results.push(await statement.run());
        }

        database.exec("COMMIT");

        return results;
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    }
  };
};
