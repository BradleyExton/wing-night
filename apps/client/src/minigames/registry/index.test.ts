import assert from "node:assert/strict";
import test from "node:test";

import { DisplayTakeoverRenderer as TriviaDisplayTakeoverRenderer } from "../trivia/DisplayTakeoverRenderer";
import { HostTakeoverRenderer as TriviaHostTakeoverRenderer } from "../trivia/HostTakeoverRenderer";
import { DisplayUnsupportedRenderer } from "../unsupported/DisplayUnsupportedRenderer";
import { HostUnsupportedRenderer } from "../unsupported/HostUnsupportedRenderer";
import {
  CLIENT_MINIGAME_RENDERER_REGISTRY,
  resolveClientMinigameRendererDescriptor
} from "./index";

test("resolves trivia takeover renderers for TRIVIA", () => {
  const descriptor = resolveClientMinigameRendererDescriptor("TRIVIA");

  assert.equal(descriptor.minigameId, "TRIVIA");
  assert.equal(descriptor.hostTakeoverRenderer, TriviaHostTakeoverRenderer);
  assert.equal(descriptor.displayTakeoverRenderer, TriviaDisplayTakeoverRenderer);
  assert.equal(descriptor.supportsGameplayRenderer, true);
});

test("resolves unsupported takeover renderers for GEO and DRAWING", () => {
  for (const minigameId of ["GEO", "DRAWING"] as const) {
    const descriptor = resolveClientMinigameRendererDescriptor(minigameId);

    assert.equal(descriptor.minigameId, minigameId);
    assert.equal(descriptor.hostTakeoverRenderer, HostUnsupportedRenderer);
    assert.equal(descriptor.displayTakeoverRenderer, DisplayUnsupportedRenderer);
    assert.equal(descriptor.supportsGameplayRenderer, false);
  }
});

test("registry contains every known minigame id", () => {
  assert.deepEqual(Object.keys(CLIENT_MINIGAME_RENDERER_REGISTRY).sort(), [
    "DRAWING",
    "GEO",
    "TRIVIA"
  ]);
});
