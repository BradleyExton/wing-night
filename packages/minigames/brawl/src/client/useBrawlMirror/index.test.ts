import assert from "node:assert/strict";
import test from "node:test";
import type { BrawlInput } from "@wingnight/shared";

import { isLogAppendedFrom } from "./index.js";

const log: BrawlInput[] = [
  { tick: 0, kind: "peck" },
  { tick: 4, kind: "walk", dir: 1 }
];

test("does carry on without a rebuild when the new thumbs land on ticks the mirror has not drawn", () => {
  assert.equal(isLogAppendedFrom(log, [...log, { tick: 30, kind: "peck" }], 24), true);
  assert.equal(isLogAppendedFrom(log, log, 24), true);
  assert.equal(isLogAppendedFrom([], log, 0), true);
});

test("does ask for a rebuild when a thumb lands on a tick the mirror already drew", () => {
  assert.equal(isLogAppendedFrom(log, [...log, { tick: 20, kind: "peck" }], 24), false);
});

test("does ask for a rebuild when the log was rewritten under it rather than added to", () => {
  assert.equal(isLogAppendedFrom(log, [{ tick: 0, kind: "peck" }, { tick: 4, kind: "walk", dir: -1 }], 2), false);
  assert.equal(isLogAppendedFrom(log, [{ tick: 0, kind: "peck" }], 2), false);
});
