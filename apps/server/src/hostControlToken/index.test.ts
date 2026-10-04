import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  HOST_CONTROL_TOKEN_FILE_NAME,
  generateHostControlToken,
  resolveHostControlToken
} from "./index.js";

const createStateDir = (): string => mkdtempSync(join(tmpdir(), "wn-host-token-"));

const MINTED = "AbCdEfGhIjKlMnOpQrStUvWxYz012345";

test("does use the configured token when HOST_CONTROL_TOKEN is set", () => {
  const stateDir = createStateDir();

  assert.deepEqual(resolveHostControlToken("  room-token  ", { stateDir, generate: () => MINTED }), {
    token: "room-token",
    source: "env"
  });
  assert.equal(existsSync(join(stateDir, HOST_CONTROL_TOKEN_FILE_NAME)), false);
});

test("does mint and persist a private token when HOST_CONTROL_TOKEN is unset or blank", () => {
  const stateDir = createStateDir();
  const path = join(stateDir, HOST_CONTROL_TOKEN_FILE_NAME);

  assert.deepEqual(resolveHostControlToken("   ", { stateDir, generate: () => MINTED }), {
    token: MINTED,
    source: "generated"
  });
  assert.equal(readFileSync(path, "utf8"), MINTED);
  assert.equal(statSync(path).mode & 0o777, 0o600);
});

test("does reuse the persisted token when the server restarts", () => {
  const stateDir = createStateDir();

  resolveHostControlToken(undefined, { stateDir, generate: () => MINTED });

  assert.deepEqual(
    resolveHostControlToken(undefined, {
      stateDir,
      generate: () => assert.fail("a persisted token must not be re-minted")
    }),
    { token: MINTED, source: "persisted" }
  );
});

test("does mint a new token when the persisted file holds garbage", () => {
  const stateDir = createStateDir();
  const path = join(stateDir, HOST_CONTROL_TOKEN_FILE_NAME);
  writeFileSync(path, "not a token", { mode: 0o600 });

  assert.deepEqual(resolveHostControlToken(undefined, { stateDir, generate: () => MINTED }), {
    token: MINTED,
    source: "generated"
  });
  assert.equal(readFileSync(path, "utf8"), MINTED);
});

test("does mint a new token when the persisted file is readable by others", () => {
  const stateDir = createStateDir();
  const path = join(stateDir, HOST_CONTROL_TOKEN_FILE_NAME);
  writeFileSync(path, "ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ");
  chmodSync(path, 0o644);

  assert.deepEqual(resolveHostControlToken(undefined, { stateDir, generate: () => MINTED }), {
    token: MINTED,
    source: "generated"
  });
  assert.equal(statSync(path).mode & 0o777, 0o600);
});

test("does mint a fresh url-safe token when called twice", () => {
  const first = generateHostControlToken();
  const second = generateHostControlToken();

  assert.notEqual(first, second);
  assert.match(first, /^[A-Za-z0-9_-]{32}$/);
});
