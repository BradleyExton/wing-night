import assert from "node:assert/strict";
import test from "node:test";

import { resolveMinigameModule } from "./index.js";

test("resolveMinigameModule returns trivia module for TRIVIA", () => {
  const module = resolveMinigameModule("TRIVIA");

  assert.ok(module);
  assert.equal(module?.id, "TRIVIA");
});

test("resolveMinigameModule returns null for unimplemented minigames", () => {
  assert.equal(resolveMinigameModule("GEO"), null);
  assert.equal(resolveMinigameModule("DRAWING"), null);
});
