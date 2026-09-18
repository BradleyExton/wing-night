import assert from "node:assert/strict";
import test from "node:test";

import { resolvePlayerAppearance } from "./index";

const rosterNames = [
  "Alex",
  "Caitlin",
  "Dan",
  "Rosie",
  "Darren",
  "Steve B",
  "Sarah",
  "Jazz",
  "Dylan",
  "Samantha",
  "Rob",
  "Joleeza",
  "Steve C",
  "Tay"
];

test("does resolve the same appearance when the same name is given twice", () => {
  assert.deepEqual(
    resolvePlayerAppearance({ name: "Brad" }),
    resolvePlayerAppearance({ name: "Brad" })
  );
});

test("does ignore case and surrounding whitespace when seeding the appearance", () => {
  assert.deepEqual(
    resolvePlayerAppearance({ name: "  bRAD " }),
    resolvePlayerAppearance({ name: "Brad" })
  );
});

test("does spread bodies, combs and tails across the sample roster", () => {
  const appearances = rosterNames.map((name) => resolvePlayerAppearance({ name }));
  const bodies = new Set(appearances.map((appearance) => appearance.body));
  const combs = new Set(appearances.map((appearance) => appearance.comb));
  const tails = new Set(appearances.map((appearance) => appearance.tail));

  assert.ok(bodies.size >= 2, `expected more than one body, got ${[...bodies].join(",")}`);
  assert.ok(combs.size >= 2, `expected more than one comb, got ${[...combs].join(",")}`);
  assert.equal(tails.size, 2);
});

test("does carry the avatar through when the player has one", () => {
  const appearance = resolvePlayerAppearance({
    name: "Brad",
    avatarSrc: "/local-assets/avatars/brad.jpg"
  });

  assert.equal(appearance.avatarSrc, "/local-assets/avatars/brad.jpg");
});

test("does omit the avatar key when the player has none", () => {
  const appearance = resolvePlayerAppearance({ name: "Brad" });

  assert.equal("avatarSrc" in appearance, false);
});
