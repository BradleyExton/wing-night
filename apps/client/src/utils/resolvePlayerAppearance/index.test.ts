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

test("does address the pack head on the server when an origin is known", () => {
  const appearance = resolvePlayerAppearance(
    { name: "Brad", avatarSrc: "avatars/brad.png" },
    "http://192.168.1.20:3000"
  );

  assert.equal(
    appearance.avatarSrc,
    "http://192.168.1.20:3000/content-assets/avatars/brad.png"
  );
});

// The origin read happens in an effect, so the first paint has none. A drawn
// head for one frame beats a broken image, and beats an empty lobby.
test("does fall back to the drawn head when the server origin is not known yet", () => {
  const appearance = resolvePlayerAppearance({
    name: "Brad",
    avatarSrc: "avatars/brad.png"
  });

  assert.equal("avatarSrc" in appearance, false);
});

test("does omit the avatar key when the player has none", () => {
  const appearance = resolvePlayerAppearance({ name: "Brad" });

  assert.equal("avatarSrc" in appearance, false);
});
