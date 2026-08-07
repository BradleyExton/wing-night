import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import test, { beforeEach } from "node:test";

import { CONFIG_ERROR_CODES } from "@wingnight/shared";

import {
  createContentRoot,
  writeContentFile,
  writeValidContentTree
} from "../contentLoader/testHarness.js";
import { resetRoomState } from "../roomState/index.js";
import { createConfigService } from "./index.js";

beforeEach(() => {
  resetRoomState();
});

// The two save failures are different things and the wizard renders them
// differently — one is "fix your input", the other is "your disk is broken" —
// so the mapping from the writer's reason onto the wire code is worth pinning
// rather than assuming.
test("maps a validation failure onto CONFIG_INVALID with its issues", () => {
  const configService = createConfigService({
    contentRootDir: createContentRoot()
  });

  const result = configService.save([
    { key: "players", value: { players: [{ name: "" }] } }
  ]);

  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.code, CONFIG_ERROR_CODES.INVALID);
  assert.deepEqual(
    !result.ok ? result.issues : [],
    [{ path: "players.players[0].name", message: "must be a non-empty string" }]
  );
});

test("maps an unwritable content root onto CONFIG_WRITE_FAILED", () => {
  const contentRoot = createContentRoot();
  // A file where the `local` directory needs to be: mkdir fails with ENOTDIR.
  writeFileSync(join(contentRoot, "local"), "not a directory", "utf8");
  const configService = createConfigService({ contentRootDir: contentRoot });

  const result = configService.save([
    { key: "teams", value: { teams: [{ name: "Blocked" }] } }
  ]);

  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.code, CONFIG_ERROR_CODES.WRITE_FAILED);
  assert.deepEqual(!result.ok ? result.issues : ["unexpected"], []);
});

test("maps unreadable content onto CONFIG_LOAD_FAILED when reading", () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "sample", "Sample");
  writeContentFile(contentRoot, "local/gameConfig.json", "{ not json");
  const configService = createConfigService({ contentRootDir: contentRoot });

  const result = configService.read();

  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.code, CONFIG_ERROR_CODES.LOAD_FAILED);
});

test("reports the content it loaded when a reload succeeds", () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "sample", "Sample");
  const configService = createConfigService({ contentRootDir: contentRoot });

  const result = configService.reload();

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.content?.gameConfig.name, "Sample");
});
