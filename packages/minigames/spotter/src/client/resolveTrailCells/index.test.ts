import assert from "node:assert/strict";
import test from "node:test";

import { resolveTrailCells } from "./index.js";

test("resolveTrailCells returns only the cursor when the trail is empty", () => {
  assert.deepEqual(resolveTrailCells({ col: 6, row: 3 }, []), [{ col: 6, row: 3 }]);
});

test("resolveTrailCells rebuilds the walked cells oldest first", () => {
  assert.deepEqual(resolveTrailCells({ col: 7, row: 2 }, ["U", "R"]), [
    { col: 6, row: 3 },
    { col: 6, row: 2 },
    { col: 7, row: 2 }
  ]);
});
