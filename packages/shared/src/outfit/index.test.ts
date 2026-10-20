import assert from "node:assert/strict";
import test from "node:test";

import {
  OUTFIT_GENRES,
  OUTFIT_ITEMS,
  OUTFIT_LOOKS,
  OUTFIT_SLOTS,
  findOutfitItem,
  parseOutfit,
  resolveOutfitRail,
  resolveOutfitSlots,
  resolveWornOutfit,
  validateOutfit,
  validateOutfitsByGenre
} from "./index.js";
import type { ValidationIssue } from "../content/validationIssue/index.js";

const pathsOf = (issues: readonly ValidationIssue[]): string[] => issues.map((issue) => issue.path);

test("gives every catalogue item a unique kebab id", () => {
  const ids = OUTFIT_ITEMS.map((item) => item.id);

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)));
});

test("holds the 132 tiles Gate 1 kept", () => {
  assert.equal(OUTFIT_ITEMS.length, 132);
  assert.equal(OUTFIT_ITEMS.filter((item) => item.slot === "move").length, 9);
});

test("leaves gold out of the lead style and out of every country item", () => {
  assert.ok(OUTFIT_ITEMS.every((item) => item.styles[0] !== "gold"));
  assert.ok(OUTFIT_ITEMS.filter((item) => item.genre === "country").every((item) => !item.styles.includes("gold")));
});

test("gives every drawn item a style and no move one", () => {
  assert.ok(OUTFIT_ITEMS.every((item) => (item.slot === "move" ? item.styles.length === 0 : item.styles.length > 0)));
});

test("hangs no boots on the country rail", () => {
  assert.ok(!resolveOutfitSlots("country").includes("boots"));
  assert.deepEqual(resolveOutfitRail("country", "boots"), []);
  assert.ok(OUTFIT_ITEMS.every((item) => !(item.genre === "country" && item.slot === "boots")));
});

test("offers a genre its own rail first and then the shared one", () => {
  const rail = resolveOutfitRail("metal", "prop").map((item) => item.genre);

  assert.ok(rail.length > 0);
  assert.equal(rail.at(-1), "shared");
  assert.ok(rail.every((genre) => genre === "metal" || genre === "shared"));
});

test("offers a genre with no rail of its own only the shared rail", () => {
  assert.ok(OUTFIT_SLOTS.every((slot) => resolveOutfitRail("punk", slot).every((item) => item.genre === "shared")));
  assert.ok(resolveOutfitRail("punk", "top").length > 0);
});

test("dresses every Look in items its own genre can wear", () => {
  for (const genre of OUTFIT_GENRES) {
    for (const look of OUTFIT_LOOKS[genre]) {
      assert.deepEqual(validateOutfit(genre, look.outfit), [], `${genre} ${look.name}`);
    }
  }
});

test("accepts a valid outfit as written when parsing strictly", () => {
  const outfit = { top: { item: "battle-vest-b" }, prop: { item: "flying-v-a", style: "gold" } };

  assert.deepEqual(parseOutfit("metal", outfit), outfit);
});

test("refuses the whole outfit when one choice is wrong", () => {
  assert.equal(parseOutfit("metal", { top: { item: "battle-vest-b" }, sleeve: { item: "nope" } }), null);
});

test("refuses an item from another genre's rail", () => {
  assert.deepEqual(pathsOf(validateOutfit("pop", { top: { item: "battle-vest-a" } })), ["top.item"]);
});

test("refuses an item worn in the wrong slot", () => {
  assert.deepEqual(pathsOf(validateOutfit("metal", { sleeve: { item: "battle-vest-a" } })), ["sleeve.item"]);
});

test("refuses a style the item does not offer", () => {
  assert.deepEqual(pathsOf(validateOutfit("metal", { top: { item: "battle-vest-a", style: "gold" } })), ["top.style"]);
});

test("refuses boots on a country bird", () => {
  assert.deepEqual(pathsOf(validateOutfit("country", { boots: { item: "combat-boots-a" } })), ["boots"]);
});

test("refuses an unknown slot and a value that is not an object", () => {
  assert.deepEqual(pathsOf(validateOutfit("metal", { hat: { item: "battle-vest-a" } })), ["hat"]);
  assert.deepEqual(pathsOf(validateOutfit("metal", [])), [""]);
});

test("keeps what it recognises and drops the rest when wearing tolerantly", () => {
  const dropped: string[] = [];
  const worn = resolveWornOutfit(
    "metal",
    {
      top: { item: "battle-vest-a" },
      sleeve: { item: "a-cut-sleeve" },
      boots: { item: "bandana-a" },
      hat: { item: "flying-v-a" }
    },
    (issue) => dropped.push(issue.path)
  );

  assert.deepEqual(worn, { top: { item: "battle-vest-a", style: "ink" } });
  assert.deepEqual(dropped, ["sleeve.item", "boots.item", "hat"]);
});

test("fills in the default style when a worn choice names none", () => {
  assert.deepEqual(resolveWornOutfit("pop", { boots: { item: "go-go-boots-b" } }), {
    boots: { item: "go-go-boots-b", style: "ink" }
  });
});

test("keeps the item and falls back to its default when its style was withdrawn", () => {
  assert.deepEqual(resolveWornOutfit("pop", { prop: { item: "pom-pom-a", style: "gold" } }), {
    prop: { item: "pom-pom-a", style: "white" }
  });
});

test("wears a move with no style", () => {
  assert.deepEqual(resolveWornOutfit("pop", { move: { item: "chicken-dance" } }), { move: { item: "chicken-dance" } });
});

test("wears nothing quietly when there is no outfit at all", () => {
  const dropped: unknown[] = [];

  assert.deepEqual(resolveWornOutfit("metal", undefined, (issue) => dropped.push(issue)), {});
  assert.deepEqual(dropped, []);
});

test("finds an item by its id", () => {
  assert.equal(findOutfitItem("flying-v-a")?.slot, "prop");
  assert.equal(findOutfitItem("flying-v"), undefined);
});

test("accepts a pack outfit map whose items it does not know", () => {
  assert.deepEqual(validateOutfitsByGenre({ metal: { top: { item: "cut-long-ago" } }, pop: {} }), []);
});

test("reports a pack outfit map's bad genre, slot and choice by path", () => {
  assert.deepEqual(
    pathsOf(
      validateOutfitsByGenre({
        Metal: {},
        pop: { Top: { item: "crop-jacket-a" }, sleeve: "puff-sleeve-a", tail: { item: "big-bow-a", style: "pink" } }
      })
    ),
    ["Metal", "pop.Top", "pop.sleeve", "pop.tail.style"]
  );
  assert.deepEqual(pathsOf(validateOutfitsByGenre([])), [""]);
});
