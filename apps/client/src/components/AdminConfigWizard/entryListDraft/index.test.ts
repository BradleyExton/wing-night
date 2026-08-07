import assert from "node:assert/strict";
import test from "node:test";

import { addEntry, removeEntry, setEntry } from "./index";

type Prompt = { id: string; prompt: string };

const buildPack = (): { prompts: Prompt[] } => ({
  prompts: [
    { id: "a", prompt: "Alpha" },
    { id: "b", prompt: "Beta" }
  ]
});

// Mirrors `PlayersContentEntry`, whose optional key is the reason `setEntry`
// replaces an entry instead of merging a `Partial` into it.
const buildRoster = (): { players: { name: string; avatarSrc?: string }[] } => ({
  players: [{ name: "Alex", avatarSrc: "/alex.png" }]
});

test("replaces only the addressed entry when setEntry targets an index", () => {
  const next = setEntry(buildPack(), "prompts", 1, { id: "b", prompt: "Rewritten" });

  assert.deepEqual(next.prompts, [
    { id: "a", prompt: "Alpha" },
    { id: "b", prompt: "Rewritten" }
  ]);
});

test("leaves the input file untouched when setEntry returns a new file", () => {
  const pack = buildPack();

  setEntry(pack, "prompts", 0, { id: "a", prompt: "Mutated" });

  assert.deepEqual(pack.prompts[0], { id: "a", prompt: "Alpha" });
});

test("drops a key the replacement omits when setEntry replaces rather than merges", () => {
  const next = setEntry(buildRoster(), "players", 0, { name: "Alex" });

  assert.equal("avatarSrc" in next.players[0], false);
});

test("appends to the end when addEntry adds an entry", () => {
  const next = addEntry(buildPack(), "prompts", { id: "c", prompt: "Gamma" });

  assert.deepEqual(
    next.prompts.map((prompt) => prompt.id),
    ["a", "b", "c"]
  );
});

test("removes the addressed index and keeps the rest in order when removeEntry runs", () => {
  const next = removeEntry(buildPack(), "prompts", 0);

  assert.deepEqual(
    next.prompts.map((prompt) => prompt.id),
    ["b"]
  );
});

test("returns an unchanged list when removeEntry is given an out-of-range index", () => {
  const next = removeEntry(buildPack(), "prompts", 9);

  assert.deepEqual(
    next.prompts.map((prompt) => prompt.id),
    ["a", "b"]
  );
});
