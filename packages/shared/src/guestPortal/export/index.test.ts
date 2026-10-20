import assert from "node:assert/strict";
import test from "node:test";

import { isAdminGuestExportList } from "./index.ts";

const head = { sha256: "a".repeat(64), contentType: "image/png", bytes: 1200 };

test("does read the export when every guest has a head or a null one, and a team or a null one", () => {
  assert.equal(
    isAdminGuestExportList([
      { guestId: "g_rob", displayName: "Rob", head, team: "Iron Hens" },
      { guestId: "g_sam", displayName: "Sam", head: null, team: null }
    ]),
    true
  );
  assert.equal(isAdminGuestExportList([]), true);
});

test("does refuse a head whose hash is not lower-case sha256 hex when it could name a file", () => {
  for (const sha256 of ["A".repeat(64), "a".repeat(63), `../${"a".repeat(61)}`]) {
    assert.equal(
      isAdminGuestExportList([{ guestId: "g_rob", displayName: "Rob", head: { ...head, sha256 }, team: null }]),
      false
    );
  }
});

test("does refuse the export when a guest is missing its id, name, head or team field", () => {
  assert.equal(isAdminGuestExportList([{ guestId: "", displayName: "Rob", head: null, team: null }]), false);
  assert.equal(isAdminGuestExportList([{ guestId: "g_rob", head: null, team: null }]), false);
  assert.equal(isAdminGuestExportList([{ guestId: "g_rob", displayName: "Rob", team: null }]), false);
  assert.equal(isAdminGuestExportList([{ guestId: "g_rob", displayName: "Rob", head: null }]), false);
  assert.equal(isAdminGuestExportList([{ guestId: "g_rob", displayName: "Rob", head: null, team: "" }]), false);
  assert.equal(isAdminGuestExportList({ guests: [] }), false);
});

test("does read a guest's outfits whatever items they name when the shape is right", () => {
  const outfits = { metal: { top: { item: "battle-vest-a" } }, pop: { tail: { item: "cut-since" } } };

  assert.equal(isAdminGuestExportList([{ guestId: "g_rob", displayName: "Rob", head: null, team: null, outfits }]), true);
});

test("does refuse a guest's outfits when they are not genre -> slot -> choice", () => {
  for (const outfits of [[], { metal: { hat: { item: "x" } } }, { metal: { top: "battle-vest-a" } }]) {
    assert.equal(
      isAdminGuestExportList([{ guestId: "g_rob", displayName: "Rob", head: null, team: null, outfits }]),
      false,
      JSON.stringify(outfits)
    );
  }
});
