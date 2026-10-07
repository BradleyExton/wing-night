import assert from "node:assert/strict";
import test from "node:test";

import { isAdminGuestExportList } from "./index.ts";

const head = { sha256: "a".repeat(64), contentType: "image/png", bytes: 1200 };

test("does read the export when every guest has a head or a null one", () => {
  assert.equal(
    isAdminGuestExportList([
      { guestId: "g_rob", displayName: "Rob", head },
      { guestId: "g_sam", displayName: "Sam", head: null }
    ]),
    true
  );
  assert.equal(isAdminGuestExportList([]), true);
});

test("does refuse a head whose hash is not lower-case sha256 hex when it could name a file", () => {
  for (const sha256 of ["A".repeat(64), "a".repeat(63), `../${"a".repeat(61)}`]) {
    assert.equal(isAdminGuestExportList([{ guestId: "g_rob", displayName: "Rob", head: { ...head, sha256 } }]), false);
  }
});

test("does refuse the export when a guest is missing its id, name or head field", () => {
  assert.equal(isAdminGuestExportList([{ guestId: "", displayName: "Rob", head: null }]), false);
  assert.equal(isAdminGuestExportList([{ guestId: "g_rob", head: null }]), false);
  assert.equal(isAdminGuestExportList([{ guestId: "g_rob", displayName: "Rob" }]), false);
  assert.equal(isAdminGuestExportList({ guests: [] }), false);
});
