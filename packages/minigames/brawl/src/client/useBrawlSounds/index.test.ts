import assert from "node:assert/strict";
import test from "node:test";

import { BRAWL_CUE_NAMES, BRAWL_HONK_GOON_INTENSITY } from "../audio/index.js";
import { resolveBrawlCue } from "./index.js";

test("does honk a goon at its heft and the boss at full when a goon telegraphs", () => {
  assert.deepEqual(resolveBrawlCue({ kind: "honk", goonKind: "goose" }), { cue: "honk", intensity: BRAWL_HONK_GOON_INTENSITY });
  assert.deepEqual(resolveBrawlCue({ kind: "honk", goonKind: "boss" }), { cue: "honk", intensity: 1 });
});

test("does ring a cue of its own name for every other event and beat when the mirror announces it", () => {
  const kinds = ["peck", "land", "boss", "hurt", "go", "handoff", "bay", "bell"] as const;

  for (const kind of kinds) {
    assert.deepEqual(resolveBrawlCue({ kind }), { cue: kind });
    assert.ok(BRAWL_CUE_NAMES.includes(kind));
  }

  assert.deepEqual(resolveBrawlCue({ kind: "ko", goonKind: "raccoon" }), { cue: "ko" });
});
