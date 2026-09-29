import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

import {
  SEARCH_RESULT_LIMIT,
  buildEmojiSearchIndex,
  searchEmojiIndex,
  type EmojiKeywords
} from "./index.js";

// The real keyword data, so these prove the search a host gets on the night
// and not a fixture shaped to pass.
const keywords = createRequire(import.meta.url)("emojilib") as EmojiKeywords;
const index = buildEmojiSearchIndex(keywords);

const search = (query: string): string[] => searchEmojiIndex(index, query);

test("finds an emoji by the name a host would type", () => {
  assert.equal(search("pizza")[0], "🍕");
  assert.deepEqual(search("dog").slice(0, 2).sort(), ["🐕", "🐶"].sort());
});

test("finds an emoji by a keyword that is not in its name", () => {
  assert.ok(search("dinosaur").includes("🦖"));
  assert.ok(search("puppy").includes("🐶"));
  assert.ok(search("money").includes("💰"));
});

test("matches a word the host has only started typing", () => {
  assert.ok(search("dino").includes("🦖"));
  assert.ok(search("skul").includes("💀"));
});

test("narrows on every word of a multi-word search", () => {
  const results = search("red car");

  assert.equal(results[0], "🚗");
  assert.equal(results.includes("🚕"), false);
});

test("searches emoji the catalog tabs never show", () => {
  assert.ok(search("volcano").includes("🌋"));
  assert.ok(search("saxophone").includes("🎷"));
});

test("leaves out the letter emoji the reducer refuses", () => {
  assert.equal(search("italy").some((emoji) => emoji.includes("🇮")), false);
  // 🔟 is one code point the reducer takes; the digit keycaps are not.
  assert.deepEqual(search("keycap"), ["🔟"]);
});

test("ranks a whole word above a word it only starts or sits inside", () => {
  assert.deepEqual(search("king").slice(0, 3).sort(), ["🍔", "👑", "🤴"].sort());
  assert.equal(search("king").includes("😉"), false);
});

test("returns nothing for an empty or unmatched search", () => {
  assert.deepEqual(search("   "), []);
  assert.deepEqual(search("zzqxv"), []);
});

test("caps a broad search at a screenful of results", () => {
  assert.equal(search("face").length, SEARCH_RESULT_LIMIT);
});
