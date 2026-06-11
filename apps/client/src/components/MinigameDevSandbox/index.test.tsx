import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { MinigameDevSandbox } from "./index";

test("renders the trivia sandbox from the live runtime plugin", () => {
  const html = renderToStaticMarkup(<MinigameDevSandbox minigameType="TRIVIA" />);

  assert.match(html, /Minigame Dev Sandbox/);
  assert.match(html, /Host Preview/);
  assert.match(html, /Display Preview/);
  assert.match(html, /Reset/);
  // The first sample prompt comes from the runtime plugin, not static views.
  assert.match(
    html,
    /What country is widely credited as the origin of hot sauce\?/
  );
  assert.match(html, /Correct/);
});

test("renders the geo sandbox without leaking answer coordinates", () => {
  const html = renderToStaticMarkup(<MinigameDevSandbox minigameType="GEO" />);

  assert.match(html, /Eiffel Tower/);
  assert.match(html, /Submit Guess/);
  assert.doesNotMatch(html, /48\.85837/);
  assert.doesNotMatch(html, /answerLat/);
});

test("renders the unsupported stub for minigames without a playable runtime", () => {
  const html = renderToStaticMarkup(<MinigameDevSandbox minigameType="DRAWING" />);

  assert.match(html, /Minigame Dev Sandbox/);
  assert.match(html, /not implemented yet/);
});
