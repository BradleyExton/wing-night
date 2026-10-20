import assert from "node:assert/strict";
import test from "node:test";

import { parseOutfit, resolveOutfitRail } from "@wingnight/shared";

import {
  dressOutfitSlot,
  resolveDressMeOutfit,
  resolveGenreOutfit,
  resolveOutfitLooks,
  resolveOutfitSummary,
  resolveWornLookId,
  resolveWornLookOutfit,
  restyleOutfitSlot
} from "./index";

// A dice that rolls the numbers given, in order, then keeps rolling the last.
const rolls =
  (...values: number[]): (() => number) =>
  () =>
    values.length > 1 ? (values.shift() as number) : (values[0] as number);

test("does say the bird is bare when it has nothing on", () => {
  assert.equal(resolveOutfitSummary({}), "Bare. The silhouette's doing all the work.");
});

test("does list what the bird has on in slot order, names keeping their capitals", () => {
  assert.equal(resolveOutfitSummary({ top: { item: "battle-vest-a" } }), "Battle vest.");
  assert.equal(
    resolveOutfitSummary({
      prop: { item: "flying-v-a", style: "white" },
      sleeve: { item: "leather-sleeve-a" },
      top: { item: "battle-vest-a" }
    }),
    "Battle vest, leather sleeve and Flying V."
  );
});

test("does leave out a choice the catalogue no longer has when it summarises", () => {
  assert.equal(resolveOutfitSummary({ top: { item: "cut-since" }, sleeve: { item: "leather-sleeve-a" } }), "Leather sleeve.");
});

test("does dress every slot from the rail when the dice always fills, and nothing when it never does", () => {
  const full = resolveDressMeOutfit("metal", rolls(0));

  assert.deepEqual(Object.keys(full), ["top", "sleeve", "tail", "boots", "prop", "stage", "move"]);
  assert.equal(full.top?.item, resolveOutfitRail("metal", "top")[0]?.id);
  assert.notEqual(parseOutfit("metal", full), null, "the dice only ever deals what the Worker accepts");
  assert.deepEqual(resolveDressMeOutfit("metal", rolls(0.99)), {});
});

test("does deal no boots to a country bird and only the shared rail to a genre without one", () => {
  assert.equal(resolveDressMeOutfit("country", rolls(0)).boots, undefined);

  const punk = resolveDressMeOutfit("punk", rolls(0, 0.99));

  assert.notEqual(parseOutfit("punk", punk), null);
});

test("does put a tapped item on in its default style and take the slot off for None", () => {
  const dressed = dressOutfitSlot({}, "prop", "flying-v-a");

  assert.deepEqual(dressed, { prop: { item: "flying-v-a", style: "white" } });
  assert.deepEqual(dressOutfitSlot(dressed, "prop", null), {});
});

test("does keep a picked style when the tile already on is tapped again", () => {
  const gold = { prop: { item: "flying-v-a", style: "gold" } } as const;

  assert.deepEqual(dressOutfitSlot(gold, "prop", "flying-v-a"), gold);
});

test("does refuse an item tapped into another slot's grid", () => {
  assert.deepEqual(dressOutfitSlot({}, "top", "flying-v-a"), {});
});

test("does restyle the slot's item only to a style it offers", () => {
  const worn = { prop: { item: "flying-v-a", style: "white" } } as const;

  assert.deepEqual(restyleOutfitSlot(worn, "prop", "gold"), { prop: { item: "flying-v-a", style: "gold" } });
  assert.deepEqual(restyleOutfitSlot(worn, "prop", "team"), worn);
  assert.deepEqual(restyleOutfitSlot({}, "prop", "gold"), {});
});

test("does name the Look the bird is wearing, read as worn, and none once one piece changes", () => {
  const [thrash] = resolveOutfitLooks("metal");

  assert.ok(thrash !== undefined);

  const worn = resolveWornLookOutfit("metal", thrash);

  assert.equal(resolveWornLookId("metal", worn), thrash.id);
  assert.equal(resolveWornLookId("metal", thrash.outfit), thrash.id);
  assert.equal(resolveWornLookId("metal", dressOutfitSlot(worn, "top", null)), null);
  assert.deepEqual(resolveOutfitLooks("punk"), []);
});

test("does read a genre's stored outfit as worn and leave every other genre's out", () => {
  const outfits = { metal: { top: { item: "battle-vest-a" }, tail: { item: "cut-since" } }, disco: { tail: { item: "tinsel-a" } } };

  assert.deepEqual(resolveGenreOutfit(outfits, "metal"), { top: { item: "battle-vest-a", style: "ink" } });
  assert.deepEqual(resolveGenreOutfit(outfits, "pop"), {});
  assert.deepEqual(resolveGenreOutfit(undefined, "pop"), {});
});
