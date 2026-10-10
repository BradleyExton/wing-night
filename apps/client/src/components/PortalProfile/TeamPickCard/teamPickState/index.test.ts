import assert from "node:assert/strict";
import test from "node:test";

import { isPickOrphaned, isPickPending, resolveShownPick, resolveTeamTile } from "./index";

const member = (guestId: string): { guestId: string; displayName: string; headHash: string | null } => ({
  guestId,
  displayName: guestId,
  headHash: null
});

test("does show the tapped team while a save is in flight, and the stored one once it is not", () => {
  const pending = { pickedName: "Molten Metal", pendingName: "Disco Inferno" };

  assert.equal(isPickPending(pending), true);
  assert.equal(resolveShownPick(pending), "Disco Inferno");

  const settled = { pickedName: "Disco Inferno", pendingName: null };

  assert.equal(isPickPending(settled), false);
  assert.equal(resolveShownPick(settled), "Disco Inferno");
});

test("does show nothing picked when a first pick is reverted", () => {
  assert.equal(resolveShownPick({ pickedName: null, pendingName: null }), null);
});

test("does flag a pick as orphaned when no listed team carries its name", () => {
  const teams = [{ name: "Molten Metal" }, { name: "Spice Girls" }];

  assert.equal(isPickOrphaned("Honky Tonk Heat", teams), true);
  assert.equal(isPickOrphaned("Spice Girls", teams), false);
  assert.equal(isPickOrphaned(null, teams), false);
});

test("does ring the shown pick, dim a full team and leave the rest open", () => {
  const context = { shownPick: "Spice Girls", seatCap: 2, picksClosed: false, isPending: false };

  assert.deepEqual(resolveTeamTile({ name: "Spice Girls", members: [member("a")] }, context), {
    state: "picked",
    isDisabled: false
  });
  assert.deepEqual(resolveTeamTile({ name: "Molten Metal", members: [member("b"), member("c")] }, context), {
    state: "full",
    isDisabled: true
  });
  assert.deepEqual(resolveTeamTile({ name: "Disco Inferno", members: [] }, context), {
    state: "open",
    isDisabled: false
  });
});

test("does keep the picked tile picked, not full, when its members have reached the cap", () => {
  const tile = resolveTeamTile(
    { name: "Spice Girls", members: [member("me"), member("b")] },
    { shownPick: "Spice Girls", seatCap: 2, picksClosed: false, isPending: false }
  );

  assert.equal(tile.state, "picked");
  assert.equal(tile.isDisabled, false);
});

test("does make every tile inert when picks are closed, the pick still shown", () => {
  const context = { shownPick: "Spice Girls", seatCap: 4, picksClosed: true, isPending: false };

  assert.deepEqual(resolveTeamTile({ name: "Spice Girls", members: [] }, context), {
    state: "picked",
    isDisabled: true
  });
  assert.deepEqual(resolveTeamTile({ name: "Molten Metal", members: [] }, context), {
    state: "open",
    isDisabled: true
  });
});

test("does make every tile inert while a save is in flight", () => {
  const tile = resolveTeamTile(
    { name: "Molten Metal", members: [] },
    { shownPick: "Spice Girls", seatCap: 4, picksClosed: false, isPending: true }
  );

  assert.deepEqual(tile, { state: "open", isDisabled: true });
});
