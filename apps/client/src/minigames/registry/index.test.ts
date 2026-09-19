import assert from "node:assert/strict";
import test from "node:test";
import {
  MINIGAME_DEFINITIONS,
  MINIGAME_TYPES,
  resolveMinigameTypeFromSlug
} from "@wingnight/shared";

import {
  loadMinigameRendererBundle,
  minigameRequiresDisplayAudio,
  peekMinigameRendererBundle
} from "./index";

// Order matters in this file: the registry's cache is module state, and the
// first two tests are about the moment before a chunk has landed. They run
// before anything loads a renderer.

test("answers the display-audio requirement without loading any renderer", () => {
  // The point of the flag living beside the loader rather than inside the
  // bundle: the display shell decides whether to offer its tap-to-enable
  // overlay at MINIGAME_INTRO, a phase before anything downloads the surface.
  assert.equal(minigameRequiresDisplayAudio("SONG_GUESS"), true);
  assert.equal(minigameRequiresDisplayAudio("TRIVIA"), false);

  for (const minigameType of MINIGAME_TYPES) {
    assert.equal(peekMinigameRendererBundle(minigameType), null);
  }
});

test("peeks the bundle once its chunk has landed", async () => {
  assert.equal(peekMinigameRendererBundle("GEO"), null);

  const loadedBundle = await loadMinigameRendererBundle("GEO");

  assert.ok(loadedBundle);
  assert.equal(peekMinigameRendererBundle("GEO"), loadedBundle);
  // Loading one game's renderer must not drag another's in with it.
  assert.equal(peekMinigameRendererBundle("TRIVIA"), null);
});

test("joins the in-flight load when two callers ask at once", async () => {
  const [firstBundle, secondBundle] = await Promise.all([
    loadMinigameRendererBundle("JOUST"),
    loadMinigameRendererBundle("JOUST")
  ]);

  assert.ok(firstBundle);
  assert.equal(firstBundle, secondBundle);
});

test("loads a renderer bundle with both surfaces for every minigame type", async () => {
  for (const minigameType of MINIGAME_TYPES) {
    const rendererBundle = await loadMinigameRendererBundle(minigameType);

    assert.ok(rendererBundle, `no renderer bundle for ${minigameType}`);
    assert.equal(typeof rendererBundle.HostSurface, "function");
    assert.equal(typeof rendererBundle.DisplaySurface, "function");
  }
});

test("shared slug resolution reaches every registered minigame", async () => {
  for (const minigameType of MINIGAME_TYPES) {
    const slug = MINIGAME_DEFINITIONS[minigameType].slug;

    assert.equal(resolveMinigameTypeFromSlug(slug), minigameType);
    assert.ok(await loadMinigameRendererBundle(minigameType));
  }

  assert.equal(resolveMinigameTypeFromSlug("unknown"), null);
});
