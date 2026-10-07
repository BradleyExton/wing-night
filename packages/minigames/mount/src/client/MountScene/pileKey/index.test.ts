import assert from "node:assert/strict";
import test from "node:test";

import { MOUNT_WORLD, createMountPile } from "@wingnight/shared";

import { resolvePileKey } from "./index.js";

test("does give a deep copy of a pile the same key", () => {
  const pile = createMountPile(20261002);

  assert.equal(resolvePileKey(JSON.parse(JSON.stringify(pile))), resolvePileKey(pile));
});

test("does change the key when a hen joins the pile", () => {
  const pile = createMountPile(20261002);
  const grown = {
    ...pile,
    hens: [{ pileIndex: 0, playerId: "player-1", pose: MOUNT_WORLD.rig.rest, grabs: {}, mounted: false }]
  };

  assert.notEqual(resolvePileKey(grown), resolvePileKey(pile));
});
